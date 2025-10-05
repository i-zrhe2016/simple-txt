# 极简空白记事本（单页）

一个极简的空白页面，仅提供一个全屏文本框用于记录纯文本。输入会自动保存到浏览器本地存储（localStorage），刷新后仍可恢复。

## 使用

- 直接用浏览器打开 `index.html`。
- 在文本框输入内容，会自动保存；再次打开页面自动恢复。

## 自部署（Docker Compose）

- 修改（可选）`.env` 中的 `HOST_PORT`，默认 8090（若端口占用可更换）。
- 启动：`docker compose up -d --build`
- 访问：`http://<服务器IP>:<HOST_PORT>`
 
数据存放位置（本地目录）
- 目录：`./data/notes`
- 文件：`./data/notes/<tocken>.txt`

## 说明

- 若不需要自动保存，可删除 `index.html` 中的脚本引用或移除 `assets/app.js`。
- 项目为纯静态页面，无需任何后端。
 
## 登录模型（基于 tocken）

- 注册：点击登录页的“注册”直接生成 12 位 tocken，并跳转到 `/<tocken>`
- 登录：在登录页输入已有 12 位 tocken，跳转到 `/<tocken>`
- 直接访问：直接访问 `/<tocken>` 也视为已登录并可编辑

API（以 tocken 为标识）
- 加载：`GET /api/note/<tocken>` → `{ content }`
- 保存：`POST /api/note/<tocken>`，body: `{ content }`

存储结构
- 笔记：`data/notes/<tocken>.txt` 纯文本
