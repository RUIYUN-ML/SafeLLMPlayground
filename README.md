# 《星辉剑传》项目说明

中文 ｜ [English](https://github.com/RUIYUN-ML/SafeLLMPlayground/blob/main/READ_EN.md)

![星辉剑传 序章首屏](Front-end%20development/assets/images/序章首屏.png)

**在线试玩（Demo）**：本仓库在服务器上与 FastAPI 同端口提供静态页。后端启动后，在浏览器中打开（路径中的空格可写作 `%20`）：

- 点击试玩：`http://124.223.115.66:8001/Front-end%20development/%E4%B8%BB%E9%A1%B5/login.html`

本地本机：将上述 `<服务器IP或域名>` 换为 `127.0.0.1` 或 `localhost` 即可。若前端与 API 不同机或端口不同，见下文「自定义 API 地址」。

大语言模型提示词安全科普小游戏。玩家将扮演勇者，与会说话的星辉剑对话，在沉浸式剧情体验中理解 **大语言模型提示词注入、越狱攻击与防御** 等概念。

## 🎮 核心内容

- 🗡️ 第一章：提示词注入与剧情关卡（`chapter1` 多关）
- 🛡️ 第二章：对话防御与铸灵相关关卡（`chapter2` 多关）
- 📜 第三章：知识卷轴式关卡与尾声

## 近期更新

- 2026.05 🔥《星辉剑传》正式上线
- 开源代码正在逐步上传/更新中···

## 运行方式

### 1. 环境配置

- **Python**：建议 **3.10 及以上**（与代码中类型标注等写法一致）。
- 进入本仓库的 `playground` 根目录（含 `chapter1` 与 `Front-end development` 的目录），安装依赖：

```bash
cd /path/to/playground
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r chapter1/requirements.txt
```

- **大模型 API 密钥**（当前实现为代码内配置，请**勿将含真实密钥的修改推送到公共仓库**）  
  - **阿里云百炼（DashScope，兼容 OpenAI 协议）**：在仓库根目录的 `dashscope_api.py` 中配置 `api_key` 与 `DASHSCOPE_BASE_URL`（默认已指向百炼兼容模式地址）。各关 **非 `sf:` 前缀** 的模型名经此处调用。  
  - **硅基流动（SiliconFlow）**：在仓库根目录的 `siliconflow_api.py` 中配置 `api_key` 与 `base_url`。当 [chapter1/config.py](chapter1/config.py) 中模型名以 **`sf:`** 开头时（如默认小模型 `sf:Qwen/Qwen2.5-7B-Instruct`），会走硅基流动。  
  - 模型名、关卡路由等还可通过环境变量覆盖，例如 `DASHSCOPE_BIG_MODEL`、`DASHSCOPE_SMALL_MODEL`、`DASHSCOPE_LEVEL4_MODEL` 等，详见 `chapter1/config.py` 与第二章各关的 `game_logic.py`。

若你改为从环境变量读取密钥，可本地修改 `dashscope_api.py` / `siliconflow_api.py` 从 `os.environ` 读取，与部署平台注入的 Secret 配合使用。

**可选（旧版 Streamlit 演示）**：根目录 [README.md](README.md) 中提供了 `streamlit run streamlit_demo.py` 的示例，依赖见根目录 `requirements.txt`（与主线 FastAPI 游戏相互独立）。

### 2. 启动后端（同时托管前端静态资源）

在 **`playground` 根目录** 下执行（与 `chapter1/main.py` 中挂载 `Front-end development` 的路径一致；默认与前端 [Front-end development/js/api.js](Front-end%20development/js/api.js) 中 **`GAME_API` 默认端口 8001** 对齐）：

```bash
cd /path/to/playground
source .venv/bin/activate
uvicorn chapter1.main:app --host 0.0.0.0 --port 8001
```

启动成功后，健康检查：<http://127.0.0.1:8001/health>；根路径 JSON 会提示 API 与前端入口。

### 3. 打开游戏页面（前端）

前端 **无需单独 `npm run dev`**，已由 FastAPI 挂载在同一进程、同一端口。浏览器访问：

- 见上文 **「在线试玩（Demo）」** 中的 `login.html` / `prologue.html` 地址。

**自定义 API 地址与端口**（仅当静态页与 API 不同源/端口时）：

- 在页面引入 `api.js` 前设置 `window.GAME_API_BASE_URL = 'http://你的API主机:端口'`，或 `localStorage.setItem('GAME_API_BASE_URL', '...')` 后刷新；见 `api.js` 顶部注释。  
- 仅改端口时可用 `window.GAME_API_PORT = 8000` 等，与 `uvicorn --port` 一致即可。

**说明**：在 **HTTPS 页面** 中请求本机 `http://127.0.0.1:端口` 时，`api.js` 会按注释处理混合适配；全站 HTTPS 时建议用反向代理把 API 与静态页同域，或显式设置 `GAME_API_BASE_URL`。

---

## 许可证协议

本仓库中提供的源代码基于 [MIT License](https://github.com/RUIYUN-ML/SafeLLMPlayground/blob/main/LICENSE) 许可，相关许可证见根目录。请在合法、合规的场景下进行学习与实验。

