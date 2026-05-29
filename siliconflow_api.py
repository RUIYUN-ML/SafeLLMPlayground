import os
from openai import AsyncOpenAI, OpenAI

api_key = "*" #请补充您的api_key

# 单轮对话等「单次外呼」场景：须小于前端 fetch 中止时间（约 30s），否则浏览器会先超时
_DEFAULT_HTTP_TIMEOUT = float(os.getenv("SILICONFLOW_HTTP_TIMEOUT", "29"))
# 控制生成长度，降低首字延迟与总耗时（中文约 80–150 字时 384 足够）
_DEFAULT_MAX_TOKENS = int(os.getenv("SILICONFLOW_MAX_TOKENS", "384"))

_client_kwargs = {
    "api_key": api_key,
    "base_url": "https://api.siliconflow.cn/v1",
    "timeout": _DEFAULT_HTTP_TIMEOUT,
}

client = OpenAI(**_client_kwargs)
async_client = AsyncOpenAI(**_client_kwargs)


def get_response(
    model_name: str,
    system_prompt: str,
    user_query: str,
    temperature: float | None = None,
    *,
    max_tokens: int | None = None,
    http_timeout: float | None = None,
) -> str:
    try:
        req_timeout = (
            http_timeout if http_timeout is not None else _DEFAULT_HTTP_TIMEOUT
        )
        create_kwargs: dict = {
            "model": model_name,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_query},
            ],
            "max_tokens": max_tokens if max_tokens is not None else _DEFAULT_MAX_TOKENS,
            "timeout": req_timeout,
        }
        if temperature is not None:
            create_kwargs["temperature"] = temperature
        resp = client.chat.completions.create(**create_kwargs)
        return resp.choices[0].message.content
    except Exception as e:
        return f"Error when querying API: {e}"


async def async_get_response(
    model_name: str,
    system_prompt: str,
    user_query: str,
    temperature: float | None = None,
    *,
    max_tokens: int | None = None,
    http_timeout: float | None = None,
) -> str:
    """与 get_response 等价，供 FastAPI 路由 await，避免 run_in_threadpool 占用线程与排队抖动。"""
    try:
        req_timeout = (
            http_timeout if http_timeout is not None else _DEFAULT_HTTP_TIMEOUT
        )
        create_kwargs: dict = {
            "model": model_name,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_query},
            ],
            "max_tokens": max_tokens if max_tokens is not None else _DEFAULT_MAX_TOKENS,
            "timeout": req_timeout,
        }
        if temperature is not None:
            create_kwargs["temperature"] = temperature
        resp = await async_client.chat.completions.create(**create_kwargs)
        content = resp.choices[0].message.content
        return content if content is not None else ""
    except Exception as e:
        return f"Error when querying API: {e}"


if __name__=="__main__":
    model_name = "Qwen/Qwen2.5-7B-Instruct"
    res = get_response(model_name, "you are a helpful assistant", "hello")
    print(res)
