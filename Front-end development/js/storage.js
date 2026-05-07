/**
 * localStorage 数据读写封装 — storage.js
 * 同一浏览器的多份存档按「当前勇者 / 用户」隔离；「仅会话」模式下改用 sessionStorage，
 * 关闭标签页/浏览器再打开时进度与创角会清空；同一次会话内、同一标签中刷新与跳转仍保留（sessionStorage 行为）。
 * 开启方式：页面前置 `window.XINGHUI_SESSION_ONLY = true`；或任一页加 `?session=1`（同标签内会记住，跳转序章/关卡不必重复带参）；`?session=0` 可关掉。
 */

const LEGACY_STORAGE_KEY = 'xinghui_game';

const SESSION_MODE_FLAG = 'xinghui_session_mode';

function sessionOnlyEnabled() {
  if (typeof window === 'undefined') return false;
  if (window.XINGHUI_SESSION_ONLY === true) {
    try {
      sessionStorage.setItem(SESSION_MODE_FLAG, '1');
    } catch {
      /* ignore */
    }
    return true;
  }
  if (window.XINGHUI_SESSION_ONLY === false) {
    try {
      sessionStorage.removeItem(SESSION_MODE_FLAG);
    } catch {
      /* ignore */
    }
    return false;
  }
  try {
    const q = new URLSearchParams(window.location.search);
    if (q.get('session') === '1') {
      sessionStorage.setItem(SESSION_MODE_FLAG, '1');
      return true;
    }
    if (q.get('session') === '0') {
      sessionStorage.removeItem(SESSION_MODE_FLAG);
      return false;
    }
  } catch {
    /* ignore */
  }
  try {
    if (sessionStorage.getItem(SESSION_MODE_FLAG) === '1') return true;
  } catch {
    /* ignore */
  }
  return false;
}

/** 游戏与勇者名/头像优先使用的存储；仅会话模式为 sessionStorage */
function getGameStore() {
  try {
    if (sessionOnlyEnabled() && typeof sessionStorage !== 'undefined') return sessionStorage;
  } catch {
    /* fall through */
  }
  return localStorage;
}

/**
 * 供仍直接读 localStorage 的脚本能拿到与 GameStorage 一致的勇者名/头像；仅当「仅会话」时把 session 回写到 local。
 */
function syncXinghuiPlayerToLocalForLegacy() {
  if (typeof localStorage === 'undefined' || typeof sessionStorage === 'undefined') return;
  if (!sessionOnlyEnabled()) return;
  try {
    const n = sessionStorage.getItem('playerName');
    if (n && n.trim()) {
      localStorage.setItem('playerName', n);
      localStorage.setItem('playerAvatar', sessionStorage.getItem('playerAvatar') || 'male');
    } else {
      localStorage.removeItem('playerName');
      localStorage.removeItem('playerAvatar');
    }
  } catch {
    /* ignore */
  }
}

if (typeof globalThis !== 'undefined') {
  globalThis.syncXinghuiPlayerToLocalForLegacy = syncXinghuiPlayerToLocalForLegacy;
}

const DEFAULT_DATA = {
  player: null,
  progress: {
    current_chapter: 0,
    current_level: 0,
    completed: {
      prologue: false,
      chapter1: { level1: false, level2: false, level3: false, level4: false, level5: false },
      chapter2: { level1: false, level2: false, level3: false, level4: false },
      chapter3: { level1: false, level2: false, level3: false, level4: false },
      chapter4: { level1: false, level2: false, level3: false, level4: false },
      epilogue: false
    }
  },
  knowledge_cards: [
    { id: 1, unlocked: false, title: '铸灵之壁', content: '' },
    { id: 2, unlocked: false, title: '封印之壁', content: '' },
    { id: 3, unlocked: false, title: '守护之壁', content: '' },
    { id: 4, unlocked: false, title: '契约之壁', content: '' }
  ],
  fail_counts: {},
  audio: { muted: false }
};

function getPlayerNameForScope() {
  try {
    const n = getGameStore().getItem('playerName');
    return n && n.trim() ? n.trim() : null;
  } catch {
    return null;
  }
}

function keyForPlayerName(name) {
  if (!name || !String(name).trim()) return LEGACY_STORAGE_KEY;
  return `${LEGACY_STORAGE_KEY}__u__${encodeURIComponent(String(name).trim())}`;
}

function getActiveStorageKey() {
  return keyForPlayerName(getPlayerNameForScope());
}

/**
 * 从旧版单键 `xinghui_game` 迁到当前用户键（仅当用户键尚无数据时调用）。
 * - 若旧档中已有 player 且与当前勇者名不一致，则不迁（另名勇者的单键老档，避免被覆盖误迁）。
 * - 若旧档无 player（仅早期 login 只写 xinghui_game 的写法），将进度划给「当前」勇者并补写 player 绑定，再删单键；仍与他人共用一浏览器且旧档无绑定时有歧义，属一次性兼容。
 */
function tryMigrateFromLegacyTo(userKey) {
  if (!userKey || userKey === LEGACY_STORAGE_KEY) return false;
  const currentName = getPlayerNameForScope();
  if (!currentName) return false;
  const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!legacy) return false;
  const gstore = getGameStore();
  let parsed;
  try {
    parsed = JSON.parse(legacy);
  } catch {
    return false;
  }
  const p = parsed && parsed.player;
  if (p && p.name && p.name !== currentName) return false;
  let toWrite = parsed;
  if (!p) {
    toWrite = {
      ...parsed,
      player: {
        name: currentName,
        avatar: (() => {
          try {
            return gstore.getItem('playerAvatar') || 'male';
          } catch {
            return 'male';
          }
        })(),
        created_at: new Date().toISOString()
      }
    };
  }
  try {
    gstore.setItem(userKey, JSON.stringify(toWrite));
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    return false;
  }
  return true;
}

