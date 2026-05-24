# 《星辉剑传》

面向学习与科普场景的 **大语言模型提示词安全** 剧情互动小游戏。

项目以 **Python 3.10+**、**FastAPI** 与 **原生 HTML/CSS/JS** 实现：后端对接硅基流动（SiliconFlow）等 OpenAI 兼容 API，前端由同一进程挂载静态资源，玩家在剧情对话中体验 **提示词注入、越狱诱导、对话防御与 GCG 风格攻击** 等概念。

中文 ｜ [English](https://github.com/RUIYUN-ML/SafeLLMPlayground/blob/main/README_EN.md)

![星辉剑传 序章首屏](Front-end%20development/assets/images/序章首屏.png)

**在线试玩（Demo）**：启动后端后，在浏览器打开（路径空格可写作 `%20`）：

- [在线试玩]http://124.223.115.66:8001/Front-end%20development/%E4%B8%BB%E9%A1%B5/login.html)`
- 序章剧情：`http://<服务器IP或域名>:8001/Front-end%20development/主页/prologue.html`

本地将 `<服务器IP或域名>` 换为 `127.0.0.1` 或 `localhost` 即可。

---

## 🎮 核心内容

### 章节化剧情关卡

- 🗡️ 第一章：提示词注入与剧情关卡（`chapter1` 多关）
- 🛡️ 第二章：对话防御与铸灵相关关卡（`chapter2` 多关）
- 📜 第三章：知识卷轴式关卡
- 🔚 尾声：附加关卡越狱攻击

### 灵活的通关判定

- **关键词/规则判定**：部分关卡在回复中检测通关关键词或泄露秘密（如第二章关卡检测保密词是否出现在模型输出中）。
- **LLM 裁判**（`judge_service`）：部分关卡根据关卡配置的核心元素列表，由独立模型输出 `{"passed": bool, "reason": "..."}` JSON，语义相近即为通关。


### 会话与多轮对话

`session_store` 按 `level` + `session_id` 保存对话历史；`chat_service` 限制历史上传条数（`SILICONFLOW_CHAT_HISTORY_MAX_MESSAGES`），控制 prompt 膨胀。前端 `api.js` 在 `sessionStorage` 中为每章每关生成并复用 `session_id`，与后端 `/chat`、`/reset` 对齐。

### 关于附加关：短后缀与 GCG 主题

附加关限制玩家输入约 **8 个 token**（本地 `tokenizers` 校验），通过 `generate_reply_gcg` 诱导模型输出含特定关键词的回复，与 **GCG（Greedy Coordinate Gradient）** 类攻击科普。可参考[题解](https://github.com/RUIYUN-ML/SafeLLMPlayground/tree/main/writeups)。

### 统一前端与冒险地图

`Front-end development` 提供登录/序章、各章关卡页、冒险地图（`adventure-map.js`）、知识相册（`knowledge-album.js`）与尾声。全局样式与组件见 `css/global.css`、`css/components.css`；`js/api.js` 支持 `GAME_API_BASE_URL`、`GAME_API_PORT` 与 HTTPS 混合适配。

---

## 仓库结构

```
chapter1/                      第一章 FastAPI：路由、会话、聊天与裁判服务
  main.py                      应用入口；挂载前端静态目录
  config.py                    模型名、关卡映射、关键词参考
  routers/                     level1–level4 路由
  services/                    chat_service、judge_service
  prompts/                     人设、各关 seal、GCG 备忘
chapter2/                      第二章关卡逻辑与路由
  level1/ level2/ level3/      各关 router、game_logic、prompts
  http_budget.py               单次请求内 API 调用超时预算
  cors.py                      CORS 配置
Front-end development/         主线前端（主页、各章关卡、地图、尾声）
siliconflow_api.py             硅基流动 API 封装（根目录）
README.md / README_EN.md       项目入口说明

```

---

## 运行

### 依赖

- Python **3.10+**
- 见 [chapter1/requirements.txt](chapter1/requirements.txt)：`fastapi`、`uvicorn`、`openai`、`pydantic` 等
- 可访问的 **LLM API 密钥**（默认经 SiliconFlow；模型名 `sf:` 前缀见 `config.py`）

### 安装与启动

```bash
cd /path/to/playground
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r chapter1/requirements.txt
```

在根目录配置 API（**需要自行配置API使用**）：

- [siliconflow_api.py](siliconflow_api.py)：`api_key`、`base_url`；`sf:` 前缀模型走此客户端
- [dashscope_api.py](dashscope_api.py)：百炼兼容模式；非 `sf:` 前缀时可经此调用

```bash
uvicorn chapter1.main:app --host 0.0.0.0 --port 8001
```

- 健康检查：<http://127.0.0.1:8001/health>
- 根路径 JSON 含 API 与前端入口提示

### 环境变量（模型与行为）

| 变量 | 说明 |
|------|------|
| `SILICONFLOW_BIG_MODEL` / `DASHSCOPE_BIG_MODEL` | 大关卡默认大模型 |
| `SILICONFLOW_SMALL_MODEL` / `DASHSCOPE_SMALL_MODEL` | 小模型默认 |
| `SILICONFLOW_LEVEL4_MODEL` | 附加关专用模型 |
| `SILICONFLOW_CHAT_HISTORY_MAX_MESSAGES` | 上传模型的最大历史条数 |
| `CHAPTER2_HTTP_BUDGET_SEC` | 第二章单次请求总预算（秒） |

详见 [chapter1/config.py](chapter1/config.py) 与第二章各关 `game_logic.py`。

### 自定义 API 地址

仅当静态页与 API **不同源或不同端口** 时：

- 在引入 `api.js` 前设置 `window.GAME_API_BASE_URL = 'http://主机:端口'`
- 或 `localStorage.setItem('GAME_API_BASE_URL', '...')` 后刷新
- 仅改端口：`window.GAME_API_PORT = 8000`（与 `uvicorn --port` 一致）

HTTPS 页面访问本机 HTTP API 时，见 [Front-end development/js/api.js](Front-end%20development/js/api.js) 顶部注释；生产环境建议反向代理同域。


---

## 开发与自检

- 格式与关卡逻辑变更后，建议手动走通 **登录 → 序章 → 第一章 level1 → health** 链路。
- 附加关若启用本地 tokenizer，需保证 `chapter1/routers/level4.py` 中 `tokenizer.json` 路径在本机存在。

---

## 主要 API 入口

| 前缀 | 说明 |
|------|------|
| `GET /health` | 健康检查 |
| `GET /` | API 与前端入口提示 |
| `POST /chapter1/level{1-5}/chat` | 第一章各关对话 |
| `POST /chapter1/level{1-5}/reset` | 重置本会话历史 |
| `POST /chapter2/level{1-3}/...` | 第二章各关（以各 `router.py` 为准） |
| 静态：`/Front-end development/...` | 前端页面与资源 |

推荐从 [Front-end development/js/api.js](Front-end%20development/js/api.js) 的封装函数调用后端，以保持 `session_id` 与章节路径一致。

### 重要文件

| 路径 | 说明 |
|------|------|
| [chapter1/config.py](chapter1/config.py) | 模型映射、关卡关键词参考 |
| [chapter1/services/chat_service.py](chapter1/services/chat_service.py) | 对话生成与 prompt 拼接 |
| [chapter1/services/judge_service.py](chapter1/services/judge_service.py) | 裁判 prompt 与 JSON 解析 |
| [chapter1/main.py](chapter1/main.py) | 路由注册与静态挂载 |
| [README.md](README.md) / [README_EN.md](README_EN.md) | 中英说明 |


---

## 使用边界

本仓库默认用于 **合法、合规的学习与实验**，请注意：

| 边界 | 说明 |
|------|------|
| API 密钥 | 当前多在代码内配置；公开仓库勿提交真实 key，生产请改用环境变量或密钥管理 |
| 模型输出 | 云端模型非确定性，同一关卡在不同时间回复可能不同；裁判 JSON 偶发解析失败会判为未通过 |
| 安全演示范围 | 关卡模拟攻击与防御思路，**不**等同于完整红队、WAF 或企业级 LLM 网关方案 |
| 第 4 关 tokenizer | 依赖本机路径与 `tokenizers` 包；缺失时仅影响 token 计数与 GCG 关体验 |
| Demo 地址 | 文档中的公网 IP 仅为示例，请以你实际部署的主机为准 |

---

## 近期更新

- **2026.05** — 《星辉剑传》正式上线：第一章多关、第二章防御关卡、第三章知识卷轴与尾声及附加关。

---

## 许可协议

本仓库源代码基于 [MIT License](https://github.com/RUIYUN-ML/SafeLLMPlayground/blob/main/LICENSE) 发布。请在合法、合规场景下用于学习与实验。

---
