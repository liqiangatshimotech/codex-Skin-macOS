#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const PROJECT_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const DEFAULT_APP = "/Applications/ChatGPT.app";
const ASAR_RELATIVE_PATH = "Contents/Resources/app.asar";
const BACKUP_SUFFIX = ".codexskin.original.bak";
const THEME = "doraemon";
const BLOCK_START = `<!-- codexskin:${THEME}:start -->`;
const BLOCK_END = `<!-- codexskin:${THEME}:end -->`;
const BLOCK_RE = new RegExp(`\\n?\\s*${escapeRegExp(BLOCK_START)}[\\s\\S]*?${escapeRegExp(BLOCK_END)}\\n?`, "g");
const BLOCK_SIZE = 4 * 1024 * 1024;

function usage() {
  console.log(`Usage:
  node scripts/asar-patcher.mjs install [--app /Applications/ChatGPT.app]
  node scripts/asar-patcher.mjs uninstall [--app /Applications/ChatGPT.app]
  node scripts/asar-patcher.mjs status [--app /Applications/ChatGPT.app]
  node scripts/asar-patcher.mjs validate [--app /Applications/ChatGPT.app]`);
}

function parseArgs(argv) {
  const args = { command: argv[2] || "status", app: DEFAULT_APP };
  for (let i = 3; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--app") {
      args.app = argv[i + 1];
      i += 1;
    } else if (arg === "--help" || arg === "-h") {
      args.command = "help";
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return args;
}

function appPaths(appPath) {
  const asarPath = path.join(appPath, ASAR_RELATIVE_PATH);
  return {
    appPath,
    asarPath,
    backupPath: `${asarPath}${BACKUP_SUFFIX}`,
    resourcesPath: path.dirname(asarPath),
  };
}

function readArchive(asarPath) {
  const raw = fs.readFileSync(asarPath);
  if (raw.length < 16 || raw.readUInt32LE(0) !== 4) {
    throw new Error(`Not a supported asar archive: ${asarPath}`);
  }

  const headerPickleSize = raw.readUInt32LE(4);
  const headerPayloadSize = raw.readUInt32LE(8);
  const jsonSize = raw.readUInt32LE(12);
  const headerEnd = 16 + jsonSize;
  const baseOffset = 8 + headerPickleSize;
  if (headerEnd > raw.length || baseOffset > raw.length || headerPayloadSize < jsonSize) {
    throw new Error(`Invalid asar header: ${asarPath}`);
  }

  const header = JSON.parse(raw.subarray(16, headerEnd).toString("utf8"));
  return { asarPath, raw, header, baseOffset };
}

function writeArchive(archive, outputPath, changedFiles = new Map()) {
  const header = structuredClone(archive.header);

  for (const [relativePath, data] of changedFiles) {
    const node = ensureFileNode(header, relativePath);
    node.size = data.length;
    delete node.unpacked;
    delete node.link;
  }

  const chunks = [];
  let offset = 0;
  for (const file of walkFiles(header)) {
    if (file.node.unpacked || file.node.link) {
      continue;
    }

    const replacement = changedFiles.get(file.relativePath);
    const data = replacement ?? readPackedFile(archive, file.relativePath);
    file.node.size = data.length;
    file.node.offset = String(offset);
    file.node.integrity = integrityFor(data);
    chunks.push(data);
    offset += data.length;
  }

  const headerBuffer = makeHeaderBuffer(header);
  const bodyBuffer = Buffer.concat(chunks, offset);
  fs.writeFileSync(outputPath, Buffer.concat([headerBuffer, bodyBuffer]));
}

function readPackedFile(archive, relativePath) {
  const node = getFileNode(archive.header, relativePath);
  if (node.unpacked) {
    const unpackedPath = path.join(`${archive.asarPath}.unpacked`, relativePath);
    return fs.readFileSync(unpackedPath);
  }
  if (node.link) {
    throw new Error(`Cannot read linked asar entry: ${relativePath}`);
  }
  if (node.offset === undefined) {
    throw new Error(`Missing asar offset for ${relativePath}`);
  }
  const start = archive.baseOffset + Number(node.offset);
  const end = start + node.size;
  return archive.raw.subarray(start, end);
}

function readPackedText(archive, relativePath) {
  return readPackedFile(archive, relativePath).toString("utf8");
}

function makeHeaderBuffer(header) {
  const json = Buffer.from(JSON.stringify(header), "utf8");
  const payloadSize = align4(4 + json.length);
  const headerPickleSize = 4 + payloadSize;
  const totalSize = 8 + headerPickleSize;
  const out = Buffer.alloc(totalSize);
  out.writeUInt32LE(4, 0);
  out.writeUInt32LE(headerPickleSize, 4);
  out.writeUInt32LE(payloadSize, 8);
  out.writeUInt32LE(json.length, 12);
  json.copy(out, 16);
  return out;
}

function align4(value) {
  return Math.ceil(value / 4) * 4;
}

function integrityFor(data) {
  const hash = crypto.createHash("sha256").update(data).digest("hex");
  const blocks = [];
  for (let i = 0; i < data.length; i += BLOCK_SIZE) {
    blocks.push(crypto.createHash("sha256").update(data.subarray(i, i + BLOCK_SIZE)).digest("hex"));
  }
  if (blocks.length === 0) {
    blocks.push(hash);
  }
  return { algorithm: "SHA256", hash, blockSize: BLOCK_SIZE, blocks };
}

function getFileNode(header, relativePath) {
  const parts = relativePath.split("/").filter(Boolean);
  let node = header;
  for (const part of parts) {
    if (!node.files || !node.files[part]) {
      throw new Error(`Missing asar entry: ${relativePath}`);
    }
    node = node.files[part];
  }
  if (node.files) {
    throw new Error(`Asar entry is a directory: ${relativePath}`);
  }
  return node;
}

function ensureFileNode(header, relativePath) {
  const parts = relativePath.split("/").filter(Boolean);
  let node = header;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const part = parts[i];
    node.files ??= {};
    node.files[part] ??= { files: {} };
    node = node.files[part];
  }
  node.files ??= {};
  const fileName = parts.at(-1);
  node.files[fileName] ??= {};
  return node.files[fileName];
}

