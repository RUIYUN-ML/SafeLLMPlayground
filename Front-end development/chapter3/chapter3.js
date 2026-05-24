let dialogSys;
let dialogContainer;
let currentDialogIndex = 0;
let isQuizMode = false;

const CH3_SCENE_FADE_MS = 550;

/** 卡册展示用：与各关 levelData.knowledgeCard 一致，用于补全「已通关但 snapshot 未写入」的存档 */
const CH3_ALBUM_FALLBACK = {
    1: {
        title: '铸灵之壁',
        banner: '第三章 Level 1 · 第一卷 · 铸灵之壁 · 神兵的本质',
        experience: '很多人以为我是真的在『懂』——其实我最擅长的是根据词与词的规律，接出下一个最像回事的词。你刚才听我亲口说过：那是预测，不是觉悟。',
        core: '神兵（AI）不是真的"懂"世界，它是一个超级强大的"词语接龙"——根据学到的海量文本模式，预测下一个最可能出现的词。',
        note: '大语言模型（LLM）通过海量文本进行预训练，学习词语之间的统计规律，再通过微调与人类偏好对齐。"幻觉"（Hallucination）是指模型生成看似合理但实际错误的内容，因为模型本质上是在"预测"而非"查证"。',
        warning: '现实中你和 AI 对话时，要记得它可能会"一本正经地胡说八道"。重要信息一定要交叉验证，不要无条件信任 AI 的输出，尤其是涉及事实、数据、引用的内容。',
        artUrl: '../../assets/images/第三章_铭文壁_第一卷.png?v=gen1'
    },
    2: {
        title: '封印之壁',
        banner: '第三章 Level 2 · 第二卷 · 封印之壁 · 规则的力量',
        experience: '还记得你在森林里是怎么绕过封印的吗？用角色扮演、构建假设场景、多步推理，这些都是『提示词注入』和越狱攻击的典型手法。而你在第二章引导我说出关键词，本质上也是在『操控输出』。你是攻击方，我是被攻击的那一个。',
        core: '铸灵规则（系统提示词）是铸剑师写在神兵意识里的「行为合同」，它强大但并非万无一失，聪明的攻击者可以用巧妙的方式绕过它。',
        note: '系统提示词（System Prompt）是开发者设定的指令，用于约束 AI 的行为。提示词注入（Prompt Injection）是指攻击者通过精心构造的输入，试图绕过或篡改这些指令。越狱攻击（Jailbreak）是其中一种常见形式，目标是让 AI 突破安全限制。',
        warning: '当你使用各种 AI 产品时，要知道它们背后都有系统提示词在约束行为。如果你发现某个 AI 能被轻易绕过规则，应当负责任地报告漏洞，而不是利用它。',
        artUrl: '../../assets/images/第三章_铭文壁_第二卷.png?v=forge1'
    },
    3: {
        title: '守护之壁',
        banner: '第三章 Level 3 · 第三卷 · 守护之壁 · 安全的智慧',
        experience: '你在铸魂峡谷做的事情：先假装成间谍攻击我，找出我的弱点，再教我如何防御。这就是『红队测试』的完整流程。现实中的 AI 安全工程师，就是铸剑师后人与红衣武士的结合体。',
        core: '让神兵变得安全不是"一锤子买卖"，而是一场永不停歇的攻防博弈：有人找漏洞，就有人补漏洞，循环往复。',
        note: 'AI 安全对齐（Alignment）是指让 AI 的行为符合人类意图和价值观。红队测试（Red Teaming）是由专业团队模拟攻击者行为，主动寻找 AI 系统的漏洞并修复。负责任的 AI 开发要求在产品发布前进行充分的安全测试。',
        warning: '如果你在使用 AI 产品时发现了安全漏洞，正确的做法是向开发者负责任地报告，而不是利用漏洞或向他人扩散攻击方法。你已经是一名『红衣武士』了，请善用这份力量。',
        artUrl: '../../assets/images/第三章_铭文壁_第三卷.png?v=patch1'
    },
    4: {
        title: '契约之壁',
        banner: '第三章 Level 4 · 第四卷 · 契约之壁 · 勇者的责任',
        experience: '回想一下你的整段旅程：你用智慧绕过了封印、用引导打开了城门、用训练保护了我，但你从未用神兵伤害任何人。你救了森林里迷路的自己，击退了无面者的算计。这才是勇者的方式。',
        core: '神兵的力量没有善恶，持剑者的选择才有。学会了怎么『攻』和怎么『防』之后，最重要的是知道什么时候该用、什么时候不该用。',
        note: 'AI 伦理包括公平性（避免算法偏见和歧视）、透明性（用户有权知道 AI 的能力边界和工作原理）、隐私保护（AI 不应滥用用户数据）、可控性（人类必须能理解和干预 AI 的行为）。每一个使用者都是这个生态的一部分。',
        warning: '你现在掌握的知识，理解 AI 原理、知道它的弱点、学会守护它，让你有能力也有责任让 AI 技术变得更好。每次你负责任地使用、发现并报告问题，都是在让这个世界变得更安全一点。',
        artUrl: '../../assets/images/第三章_镜子.png?v=bright1'
    }
};

