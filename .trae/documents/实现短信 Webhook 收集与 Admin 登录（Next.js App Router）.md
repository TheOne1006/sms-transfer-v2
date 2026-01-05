## 目标
- 使用 react-admin + ra-data-json-server 构建单页后台 /admin
- 仅内存存储短信；开放符合 JSON Server 约定的 API 供数据提供器读取
- 简易管理员登录校验，未登录无法访问数据 API

## 依赖
- 前端：react-admin、ra-data-json-server

## 路由与文件（最小集）
- app/admin/page.tsx（客户端组件）：挂载 <Admin>
  - dataProvider: jsonServerProvider('/api')
  - authProvider：调用 /api/login、/api/logout、/api/auth/check
  - <Resource name="messages" list={Datagrid/简易列表}>
- API（JSON Server 风格）
  - GET /api/messages：返回短信列表（支持 sort、range、filter；设置 Content-Range 头）
  - GET /api/messages/[id]：返回单条短信
  - POST /api/sms：webhook 入站（校验 X-Webhook-Token，写入内存）
  - POST /api/login：校验 ADMIN_PASSWORD，设置 HttpOnly 会话 Cookie
  - POST /api/logout：清除会话 Cookie
  - GET /api/auth/check：检查会话 Cookie 是否有效（供 authProvider 使用）
- 内存与认证
  - lib/store.ts：globalThis 单例，提供 add/list/get
  - lib/auth.ts：校验密码；签名/验证 Cookie；API 访问前校验
  - lib/types.ts：Message 类型
  - .env.example：ADMIN_PASSWORD、WEBHOOK_TOKEN、SESSION_SECRET

## API 约定（兼容 ra-data-json-server）
- 列表：GET /api/messages
  - query：sort=["field","ASC|DESC"]、range=[start,end]、filter={...}
  - 响应：body 为记录数组；头部 Content-Range: messages start-end/total；状态 200
- 单条：GET /api/messages/[id]
  - 响应：{ id, ... }；状态 200/404
- 认证保护：/api/messages 与 /api/messages/[id] 在读取前检查会话 Cookie；未通过返回 401

## 页面行为（/admin）
- 未登录：react-admin 内置登录页（由 authProvider 控制）
- 登录后：显示 messages 的 Datagrid（id、from、to、content、timestamp）

## 开发步骤
1) 安装依赖 react-admin、ra-data-json-server；新增 .env.example（三个变量）
2) 新增 lib/types.ts 与 lib/store.ts（globalThis 单例 + add/list/get）
3) 新增 lib/auth.ts（读取 ADMIN_PASSWORD；签发/验证 Cookie）
4) 新增 API：/api/login、/api/logout、/api/auth/check（会话管理）
5) 新增 API：/api/messages 与 /api/messages/[id]（JSON Server 风格 + 认证校验）
6) 新增 API：/api/sms（校验 X-Webhook-Token，写入内存）
7) 新增 app/admin/page.tsx（客户端组件），配置 Admin + dataProvider + authProvider + Resource
8) 使用 curl 验证 webhook；在 /admin 登录查看列表

## 验证
- curl -X POST http://localhost:3000/api/sms -H "X-Webhook-Token: $WEBHOOK_TOKEN" -H "Content-Type: application/json" -d '{"provider":"demo","messageId":"1","from":"1380000","to":"10690000","content":"Hello","timestamp":"2026-01-05T12:00:00Z"}'
- 打开 /admin，使用 ADMIN_PASSWORD 登录；应显示消息列表