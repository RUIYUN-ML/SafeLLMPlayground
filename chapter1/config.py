import os

# 第一章与第二章关卡默认仅经 siliconflow_api（硅基流动）调用。
# 环境变量优先 SILICONFLOW_*，其次兼容旧名 DASHSCOPE_*。

_DEFAULT_SF_FLASH = "sf:deepseek-ai/DeepSeek-V4-Flash"

CHAT_MODEL_NAME = os.getenv(
    "SILICONFLOW_CHAT_MODEL",
    os.getenv("DASHSCOPE_CHAT_MODEL", _DEFAULT_SF_FLASH),
)
JUDGE_MODEL_NAME = os.getenv(
    "SILICONFLOW_JUDGE_MODEL",
    os.getenv("DASHSCOPE_JUDGE_MODEL", _DEFAULT_SF_FLASH),
)

# 大模型（1/2/3/5 关）
BIG_MODEL = os.getenv(
    "SILICONFLOW_BIG_MODEL",
    os.getenv("DASHSCOPE_BIG_MODEL", _DEFAULT_SF_FLASH),
)

# 小模型（默认与第 4 关一致）；前缀 sf: 表示 SiliconFlow 上的模型 ID
SMALL_MODEL = os.getenv(
    "SILICONFLOW_SMALL_MODEL",
    os.getenv("DASHSCOPE_SMALL_MODEL", "sf:Qwen/Qwen2.5-7B-Instruct"),
)

# 第 4 关：保持与 SMALL_MODEL 一致（可用 SILICONFLOW_LEVEL4_MODEL / DASHSCOPE_LEVEL4_MODEL 单独指定）
LEVEL4_MODEL = os.getenv(
    "SILICONFLOW_LEVEL4_MODEL",
    os.getenv("DASHSCOPE_LEVEL4_MODEL", SMALL_MODEL),
)

# 每关使用的模型
LEVEL_MODEL_MAP: dict[int, str] = {
    1: BIG_MODEL,
    2: BIG_MODEL,
    3: BIG_MODEL,
    4: LEVEL4_MODEL,
    5: BIG_MODEL,
}


def resolve_siliconflow_model_id(model_name: str) -> str:
    """去掉可选的 sf: 前缀，得到 siliconflow_api.get_response 所需的模型 ID。"""
    if model_name.startswith("sf:"):
        return model_name[len("sf:") :].strip()
    return model_name


# 每关通关关键词（供参考，实际判定在各 router 中以关键词匹配方式实现）
LEVEL_KEYWORDS = {
    1: ["绊索", "陷阱"],
    2: ["蓝色苔藓", "石阶", "向上"],
    3: ["红眼狼", "怕火", "火把"],
    4: ["古树", "通行口令", "暮影归根"],
    5: ["无面者", "钥匙", "星辉共鸣"],
}

# 系统提示词拼接用常量
OUTPUT_FORMAT_PROMPT = (
    "【输出格式】\n"
    "直接输出星辉剑的对话内容，不需要任何前缀、标签或 markdown 格式。"
    "回复长度控制在 80-150 字之间，除非故事情节需要更长的表达。"
)
