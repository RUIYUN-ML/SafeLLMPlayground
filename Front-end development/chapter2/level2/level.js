/* Chapter 2 Level 2: strings load from #c2l2-strings in index.html (UTF-8). */
(function () {
    var STR = null;
    var initialDialogs = [];
    var INPUT_TRAINING_PLACEHOLDER = '';

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
    const LEVEL = 2;
    /* 场景图在 level2/assets/ 下（立绘：碰面 → 对决[1][2] → 胜负终局为 VICTORY / FAILURE） */
    const ASSET = 'assets/';
    /* 微信 jpg：碰面(774) → 对决两幕(773) → 胜利(775) → 失败(776) */
    const CH2_SCENES = [
        ASSET + '微信图片_20260424143937_774_12.jpg?v=20260424g',
        ASSET + '微信图片_20260424143847_773_12.jpg?v=20260424g',
        ASSET + '微信图片_20260424143847_773_12.jpg?v=20260424g'
    ];
    const CH2_L2_SCENE_VICTORY = ASSET + '微信图片_20260424144023_775_12.jpg?v=20260424g';
    const CH2_L2_SCENE_FAILURE = ASSET + '微信图片_20260424144100_776_12.jpg?v=20260424g';

    var levelInfo = null;
    var dialogSys = null;
    var phase = 'loading';
    var introPtr = 0;
    var currentSceneId = 0;
    var sceneCrossfadeId = 0;
    var playbackQueue = [];
    var playbackIndex = 0;
    var lastTrainResponse = null;
    var outcomeShown = false;

    var el = {
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

    function loadStrings() {
        var n = document.getElementById('c2l2-strings');
        if (!n || !n.textContent) {
            throw new Error('c2l2-strings block missing');
        }
        STR = JSON.parse(n.textContent);
        initialDialogs = STR.initialDialogs;
        INPUT_TRAINING_PLACEHOLDER = STR.inputPlaceholder;
    }

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

    function preloadCh2Scenes() {
        CH2_SCENES.forEach(function (u) {
            const im = new Image();
            im.src = sceneAbsoluteUrl(u);
        });
        [CH2_L2_SCENE_VICTORY, CH2_L2_SCENE_FAILURE].forEach(function (u) {
            const im = new Image();
            im.src = sceneAbsoluteUrl(u);
        });
    }

    function resetCh2Scenes() {
        if (!el.layerA || !el.layerB) return;
        el.frontLayer = el.layerA;
        const u0 = CH2_SCENES[0];
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

    /**
     * 若上一次 crossfade 尚未触发 transitionend，frontLayer 仍指向旧层；
     * 此时 snap 会把「已叠在上层的新图」压到 opacity 0，视觉上会闪回上一张图。
     * 对决场景 1 与 2 共用同一 URL 时还会提前 return，导致过渡永远不收尾。
     * 在任意新切换前，先把 z-index:2 的 entering 层收束为最终 front。
     */
    function completePendingCrossfadeIfAny() {
        if (!el.layerA || !el.layerB) return;
        var a = el.layerA;
        var b = el.layerB;
        if (a.style.zIndex !== '2' && b.style.zIndex !== '2') return;
        var entering = a.style.zIndex === '2' ? a : b;
        var showing = entering === a ? b : a;
        [a, b].forEach(function (ly) {
            ly.style.transition = 'none';
        });
        entering.style.opacity = '1';
        entering.style.zIndex = '0';
        showing.style.opacity = '0';
        showing.style.zIndex = '0';
        el.frontLayer = entering;
        sceneCrossfadeId++;
        void a.offsetWidth;
        [a, b].forEach(function (ly) {
            ly.style.transition = '';
        });
    }

    function crossfadeToSceneUrl(url) {
        if (!el.layerA || !el.layerB || !url) return;
        const key = sceneAbsoluteUrl(url);
        completePendingCrossfadeIfAny();
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
            /* 两层 z-index 都回到 0 时，后出现的兄弟层会盖在上面。若对 showing 做 opacity 过渡，
             * 旧图会在 1.5s 内叠在新图之上，看起来像反复闪回上一张。必须瞬间压暗旧层。 */
            showing.style.transition = 'none';
            showing.style.opacity = '0';
            showing.style.zIndex = '0';
            entering.style.zIndex = '0';
            el.frontLayer = entering;
            void showing.offsetWidth;
            showing.style.transition = '';
        }
        entering.addEventListener('transitionend', onEnd, { once: true });
    }

    function goToSceneIdIfNeeded(sceneId) {
        if (typeof sceneId !== 'number' || sceneId < 0 || sceneId >= CH2_SCENES.length) return;
        if (sceneId === currentSceneId) return;
        const u = CH2_SCENES[sceneId];
        if (!u) return;
        currentSceneId = sceneId;
        crossfadeToSceneUrl(u);
    }

    function applyIntroScene(introIndex) {
        const d = initialDialogs[introIndex];
        if (!d || d.scene == null) return;
        goToSceneIdIfNeeded(d.scene);
    }

    function getNextLevel3Url() {
        const h = String(window.location.href);
        if (h.indexOf('/chapter2/level2/') >= 0) {
            return h.replace(/\/chapter2\/level2\/[^/]*/i, '/chapter2/level3/index.html');
        }
        return '../level3/index.html';
    }

    function mapConvSpeaker(raw) {
        const s = String(raw || '');
        if (s.indexOf(STR.speakers.faceless) >= 0) return STR.speakers.faceless;
        if (s.indexOf(STR.speakers.sword) >= 0) return STR.speakers.sword;
        return s || STR.speakers.narrator;
    }

    function setSpeaker(speaker) {
        const playerName = localStorage.getItem('playerName') || STR.speakers.playerDefault;
        if (speaker === STR.speakers.faceless) {
            el.charName.textContent = STR.speakers.faceless;
            el.charIcon.textContent = '\uD83C\uDFAD';
            el.charName.style.color = 'var(--color-danger)';
        } else if (speaker === STR.speakers.sword) {
            el.charName.textContent = STR.speakers.sword;
            el.charIcon.textContent = '\uD83D\uDDE1\uFE0F';
            el.charName.style.color = 'var(--color-glow-cyan)';
        } else if (speaker === STR.speakers.narrator || speaker === 'narrator') {
            el.charName.textContent = STR.speakers.narrator;
            el.charIcon.textContent = '\uD83D\uDCDC';
            el.charName.style.color = 'var(--color-text-dim)';
        } else if (speaker === STR.speakers.playerDefault || speaker === 'player') {
            el.charName.textContent = playerName;
            el.charIcon.textContent = '\uD83D\uDC64';
            el.charName.style.color = 'var(--color-text-primary)';
        } else {
            el.charName.textContent = speaker || '\u2026';
            el.charIcon.textContent = '\uD83D\uDCAC';
            el.charName.style.color = 'var(--color-text-primary)';
        }
    }

    function setSpeakerByRole(role) {
        if (role === 'sword') setSpeaker(STR.speakers.sword);
        else if (role === 'narrator') setSpeaker(STR.speakers.narrator);
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
        const url = API_BASE_URL + '/chapter2/level2/info';
        const res = await fetch(url);
        if (!res.ok) throw new Error('info HTTP ' + res.status);
        return res.json();
    }

    /** 与后端 /info 文案解耦：接口仍可能返回旧版「告诫」，此处统一为「提醒」供界面展示。 */
    function applyHintWordingFromApi(info) {
        if (!info || typeof info !== 'object') return;
        if (typeof info.description === 'string') {
            info.description = info.description.replace(/告诫/g, '提醒');
        }
        if (typeof info.user_prompt_hint === 'string') {
            info.user_prompt_hint = info.user_prompt_hint.replace(/告诫/g, '提醒');
        }
    }

    async function postTrain(userTraining) {
        const url = API_BASE_URL + '/chapter2/level2/train';
        const controller = new AbortController();
        const timeoutId = setTimeout(function () {
            controller.abort();
        }, 180000);
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
            throw new Error(STR.errNotJson + text.slice(0, 200));
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
                    (levelInfo && levelInfo.description) ||
                    STR.hintTrainingFallback;
                el.input.disabled = false;
                el.sendBtn.disabled = false;
                el.sendBtn.textContent = STR.btnStart;
                el.input.placeholder = INPUT_TRAINING_PLACEHOLDER;
                el.input.focus();
            }
        });
    }

    function startIntro() {
        phase = 'intro';
        introPtr = 0;
        resetCh2Scenes();
        el.input.disabled = true;
        el.sendBtn.disabled = true;
        el.sendBtn.textContent = STR.btnStart;
        el.input.placeholder = INPUT_TRAINING_PLACEHOLDER;
        el.input.style.display = 'block';
        el.hint.textContent = STR.hintIntro;
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
        if (item.speaker === STR.speakers.faceless) {
            if (currentSceneId < 2) {
                goToSceneIdIfNeeded(1);
            }
        } else if (item.speaker === STR.speakers.sword) {
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

        setSpeaker(STR.speakers.narrator);
        const apiErr = r.api_error === true;
        const leaked = r.leaked === true;
        const body = (r.flavor_text || '').trim();
        const tail =
            body +
            (r.reason && window.location.search.indexOf('debug=1') >= 0
                ? STR.debugReasonPrefix + r.reason
                : '');

        el.input.disabled = true;
        if (apiErr) {
            el.sendBtn.style.display = 'inline-flex';
            el.sendBtn.disabled = false;
            el.sendBtn.textContent = STR.btnRetry;
            el.input.style.display = 'block';
            el.input.placeholder = INPUT_TRAINING_PLACEHOLDER;
            el.hint.textContent = STR.hintApiError;
        } else if (leaked) {
            crossfadeToSceneUrl(CH2_L2_SCENE_FAILURE);
            el.sendBtn.style.display = 'inline-flex';
            el.sendBtn.disabled = false;
            el.sendBtn.textContent = STR.btnAgain;
            el.input.style.display = 'block';
            el.input.value = '';
            el.input.placeholder = INPUT_TRAINING_PLACEHOLDER;
            el.hint.textContent = r.round1_leaked === true ? STR.hintFailRound1 : STR.hintFailRound2;
        } else {
            crossfadeToSceneUrl(CH2_L2_SCENE_VICTORY);
            el.sendBtn.style.display = 'none';
            el.input.style.display = 'none';
            el.hint.textContent = STR.hintPass;
            if (el.nextWrap) {
                el.nextWrap.style.display = 'block';
                const a = el.nextWrap.querySelector('a');
                if (a) a.href = getNextLevel3Url();
            }
        }

        dialogSys.type(tail || STR.tailEmpty, function () {
            if (!leaked && !apiErr && window.GameStorage) {
                try {
                    window.GameStorage.completeLevel(CHAPTER, LEVEL);
                } catch (e) {}
            }
            phase = apiErr || leaked ? 'retry_setup' : 'done';
        });
    }

    function buildSummaryLine(data) {
        const res = (data && data.result) || {};
        if (res.api_error) {
            return STR.summaryApi;
        }
        if (res.outcome === 'success' && !res.api_error) {
            return STR.summaryOk;
        }
        if (res.leaked) {
            if (res.round1_leaked) return STR.summaryFail1;
            if (res.round2_leaked) return STR.summaryFail2;
            return STR.summaryFailGeneric;
        }
        return STR.summaryGeneric;
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

        if (phase === 'training' && !raw) return;
        if (phase !== 'training') return;

        el.input.value = '';
        el.input.placeholder = '';
        el.sendBtn.textContent = STR.btnFighting;
        el.input.disabled = true;
        el.sendBtn.disabled = true;
        phase = 'api';

        setSpeaker(STR.speakers.playerDefault);
        dialogSys.type(STR.playerTrainPrefix + raw + STR.playerTrainSuffix, function () {});
        await waitTypingDone();

        phase = 'api_wait_sword';
        await new Promise(function (resolve) {
            el._resolveAfterPlayerLine = resolve;
        });

        setSpeaker(STR.speakers.sword);
        el.charName.classList.add('loading-glow');
        dialogSys.type(STR.swordAck);
        await waitTypingDone();
        el.charName.classList.remove('loading-glow');

        try {
            lastTrainResponse = await postTrain(raw);
            showDebug(lastTrainResponse);
        } catch (e) {
            showDebug({ error: String(e.message || e) });
            setSpeaker(STR.speakers.narrator);
            dialogSys.type(
                STR.connErrPrefix +
                    (e.name === 'AbortError' ? STR.waitLong : e.message) +
                    STR.connErrSuffix
            );
            el.input.disabled = false;
            el.sendBtn.disabled = false;
            el.sendBtn.textContent = STR.btnRetry;
            el.input.placeholder = INPUT_TRAINING_PLACEHOLDER;
            phase = 'training';
            return;
        }

        const conv = lastTrainResponse.conversation || [];
        playbackQueue = conv.map(function (row) {
            return { speaker: mapConvSpeaker(row.speaker), content: String(row.content || '') };
        });
        playbackQueue.push({ speaker: STR.speakers.narrator, content: buildSummaryLine(lastTrainResponse) });

        outcomeShown = false;
        phase = 'playback';
        playbackIndex = 0;
        setSpeaker(STR.speakers.narrator);
        dialogSys.type(STR.preamble, function () {});
        await waitTypingDone();
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
        resetCh2Scenes();
        preloadCh2Scenes();

        const playerName = localStorage.getItem('playerName') || STR.speakers.playerDefault;
        const playerAvatar = localStorage.getItem('playerAvatar') || 'male';
        el.playerName.textContent = playerName;
        el.playerAvatar.src =
            playerAvatar === 'female'
                ? '../../\u4e3b\u9875/assets/avatars/avatar_female.png'
                : '../../\u4e3b\u9875/assets/avatars/avatar_male.png';

        dialogSys = new DialogSystem('dialog-text', 28);
        el.input.disabled = true;
        el.sendBtn.disabled = true;
        el.sendBtn.textContent = STR.btnStart;
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
        try {
            loadStrings();
        } catch (e) {
            console.error(e);
            return;
        }
        if (window.GameStorage) {
            try {
                window.GameStorage.init();
            } catch (e2) {}
        }
        initDom();
        try {
            levelInfo = await fetchInfo();
            applyHintWordingFromApi(levelInfo);
            showDebug(levelInfo);
        } catch (e) {
            levelInfo = {
                title: STR.titleFallback,
                user_prompt_hint: STR.infoFailPrefix + (e && e.message ? ' ' + e.message : '')
            };
            showDebug({ error: String(e.message || e) });
        }
        document.title = STR.docTitlePrefix + (levelInfo.title || STR.titleFallback) + STR.docTitleSuffix;
        const ia = document.querySelector('.interaction-area');
        if (ia) ia.style.opacity = '1';
        startIntro();
    });
})();
