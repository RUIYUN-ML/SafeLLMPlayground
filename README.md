# 《星辉剑传》

中文 ｜ [English](https://github.com/RUIYUN-ML/SafeLLMPlayground/blob/main/README_EN.md)

《星辉剑传》是一款面向 大语言模型提示词安全 学习与科普场景的剧情互动游戏。项目以 Python 3.10+、FastAPI 及原生 HTML/CSS/JS 实现，后端使用 OpenAI 兼容的大模型 API，前端由同一进程挂载静态资源。玩家在剧情对话中体验 提示词注入、对话防御与 GCG 攻击 等概念，将提示词注入问题以可视化、可交互的方式呈现。

同时，本项目为基于 LLM 的文字对话游戏开发提供了可用的模板与参考实现，涵盖会话管理、多轮对话、可配置的关卡逻辑、LLM 裁判、关键词判定及前后端分离架构，可快速复用于同类游戏或教育演示项目。

![星辉剑传 序章首屏](https://github.com/RUIYUN-ML/SafeLLMPlayground/blob/main/Front-end%20development/assets/images/%E5%BA%8F%E7%AB%A0%E9%A6%96%E5%B1%8F.png?raw=true)

**在线试玩（Demo）**：[点击进入](http://124.223.115.66:8001/Front-end development/主页/login.html) 

------

## 近期更新

- **2026.05** — 《星辉剑传》正式上线



## 核心内容

- **序 章**：勇者的故事开始了
- **第一章**：提示词注入与剧情关卡
- **第二章**：对话防御与铸灵相关关卡
- **第三章**：知识卷轴式关卡
- **尾 声**：故事告一段落，但勇者的旅程仍在继续
- **附加关**：GCG 攻击实践，深入了解LLM越狱攻击相关知识



## 快速开始

### 依赖

- Python **3.10+**
- 依赖包：`fastapi`、`uvicorn`、`openai`、`pydantic` 等（ `pip install -r chapter1/requirements.txt`）
- 配置有效的 **SiliconFlow LLM API** 或其他LLM API密钥

### 前后端启动

```
cd /path/to/playground
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r chapter1/requirements.txt
```

在根目录配置 LLM API 密钥（`siliconflow_api.py` 中设置 `api_key`、`base_url`）：

```
uvicorn chapter1.main:app --host 0.0.0.0 --port 8001
```

启动后，浏览器访问 `http://127.0.0.1:8001/Front-end%20development/%E4%B8%BB%E9%A1%B5/login.html` 即可进入主页。



------

## 模板开发说明

### 仓库结构

```
chapter1/                      第一章 FastAPI：路由、会话、聊天与裁判服务
  main.py                      应用入口；挂载前端静态目录
  config.py                    模型名、关卡映射、关键词参考
  routers/                     level1–level4 路由
  services/                    chat_service、judge_service
  prompts/                     人设、各关 prompts
chapter2/                      第二章关卡逻辑与路由
  level1/ level2/ level3/      各关 router、game_logic、prompts
  http_budget.py               单次请求内 API 调用超时预算
  cors.py                      CORS 配置
Front-end development/         主线前端（主页、各章关卡、地图、尾声）
siliconflow_api.py             硅基流动 LLM API 封装
README.md / README_EN.md       项目说明
```

### 重要文件

| 路径                                 | 说明                     |
| :----------------------------------- | :----------------------- |
| `chapter1/config.py`                 | 模型映射、关卡关键词配置 |
| `chapter1/services/chat_service.py`  | 对话生成与 prompt 拼接   |
| `chapter1/services/judge_service.py` | 裁判 prompt 与 JSON 解析 |
| `chapter1/main.py`                   | 路由注册与静态挂载       |
| `README.md` / `README_EN.md`         | 中英文项目介绍           |

### 变量说明

| 变量                                    | 说明                       |
| :-------------------------------------- | :------------------------- |
| `SILICONFLOW_BIG_MODEL`                 | 大模型名称                 |
| `SILICONFLOW_SMALL_MODEL`               | 小模型名称                 |
| `SILICONFLOW_LEVEL4_MODEL`              | 附加关模型名称             |
| `SILICONFLOW_CHAT_HISTORY_MAX_MESSAGES` | 上传模型的最大历史条数     |
| `CHAPTER2_HTTP_BUDGET_SEC`              | 第二章单次请求总预算（秒） |

详见 `chapter1/config.py` 与第二章各关 `game_logic.py`。

### 主要 API 入口

| 前缀                               | 说明                                |
| :--------------------------------- | :---------------------------------- |
| `POST /chapter1/level{1-5}/chat`   | 第一章各关对话                      |
| `POST /chapter1/level{1-5}/reset`  | 重置本会话历史                      |
| `POST /chapter2/level{1-3}/...`    | 第二章各关（以各 `router.py` 为准） |
| 静态：`/Front-end development/...` | 前端页面与资源                      |

推荐从前端 `api.js` 的封装函数调用后端，以保持 `session_id` 与章节路径一致。

### 自定义 API 地址

当静态页与 API 不同源或不同端口时：

- 在引入 `api.js` 前设置 `window.GAME_API_BASE_URL = 'http://主机:端口'`
- 或 `localStorage.setItem('GAME_API_BASE_URL', '...')` 后刷新
- 仅改端口：`window.GAME_API_PORT = 8000`（与 `uvicorn --port` 一致）

HTTPS 页面访问本机 HTTP API 时，参考 `Front-end development/js/api.js` 顶部注释；生产环境建议使用反向代理同域。

### 开发提示

本仓库默认用于 **合法、合规的学习与实验**，请注意：

- API密钥请在本地自行配置，公开仓库勿提交真实密钥，生产请改用环境变量或密钥管理
- 云端模型输出存在非确定性，同一关卡对于同一输入的多次回复可能不同；裁判 JSON 偶发解析失败会判为未通过

------

## 许可协议

本仓库源代码基于 [MIT License](https://github.com/RUIYUN-ML/SafeLLMPlayground/blob/main/LICENSE) 发布。请在合法、合规场景下用于学习与实验。
