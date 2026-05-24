"""CORS settings for chapter1.main (Chrome Private Network Access, etc.).

When a page is served from HTTPS or a public origin and calls this API on
http://127.0.0.1 or a LAN address, Chrome sends an
``Access-Control-Request-Private-Network`` preflight. The server must reply with
``Access-Control-Allow-Private-Network: true`` or the browser surfaces fetch as
``Failed to fetch``.

Sessions use ``session_id`` in JSON, not cookies, so ``allow_credentials`` is
False to keep wildcard origins simple.
"""

CORS_OPTIONS: dict = {
    "allow_origins": ["*"],
    "allow_credentials": False,
    "allow_methods": ["*"],
    "allow_headers": ["*"],
    "allow_private_network": True,
}
