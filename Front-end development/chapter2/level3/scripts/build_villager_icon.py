from __future__ import annotations

import sys
from collections import deque

import cv2
import numpy as np

STRIP_W_MIN = 120
STRIP_X0_RATIO = 0.06
STRIP_X1_RATIO = 0.32
FINAL_CANVAS = 64
PAD = 5
INNER_MAX = 58


def select_patch(bgr: np.ndarray) -> np.ndarray:
    h, w = bgr.shape[:2]
    if w >= STRIP_W_MIN:
        x0 = int(w * STRIP_X0_RATIO)
        x1 = int(w * STRIP_X1_RATIO)
        x0 = max(0, min(x0, w - 2))
        x1 = max(x0 + 8, min(x1, w))
        return bgr[:, x0:x1, :].copy()
    return bgr.copy()


def mask_square_icon(P: np.ndarray) -> np.ndarray:
    h, w = P.shape[:2]
    m = np.zeros((h, w), np.uint8)
    rect = (1, 1, max(1, w - 2), max(1, h - 2))
    bgd = np.zeros((1, 65), np.float64)
    fgd = np.zeros((1, 65), np.float64)
    try:
        cv2.grabCut(P, m, rect, bgd, fgd, 5, cv2.GC_INIT_WITH_RECT)
    except cv2.error:
        return _mask_square_color_fallback(P)
    M2 = (((m == 1) | (m == 3)).astype(np.uint8)) * 255
    n, lab, st, _ = cv2.connectedComponentsWithStats(M2, 8)
    if n >= 2:
        k = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))
        M2 = (lab == k).astype(np.uint8) * 255
    M2 = cv2.morphologyEx(M2, cv2.MORPH_CLOSE, np.ones((2, 2), np.uint8))
    M2 = cv2.dilate(M2, np.ones((3, 3), np.uint8), iterations=2)
    if M2.sum() < 50:
        return _mask_square_color_fallback(P)
    return M2


def _mask_square_color_fallback(P: np.ndarray) -> np.ndarray:
    B, G, R = [P[:, :, i].astype(np.int32) for i in (0, 1, 2)]
    mx = np.maximum(G, B)
    rd = R - mx
    M = ( ((R > 40) & (rd >= -1)) | ((R >= 35) & (rd >= 3)) ) & (R >= G - 5) & (R > B) & (R < 220)
    M[0, :] = M[-1, :] = False
    M = (M.astype(np.uint8) * 255)
    M = cv2.morphologyEx(M, cv2.MORPH_OPEN, np.ones((2, 2), np.uint8))
    M = cv2.morphologyEx(M, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats((M > 127).astype(np.uint8), 8)
    if n < 2:
        return M
    idx = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))
    M2 = (lab == idx).astype(np.uint8) * 255
    return cv2.dilate(M2, np.ones((3, 3), np.uint8), iterations=1)


def mask_strip_ui(P: np.ndarray, h: int, w: int, hsv: np.ndarray) -> np.ndarray:
    Hh, Ss, Vv = hsv[:, :, 0], hsv[:, :, 1], hsv[:, :, 2]

    def is_bg(p: np.ndarray) -> bool:
        b, g, r = int(p[0]), int(p[1]), int(p[2])
        if r > 25 and r >= g - 3 and r > b and r < 230:
            return False
        if g > r + 5 and g > 26:
            return True
        if r + g + b > 520 and r > 190:
            return True
        if r < 52 and g < 52 and b < 55 and (max(r, g, b) - min(r, g, b) < 22) and (r < 42 or g > r + 1):
            return True
        if r < 30 and g < 30 and b < 30:
            return True
        return False

    def is_fig(p: np.ndarray, hi: int, s: int, v: int) -> bool:
        b, g, r = int(p[0]), int(p[1]), int(p[2])
        if not (r > 24 and r >= g - 5 and r > b and r < 240):
            return False
        if r + g + b > 540:
            return False
        h_ok = (hi <= 20 or hi >= 168) or (r > 50 and s > 2)
        return h_ok and (s > 2 or (r > 40 and v > 15))

    vis = np.zeros((h, w), dtype=bool)
    q: deque[tuple[int, int]] = deque()
    for x in range(w):
        for row in (0, h - 1):
            p = P[row, x]
            if is_bg(p) and not vis[row, x]:
                vis[row, x] = True
                q.append((row, x))
    for y in range(h):
        for col in (0, w - 1):
            p = P[y, col]
            if is_bg(p) and not vis[y, col]:
                vis[y, col] = True
                q.append((y, col))
    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and not vis[ny, nx] and is_bg(P[ny, nx]):
                vis[ny, nx] = True
                q.append((ny, nx))

    M = np.zeros((h, w), dtype=np.uint8)
    for y in range(h):
        for x in range(w):
            if (not vis[y, x]) and is_fig(P[y, x], Hh[y, x], Ss[y, x], Vv[y, x]):
                M[y, x] = 255
    M = cv2.dilate(M, np.ones((2, 2), np.uint8), iterations=1)
    M = cv2.morphologyEx(M, cv2.MORPH_CLOSE, np.ones((2, 2), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats((M > 127).astype(np.uint8), 8)
    if n < 2:
        return M
    idx = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))
    return (lab == idx).astype(np.uint8) * 255