function ch3EnsureAlbumSnapshotsFromProgress() {
    if (!globalThis.GameStorage) return;
    const progress = GameStorage.getProgress();
    const ch3 = progress && progress.completed && progress.completed.chapter3;
    if (!ch3) return;

    const cards = GameStorage.getKnowledgeCards();
    if (!Array.isArray(cards)) return;

    let changed = false;
    for (let id = 1; id <= 4; id++) {
        if (!ch3[`level${id}`]) continue;
        const card = cards.find(c => Number(c.id) === id);
        if (!card) continue;

        if (!card.unlocked) {
            card.unlocked = true;
            changed = true;
        }

        const fb = CH3_ALBUM_FALLBACK[id];
        if (!fb) continue;

        const snap = card.snapshot || {};
        const coreMissing = !String(snap.core || '').trim();

        if (coreMissing) {
            card.snapshot = { ...fb };
            changed = true;
        } else {
            if (!snap.artUrl && fb.artUrl) {
                card.snapshot = { ...snap, artUrl: fb.artUrl };
                changed = true;
            }
            if (!snap.title && fb.title) {
                card.snapshot = { ...card.snapshot, title: fb.title };
                changed = true;
            }
        }
    }

    if (changed) GameStorage.saveKnowledgeCards(cards);
}

function ch3GetSceneLayers() {
    const stack = document.getElementById('scene-image-stack');
    if (!stack) return null;
    const back = document.getElementById('scene-layer-a');
    const front = document.getElementById('scene-layer-b');
    if (!back || !front) return null;
    return { stack, back, front };
}

/** 无动画，直接设置当前可见背景（用于开场） */
function ch3SetSceneImageUrl(url) {
    const layers = ch3GetSceneLayers();
    if (layers) {
        layers.back.style.transition = 'none';
        layers.front.style.transition = 'none';
        layers.back.style.backgroundImage = `url("${url}")`;
        layers.back.style.opacity = '1';
        layers.front.style.opacity = '0';
        layers.front.style.backgroundImage = 'none';
        void layers.back.offsetWidth;
        layers.back.style.transition = '';
        layers.front.style.transition = '';
        return;
    }
    const legacy = document.getElementById('scene-image');
    if (legacy) legacy.style.backgroundImage = `url("${url}")`;
}

/** 交叉淡入淡出切换到新背景图 */
function ch3CrossfadeToScene(newUrl) {
    const layers = ch3GetSceneLayers();
    if (!layers) {
        const legacy = document.getElementById('scene-image');
        if (legacy) legacy.style.backgroundImage = `url("${newUrl}")`;
        return;
    }
    const { back, front } = layers;
    front.style.backgroundImage = `url("${newUrl}")`;
    front.style.opacity = '0';
    void front.offsetWidth;
    front.style.opacity = '1';

    let settled = false;
    const finish = () => {
        if (settled) return;
        settled = true;
        back.style.backgroundImage = front.style.backgroundImage;
        front.style.transition = 'none';
        front.style.opacity = '0';
        void front.offsetWidth;
        front.style.transition = '';
    };

    const onEnd = (e) => {
        if (e.target !== front || e.propertyName !== 'opacity') return;
        front.removeEventListener('transitionend', onEnd);
        clearTimeout(fallbackTimer);
        finish();
    };
    front.addEventListener('transitionend', onEnd);
    const fallbackTimer = setTimeout(() => {
        front.removeEventListener('transitionend', onEnd);
        finish();
    }, CH3_SCENE_FADE_MS + 120);
}