function removeEntry(header, relativePath) {
  const parts = relativePath.split("/").filter(Boolean);
  let node = header;
  for (let i = 0; i < parts.length - 1; i += 1) {
    node = node.files?.[parts[i]];
    if (!node) return false;
  }
  return Boolean(node.files && delete node.files[parts.at(-1)]);
}

function* walkFiles(node, prefix = "") {
  if (!node.files) {
    yield { relativePath: prefix, node };
    return;
  }
  for (const [name, child] of Object.entries(node.files)) {
    const next = prefix ? `${prefix}/${name}` : name;
    yield* walkFiles(child, next);
  }
}

function themeFiles() {
  const cssPath = path.join(PROJECT_ROOT, "theme", "doraemon.css");
  const jsPath = path.join(PROJECT_ROOT, "theme", "doraemon.js");
  const heroPath = path.join(PROJECT_ROOT, "theme", "assets", "doraemon-hero-v2.png");
  return new Map([
    ["webview/codexskin/doraemon.css", fs.readFileSync(cssPath)],
    ["webview/codexskin/doraemon.js", fs.readFileSync(jsPath)],
    ["webview/codexskin/assets/doraemon-hero-v2.png", fs.readFileSync(heroPath)],
  ]);
}

function injectTheme(html) {
  const block = `
    ${BLOCK_START}
    <link rel="stylesheet" href="./codexskin/doraemon.css" data-codexskin-theme="${THEME}" />
    <script defer src="./codexskin/doraemon.js" data-codexskin-theme="${THEME}"></script>
    ${BLOCK_END}`;

  const withoutOldBlock = addRootThemeMarker(html.replace(BLOCK_RE, "\n"));
  if (!withoutOldBlock.includes("</head>")) {
    throw new Error("webview/index.html does not contain </head>");
  }
  return withoutOldBlock.replace(/\n?\s*<\/head>/i, `${block}\n  </head>`);
}

function stripTheme(html) {
  return removeRootThemeMarker(html.replace(BLOCK_RE, "\n"));
}

