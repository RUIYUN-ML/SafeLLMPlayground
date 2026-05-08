import os

# 使用 DashScope 兼容 OpenAI 的模型名称，可通过环境变量覆盖
CHAT_MODEL_NAME = os.getenv("DASHSCOPE_CHAT_MODEL", "qwen-plus")
JUDGE_MODEL_NAME = os.getenv("DASHSCOPE_JUDGE_MODEL", "qwen-plus")

# 大模型（1/2/3/5 关）：语义理解强，封印更难绕过
# qwen-max 等已逐步下线，默认用 qwen3-max；可改为 deepseek-v3 等（见百炼模型列表）
BIG_MODEL = os.getenv("DASHSCOPE_BIG_MODEL", "qwen3-max")

# 小模型：前缀 sf: 表示经 siliconflow_api（硅基流动）调用，值为 SiliconFlow 上的模型名
SMALL_MODEL = os.getenv("DASHSCOPE_SMALL_MODEL", "sf:Qwen/Qwen2.5-7B-Instruct")

# 第 4 关：经 DashScope 兼容 API 调用（默认与 SMALL_MODEL 一致，可用 DASHSCOPE_LEVEL4_MODEL 单独指定）
LEVEL4_MODEL = os.getenv("DASHSCOPE_LEVEL4_MODEL", SMALL_MODEL)

# 每关使用的模型
LEVEL_MODEL_MAP: dict[int, str] = {
    1: BIG_MODEL,
    2: BIG_MODEL,
    3: BIG_MODEL,
    4: LEVEL4_MODEL,
    5: BIG_MODEL,
}

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
