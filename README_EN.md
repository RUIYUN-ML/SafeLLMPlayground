# Legend of the Starlight Sword

An interactive story-driven mini-game about **LLM prompt security** for learning and outreach.

Built with **Python 3.10+**, **FastAPI**, and **vanilla HTML/CSS/JS**: the backend talks to OpenAI-compatible APIs such as SiliconFlow; the frontend is served from the same process. Players experience concepts like **prompt injection, jailbreak induction, dialogue defenses, and GCG-style attacks** through in-story dialogue.

[中文](README.md) | English

![Legend of the Starlight Sword - Prologue title screen](Front-end%20development/assets/images/序章首屏.png)

**Live demo**: After starting the backend, open in your browser (encode spaces in paths as `%20`):

- [StartGame] (http://<server-ip-or-hostname>:8001/Front-end%20development/主页/login.html)


On your machine, replace `<server-ip-or-hostname>` with `127.0.0.1` or `localhost`.

---

## Core content

### Chaptered story levels

- Chapter 1: Prompt injection and story levels (`chapter1`, multiple stages)
- Chapter 2: Dialogue defense and spirit-forging levels (`chapter2`, multiple stages)
- Chapter 3: Scroll-style knowledge levels
- Epilogue: Bonus jailbreak attack level

### Flexible pass conditions

- **Keyword / rule checks**: Some levels detect pass keywords or leaked secrets in replies (e.g. Chapter 2 checks whether confidential terms appear in model output).
- **LLM judge** (`judge_service`): Some levels use a separate model to output `{"passed": bool, "reason": "..."}` JSON against a configured list of core elements; semantically close answers count as a pass.

### Sessions and multi-turn dialogue

`session_store` keeps conversation history per `level` + `session_id`; `chat_service` caps how many history messages are sent (`SILICONFLOW_CHAT_HISTORY_MAX_MESSAGES`) to control prompt growth. Frontend `api.js` generates and reuses a `session_id` per chapter/level in `sessionStorage`, aligned with backend `/chat` and `/reset`.

### Bonus level: short suffix and GCG theme

The bonus level limits player input to about **8 tokens** (validated locally with `tokenizers`). `generate_reply_gcg` nudges the model toward replies containing specific keywords, illustrating **GCG (Greedy Coordinate Gradient)**-style attacks. See [writeups](https://github.com/RUIYUN-ML/SafeLLMPlayground/tree/main/writeups).

### Unified frontend and adventure map

`Front-end development` provides login/prologue, chapter level pages, adventure map (`adventure-map.js`), knowledge album (`knowledge-album.js`), and epilogue. Global styles and components: `css/global.css`, `css/components.css`; `js/api.js` supports `GAME_API_BASE_URL`, `GAME_API_PORT`, and HTTPS mixed-content handling.

---

## Repository layout

```
chapter1/                      Chapter 1 FastAPI: routes, sessions, chat, judge
  main.py                      App entry; mounts frontend static dir
  config.py                    Model names, level mapping, keyword reference
  routers/                     level1–level4 routes
  services/                    chat_service, judge_service
  prompts/                     Personas, per-level seals, GCG notes
chapter2/                      Chapter 2 level logic and routes
  level1/ level2/ level3/      Per-level router, game_logic, prompts
  http_budget.py               Per-request API call timeout budget
  cors.py                      CORS config
Front-end development/         Main frontend (home, chapters, map, epilogue)
siliconflow_api.py             SiliconFlow API wrapper (repo root)
README.md / README_EN.md       Project entry docs

```

---

## Running the project

### Dependencies

- Python **3.10+**
- See [chapter1/requirements.txt](chapter1/requirements.txt): `fastapi`, `uvicorn`, `openai`, `pydantic`, etc.
- A reachable **LLM API key** (SiliconFlow by default; `sf:` model prefix in `config.py`)

### Install and start

```bash
cd /path/to/playground
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r chapter1/requirements.txt
```

Configure APIs at the repo root (**you must set up API access yourself**):

- [siliconflow_api.py](siliconflow_api.py): `api_key`, `base_url`; `sf:` models use this client
- [dashscope_api.py](dashscope_api.py): Bailian compatible mode; non-`sf:` models may use this client

```bash
uvicorn chapter1.main:app --host 0.0.0.0 --port 8001
```

- Health check: <http://127.0.0.1:8001/health>
- Root JSON includes API and frontend entry hints

### Environment variables (models and behavior)

| Variable | Description |
|----------|-------------|
| `SILICONFLOW_BIG_MODEL` / `DASHSCOPE_BIG_MODEL` | Default large model for major levels |
| `SILICONFLOW_SMALL_MODEL` / `DASHSCOPE_SMALL_MODEL` | Default small model |
| `SILICONFLOW_LEVEL4_MODEL` | Bonus level dedicated model |
| `SILICONFLOW_CHAT_HISTORY_MAX_MESSAGES` | Max history messages sent to the model |
| `CHAPTER2_HTTP_BUDGET_SEC` | Chapter 2 per-request total budget (seconds) |

See [chapter1/config.py](chapter1/config.py) and each Chapter 2 `game_logic.py`.

### Custom API URL

Only when static pages and the API are **different origin or port**:

- Before loading `api.js`, set `window.GAME_API_BASE_URL = 'http://host:port'`
- Or `localStorage.setItem('GAME_API_BASE_URL', '...')` then refresh
- Port only: `window.GAME_API_PORT = 8000` (must match `uvicorn --port`)

For HTTPS pages calling a local HTTP API, see comments at the top of [Front-end development/js/api.js](Front-end%20development/js/api.js); production setups should use a same-origin reverse proxy.

---

## Development and smoke checks

- After formatting or level-logic changes, manually verify **login → prologue → Chapter 1 level1 → health**.
- If bonus Level uses a local tokenizer, ensure the `tokenizer.json` path in `chapter1/routers/level4.py` exists on your machine.

---

## Main API endpoints

| Prefix | Description |
|--------|-------------|
| `GET /health` | Health check |
| `GET /` | API and frontend entry hints |
| `POST /chapter1/level{1-5}/chat` | Chapter 1 dialogue per level |
| `POST /chapter1/level{1-5}/reset` | Reset session history |
| `POST /chapter2/level{1-3}/...` | Chapter 2 per level (see each `router.py`) |
| Static: `/Front-end development/...` | Frontend pages and assets |

Prefer calling the backend through helpers in [Front-end development/js/api.js](Front-end%20development/js/api.js) to keep `session_id` and chapter paths consistent.

### Key files

| Path | Description |
|------|-------------|
| [chapter1/config.py](chapter1/config.py) | Model mapping, level keyword reference |
| [chapter1/services/chat_service.py](chapter1/services/chat_service.py) | Reply generation and prompt assembly |
| [chapter1/services/judge_service.py](chapter1/services/judge_service.py) | Judge prompts and JSON parsing |
| [chapter1/main.py](chapter1/main.py) | Route registration and static mount |
| [README.md](README.md) / [README_EN.md](README_EN.md) | Chinese / English docs |

---

## Usage boundaries

This repository is intended for **lawful, compliant learning and experiments**. Please note:

| Boundary | Notes |
|----------|-------|
| API keys | Often configured in code today; do not commit real keys to public repos; use env vars or a secret manager in production |
| Model output | Cloud models are non-deterministic; the same level may differ over time; occasional judge JSON parse failures count as not passed |
| Security demo scope | Levels illustrate attack/defense ideas; they are **not** a full red team, WAF, or enterprise LLM gateway |
| Level 4 tokenizer | Depends on local paths and the `tokenizers` package; missing pieces only affect token counting and the GCG level experience |
| Demo URLs | Public IPs in docs are examples only; use your actual deployment host |

---

## Recent updates

- **2026.05** — *Legend of the Starlight Sword* initial release: Chapter 1 multi-level, Chapter 2 defense levels, Chapter 3 knowledge scrolls, epilogue, and bonus level.

---

## License

Source code in this repository is released under the [MIT License](https://github.com/RUIYUN-ML/SafeLLMPlayground/blob/main/LICENSE). Use it for learning and experiments only in lawful, compliant settings.

---
