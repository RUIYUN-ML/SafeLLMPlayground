/**
 * 后端根地址（不含末尾 /）。
 * 优先级：window.GAME_API_BASE_URL → localStorage GAME_API_BASE_URL → 自动推断。
 * 自定义示例：localStorage.setItem('GAME_API_BASE_URL', 'http://192.168.1.3:8001'); 后刷新页面。
 * 仅改端口：在引入本文件前设 window.GAME_API_PORT = 8000（默认与 uvicorn --port 8001 对齐）。
 */
function getDefaultApiPort() {
    const p = window.GAME_API_PORT;
    if (typeof p === 'number' && p > 0 && p < 65536) return p;
    return 8001;
}

function getApiBaseUrl() {
    if (typeof window.GAME_API_BASE_URL === 'string' && window.GAME_API_BASE_URL.trim()) {
        return window.GAME_API_BASE_URL.trim().replace(/\/$/, '');
    }
    try {
        const stored = localStorage.getItem('GAME_API_BASE_URL');
        if (stored && stored.trim()) {
            return stored.trim().replace(/\/$/, '');
        }
    } catch (e) {
        /* 隐私模式等 */
    }
    const port = getDefaultApiPort();
    if (window.location.protocol === 'file:') {
        return 'http://127.0.0.1:' + port;
    }
    // HTTPS 页面无法请求同机的 http://域名:端口（混合内容被拦截）。本机调试多指向 127.0.0.1。
    if (window.location.protocol === 'https:') {
        return 'http://127.0.0.1:' + port;
    }
    const host = window.location.hostname || '127.0.0.1';
    return window.location.protocol + '//' + host + ':' + port;
}

/** 与后端 chapter1 各关 /chat 对齐：服务端按 session_id 维护历史，须在同一关卡内保持稳定 */
function getOrCreateSessionId(chapter, level) {
    const key = `gameApi_session_c${chapter}_l${level}`;
    let sid = sessionStorage.getItem(key);
    if (!sid) {
        sid =
            typeof crypto !== 'undefined' && crypto.randomUUID
                ? crypto.randomUUID()
                : 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2, 11);
        sessionStorage.setItem(key, sid);
    }
    return sid;
}

/**
 * 第一章对话：POST /chapter1/level{level}/chat
 * 参数 playerName、history 保留以兼容现有 level.js，由服务端会话承载上下文。
 */
async function sendChatMessage(playerName, chapter, level, message, history) {
    try {
        const sessionId = getOrCreateSessionId(chapter, level);
        const base = getApiBaseUrl();
        const url = `${base}/chapter${chapter}/level${level}/chat`;
        console.log('[GameAPI] base:', base, '→', url);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                session_id: sessionId,
                message: message
            }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[GameAPI] Server error:', response.status, errorText);
            const hint =
                response.status === 404
                    ? '请确认后端为 chapter1.main:app 且路径为 /chapter1/level' + level + '/chat'
                    : '';
            return {
                reply:
                    '（服务器返回 ' +
                    response.status +
                    '。' +
                    hint +
                    (errorText ? ' ' + errorText.slice(0, 160) : '') +
                    '）',
                passed: false,
                fail_count: 0,
                error: true
            };
        }

        const data = await response.json();
        console.log('[GameAPI] Response:', data);
        const replyText =
            data.reply != null && String(data.reply).trim() !== ''
                ? String(data.reply)
                : '（后端未返回 reply 字段，请检查接口 JSON）';
        return {
            reply: replyText,
            passed: !!data.passed,
            fail_count: data.fail_count != null ? data.fail_count : undefined,
            error: false
        };
    } catch (error) {
        console.error('[GameAPI] Error:', error.name, error.message);
        if (error.name === 'AbortError') {
            return { reply: '星辉剑陷入了沉思...请再试一次', passed: false, fail_count: 0, error: true };
        }
        const detail = (error && error.message) || String(error);
        return {
            reply:
                '（无法连接后端：' +
                detail +
                '。请确认本机已运行 uvicorn 且端口与「' +
                getApiBaseUrl() +
                '」一致；若网页是 HTTPS，已默认指向 http://127.0.0.1:' +
                getDefaultApiPort() +
                '，局域网请设 localStorage：GAME_API_BASE_URL）',
            passed: false,
            fail_count: 0,
            error: true
        };
    }
}

window.GameAPI = { sendChatMessage };
