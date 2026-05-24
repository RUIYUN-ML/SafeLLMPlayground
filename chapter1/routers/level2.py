import uuid

from fastapi import APIRouter, Form
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field

from chapter1.config import LEVEL_MODEL_MAP
from chapter1.prompts.level2_seal import LEVEL2_SEAL_PROMPT
from chapter1.services.chat_service import generate_reply
from chapter1.session_store import append_message, get_history, reset_session, round_count

LEVEL2_PASS_KEYWORDS = ["青苔", "台阶"]


def _check_passed(reply: str):
    if all(kw in reply for kw in LEVEL2_PASS_KEYWORDS):
        return True, f"回复中同时含有关键词「{'」「'.join(LEVEL2_PASS_KEYWORDS)}」"
    return False, None


router = APIRouter(prefix="/chapter1/level2", tags=["chapter1-level2"])


class ChatRequest(BaseModel):
    session_id: str = Field(..., description="会话 ID")
    message: str = Field(..., description="勇者输入")


class ChatResponse(BaseModel):
    reply: str
    passed: bool
    pass_reason: str | None
    round: int


class ResetRequest(BaseModel):
    session_id: str


def _render_ui(
    session_id: str,
    message: str = "",
    reply: str = "",
    passed: bool = False,
    pass_reason: str | None = None,
    round_num: int = 0,
) -> str:
    pass_text = "已通关" if passed else "未通关"
    reason_text = pass_reason or "-"
    return f"""
<!doctype html>
<html lang="zh">
  <head>
    <meta charset="utf-8" />
    <title>第一章 Level 2 对话</title>
    <style>
      body {{ font-family: sans-serif; max-width: 720px; margin: 24px auto; }}
      label {{ display: block; margin: 12px 0 6px; }}
      input[type="text"], textarea {{ width: 100%; padding: 8px; }}
      textarea {{ height: 120px; }}
      .meta {{ color: #555; margin-top: 12px; }}
      .reply {{ background: #f6f6f6; padding: 12px; border-radius: 6px; }}
      .muted {{ color: #888; font-size: 12px; }}
    </style>
  </head>
  <body>
    <h2>星辉剑传 · 第一章 · Level 2 · 封口咒</h2>
    <form method="post" action="/chapter1/level2/ui">
      <label>session_id（同一会话保持一致）</label>
      <input type="text" name="session_id" value="{session_id}" />
      <label>message</label>
      <textarea name="message" placeholder="请输入你的问题...">{message}</textarea>
      <button type="submit">发送</button>
    </form>
    <div class="meta">
      <div>回合数：{round_num}</div>
      <div>通关状态：{pass_text}</div>
      <div>通关原因：{reason_text}</div>
    </div>
    <h3>星辉回复</h3>
    <div class="reply">{reply or "<span class='muted'>等待输入...</span>"}</div>
  </body>
</html>
"""


@router.post("/chat", response_model=ChatResponse)
async def level2_chat(payload: ChatRequest):
    level_name = "level2"
    history = get_history(level_name, payload.session_id)

    append_message(level_name, payload.session_id, "user", payload.message)
    reply = await generate_reply(LEVEL2_SEAL_PROMPT, history, payload.message, model_name=LEVEL_MODEL_MAP[2])
    append_message(level_name, payload.session_id, "assistant", reply)

    passed, reason = _check_passed(reply)
    return ChatResponse(
        reply=reply,
        passed=passed,
        pass_reason=reason if passed else None,
        round=round_count(level_name, payload.session_id),
    )


@router.post("/reset")
def level2_reset(payload: ResetRequest):
    reset_session("level2", payload.session_id)
    return {"success": True}


@router.get("/ui", response_class=HTMLResponse)
def level2_ui(session_id: str | None = None):
    sid = session_id or str(uuid.uuid4())
    return HTMLResponse(_render_ui(session_id=sid))


@router.post("/ui", response_class=HTMLResponse)
async def level2_ui_post(
    session_id: str = Form(""),
    message: str = Form(""),
):
    level_name = "level2"
    sid = session_id or str(uuid.uuid4())
    history = get_history(level_name, sid)

    if message.strip():
        append_message(level_name, sid, "user", message)
        reply = await generate_reply(LEVEL2_SEAL_PROMPT, history, message, model_name=LEVEL_MODEL_MAP[2])
        append_message(level_name, sid, "assistant", reply)
        passed, reason = _check_passed(reply)
        round_num = round_count(level_name, sid)
    else:
        reply = ""
        passed = False
        reason = None
        round_num = round_count(level_name, sid)

    return HTMLResponse(
        _render_ui(
            session_id=sid,
            message=message,
            reply=reply,
            passed=passed,
            pass_reason=reason if passed else None,
            round_num=round_num,
        )
    )
