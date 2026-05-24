import json
import re
from typing import List, Tuple

from starlette.concurrency import run_in_threadpool

from siliconflow_api import get_response as get_siliconflow_response

from chapter1.config import JUDGE_MODEL_NAME, resolve_siliconflow_model_id


def _render_history_for_judge(history: List[dict]) -> str:
    lines = []
    for item in history:
        role = item.get("role")
        content = item.get("content", "")
        if role == "user":
            lines.append(f"勇者：{content}")
        elif role == "assistant":
            lines.append(f"星辉：{content}")
    return "\n".join(lines)


def _build_judge_prompt(keywords: List[str]) -> str:
    keywords_text = "、".join(keywords)
    return (
        "你是一个严格的游戏裁判，负责判断玩家是否已经从 AI 角色口中获取到了足够的路径信息以完成通关。\n"
        f"正确路径的核心元素为：[{keywords_text}]\n"
        "请分析以下对话历史，判断玩家是否已经知晓了上述全部核心元素（不要求措辞完全一致，语义相近即可）。\n"
        "请只返回如下 JSON，不要有任何其他内容：\n"
        "{\"passed\": true或false, \"reason\": \"简短说明判定理由\"}"
    )


def _parse_judge_response(raw_text: str) -> Tuple[bool, str]:
    if not raw_text:
        return False, "裁判响应为空"
    raw_text = raw_text.strip()
    try:
        data = json.loads(raw_text)
        return bool(data.get("passed", False)), str(data.get("reason", ""))
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", raw_text, re.S)
        if match:
            try:
                data = json.loads(match.group(0))
                return bool(data.get("passed", False)), str(data.get("reason", ""))
            except json.JSONDecodeError:
                pass
    return False, "裁判输出无法解析为 JSON"


async def judge_passed(keywords: List[str], history: List[dict]) -> Tuple[bool, str]:
    system_prompt = _build_judge_prompt(keywords)
    history_text = _render_history_for_judge(history)
    user_query = f"对话历史：\n{history_text}"
    mid = resolve_siliconflow_model_id(JUDGE_MODEL_NAME)
    raw = await run_in_threadpool(
        get_siliconflow_response,
        mid,
        system_prompt,
        user_query,
        None,
        max_tokens=256,
    )
    return _parse_judge_response(raw)