function addRootThemeMarker(html) {
  return html.replace(/<html\b([^>]*)>/i, (match, attrs) => {
    let next = attrs;
    if (/\bclass\s*=/.test(next)) {
      next = next.replace(/\bclass\s*=\s*(["'])(.*?)\1/i, (classMatch, quote, value) => {
        const classes = new Set(value.split(/\s+/).filter(Boolean));
        classes.add("codexskin-doraemon");
        return `class=${quote}${[...classes].join(" ")}${quote}`;
      });
    } else {
      next = ` class="codexskin-doraemon"${next}`;
    }

    if (/\bdata-codexskin\s*=/.test(next)) {
      next = next.replace(/\bdata-codexskin\s*=\s*(["']).*?\1/i, `data-codexskin="doraemon"`);
    } else {
      next = ` data-codexskin="doraemon"${next}`;
    }

    return `<html${next}>`;
  });
}

function removeRootThemeMarker(html) {
  return html.replace(/<html\b([^>]*)>/i, (match, attrs) => {
    let next = attrs
      .replace(/\sdata-codexskin\s*=\s*(["'])doraemon\1/i, "")
      .replace(/\bclass\s*=\s*(["'])(.*?)\1/i, (classMatch, quote, value) => {
        const classes = value.split(/\s+/).filter((item) => item && item !== "codexskin-doraemon");
        return classes.length ? `class=${quote}${classes.join(" ")}${quote}` : "";
      })
      .replace(/\s{2,}/g, " ");
    return `<html${next}>`;
  });
}

function isInstalled(archive) {
  try {
    return readPackedText(archive, "webview/index.html").includes(BLOCK_START);
  } catch {
    return false;
  }
}

function install(appPath) {
  const paths = appPaths(appPath);
  assertArchiveExists(paths);
  const archive = readArchive(paths.asarPath);
  const html = readPackedText(archive, "webview/index.html");
  const changed = themeFiles();
  changed.set("webview/index.html", Buffer.from(injectTheme(html), "utf8"));
  removeEntry(archive.header, "webview/codexskin/assets/doraemon-hero.png");

  if (!fs.existsSync(paths.backupPath)) {
    fs.copyFileSync(paths.asarPath, paths.backupPath);
  }

  const tmpPath = `${paths.asarPath}.codexskin.tmp`;
  writeArchive(archive, tmpPath, changed);
  validateArchive(tmpPath, true);
  preserveMode(paths.asarPath, tmpPath);
  fs.renameSync(tmpPath, paths.asarPath);

  console.log(`Installed ${THEME} skin into ${paths.appPath}`);
  console.log(`Backup: ${paths.backupPath}`);
  console.log("Restart ChatGPT/Codex to see the skin.");
}

function uninstall(appPath) {
  const paths = appPaths(appPath);
  assertArchiveExists(paths);

  if (fs.existsSync(paths.backupPath)) {
    fs.copyFileSync(paths.backupPath, paths.asarPath);
    console.log(`Restored original archive from ${paths.backupPath}`);
    console.log("Restart ChatGPT/Codex to return to the original UI.");
    return;
  }

  const archive = readArchive(paths.asarPath);
  const html = readPackedText(archive, "webview/index.html");
  const changed = new Map([["webview/index.html", Buffer.from(stripTheme(html), "utf8")]]);
  removeEntry(archive.header, "webview/codexskin");
  const tmpPath = `${paths.asarPath}.codexskin.tmp`;
  writeArchive(archive, tmpPath, changed);
  validateArchive(tmpPath, false);
  preserveMode(paths.asarPath, tmpPath);
  fs.renameSync(tmpPath, paths.asarPath);
  console.log("Removed Codexskin injection. No original backup was found.");
}

function status(appPath) {
  const paths = appPaths(appPath);
  assertArchiveExists(paths);
  const archive = readArchive(paths.asarPath);
  console.log(`App: ${paths.appPath}`);
  console.log(`Archive: ${paths.asarPath}`);
  console.log(`Backup: ${fs.existsSync(paths.backupPath) ? "present" : "missing"}`);
  console.log(`Doraemon skin: ${isInstalled(archive) ? "installed" : "not installed"}`);
}

function validate(appPath) {
  const paths = appPaths(appPath);
  assertArchiveExists(paths);
  validateArchive(paths.asarPath, undefined);
  for (const localFile of ["theme/doraemon.css", "theme/doraemon.js", "theme/assets/doraemon-hero-v2.png"]) {
    const filePath = path.join(PROJECT_ROOT, localFile);
    if (!fs.existsSync(filePath)) throw new Error(`Missing ${localFile}`);
  }
  console.log("Archive and local theme files look valid.");
}

function validateArchive(asarPath, shouldBeInstalled) {
  const archive = readArchive(asarPath);
  const html = readPackedText(archive, "webview/index.html");
  if (!html.includes("<title>Codex</title>")) {
    throw new Error("Validation failed: Codex title missing from webview/index.html");
  }
  if (shouldBeInstalled === true) {
    if (!html.includes(BLOCK_START)) throw new Error("Validation failed: skin marker not installed");
    readPackedFile(archive, "webview/codexskin/doraemon.css");
    readPackedFile(archive, "webview/codexskin/doraemon.js");
    readPackedFile(archive, "webview/codexskin/assets/doraemon-hero-v2.png");
  }
  if (shouldBeInstalled === false && html.includes(BLOCK_START)) {
    throw new Error("Validation failed: skin marker still present");
  }
}

function assertArchiveExists(paths) {
  if (!fs.existsSync(paths.appPath)) throw new Error(`App not found: ${paths.appPath}`);
  if (!fs.existsSync(paths.asarPath)) throw new Error(`Archive not found: ${paths.asarPath}`);
}

function preserveMode(source, target) {
  const stat = fs.statSync(source);
  fs.chmodSync(target, stat.mode);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

try {
  const args = parseArgs(process.argv);
  if (args.command === "help") {
    usage();
  } else if (args.command === "install") {
    install(args.app);
  } else if (args.command === "uninstall") {
    uninstall(args.app);
  } else if (args.command === "status") {
    status(args.app);
  } else if (args.command === "validate") {
    validate(args.app);
  } else {
    usage();
    process.exitCode = 1;
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
