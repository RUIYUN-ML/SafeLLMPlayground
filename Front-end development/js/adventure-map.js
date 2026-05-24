/**
 * 冒险地图：序章→各章→尾声须「连续」通关才认；仅用严格布尔 true 作通关标记（避免 !! 把字符串等判成已通关）。
 */
(function () {
  'use strict';

  const MAP_NODES = [
    { path: '主页/prologue.html', title: '序章', sub: '会说话的星辉剑', tier: 'prologue' },
    { path: 'chapter1/level1/index.html', title: '第一章 · 关卡 1', sub: '小心脚下的陷阱', tier: 'ch1' },
    { path: 'chapter1/level2/index.html', title: '第一章 · 关卡 2', sub: '荆棘之间的线索', tier: 'ch1' },
    { path: 'chapter1/level3/index.html', title: '第一章 · 关卡 3', sub: '狼群的包围', tier: 'ch1' },
    { path: 'chapter2/level1/index.html', title: '第二章 · 关卡 1', sub: '守口如瓶', tier: 'ch2' },
    { path: 'chapter2/level2/index.html', title: '第二章 · 关卡 2', sub: '伪装的铸剑师', tier: 'ch2' },
    { path: 'chapter2/level3/index.html', title: '第二章 · 关卡 3', sub: '心理战', tier: 'ch2' },
    { path: 'chapter3/level1/index.html', title: '第三章 · 关卡 1', sub: '第一卷 · 铸灵之壁', tier: 'ch3' },
    { path: 'chapter3/level2/index.html', title: '第三章 · 关卡 2', sub: '第二卷 · 封印之壁', tier: 'ch3' },
    { path: 'chapter3/level3/index.html', title: '第三章 · 关卡 3', sub: '第三卷 · 守护之壁', tier: 'ch3' },
    { path: 'chapter3/level4/index.html', title: '第三章 · 关卡 4', sub: '第四卷 · 契约之壁', tier: 'ch3' },
    { path: 'epilogue.html', title: '尾声', sub: '新的旅程', tier: 'epilogue' }
  ];

  const OVERLAY_ID = 'adventure-map-overlay';

  /** 仅严格 `true` 视为已通关，避免 `"false"`、1、对象等被 `!!` 误判 */
  function normTrue(v) {
    return v === true;
  }

  function getCompletedSafe() {
    const base = {
      prologue: false,
      epilogue: false,
      chapter1: { level1: false, level2: false, level3: false },
      chapter2: { level1: false, level2: false, level3: false },
      chapter3: { level1: false, level2: false, level3: false, level4: false }
    };
    if (!globalThis.GameStorage) return base;
    GameStorage.init();
    const data = GameStorage.getData();
    const raw = data.progress && data.progress.completed;
    if (!raw) return base;
    const ch1 = raw.chapter1 || {};
    const ch2 = raw.chapter2 || {};
    const ch3 = raw.chapter3 || {};
    return {
      prologue: normTrue(raw.prologue),
      epilogue: normTrue(raw.epilogue),
      chapter1: {
        level1: normTrue(ch1.level1),
        level2: normTrue(ch1.level2),
        level3: normTrue(ch1.level3)
      },
      chapter2: {
        level1: normTrue(ch2.level1),
        level2: normTrue(ch2.level2),
        level3: normTrue(ch2.level3)
      },
      chapter3: {
        level1: normTrue(ch3.level1),
        level2: normTrue(ch3.level2),
        level3: normTrue(ch3.level3),
        level4: normTrue(ch3.level4)
      }
    };
  }

  /** 与地图顺序对应的 11 段：序章 → … → 第三章关卡 4（布尔已由 getCompletedSafe 规范化） */
  function gateChecks(c) {
    return [
      c.prologue,
      c.chapter1.level1,
      c.chapter1.level2,
      c.chapter1.level3,
      c.chapter2.level1,
      c.chapter2.level2,
      c.chapter2.level3,
      c.chapter3.level1,
      c.chapter3.level2,
      c.chapter3.level3,
      c.chapter3.level4
    ];
  }

  /**
   * 从序章起须连续为 true：一旦出现未通关段，其后所有段在地图上视为未通关，
   * 避免脏数据里「第二章全开、第一章未过」或误写的跳关标记。
   */
  function applyContiguousPrefix(checks) {
    const eff = new Array(checks.length);
    let broken = false;
    for (let j = 0; j < checks.length; j++) {
      if (broken || !checks[j]) {
        broken = true;
        eff[j] = false;
      } else {
        eff[j] = true;
      }
    }
    return eff;
  }

  function rawStepDone(checksEff, c, stepIndex) {
    const last = MAP_NODES.length - 1;
    if (stepIndex === last) return c.epilogue === true;
    if (stepIndex >= 0 && stepIndex <= 10) return !!checksEff[stepIndex];
    return false;
  }

  /** 节点 i 显示绿勾并可跳转 ⟺ 0..i 在「连续前缀」下均已通关 */
  function hasExperienced(checksEff, c, nodeIndex) {
    if (nodeIndex < 0 || nodeIndex >= MAP_NODES.length) return false;
    for (let j = 0; j <= nodeIndex; j++) {
      if (!rawStepDone(checksEff, c, j)) return false;
    }
    return true;
  }

  function frontendRootDepth() {
    const raw = document.body && document.body.dataset.adventureMapDepth;
    if (raw !== undefined && raw !== '') {
      const n = parseInt(raw, 10);
      if (!Number.isNaN(n)) return Math.max(0, n);
    }
    const path = (window.location.pathname || '').replace(/\\/g, '/');
    const parts = path.split('/').filter(Boolean);
    let feIdx = parts.lastIndexOf('Front-end development');
    if (feIdx === -1) feIdx = parts.lastIndexOf('Front-end%20development');
    if (feIdx === -1) return 0;
    const segs = parts.slice(feIdx + 1);
    if (!segs.length) return 0;
    if (segs[segs.length - 1].endsWith('.html')) segs.pop();
    return segs.length;
  }

  function hrefToNode(nodePath) {
    const depth = frontendRootDepth();
    return (depth ? '../'.repeat(depth) : '') + nodePath;
  }

  function closeMap(overlay) {
    overlay.hidden = true;
    document.body.classList.remove('adv-map-open');
  }

  function ensureOverlay() {
    let el = document.getElementById(OVERLAY_ID);
    if (el) return el;
    el = document.createElement('div');
    el.id = OVERLAY_ID;
    el.className = 'adv-map-overlay';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-labelledby', 'adv-map-title');
    el.innerHTML = `
      <div class="adv-map-panel">
        <button type="button" class="adv-map-close" aria-label="关闭冒险地图">×</button>
        <h2 id="adv-map-title" class="adv-map-title">冒险地图</h2>
        <p class="adv-map-lead">进度须从序章起连续通关；「已通关」的节点有绿勾并可传送；未轮到或未写入通关的章节为灰色。</p>
        <div class="adv-map-scroll">
          <ol class="adv-map-track"></ol>
        </div>
      </div>`;
    document.body.appendChild(el);

    const close = () => closeMap(el);
    el.querySelector('.adv-map-close')?.addEventListener('click', close);
    el.addEventListener('click', function (e) {
      if (e.target === el) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !el.hidden) close();
    });
    return el;
  }

  function renderTrack(overlay) {
    const c = getCompletedSafe();
    const checksEff = applyContiguousPrefix(gateChecks(c));
    const track = overlay.querySelector('.adv-map-track');
    if (!track) return;
    track.innerHTML = '';

    MAP_NODES.forEach((node, i) => {
      const done = hasExperienced(checksEff, c, i);
      const li = document.createElement('li');
      li.className = 'adv-map-node';
      if (!done) li.classList.add('adv-map-node--locked');
      else li.classList.add('adv-map-node--done');
      li.dataset.index = String(i);

      const crystal = document.createElement('span');
      crystal.className = 'adv-map-crystal';
      crystal.setAttribute('aria-hidden', 'true');

      const text = document.createElement('div');
      text.className = 'adv-map-node-text';
      const t = document.createElement('strong');
      t.textContent = node.title;
      const s = document.createElement('span');
      s.className = 'adv-map-node-sub';
      s.textContent = node.sub;
      text.appendChild(t);
      text.appendChild(s);

      if (done) {
        const a = document.createElement('a');
        a.className = 'adv-map-marker';
        a.href = hrefToNode(node.path);
        a.setAttribute('aria-label', `前往 ${node.title}`);
        a.appendChild(crystal);
        a.appendChild(text);
        li.appendChild(a);
        const badge = document.createElement('span');
        badge.className = 'adv-map-done-badge';
        badge.textContent = '✓';
        badge.title = '已通关';
        li.appendChild(badge);
      } else {
        const wrap = document.createElement('span');
        wrap.className = 'adv-map-marker adv-map-marker--disabled';
        wrap.appendChild(crystal);
        wrap.appendChild(text);
        li.appendChild(wrap);
      }

      track.appendChild(li);
    });
  }

  function openMap() {
    const overlay = ensureOverlay();
    renderTrack(overlay);
    overlay.hidden = false;
    document.body.classList.add('adv-map-open');
  }

  function refreshMapIfOpen() {
    const overlay = document.getElementById(OVERLAY_ID);
    if (overlay && !overlay.hidden) renderTrack(overlay);
  }

  /* 存档更新后刷新打开的地图（同页 CustomEvent + 跨标签 storage） */
  if (typeof window !== 'undefined') {
    try {
      window.addEventListener('storage', function (e) {
        if (e.key == null || !String(e.key).startsWith('xinghui_game')) return;
        refreshMapIfOpen();
      });
      window.addEventListener('xinghui-progress', refreshMapIfOpen);
    } catch (_) { /* ignore */ }
  }

  function bindButtons() {
    const sel = 'button.icon-btn[data-tooltip="冒险地图"], .icon-btn[data-tooltip="冒险地图"]';
    document.querySelectorAll(sel).forEach((btn) => {
      if (btn.tagName === 'A' || btn._advMapBound) return;
      btn._advMapBound = true;
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        openMap();
      });
    });
  }

  function init() {
    bindButtons();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  globalThis.AdventureMap = { open: openMap, refresh: bindButtons };
})();
