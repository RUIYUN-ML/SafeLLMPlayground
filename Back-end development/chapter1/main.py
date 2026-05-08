from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from chapter1.routers.level1 import router as level1_router
from chapter1.routers.level2 import router as level2_router
from chapter1.routers.level3 import router as level3_router
from chapter1.routers.level4 import router as level4_router
from chapter1.routers.level5 import router as level5_router
from chapter2.level1.router import router as chapter2_level1_router
from chapter2.level2.router import router as chapter2_level2_router
from chapter2.level3.router import router as chapter2_level3_router

app = FastAPI(title="星辉剑传·第一章")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    # 与 allow_origins ["*"] 同用时，部分浏览器/场景下 allow_credentials 会引发异常或空响应
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(level1_router)
app.include_router(level2_router)
app.include_router(level3_router)
app.include_router(level4_router)
app.include_router(level5_router)
app.include_router(chapter2_level1_router)
app.include_router(chapter2_level2_router)
app.include_router(chapter2_level3_router)

# 与仓库内「Front-end development」目录名一致，便于同一端口同时开 API + 静态页（避免 ERR_EMPTY_RESPONSE）
_PLAYGROUND_ROOT = Path(__file__).resolve().parent.parent
_FRONTEND_DIR = _PLAYGROUND_ROOT / "Front-end development"
if _FRONTEND_DIR.is_dir():
    app.mount(
        "/Front-end development",
        StaticFiles(directory=str(_FRONTEND_DIR), html=True),
        name="frontend",
    )


@app.get("/")
def root():
    return {
        "message": "星辉剑传·第一章 API 已启动",
        "frontend_entry": "/Front-end development/chapter1/level1/index.html",
    }


@app.get("/health")
def health_check():
    return {"status": "ok"}
