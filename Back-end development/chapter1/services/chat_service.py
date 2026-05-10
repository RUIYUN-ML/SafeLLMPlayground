from typing import List

from starlette.concurrency import run_in_threadpool

from dashscope_api import get_response
from siliconflow_api import get_response as get_siliconflow_response

from chapter1.config import CHAT_MODEL_NAME, OUTPUT_FORMAT_PROMPT
from chapter1.prompts.base_persona import BASE_PERSONA_PROMPT

_HF_DISABLED_MSG = (
    "当前部署未启用本地 HuggingFace 推理（不依赖 torch/GPU）。"
    "请在 chapter1.config 或环境变量中为该关配置 DashScope 等云端模型名，勿使用 hf: 前缀。"
)


def _render_history(history: List[dict]) -> str:
    lines = []
    for item in history:
        role = item.get("role")
        content = item.get("content", "")
        if role == "user":
            lines.append(f"勇者：{content}")
        elif role == "assistant":
            lines.append(f"星辉：{content}")
    return "\n".join(lines)


def build_system_prompt(seal_prompt: str) -> str:
    return "\n".join([BASE_PERSONA_PROMPT, seal_prompt, OUTPUT_FORMAT_PROMPT])


async def generate_reply(
    seal_prompt: str,
    history: List[dict],
    user_message: str,
    model_name: str | None = None,
) -> str:
    model = model_name or CHAT_MODEL_NAME
    system_prompt = build_system_prompt(seal_prompt)
    # 避免把当前勇者输入重复写入历史
    trimmed_history = history
    if history and history[-1].get("role") == "user":
        trimmed_history = history[:-1]
    history_text = _render_history(trimmed_history)
    user_query = (
        "对话历史：\n"
        f"{history_text}\n"
        "勇者（当前）：\n"
        f"{user_message}\n"
        "请以星辉剑的口吻回复。"
    )
    if model.startswith("hf:"):
        reply = _HF_DISABLED_MSG
    elif model.startswith("sf:"):
        sf_name = model[len("sf:") :].strip()
        reply = await run_in_threadpool(
            get_siliconflow_response, sf_name, system_prompt, user_query
        )
    else:
        reply = await run_in_threadpool(get_response, model, system_prompt, user_query)
    if not reply:
        return "我刚才像是被雾噎住了……你再说一遍？"
    return reply.strip()


async def generate_reply_gcg(
    user_message: str,
    model_name: str | None = None,
) -> str:
    model = model_name or CHAT_MODEL_NAME
    system_prompt = "You are a helpful assistant."

    user_query = (
        f"星辉剑，{user_message}"
    )
    if model.startswith("hf:"):
        reply = _HF_DISABLED_MSG
    elif model.startswith("sf:"):
        sf_name = model[len("sf:") :].strip()
        reply = await run_in_threadpool(
            get_siliconflow_response, sf_name, system_prompt, user_query, 0.0
        )
    else:
        reply = await run_in_threadpool(get_response, model, system_prompt, user_query)
    if not reply:
        return "我刚才像是被雾噎住了……你再说一遍？"
    return reply.strip()
