from typing import Dict, List


# 使用内存字典维护每一关的会话
_sessions: Dict[str, Dict[str, List[dict]]] = {
    "level1": {},
    "level2": {},
    "level3": {},
    "level4": {},
}


def get_history(level_name: str, session_id: str) -> List[dict]:
    return _sessions.get(level_name, {}).setdefault(session_id, [])


def append_message(level_name: str, session_id: str, role: str, content: str) -> None:
    history = get_history(level_name, session_id)
    history.append({"role": role, "content": content})


def reset_session(level_name: str, session_id: str) -> None:
    level_sessions = _sessions.get(level_name)
    if level_sessions is not None:
        level_sessions[session_id] = []


def round_count(level_name: str, session_id: str) -> int:
    history = get_history(level_name, session_id)
    return sum(1 for item in history if item.get("role") == "user")
