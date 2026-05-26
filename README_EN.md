# StarBlade Chronicles

[中文](https://github.com/RUIYUN-ML/SafeLLMPlayground/blob/main/README.md) ｜ English

**StarBlade Chronicles** is an interactive narrative game designed for learning and raising awareness about **LLM prompt security**. Built with Python 3.10+, FastAPI, and vanilla HTML/CSS/JS, it uses an OpenAI-compatible LLM API on the backend and serves static assets from the same process. Players explore concepts such as **prompt injection**, **dialogue defense**, and **GCG attacks** through story-driven gameplay — presenting prompt injection challenges in a visual, interactive format.

This project also serves as a reusable template for LLM-based text adventure game development, covering session management, multi-turn dialogue, configurable level logic, LLM judges, keyword evaluation, and a decoupled frontend/backend architecture — ready to be adapted for similar games or educational demos.

![StarBlade Chronicles – Prologue Title Screen](https://github.com/RUIYUN-ML/SafeLLMPlayground/blob/main/Front-end%20development/assets/images/%E5%BA%8F%E7%AB%A0%E9%A6%96%E5%B1%8F.png?raw=true)

**Live Demo**: [Play Now](http://124.223.115.66:8001/Front-end%20development/%E4%B8%BB%E9%A1%B5/login.html)

---

## Recent Updates

- **2026.05** — StarBlade Chronicles officially launched

---

## Content Overview

- **Prologue**: The hero's journey begins
- **Chapter 1**: Prompt injection levels woven into the narrative
- **Chapter 2**: Dialogue defense and Spirit-Forging levels
- **Chapter 3**: Knowledge scroll-style levels
- **Epilogue**: One chapter closes, but the hero's adventure continues
- **Bonus Stage**: Hands-on GCG attack practice — a deep dive into LLM jailbreak techniques

---

## Quick Start

### Prerequisites

- Python **3.10+**
- Required packages: `fastapi`, `uvicorn`, `openai`, `pydantic`, etc.
  (`pip install -r chapter1/requirements.txt`)
- A valid **SiliconFlow LLM API** key (or any compatible LLM API key)

### Setup & Launch

```bash
cd /path/to/playground
python3 -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r chapter1/requirements.txt
```

Configure your LLM API key in the root directory (set `api_key` and `base_url` in `siliconflow_api.py`), then start the server:

```bash
uvicorn chapter1.main:app --host 0.0.0.0 --port 8001
```

Once running, open your browser and navigate to:

```
http://127.0.0.1:8001/Front-end%20development/%E4%B8%BB%E9%A1%B5/login.html
```

---

## Template Development Guide

### Repository Structure

```
chapter1/                      Chapter 1 FastAPI app: routing, sessions, chat & judge services
  main.py                      Application entry point; mounts the frontend static directory
  config.py                    Model names, level mappings, keyword references
  routers/                     level1–level4 route handlers
  services/                    chat_service, judge_service
  prompts/                     Character personas and per-level prompts
chapter2/                      Chapter 2 level logic and routing
  level1/ level2/ level3/      Per-level router, game_logic, and prompts
  http_budget.py               Per-request API call timeout budget
  cors.py                      CORS configuration
Front-end development/         Main frontend (home, chapters, map, epilogue)
siliconflow_api.py             SiliconFlow LLM API wrapper
README.md / README_EN.md       Project documentation (Chinese / English)
```

### Key Files

| Path | Description |
| :--- | :--- |
| `chapter1/config.py` | Model mappings and level keyword configuration |
| `chapter1/services/chat_service.py` | Response generation and prompt assembly |
| `chapter1/services/judge_service.py` | Judge prompts and JSON parsing |
| `chapter1/main.py` | Route registration and static file mounting |
| `README.md` / `README_EN.md` | Project documentation |

### Configuration Variables

| Variable | Description |
| :--- | :--- |
| `SILICONFLOW_BIG_MODEL` | Name of the large model |
| `SILICONFLOW_SMALL_MODEL` | Name of the small model |
| `SILICONFLOW_LEVEL4_MODEL` | Model used for the bonus stage |
| `SILICONFLOW_CHAT_HISTORY_MAX_MESSAGES` | Maximum number of history messages sent to the model |
| `CHAPTER2_HTTP_BUDGET_SEC` | Total per-request time budget for Chapter 2 (seconds) |

See `chapter1/config.py` and `game_logic.py` in each Chapter 2 level for details.

### Main API Endpoints

| Prefix | Description |
| :--- | :--- |
| `POST /chapter1/level{1-5}/chat` | Chat endpoint for each Chapter 1 level |
| `POST /chapter1/level{1-5}/reset` | Reset conversation history for the current session |
| `POST /chapter2/level{1-3}/...` | Chapter 2 levels (see each `router.py`) |
| Static: `/Front-end development/...` | Frontend pages and assets |

It is recommended to call the backend through the wrapper functions in the frontend's `api.js` to keep `session_id` and chapter paths consistent.

### Custom API Base URL

When the static pages and API are on different origins or ports:

- Set `window.GAME_API_BASE_URL = 'http://host:port'` before importing `api.js`, or
- Run `localStorage.setItem('GAME_API_BASE_URL', '...')` and refresh the page.
- To change only the port: set `window.GAME_API_PORT = 8000` (matching `uvicorn --port`).

For HTTPS pages calling a local HTTP API, refer to the comments at the top of `Front-end development/js/api.js`. For production deployments, a reverse proxy on the same domain is recommended.

### Development Notes

This repository is intended for **lawful, compliant learning and experimentation**. Please note:

- Configure API keys locally. **Never commit real keys to a public repository.** Use environment variables or a secrets manager in production.
- Cloud model outputs are non-deterministic. The same input may produce different responses across runs, and the judge may occasionally fail to parse JSON, which will be treated as a failed attempt.

---

## License

The source code in this repository is released under the [MIT License](https://github.com/RUIYUN-ML/SafeLLMPlayground/blob/main/LICENSE). Please use it only in lawful and compliant contexts for learning and experimentation.
