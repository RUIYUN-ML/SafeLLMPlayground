# Legend of the Starlight Sword - Project Overview

[Chinese](Readme_finish.md) | English

![Starlight Sword - Prologue title screen](Front-end%20development/assets/images/%E5%BA%8F%E7%AB%A0%E9%A6%96%E5%B1%8F.png)

**Live demo**: This repository serves the static frontend on the **same port** as the FastAPI backend. After starting the server, open the following in a browser (encode spaces in the path as `%20` where needed):

- Game home (name entry / splash): `http://<server-ip-or-hostname>:8001/Front-end%20development/%E4%B8%BB%E9%A1%B5/login.html`

On your machine, replace `<server-ip-or-hostname>` with `127.0.0.1` or `localhost`. If the frontend and API run on different hosts or ports, see **Custom API URL** below.

An educational mini-game about **LLM prompt safety**. You play as a hero and talk to a speaking Starlight Sword, learning concepts such as **prompt injection, jailbreak attacks, and defenses** through story-driven play. 

## Core content

- Chapter 1: Prompt injection and story levels (`chapter1`, multiple stages)
- Chapter 2: Dialogue defense and spirit-forging levels (`chapter2`, multiple stages)
- Chapter 3: Scroll-style knowledge levels and epilogue

## Recent updates

- 2026.05 - *Legend of the Starlight Sword* initial public release

## How to run

### 1. Environment

- **Python**: **3.10+** recommended (matches type hints and code style in this repo).
- From the repository **root** that contains `chapter1` and `Front-end development`, install dependencies:

```bash
cd /path/to/playground
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r chapter1/requirements.txt
```

- **LLM API keys** (currently configured in code - **do not push real secrets** to a public repo)
  - **Alibaba Cloud DashScope (OpenAI-compatible)**: Set `api_key` and `DASHSCOPE_BASE_URL` in `dashscope_api.py` at the repo root (defaults target DashScope compatible mode). Model names **without** the `sf:` prefix are called through this client.
  - **SiliconFlow**: Set `api_key` and `base_url` in `siliconflow_api.py`. When a model name in [chapter1/config.py](chapter1/config.py) starts with **`sf:`** (e.g. default small model `sf:Qwen/Qwen2.5-7B-Instruct`), requests go to SiliconFlow.
  - Model names and level routing can be overridden with environment variables such as `DASHSCOPE_BIG_MODEL`, `DASHSCOPE_SMALL_MODEL`, `DASHSCOPE_LEVEL4_MODEL`; see `chapter1/config.py` and each Chapter 2 `game_logic.py`.

To read keys from the environment instead, you can locally change `dashscope_api.py` / `siliconflow_api.py` to use `os.environ`, matching secrets injected by your hosting platform.

**Optional (legacy Streamlit demo)**: Root [README.md](README.md) documents `streamlit run streamlit_demo.py`; dependencies are in root `requirements.txt` (separate from the main FastAPI game).

### 2. Start the backend (static frontend mounted together)

From the **`playground` root** (same static mount as in `chapter1/main.py`; default port **8001** aligns with [Front-end development/js/api.js](Front-end%20development/js/api.js) **`GAME_API`**):

```bash
cd /path/to/playground
source .venv/bin/activate
uvicorn chapter1.main:app --host 0.0.0.0 --port 8001
```

Health check: <http://127.0.0.1:8001/health>. The root JSON response points to API and frontend entry hints.

### 3. Open the game in the browser

You **do not** need `npm run dev`; FastAPI serves the frontend in the same process and port. Use the **Live demo** URLs above for `login.html` / `prologue.html`.

**Custom API URL or port** (only when static pages and the API differ in origin or port):

- Before loading `api.js`, set `window.GAME_API_BASE_URL = 'http://your-api-host:port'`, or `localStorage.setItem('GAME_API_BASE_URL', '...')` and refresh; see comments at the top of `api.js`.
- To change only the port, you can use `window.GAME_API_PORT = 8000`, matching `uvicorn --port`.

**Note**: When an **HTTPS** page calls `http://127.0.0.1:port`, `api.js` applies the mixed-content handling described in its comments. For full HTTPS sites, prefer a reverse proxy so API and static assets share one origin, or set `GAME_API_BASE_URL` explicitly.

---

## License

Source code in this repository is provided under the [MIT License](https://github.com/RUIYUN-ML/SafeLLMPlayground/blob/main/LICENSE); see the license files at the repository root. Use this project for learning and experiments only in lawful, compliant settings.