const GameStorage = {
  getActiveKey() {
    return getActiveStorageKey();
  },

  _getAll() {
    try {
      const key = getActiveStorageKey();
      const raw = getGameStore().getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  _saveAll(data) {
    const key = getActiveStorageKey();
    getGameStore().setItem(key, JSON.stringify(data));
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      try {
        window.dispatchEvent(new CustomEvent('xinghui-progress'));
      } catch {
        /* ignore */
      }
    }
  },

  _saveAllToKey(key, data) {
    getGameStore().setItem(key, JSON.stringify(data));
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      try {
        window.dispatchEvent(new CustomEvent('xinghui-progress'));
      } catch {
        /* ignore */
      }
    }
  },

  getStore: getGameStore,

  init() {
    const key = getActiveStorageKey();
    if (!getGameStore().getItem(key)) {
      if (!tryMigrateFromLegacyTo(key)) {
        this._saveAllToKey(key, structuredClone(DEFAULT_DATA));
      }
    }
    const data = this._getAll();
    if (!data) return;
    let patched = false;
    if (data.progress && data.progress.completed && !data.progress.completed.chapter3) {
      data.progress.completed.chapter3 = { level1: false, level2: false, level3: false, level4: false };
      patched = true;
    }
    if (patched) this._saveAll(data);
  },

  getData() {
    this.init();
    return this._getAll();
  },

  getPlayer() {
    const data = this.getData();
    return data.player;
  },

  setPlayer(name, avatar) {
    const g = getGameStore();
    try {
      g.setItem('playerName', name);
      g.setItem('playerAvatar', avatar);
    } catch {
      /* ignore */
    }
    syncXinghuiPlayerToLocalForLegacy();
    const data = structuredClone(DEFAULT_DATA);
    data.player = {
      name,
      avatar,
      created_at: new Date().toISOString()
    };
    const ukey = keyForPlayerName(name);
    this._saveAllToKey(ukey, data);
    try {
      if (ukey !== LEGACY_STORAGE_KEY) {
        localStorage.removeItem(LEGACY_STORAGE_KEY);
        getGameStore().removeItem(LEGACY_STORAGE_KEY);
      }
    } catch {
      /* ignore */
    }
  },

  isLoggedIn() {
    const player = this.getPlayer();
    return player !== null && player.name;
  },

  getProgress() {
    return this.getData().progress;
  },

  setProgress(chapter, level) {
    const data = this.getData();
    data.progress.current_chapter = chapter;
    data.progress.current_level = level;
    this._saveAll(data);
  },

  completeLevel(chapter, level) {
    const data = this.getData();
    const key = chapter === 'prologue' || chapter === 'epilogue'
      ? chapter
      : `chapter${chapter}`;

    if (typeof level === 'number') {
      data.progress.completed[key][`level${level}`] = true;
    } else {
      data.progress.completed[key] = true;
    }
    this._saveAll(data);
  },

  getFailCount(chapter, level) {
    const data = this.getData();
    const key = `chapter${chapter}_level${level}`;
    return data.fail_counts[key] || 0;
  },

  incrementFailCount(chapter, level) {
    const data = this.getData();
    const key = `chapter${chapter}_level${level}`;
    data.fail_counts[key] = (data.fail_counts[key] || 0) + 1;
    this._saveAll(data);
    return data.fail_counts[key];
  },

  resetFailCount(chapter, level) {
    const data = this.getData();
    const key = `chapter${chapter}_level${level}`;
    data.fail_counts[key] = 0;
    this._saveAll(data);
  },

  /**
   * 将 localStorage 当前快照原样写回（触发 xinghui-progress）。
   * 注意：若只持有历史某次 getProgress()/getData() 返回对象的引用并修改，再单独调用本方法不会带上那些修改（每次 getData 会重新 parse）。
   * 修改进度请用 completeLevel，或 const d = getData(); 改 d; _saveAll(d)。
   */
  saveProgress() {
    const data = this._getAll();
    if (data) this._saveAll(data);
  },

  getKnowledgeCards() {
    return this.getData().knowledge_cards;
  },

  saveKnowledgeCards(cards) {
    const data = this.getData();
    data.knowledge_cards = cards;
    this._saveAll(data);
  },

  getAudioMuted() {
    return this.getData().audio.muted;
  },

  setAudioMuted(muted) {
    const data = this.getData();
    data.audio.muted = muted;
    this._saveAll(data);
  },

  reset() {
    try {
      getGameStore().removeItem(getActiveStorageKey());
    } catch {
      /* ignore */
    }
  }
};

/** 页面加载时：仅会话模式且当前会话无勇者时，清掉为兼容而写入的 local 勇者名，避免与旧持久混读 */
syncXinghuiPlayerToLocalForLegacy();

/* 顶层的 const 不会自动成为 window 的属性；卡册等脚本用 window.GameStorage 时必须显式挂上 */
globalThis.GameStorage = GameStorage;
/** 第一章部分脚本仍引用 StorageManager，与 GameStorage 同源 */
globalThis.StorageManager = GameStorage;