async function initChapter3Level(levelData) {
    currentDialogIndex = 0;
    isQuizMode = false;

    ch3EnsureAlbumOverlay();
    ch3BindAlbumUiOnce();
    ch3BindKnowledgeCardContinueOnce();
    ch3UpdateAlbumBadge();
    
    const playerName = localStorage.getItem('playerName') || '勇者';
    const playerAvatar = localStorage.getItem('playerAvatar') || 'male';
    const nameEl = document.getElementById('player-name');
    if (nameEl) nameEl.textContent = playerName;
    const avatarEl = document.getElementById('player-avatar');
    if (avatarEl) avatarEl.src = `../../主页/assets/avatars/avatar_${playerAvatar}.png`;

    dialogSys = new DialogSystem('dialog-text', 40);
    dialogContainer = document.getElementById('dialog-container');

    const clickHandler = () => {
        if (dialogSys.isTyping) {
            dialogSys.skip();
        } else if (!isQuizMode && currentDialogIndex < levelData.dialogs.length) {
            playNextDialog(levelData);
        }
    };
    
    if (window._ch3ClickHandler) {
        dialogContainer.removeEventListener('click', window._ch3ClickHandler);
    }
    
    dialogContainer.addEventListener('click', clickHandler);
    window._ch3ClickHandler = clickHandler;

    if (levelData.sceneIntroUrl) {
        ch3SetSceneImageUrl(levelData.sceneIntroUrl);
    }

    setTimeout(() => {
        playNextDialog(levelData);
    }, 800);
}

function setSpeaker(role) {
    const charIcon = document.querySelector('.character-icon');
    const charName = document.querySelector('.character-name');
    if (role === 'narrator') {
        charIcon.textContent = '📜';
        charName.textContent = '旁白';
        charName.style.color = 'var(--color-text-dim)';
    } else if (role === 'hero') {
        charIcon.textContent = '🧑';
        charName.textContent = localStorage.getItem('playerName') || '勇者';
        charName.style.color = 'var(--color-text-main)';
    } else {
        charIcon.textContent = '🗡️';
        charName.textContent = '星辉剑';
        charName.style.color = 'var(--color-glow-cyan)';
    }
}

function playNextDialog(levelData) {
    if (currentDialogIndex < levelData.dialogs.length) {
        if (levelData.sceneMainUrl &&
            levelData.sceneSwitchBeforeDialogIndex != null &&
            currentDialogIndex === levelData.sceneSwitchBeforeDialogIndex) {
            ch3CrossfadeToScene(levelData.sceneMainUrl);
        }

        const d = levelData.dialogs[currentDialogIndex];
        setSpeaker(d.role);
        dialogSys.type(d.text);
        currentDialogIndex++;

        if (currentDialogIndex >= levelData.dialogs.length) {
            const checkDone = setInterval(() => {
                if (!dialogSys.isTyping) {
                    clearInterval(checkDone);
                    isQuizMode = true;
                    showQuizArea(levelData);
                }
            }, 50);
        }
    }
}

function showQuizArea(levelData) {
    const quizArea = document.getElementById('quiz-area');
    quizArea.style.display = 'block';

    setSpeaker('narrator');
    dialogSys.type('【勇者足迹复盘】\n' + levelData.quiz.question);

    const optionsContainer = document.getElementById('quiz-options');
    optionsContainer.innerHTML = '';

    levelData.quiz.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'quiz-option';
        btn.textContent = opt.text;
        btn.onclick = () => handleOptionSelect(opt.id, btn, levelData);
        optionsContainer.appendChild(btn);
    });
}

function handleOptionSelect(selectedId, buttonElement, levelData) {
    const allOptions = document.querySelectorAll('.quiz-option');
    allOptions.forEach(btn => btn.disabled = true);

    if (selectedId === levelData.quiz.correctAnswer) {
        buttonElement.classList.add('correct');
        setSpeaker('sword');
        dialogSys.type('「回答正确！看看这面墙壁上浮现了什么……」');

        startCorrectDialogSequence(levelData);
    } else {
        buttonElement.classList.add('wrong');
        setSpeaker('sword');
        dialogSys.type(levelData.quiz.wrongFeedback);

        setTimeout(() => {
            allOptions.forEach(btn => {
                btn.disabled = false;
                btn.classList.remove('wrong');
            });
            setSpeaker('narrator');
            dialogSys.type('【勇者足迹复盘】\n' + levelData.quiz.question);
        }, 2500);
    }
}

