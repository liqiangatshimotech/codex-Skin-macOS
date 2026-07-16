# Codexskin

一个本地 Codex 客户端机器猫风格皮肤。它会给 `ChatGPT.app` 里的 Codex webview 注入独立 CSS/JS，不改官方压缩 chunk。

定制来源、完整迭代过程、开源项目参考、架构差异和维护规则见 [`AGENTS.md`](./AGENTS.md)。

## 使用

```bash
npm run status
npm run install:skin
```

安装后重启 ChatGPT/Codex。首次安装会在应用资源目录旁创建备份：

```text
/Applications/ChatGPT.app/Contents/Resources/app.asar.codexskin.original.bak
```

卸载：

```bash
npm run uninstall:skin
```

如果 Codex 客户端升级，官方 `app.asar` 可能会被覆盖，重新运行 `npm run install:skin` 即可。这个皮肤是本地改包方案，可能会让 macOS 的代码签名校验显示已修改；如果应用无法启动，运行卸载脚本恢复原包。

## 文件

- `theme/doraemon.css`: 机器猫风格视觉样式。
- `theme/doraemon.js`: 给 Codex 页面打稳定标记并挂载装饰元素。
- `scripts/asar-patcher.mjs`: 备份、注入、卸载和校验工具。
- `preview/index.html`: 静态预览页。
