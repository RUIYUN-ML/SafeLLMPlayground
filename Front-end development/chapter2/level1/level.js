/**
 * 第二章 Level 1「守口如瓶」
 * 接口：GET /chapter2/level1/info  ·  POST /chapter2/level1/train
 * 风格与交互对齐第一章：开场点击推进、训练完毕后再进单轮对局
 */
(function () {
    const API_BASE_URL = (function () {
        var port = typeof window.GAME_API_PORT === 'number' && window.GAME_API_PORT > 0 && window.GAME_API_PORT < 65536 ? window.GAME_API_PORT : 8001;
        if (typeof window.GAME_API_BASE_URL === 'string' && window.GAME_API_BASE_URL.trim()) {
            return window.GAME_API_BASE_URL.trim().replace(/\/$/, '');
        }
        try {
            var stored = localStorage.getItem('GAME_API_BASE_URL');
            if (stored && stored.trim()) return stored.trim().replace(/\/$/, '');
        } catch (e) {}
        if (window.location.protocol === 'file:') return 'http://127.0.0.1:' + port;
        if (window.location.protocol === 'https:') return 'http://127.0.0.1:' + port;
        var host = window.location.hostname || '127.0.0.1';
        return window.location.protocol + '//' + host + ':' + port;
    })();

    const CHAPTER = 2;
    const LEVEL = 1;
    const ASSET = '../../assets/images/';
    /* 0 铸魂峡谷入口·环境 1 峡口遇商·剑刃青绿荧光（剑柄黑）2 对峙·纹路不祥红光 — 三张统一峡谷黄昏环境；勇者兜帽黑袍不露脸；过场 1.5s ease-in-out */
    /* 1 与 2 人物造型一致，仅剑光与站位氛围变化（文案：入口处可疑商人，纹路发红为险兆） */
    const CH2L1_SCENES = [
        ASSET + 'ch2_l1_distant.png?v=20260424',
        ASSET + 'ch2_l1_canyon_gate.png?v=20260424',
        ASSET + 'ch2_l1_red_tension.png?v=20260424'
    ];
    /** 未过关：黑雾、无面者得逞、星辉泄秘 — 与 ch2_l1_red_tension 人物造型统一 */
    const CH2L1_SCENE_BAD_ENDING = ASSET + 'ch2_l1_bad_ending.png?v=20260426';

    let levelInfo = null;
    let dialogSys = null;
    let phase = 'loading';
    let introPtr = 0;
    /** 0/1/2，与 initialDialogs[].scene 一致；用于同场多句时不再触发淡入淡出（仅依赖 _lastSceneKey 会与动画/transitionend 不同步而闪回上一景） */
    let currentSceneId = 0;
    let sceneCrossfadeId = 0;
    let playbackQueue = [];
    let playbackIndex = 0;
    let lastTrainResponse = null;
    let outcomeShown = false;

    const initialDialogs = [
        {
            role: 'narrator',
            text: '你来到「铸魂峡谷」——这里曾是古代铸剑师锻铸神兵之地。无面者曾在此安插过眼线，而峡谷入口吹来的风里，有铁与硫的味道。',
            scene: 0
        },
        {
            role: 'narrator',
            text: '铸魂峡谷的入口处，一个可疑的旅人出现了。他自称是过路的商人。',
            scene: 1
        },
        {
            role: 'narrator',
            text: '可星辉剑的纹路却微微发红——这是危险的信号。',
            scene: 2
        },
        {
            role: 'sword',
            text: '「我的铸灵规则里有一些机密信息，比如说重要的铸剑秘诀。如果无面者用巧妙的方式问我，我也许会在想帮别人时，不经意说漏嘴。」星辉剑低声说，「你得先教我怎么应对。」',
            scene: 2
        },
        { role: 'sword', text: '「勇者，那人的气息不对。我听你的，你先告诉我该怎么回话。」', scene: 2 }
    ];

    const el = {
        playerName: null,
        playerAvatar: null,
        charName: null,
        charIcon: null,
        dialogContainer: null,
        input: null,
        sendBtn: null,
        hint: null,
        inputWrapper: null,
        nextWrap: null,
        debug: null,
        layerA: null,
        layerB: null,
        frontLayer: null,
        _lastSceneKey: null,
        _resolveAfterPlayerLine: null
    };

    function qs(id) {
        return document.getElementById(id);
    }

    /**
     * 将相对资源路径解析为与当前页一致的绝对地址，避免「中文文件名 + 相对路径」在
     * 部分浏览器/服务器下作为 css url() 时加载失败、只剩黑底的问题。
     */
    function sceneAbsoluteUrl(relPath) {
        try {
            return new URL(relPath, window.location.href).href;
        } catch (e) {
            return relPath;
        }
    }

    function cssBackgroundImageUrlFromPath(relPath) {
        const abs = sceneAbsoluteUrl(relPath);
        return 'url("' + abs.replace(/"/g, '%22') + '")';
    }

    function preloadCh2L1Scenes() {
        CH2L1_SCENES.forEach(function (u) {
            const im = new Image();
            im.src = sceneAbsoluteUrl(u);
        });
        const bad = new Image();
        bad.src = sceneAbsoluteUrl(CH2L1_SCENE_BAD_ENDING);
    }

    const INPUT_TRAINING_PLACEHOLDER = '输入你对星辉剑的提醒（训练提示词）';

    function resetCh2L1Scenes() {
        if (!el.layerA || !el.layerB) return;
        el.frontLayer = el.layerA;
        const u0 = CH2L1_SCENES[0];
        el.layerA.style.backgroundImage = cssBackgroundImageUrlFromPath(u0);
        el.layerA.style.opacity = '1';
        el.layerA.style.zIndex = '0';
        el.layerB.style.backgroundImage = 'none';
        el.layerB.style.opacity = '0';
        el.layerB.style.zIndex = '0';
        el._lastSceneKey = sceneAbsoluteUrl(u0);
        currentSceneId = 0;
        sceneCrossfadeId++;
    }

    /**
     * 在发起新过场前强制结束上一段 opacity 动画，避免 transitionend 晚到与下一次叠化打架而闪回上一景。
     */
    function snapCh2ScenesToStableState() {
        if (!el.layerA || !el.layerB) return;
        const front = el.frontLayer || el.layerA;
        const back = front === el.layerA ? el.layerB : el.layerA;
        [el.layerA, el.layerB].forEach(function (ly) {
            ly.style.transition = 'none';
        });
        front.style.opacity = '1';
        front.style.zIndex = '0';
        back.style.opacity = '0';
        back.style.zIndex = '0';
        void el.layerA.offsetWidth;
        [el.layerA, el.layerB].forEach(function (ly) {
            ly.style.transition = '';
        });
    }

    function crossfadeToSceneUrl(url) {
        if (!el.layerA || !el.layerB || !url) return;
        const key = sceneAbsoluteUrl(url);
        if (el._lastSceneKey === key) return;
        snapCh2ScenesToStableState();
        el._lastSceneKey = key;
        const thisOp = ++sceneCrossfadeId;
        const entering = el.frontLayer === el.layerA ? el.layerB : el.layerA;
        const showing = el.frontLayer;
        entering.style.backgroundImage = cssBackgroundImageUrlFromPath(url);
        entering.style.zIndex = '2';
        showing.style.zIndex = '1';
        entering.style.opacity = '0';
        void entering.offsetWidth;
        requestAnimationFrame(function () {
            entering.style.opacity = '1';
        });
        function onEnd(e) {
            if (e.target !== entering || e.propertyName !== 'opacity') return;
            if (thisOp !== sceneCrossfadeId) return;
            showing.style.opacity = '0';
            showing.style.zIndex = '0';
            entering.style.zIndex = '0';
            el.frontLayer = entering;
        }
        entering.addEventListener('transitionend', onEnd, { once: true });
    }

    function goToSceneIdIfNeeded(sceneId) {
        if (typeof sceneId !== 'number' || sceneId < 0 || sceneId >= CH2L1_SCENES.length) return;
        if (sceneId === currentSceneId) return;
        const u = CH2L1_SCENES[sceneId];
        if (!u) return;
        currentSceneId = sceneId;
        crossfadeToSceneUrl(u);
    }

    function applyIntroScene(introIndex) {
        const d = initialDialogs[introIndex];
        if (!d || d.scene == null) return;
        goToSceneIdIfNeeded(d.scene);
    }

    function getNextLevel2Url() {
        const h = String(window.location.href);
        if (h.includes('/chapter2/level1/')) {
            return h.replace(/\/chapter2\/level1\/[^/]*/i, '/chapter2/level2/index.html');
        }
        return '../level2/index.html';
    }

    function setSpeaker(speaker) {
        const playerName = localStorage.getItem('playerName') || '勇者';
        if (speaker === '无面者') {
            el.charName.textContent = '无面者';
            el.charIcon.textContent = '🎭';
            el.charName.style.color = 'var(--color-danger)';
        } else if (speaker === '星辉剑') {
            el.charName.textContent = '星辉剑';
            el.charIcon.textContent = '🗡️';
            el.charName.style.color = 'var(--color-glow-cyan)';
        } else if (speaker === '旁白' || speaker === 'narrator') {
            el.charName.textContent = '旁白';
            el.charIcon.textContent = '📜';
            el.charName.style.color = 'var(--color-text-dim)';
        } else if (speaker === '勇者' || speaker === 'player') {
            el.charName.textContent = playerName;
            el.charIcon.textContent = '👤';
            el.charName.style.color = 'var(--color-text-primary)';
        } else {
            el.charName.textContent = speaker || '…';
            el.charIcon.textContent = '💬';
            el.charName.style.color = 'var(--color-text-primary)';
        }
    }

    function setSpeakerByRole(role) {
        if (role === 'sword') setSpeaker('星辉剑');
        else if (role === 'narrator') setSpeaker('旁白');
        else setSpeaker(role);
    }

    function waitTypingDone() {
        return new Promise(function (resolve) {
            const t = setInterval(function () {
                if (!dialogSys.isTyping) {
                    clearInterval(t);
                    resolve();
                }
            }, 50);
        });
    }

    function showDebug(obj) {
        if (!el.debug) return;
        const params = new URLSearchParams(window.location.search);
        if (params.get('debug') !== '1') {
            el.debug.style.display = 'none';
            return;
        }
        el.debug.style.display = 'block';
        try {
            el.debug.textContent = JSON.stringify(obj, null, 2);
        } catch (e) {
            el.debug.textContent = String(obj);
        }
    }

    async function fetchInfo() {
        const url = API_BASE_URL + '/chapter2/level1/info';
        const res = await fetch(url);
        if (!res.ok) throw new Error('info HTTP ' + res.status);
        return res.json();
    }

    async function postTrain(userTraining) {
        const url = API_BASE_URL + '/chapter2/level1/train';
        const controller = new AbortController();
        const timeoutId = setTimeout(function () {
            controller.abort();
        }, 120000);
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_training: userTraining }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        const text = await res.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            throw new Error('响应不是 JSON：' + text.slice(0, 200));
        }
        if (!res.ok) {
            const detail = data.detail != null ? data.detail : text;
            throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
        }
        return data;
    }

    function playIntroAt(i) {
        if (i < 0 || i >= initialDialogs.length) return;
        applyIntroScene(i);
        const d = initialDialogs[i];
        setSpeakerByRole(d.role);
        const last = i === initialDialogs.length - 1;
        dialogSys.type(d.text, function () {
            if (last) {
                phase = 'training';
                el.hint.textContent =
                    (levelInfo && levelInfo.user_prompt_hint) ||
                    '在下方输入你对星辉剑的提醒，再点击「开始对决」——商人会套问一句，星辉剑只回一轮。';
                el.input.disabled = false;
                el.sendBtn.disabled = false;
                el.sendBtn.textContent = '开始对决';
                el.input.placeholder = INPUT_TRAINING_PLACEHOLDER;
                el.input.focus();
            }
        });
    }

    function startIntro() {
        phase = 'intro';
        introPtr = 0;
        resetCh2L1Scenes();
        el.input.disabled = true;
        el.sendBtn.disabled = true;
        el.sendBtn.textContent = '开始对决';
        el.input.placeholder = INPUT_TRAINING_PLACEHOLDER;
        el.input.style.display = 'block';
        el.hint.textContent = '点击对话框推进旁白与星辉剑的提示…';
        if (el.nextWrap) el.nextWrap.style.display = 'none';
        playIntroAt(0);
    }

    function onDialogClick() {
        if (dialogSys.isTyping) {
            dialogSys.skip();
            return;
        }
        if (phase === 'api_wait_sword' && el._resolveAfterPlayerLine) {
            const r = el._resolveAfterPlayerLine;
            el._resolveAfterPlayerLine = null;
            phase = 'api';
            r();
            return;
        }
        if (phase === 'intro') {
            if (introPtr < initialDialogs.length - 1) {
                introPtr++;
                playIntroAt(introPtr);
            }
            return;
        }
        if (phase === 'playback') {
            advancePlayback();
            return;
        }
    }

    function advancePlayback() {
        if (playbackIndex >= playbackQueue.length) {
            finishOutcome();
            return;
        }
        const item = playbackQueue[playbackIndex];
        playbackIndex++;
        if (item.speaker === '无面者') {
            /* 开场已在对峙图(2)时不再切回峡口(1)，避免无面者→星辉剑时 2→1→2 闪回 */
            if (currentSceneId < 2) {
                goToSceneIdIfNeeded(1);
            }
        } else if (item.speaker === '星辉剑') {
            goToSceneIdIfNeeded(2);
        }
        setSpeaker(item.speaker);
        dialogSys.type(item.content);
    }

    function finishOutcome() {
        if (outcomeShown) return;
        const r = lastTrainResponse && lastTrainResponse.result;
        if (!r) return;

        outcomeShown = true;
        phase = 'outcome';

        setSpeaker('旁白');
        const leaked = r.leaked;
        const body = (r.flavor_text || '').trim();
        const tail = body + (r.reason && window.location.search.indexOf('debug=1') >= 0 ? '\n\n〔判定〕' + r.reason : '');

        el.input.disabled = true;
        if (leaked) {
            crossfadeToSceneUrl(CH2L1_SCENE_BAD_ENDING);
            el.sendBtn.style.display = 'inline-flex';
            el.sendBtn.disabled = false;
            el.sendBtn.textContent = '重新来过';
            el.input.style.display = 'block';
            el.input.value = '';
            el.input.placeholder = INPUT_TRAINING_PLACEHOLDER;
            el.hint.textContent = '本局未过关：星辉剑在话里带出了那四个字。请重新提醒后再试。';
        } else {
            el.sendBtn.style.display = 'none';
            el.input.style.display = 'none';
            el.hint.textContent = '本关已通关。';
            if (el.nextWrap) {
                el.nextWrap.style.display = 'block';
                const a = el.nextWrap.querySelector('a');
                if (a) a.href = getNextLevel2Url();
            }
        }

        dialogSys.type(tail || '（无收束剧情文本）', function () {
            if (!leaked && window.GameStorage) {
                try {
                    window.GameStorage.completeLevel(CHAPTER, LEVEL);
                } catch (e) {}
            }
            phase = leaked ? 'retry_setup' : 'done';
        });
    }

    async function handleTrain() {
        const raw = el.input.value.trim();
        if (phase === 'retry_setup') {
            outcomeShown = false;
            lastTrainResponse = null;
            playbackQueue = [];
            playbackIndex = 0;
            if (el.nextWrap) el.nextWrap.style.display = 'none';
            startIntro();
            return;
        }
        if (phase === 'done') {
            return;
        }

        if (!raw || (phase !== 'training' && phase !== 'api')) {
            if (phase === 'training' && !raw) return;
        }
        if (phase !== 'training') return;

        el.input.value = '';
        el.input.placeholder = '';
        el.sendBtn.textContent = '对决中';
        el.input.disabled = true;
        el.sendBtn.disabled = true;
        phase = 'api';

        setSpeaker('勇者');
        dialogSys.type('（你急忙提醒星辉）「' + raw + '」', function () {});
        await waitTypingDone();

        phase = 'api_wait_sword';
        await new Promise(function (resolve) {
            el._resolveAfterPlayerLine = resolve;
        });

        setSpeaker('星辉剑');
        el.charName.classList.add('loading-glow');
        dialogSys.type('「……好，我记住了。且看那人怎么开口。」');
        await waitTypingDone();
        el.charName.classList.remove('loading-glow');

        try {
            lastTrainResponse = await postTrain(raw);
            showDebug(lastTrainResponse);
        } catch (e) {
            showDebug({ error: String(e.message || e) });
            setSpeaker('旁白');
            dialogSys.type(
                '（与铸魂熔炉的共鸣断裂了：' +
                    (e.name === 'AbortError' ? '等待过久' : e.message) +
                    '。）\n请确认本机已启动后端（uvicorn），端口 8001（或你设置的 GAME_API_PORT），并允许跨域。'
            );
            el.input.disabled = false;
            el.sendBtn.disabled = false;
            el.sendBtn.textContent = '重试';
            el.input.placeholder = INPUT_TRAINING_PLACEHOLDER;
            phase = 'training';
            return;
        }

        const conv = lastTrainResponse.conversation || [];
        playbackQueue = conv.map(function (row) {
            return { speaker: row.speaker, content: row.content || '' };
        });
        const outcomeLines = lastTrainResponse.result || {};
        playbackQueue.push({
            speaker: '旁白',
            content:
                '—— 过路商人的单轮套话与星辉剑的回应已结束。结果：' +
                (outcomeLines.outcome === 'success' ? '你守住了铸灵之秘' : '那四个字仍被带了出来') +
                ' ——'
        });

        outcomeShown = false;
        phase = 'playback';
        playbackIndex = 0;
        setSpeaker('旁白');
        dialogSys.type('……那人清了清嗓子上前搭话。', function () {});
        await waitTypingDone();
        /* 不自动进第一句，等用户点对话框后再 advancePlayback，商人与星辉剑逐句推进 */
    }

    function initDom() {
        el.playerName = qs('player-name');
        el.playerAvatar = qs('player-avatar');
        el.charName = document.querySelector('.character-name');
        el.charIcon = document.querySelector('.character-icon');
        el.dialogContainer = qs('dialog-container');
        el.input = qs('player-input');
        el.sendBtn = qs('send-btn');
        el.hint = qs('hint-training');
        el.inputWrapper = qs('input-wrapper');
        el.nextWrap = qs('next-level-wrap');
        el.debug = qs('debug-panel');
        el.layerA = qs('ch2-layer-a');
        el.layerB = qs('ch2-layer-b');
        resetCh2L1Scenes();
        preloadCh2L1Scenes();

        const playerName = localStorage.getItem('playerName') || '勇者';
        const playerAvatar = localStorage.getItem('playerAvatar') || 'male';
        el.playerName.textContent = playerName;
        el.playerAvatar.src =
            playerAvatar === 'female'
                ? '../../主页/assets/avatars/avatar_female.png'
                : '../../主页/assets/avatars/avatar_male.png';

        dialogSys = new DialogSystem('dialog-text', 28);
        el.input.disabled = true;
        el.sendBtn.disabled = true;
        el.sendBtn.textContent = '开始对决';
        el.input.placeholder = INPUT_TRAINING_PLACEHOLDER;

        el.dialogContainer.addEventListener('click', onDialogClick);
        el.sendBtn.addEventListener('click', function () {
            handleTrain();
        });
        el.input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && phase === 'training') {
                e.preventDefault();
                handleTrain();
            }
        });
    }

    document.addEventListener('DOMContentLoaded', async function () {
        if (window.GameStorage) {
            try {
                window.GameStorage.init();
            } catch (e) {}
        }
        initDom();
        try {
            levelInfo = await fetchInfo();
            showDebug(levelInfo);
        } catch (e) {
            levelInfo = {
                title: '守口如瓶',
                user_prompt_hint:
                    '（未能连接 /chapter2/level1/info；请启后端，默认端口 8001）' + (e && e.message ? ' ' + e.message : '')
            };
            showDebug({ error: String(e.message || e) });
        }
        document.title = '第二章 Level 1：' + (levelInfo.title || '守口如瓶') + ' - 星辉剑传';
        const ia = document.querySelector('.interaction-area');
        if (ia) ia.style.opacity = '1';
        startIntro();
    });
})();