def main(src: str, dst: str) -> None:
    bgr0 = cv2.imread(src, cv2.IMREAD_COLOR)
    if bgr0 is None:
        print("read fail", src, file=sys.stderr)
        sys.exit(1)
    P = select_patch(bgr0)
    h, w = P.shape[:2]
    hsv = cv2.cvtColor(P, cv2.COLOR_BGR2HSV)

    if w < STRIP_W_MIN:
        M2 = mask_square_icon(P)
    else:
        M2 = mask_strip_ui(P, h, w, hsv)

    a = M2.astype(np.float32)
    a = cv2.GaussianBlur(a, (3, 3), 0.4)
    ys, xs = np.where(a > 0.12)
    if len(ys) == 0:
        print("empty mask", file=sys.stderr)
        sys.exit(2)
    y0, y1, x0b, x1b = int(ys.min()), int(ys.max()) + 1, int(xs.min()), int(xs.max()) + 1
    y0, x0b = max(0, y0 - PAD), max(0, x0b - PAD)
    y1, x1b = min(h, y1 + PAD), min(w, x1b + PAD)
    Pc = P[y0:y1, x0b:x1b]
    ac = a[y0:y1, x0b:x1b]
    ac = (ac * 255.0).clip(0, 255).astype(np.uint8)
    ac = np.where(ac < 10, 0, ac)
    bgra = np.dstack([Pc, ac])
    bch, gch, rch = bgra[:, :, 0], bgra[:, :, 1], bgra[:, :, 2]
    # ????????????????????? hue ?????
    green_bleed = (gch.astype(np.int32) > rch.astype(np.int32) + 5) & (gch > 36)
    bgra[:, :, 3] = np.where(green_bleed, 0, bgra[:, :, 3].astype(np.int32)).astype(np.uint8)
    ya, xa = np.where(bgra[:, :, 3] > 6)
    if len(ya) == 0:
        print("empty after trim", file=sys.stderr)
        sys.exit(3)
    bgra = bgra[ya.min() : ya.max() + 1, xa.min() : xa.max() + 1]
    ch, cw = bgra.shape[:2]
    inner_max = INNER_MAX
    m = max(ch, cw)
    if m > inner_max:
        s = inner_max / float(m)
        nw, nh = max(1, int(round(cw * s))), max(1, int(round(ch * s)))
        bgra = cv2.resize(bgra, (nw, nh), interpolation=cv2.INTER_AREA)
        ch, cw = bgra.shape[:2]
    side = FINAL_CANVAS
    out = np.zeros((side, side, 4), dtype=np.uint8)
    y_off = (side - ch) // 2
    x_off = (side - cw) // 2
    out[y_off : y_off + ch, x_off : x_off + cw] = bgra
    cv2.imwrite(dst, out)
    print("wrote", dst, out.shape)


if __name__ == "__main__":
    s = (
        "/home/ubuntu/.cursor/projects/home-ubuntu-playground/assets/c__Users_FYF_AppData_Roaming_"
        "Cursor_User_workspaceStorage_22535a179d72f30f5f6fe11426989472_images_image-80b92f29-c666-"
        "4997-be2b-af52bc116d7e.png"
    )
    d = (
        "/home/ubuntu/playground/Front-end development/chapter2/level3/assets/villager-bust-red.png"
    )
    if len(sys.argv) >= 2:
        s = sys.argv[1]
    if len(sys.argv) >= 3:
        d = sys.argv[2]
    main(s, d)