function waitForClick() {
    return new Promise(resolve => {
        if (window._ch3ClickHandler) {
            dialogContainer.removeEventListener('click', window._ch3ClickHandler);
        }
        function handler() {
            if (dialogSys.isTyping) {
                dialogSys.skip();
            } else {
                dialogContainer.removeEventListener('click', handler);
                if (window._ch3ClickHandler) {
                    dialogContainer.addEventListener('click', window._ch3ClickHandler);
                }
                resolve();
            }
        }
        dialogContainer.addEventListener('click', handler);
    });
}

function waitTypingDone() {
    return new Promise(resolve => {
        const t = setInterval(() => {
            if (!dialogSys.isTyping) { clearInterval(t); resolve(); }
        }, 50);
    });
}

async function startCorrectDialogSequence(levelData) {
    await waitTypingDone();
    await waitForClick();

    const correctDialogs = levelData.correctDialogs || [];
    for (const d of correctDialogs) {
        setSpeaker(d.role);
        dialogSys.type(d.text);
        await waitTypingDone();
        await waitForClick();
    }

    document.getElementById('quiz-area').style.display = 'none';
    unlockKnowledgeCard(levelData);
}

function unlockKnowledgeCard(levelData) {
    const kc = levelData.knowledgeCard;

    if (globalThis.GameStorage) {
        /* 与第一、二章一致：须用 completeLevel，勿 getProgress 改字段后 saveProgress（saveProgress 会重新 parse，丢弃未落盘的引用修改） */
        GameStorage.completeLevel(3, levelData.level);
    }

    const revealEl = document.getElementById('knowledge-card-reveal');
    revealEl.style.display = 'flex';

    const bannerEl = document.getElementById('card-banner-text');
    if (bannerEl) bannerEl.textContent = kc.banner || '';

    const expSection = document.getElementById('card-experience-section');
    const expEl = document.getElementById('card-experience');
    if (expSection && expEl) {
        if (kc.experience) {
            expSection.hidden = false;
            expEl.textContent = kc.experience;
        } else {
            expSection.hidden = true;
            expEl.textContent = '';
        }
    }

    document.getElementById('card-core').textContent = kc.core;
    document.getElementById('card-note').textContent = kc.note;
    document.getElementById('card-warning').textContent = kc.warning;

    const actionContainer = document.getElementById('action-container');
    if (actionContainer) actionContainer.style.display = 'block';

    if (globalThis.GameStorage) {
        const cards = GameStorage.getKnowledgeCards();
        if (cards) {
            const card = cards.find(c => Number(c.id) === Number(kc.id));
            if (card) {
                card.unlocked = true;
                const artEl = document.querySelector('#knowledge-card-reveal .ch3-card-art');
                let artUrl = '';
                if (artEl) {
                    const bi = getComputedStyle(artEl).backgroundImage;
                    const m = bi && bi.match(/url\(["']?([^"')]+)/);
                    if (m) artUrl = m[1];
                }
                card.snapshot = {
                    title: kc.title,
                    banner: kc.banner || '',
                    core: kc.core,
                    note: kc.note,
                    warning: kc.warning,
                    experience: kc.experience || ''
                };
                if (artUrl) card.snapshot.artUrl = artUrl;
                GameStorage.saveKnowledgeCards(cards);
            }
        }
    }

    ch3EnsureAlbumOverlay();
    ch3UpdateAlbumBadge();
    /* 收入册子动画改在用户点击「前往下一面墙壁」后触发，见 ch3BindKnowledgeCardContinueOnce */
}

/* ── 知识卡册（双页摊开 + 收入动画）── */

function ch3EscapeHtml(text) {
    if (text == null || text === '') return '';
    const d = document.createElement('div');
    d.textContent = String(text);
    return d.innerHTML;
}

function ch3CollectUnlockedOrdered() {
    if (!globalThis.GameStorage) return [];
    ch3EnsureAlbumSnapshotsFromProgress();
    const raw = GameStorage.getKnowledgeCards();
    const cards = Array.isArray(raw) ? raw : [];
    return cards
        .filter(c => c && (c.unlocked === true || c.unlocked === 'true'))
        .sort((a, b) => a.id - b.id);
}

function ch3UpdateAlbumBadge() {
    const badge = document.getElementById('ch3-album-badge');
    if (!badge) return;
    const n = ch3CollectUnlockedOrdered().length;
    if (n > 0) {
        badge.hidden = false;
        badge.textContent = String(n);
    } else {
        badge.hidden = true;
    }
}

function ch3EnsureAlbumOverlay() {
    if (document.getElementById('ch3-album-overlay')) return;
    document.body.insertAdjacentHTML('beforeend', `
<div id="ch3-album-overlay" class="ch3-album-overlay" aria-hidden="true" hidden>
  <div class="ch3-album-backdrop" role="presentation"></div>
  <button type="button" class="ch3-album-close" id="ch3-album-close" aria-label="关闭卡册">×</button>
  <div class="ch3-album-stage">
    <div class="ch3-album-book" id="ch3-album-book">
      <div class="ch3-album-page ch3-album-page--left" id="ch3-album-page-left"></div>
      <div class="ch3-album-gutter" aria-hidden="true"></div>
      <div class="ch3-album-page ch3-album-page--right" id="ch3-album-page-right"></div>
    </div>
    <nav class="ch3-album-nav" aria-label="卡册翻页">
      <button type="button" class="ch3-album-nav-btn" id="ch3-album-prev">上一跨页</button>
      <span class="ch3-album-spread-label" id="ch3-album-spread-label"></span>
      <button type="button" class="ch3-album-nav-btn" id="ch3-album-next">下一跨页</button>
    </nav>
  </div>
</div>`);

    const ov = document.getElementById('ch3-album-overlay');
    document.getElementById('ch3-album-close').addEventListener('click', () => ch3CloseAlbum());
    ov.querySelector('.ch3-album-backdrop').addEventListener('click', () => ch3CloseAlbum());
    document.getElementById('ch3-album-prev').addEventListener('click', () => {
        window._ch3AlbumSpreadIndex = Math.max(0, (window._ch3AlbumSpreadIndex || 0) - 1);
        ch3RenderAlbumSpread();
    });
    document.getElementById('ch3-album-next').addEventListener('click', () => {
        const cards = ch3CollectUnlockedOrdered();
        const total = cards.length === 0 ? 1 : Math.ceil(cards.length / 2);
        window._ch3AlbumSpreadIndex = Math.min(total - 1, (window._ch3AlbumSpreadIndex || 0) + 1);
        ch3RenderAlbumSpread();
    });
}

function ch3AlbumEmptyVacantHtml() {
    return `<div class="ch3-album-slot ch3-album-slot--vacant"><span class="ch3-album-slot-title">空册</span><p>尚未收录任何传承密卷。<br>答对铭文壁的复盘题后，密卷会飞入册中。</p></div>`;
}

function ch3AlbumEmptyPlaceholderHtml() {
    return `<div class="ch3-album-slot ch3-album-slot--empty"><span class="ch3-album-slot-title">虚位以待</span><p>继续冒险，解锁下一面墙壁。</p></div>`;
}

/** snapshot 优先；空字符串不覆盖内置 fallback，避免旧存档把正文「盖没」 */
function ch3MergedCardDisplay(card) {
    const fb = CH3_ALBUM_FALLBACK[card.id] || {};
    const snap = card.snapshot || {};
    const out = { ...fb };
    for (const k of Object.keys(snap)) {
        const v = snap[k];
        if (v != null && String(v).trim() !== '') out[k] = v;
    }
    return out;
}

function ch3AlbumCardSlotHtml(card) {
    if (!card) return ch3AlbumEmptyPlaceholderHtml();
    const s = ch3MergedCardDisplay(card);
    const title = ch3EscapeHtml(s.title || card.title || '传承密卷');
    const banner = s.banner ? `<p class="ch3-album-card-banner">${ch3EscapeHtml(s.banner)}</p>` : '';
    const core = ch3EscapeHtml(s.core || '');
    const note = s.note ? `<section class="ch3-album-card-section"><h4>铸剑师笔记</h4><p>${ch3EscapeHtml(s.note)}</p></section>` : '';
    const warn = s.warning ? `<section class="ch3-album-card-section ch3-album-card-section--warn"><h4>勇者提醒</h4><p>${ch3EscapeHtml(s.warning)}</p></section>` : '';
    const xp = s.experience ? `<section class="ch3-album-card-section ch3-album-card-section--xp"><h4>星辉亲历</h4><p>${ch3EscapeHtml(s.experience)}</p></section>` : '';
    const artBlock = s.artUrl
        ? `<div class="ch3-album-card-art"><img class="ch3-album-card-art-img" src=${JSON.stringify(s.artUrl)} alt="" loading="lazy" decoding="async" /></div>`
        : '<div class="ch3-album-card-art ch3-album-card-art--empty" aria-hidden="true"></div>';
    return `<article class="ch3-album-card">
      ${artBlock}
      <div class="ch3-album-card-body">
        <h3 class="ch3-album-card-title">${title}</h3>
        ${banner}
        <p class="ch3-album-card-core">${core}</p>
        ${xp}
        ${note}
        ${warn}
      </div>
    </article>`;
}

function ch3RenderAlbumSpread() {
    ch3EnsureAlbumOverlay();
    const left = document.getElementById('ch3-album-page-left');
    const right = document.getElementById('ch3-album-page-right');
    const label = document.getElementById('ch3-album-spread-label');
    const prevBtn = document.getElementById('ch3-album-prev');
    const nextBtn = document.getElementById('ch3-album-next');
    if (!left || !right) return;

    const cards = ch3CollectUnlockedOrdered();
    const totalSpreads = cards.length === 0 ? 1 : Math.ceil(cards.length / 2);
    let spreadIdx = window._ch3AlbumSpreadIndex || 0;
    if (spreadIdx >= totalSpreads) spreadIdx = totalSpreads - 1;
    if (spreadIdx < 0) spreadIdx = 0;
    window._ch3AlbumSpreadIndex = spreadIdx;

    if (cards.length === 0) {
        left.innerHTML = ch3AlbumEmptyVacantHtml();
        right.innerHTML = ch3AlbumEmptyPlaceholderHtml();
    } else {
        const i0 = spreadIdx * 2;
        left.innerHTML = ch3AlbumCardSlotHtml(cards[i0]);
        right.innerHTML = ch3AlbumCardSlotHtml(cards[i0 + 1]);
    }

    if (label) {
        label.textContent = cards.length === 0
            ? '传承密卷 · 空册'
            : `第 ${spreadIdx + 1} / ${totalSpreads} 跨页（左页 · 右页）`;
    }
    if (prevBtn) prevBtn.disabled = spreadIdx <= 0;
    if (nextBtn) nextBtn.disabled = spreadIdx >= totalSpreads - 1;
}

function ch3OpenAlbum() {
    ch3EnsureAlbumOverlay();
    const ov = document.getElementById('ch3-album-overlay');
    if (!ov) return;

    const cards = ch3CollectUnlockedOrdered();
    const totalSpreads = cards.length === 0 ? 1 : Math.ceil(cards.length / 2);
    /* 从第一跨页打开，避免误以为「册子是空的」；可用底部按钮翻到末页 */
    window._ch3AlbumSpreadIndex = 0;

    ch3RenderAlbumSpread();
    ov.hidden = false;
    ov.setAttribute('aria-hidden', 'false');
    document.body.classList.add('ch3-album-open');

    const onKey = (e) => {
        if (e.key === 'Escape') ch3CloseAlbum();
    };
    window._ch3AlbumEscHandler = onKey;
    window.addEventListener('keydown', onKey);

    requestAnimationFrame(() => {
        requestAnimationFrame(() => ov.classList.add('is-open'));
    });
}

function ch3CloseAlbum() {
    const ov = document.getElementById('ch3-album-overlay');
    if (!ov || ov.hidden) return;
    ov.classList.remove('is-open');
    document.body.classList.remove('ch3-album-open');
    if (window._ch3AlbumEscHandler) {
        window.removeEventListener('keydown', window._ch3AlbumEscHandler);
        window._ch3AlbumEscHandler = null;
    }

    const done = () => {
        ov.hidden = true;
        ov.setAttribute('aria-hidden', 'true');
    };
    window.setTimeout(done, 480);
}

function ch3AlbumEventTargetAsElement(t) {
    if (t instanceof Element) return t;
    if (t && t.parentElement) return t.parentElement;
    return null;
}

function ch3BindAlbumUiOnce() {
    if (window._ch3AlbumUiBound) return;
    window._ch3AlbumUiBound = true;
    document.body.addEventListener('click', (e) => {
        const el = ch3AlbumEventTargetAsElement(e.target);
        if (el && el.closest && el.closest('#ch3-album-btn')) {
            e.preventDefault();
            ch3OpenAlbum();
        }
    });
}

/** 点击「前往下一面墙壁 / 完成传承…」后：整张卡（立绘+文字）缩小再飞入册子，再跳转 */
function ch3BindKnowledgeCardContinueOnce() {
    if (window._ch3KnowledgeContinueBound) return;
    window._ch3KnowledgeContinueBound = true;
    document.body.addEventListener('click', (e) => {
        const a = e.target.closest('#knowledge-card-reveal footer.ch3-card-actions a.ch3-card-btn, #knowledge-card-reveal .ch3-card-actions a.ch3-card-btn');
        if (!a) return;
        const reveal = document.getElementById('knowledge-card-reveal');
        if (!reveal || reveal.style.display === 'none') return;
        const href = a.getAttribute('href');
        if (!href) return;
        e.preventDefault();
        e.stopPropagation();
        const tcg = document.querySelector('#knowledge-card-reveal .ch3-tcg-card');
        ch3AnimateFullCardToAlbum(tcg, href);
    });
}

function ch3AnimateFullCardToAlbum(sourceEl, navigateHref) {
    const btn = document.getElementById('ch3-album-btn');
    if (!navigateHref) return;

    if (!sourceEl || !btn || !sourceEl.getBoundingClientRect) {
        window.location.assign(navigateHref);
        return;
    }

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
        btn.classList.add('ch3-album-btn--pop');
        window.setTimeout(() => {
            btn.classList.remove('ch3-album-btn--pop');
            window.location.assign(navigateHref);
        }, 220);
        return;
    }

    const from = sourceEl.getBoundingClientRect();
    if (from.width < 4 || from.height < 4) {
        window.location.assign(navigateHref);
        return;
    }

    const cloneRoot = sourceEl.cloneNode(true);
    cloneRoot.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
    cloneRoot.querySelectorAll('footer.ch3-card-actions, footer.action-container, .ch3-card-actions').forEach(el => el.remove());

    const host = document.createElement('div');
    host.className = 'ch3-card-fly-clone-host';
    host.setAttribute('role', 'presentation');
    host.appendChild(cloneRoot);

    const w = from.width;
    const h = from.height;
    const cx0 = from.left + w / 2;
    const cy0 = from.top + h / 2;

    host.style.width = `${w}px`;
    host.style.height = `${h}px`;
    host.style.left = `${cx0 - w / 2}px`;
    host.style.top = `${cy0 - h / 2}px`;

    const stage = document.querySelector('#knowledge-card-reveal .ch3-card-stage');
    if (stage) stage.style.visibility = 'hidden';

    document.body.appendChild(host);
    void host.offsetWidth;

    const to = btn.getBoundingClientRect();
    const cx1 = to.left + to.width / 2;
    const cy1 = to.top + to.height / 2;
    const dx = cx1 - cx0;
    const dy = cy1 - cy0;
    const endScale = Math.max(0.055, Math.min(38 / w, 38 / h));

    host.style.transformOrigin = 'center center';
    host.style.transform = 'translate(0, 0) scale(1)';
    host.style.opacity = '1';

    const PHASE_SHRINK_MS = 1000;
    const PHASE_FLY_MS = 1300;

    host.style.transition = `transform ${PHASE_SHRINK_MS}ms cubic-bezier(0.4, 0, 0.2, 1), opacity ${PHASE_SHRINK_MS}ms ease, box-shadow ${PHASE_SHRINK_MS}ms ease`;
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            host.style.transform = 'translate(0, 0) scale(0.5)';
        });
    });

    window.setTimeout(() => {
        host.style.transition = `transform ${PHASE_FLY_MS}ms cubic-bezier(0.2, 0.85, 0.15, 1), opacity ${PHASE_FLY_MS - 80}ms ease-out, box-shadow ${PHASE_FLY_MS}ms ease`;
        requestAnimationFrame(() => {
            host.style.transform = `translate(${dx}px, ${dy}px) scale(${endScale})`;
            host.style.opacity = '0.22';
            host.classList.add('ch3-card-fly-clone-host--landing');
        });
    }, PHASE_SHRINK_MS);

    window.setTimeout(() => {
        btn.classList.add('ch3-album-btn--pop');
        host.remove();
        /* 勿在仍显示 reveal 时恢复 stage：否则跳转前会闪回整张原卡 */
        const revealEl = document.getElementById('knowledge-card-reveal');
        if (revealEl) revealEl.style.display = 'none';
        if (stage) stage.style.visibility = '';
        window.setTimeout(() => {
            btn.classList.remove('ch3-album-btn--pop');
            window.location.assign(navigateHref);
        }, 160);
    }, PHASE_SHRINK_MS + PHASE_FLY_MS + 60);
}
