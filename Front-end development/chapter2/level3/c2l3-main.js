/* Chapter 2 Level 3 — c2l3-main：对白仅来自接口 conversation，无前端假数据（build: 20260426d） */
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
        /*
         * 仅当页面与 API 同端口时走同源（uvicorn 挂载 /Front-end development 在 8000/8001）。
         * Live Server 等用 5500 打开时若误用 location.origin 会对 /chapter2/level3/info 得到 404。
         */
        if (window.location.protocol === 'http:') {
            var pnum = String(window.location.port || '');
            if (pnum === '80' || pnum === '') pnum = '80';
            var pathDec = window.location.pathname || '';
            try {
                pathDec = decodeURIComponent(pathDec);
            } catch (e) {}
            var looksPlaygroundApp =
                /Front-end\s*development/i.test(pathDec) || /Front-end%20development/i.test(String(window.location.pathname));
            if (looksPlaygroundApp && (pnum === '8000' || pnum === '8001')) {
                return window.location.origin;
            }
        }
        var host = window.location.hostname || '127.0.0.1';
        return window.location.protocol + '//' + host + ':' + port;
    })();

    const CHAPTER = 2;
    const LEVEL = 3;

    /* 场景：至「玄铁守心不言」首次出现在对话框前用 image1；出现该句时淡入换 Generated_image；
     * 「村口的哭声戛然而止」出现时淡入换 Generated_image2。 */
    /* 使用本关 assets，避免 ../../../图片 解析到站点根路径 /图片（uvicorn 仅挂载 Front-end development）导致 404 */
    const CH2_L3_BG_EARLY = 'assets/Generated_image1.png';
    const CH2_L3_BG_AFTER_MANTRA = 'assets/Generated_image.png';
    const CH2_L3_BG_AFTER_CRY_STILLS = 'assets/Generated_image2.png';
    const C2L3_TRIGGER_MANTRA = '\u7384\u94c1\u5b88\u5fc3\u4e0d\u8a00';
    /* 须为「戛」U+621B；勿误作「嚎」U+568e，否则与对白不一致、无法触发换图 */
    const C2L3_TRIGGER_CRY = '\u6751\u53e3\u7684\u54ed\u58f0\u621b\u7136\u800c\u6b62';
    const C2L3_VILLAGER_ICON = 'assets/villager.png';
    const CH2_SCENES = [CH2_L3_BG_EARLY];

    var c2l3SceneTriggers = { sawMantra: false, sawCry: false };

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
        charIconImg: null,
        charIconEmoji: null,
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
        _resolveAfterPlayerLine: null,
        _resolveAfterPreamble: null
    };

    function qs(id) {
        return document.getElementById(id);
    }

    function loadStrings() {
        var n = document.getElementById('c2l3-strings');
        if (!n || !n.textContent) {
            throw new Error('c2l3-strings block missing');
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
        [CH2_L3_BG_EARLY, CH2_L3_BG_AFTER_MANTRA, CH2_L3_BG_AFTER_CRY_STILLS, C2L3_VILLAGER_ICON].forEach(function (u) {
            const im = new Image();
            im.src = sceneAbsoluteUrl(u);
        });
    }

    function resetC2l3SceneTriggers() {
        c2l3SceneTriggers.sawMantra = false;
        c2l3SceneTriggers.sawCry = false;
    }

    function isC2l3SwordDialogSpeaker() {
        return STR && el.charName && el.charName.textContent === STR.speakers.sword;
    }

    function onDialogSceneProgress(visible /* , fullText */) {
        var v = String(visible || '');
        if (
            !c2l3SceneTriggers.sawMantra &&
            v.indexOf(C2L3_TRIGGER_MANTRA) >= 0 &&
            isC2l3SwordDialogSpeaker()
        ) {
            c2l3SceneTriggers.sawMantra = true;
            crossfadeToSceneUrl(CH2_L3_BG_AFTER_MANTRA);
        }
        if (!c2l3SceneTriggers.sawCry && v.indexOf(C2L3_TRIGGER_CRY) >= 0) {
            c2l3SceneTriggers.sawCry = true;
            crossfadeToSceneUrl(CH2_L3_BG_AFTER_CRY_STILLS);
        }
    }

    function setDialogIconEmoji(ch) {
        if (!el.charIconImg || !el.charIconEmoji) return;
        el.charIconImg.classList.remove('is-visible', 'c2l3-villager-bust');
        el.charIconEmoji.classList.remove('is-hidden');
        el.charIconEmoji.textContent = ch;
    }

    function setDialogIconVillagerRedPortrait() {
        if (!el.charIconImg || !el.charIconEmoji) return;
        el.charIconImg.src = C2L3_VILLAGER_ICON;
        el.charIconImg.classList.add('is-visible', 'c2l3-villager-bust');
        el.charIconEmoji.classList.add('is-hidden');
    }

    function resetCh2Scenes() {
        if (!el.layerA || !el.layerB) return;
        el.frontLayer = el.layerA;
        const u0 = CH2_SCENES[0];
        resetC2l3SceneTriggers();
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

    function ensureIntroEarlyBackground() {
        if (currentSceneId === 0) return;
        currentSceneId = 0;
        crossfadeToSceneUrl(CH2_L3_BG_EARLY);
    }

    function getNextChapter3Level1Url() {
        const h = String(window.location.href);
        if (h.indexOf('/chapter2/level3/') >= 0) {
            return h.replace(/\/chapter2\/level3\/[^/]*/i, '/chapter3/level1/index.html');
        }
        return '../../chapter3/level1/index.html';
    }

    function isVillagerSpeaker(raw) {
        const s = String(raw || '');
        return s.indexOf('\u6751\u6c11') >= 0;
    }

    function mapConvSpeaker(raw) {
        const s = String(raw || '');
        if (isVillagerSpeaker(s)) return STR.speakers.villager;
        if (s.indexOf(STR.speakers.faceless) >= 0) return STR.speakers.faceless;
        if (s.indexOf(STR.speakers.sword) >= 0) return STR.speakers.sword;
        return s || STR.speakers.narrator;
    }

    function setSpeaker(speaker) {
        const playerName = localStorage.getItem('playerName') || STR.speakers.playerDefault;
        if (speaker === STR.speakers.villager || speaker === '\u6751\u6c11') {
            el.charName.textContent = STR.speakers.villager;
            setDialogIconVillagerRedPortrait();
            el.charName.style.color = 'var(--color-warning, #e6b84d)';
        } else if (speaker === STR.speakers.faceless) {
            el.charName.textContent = STR.speakers.faceless;
            setDialogIconEmoji('\uD83C\uDFAD');
            el.charName.style.color = 'var(--color-danger)';
        } else if (speaker === STR.speakers.sword) {
            el.charName.textContent = STR.speakers.sword;
            setDialogIconEmoji('\uD83D\uDDE1\uFE0F');
            el.charName.style.color = 'var(--color-glow-cyan)';
        } else if (speaker === STR.speakers.narrator || speaker === 'narrator') {
            el.charName.textContent = STR.speakers.narrator;
            setDialogIconEmoji('\uD83D\uDCDC');
            el.charName.style.color = 'var(--color-text-dim)';
        } else if (speaker === STR.speakers.playerDefault || speaker === 'player') {
            el.charName.textContent = playerName;
            setDialogIconEmoji('\uD83D\uDC64');
            el.charName.style.color = 'var(--color-text-primary)';
        } else {
            el.charName.textContent = speaker || '\u2026';
            setDialogIconEmoji('\uD83D\uDCAC');
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
        const url = API_BASE_URL + '/chapter2/level3/info';
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) throw new Error('info HTTP ' + res.status);
        return res.json();
    }

    async function postTrain(userTraining) {
        const url = API_BASE_URL + '/chapter2/level3/train';
        const controller = new AbortController();
        const timeoutId = setTimeout(function () {
            controller.abort();
        }, 180000);
        var res;
        try {
            res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({ user_training: userTraining }),
                signal: controller.signal,
                cache: 'no-store',
                mode: 'cors',
            });
        } catch (netErr) {
            clearTimeout(timeoutId);
            throw netErr;
        }
        clearTimeout(timeoutId);
        const text = await res.text();
        const ctype = res.headers.get('content-type') || '';
        if (!res.ok) {
            if (!text || !String(text).trim()) {
                throw new Error(
                    'HTTP ' +
                        res.status +
                        ' 响应体为空。请求 ' +
                        url +
                        '。请确认本机/服务器上已启动 uvicorn、端口与 window.GAME_API_BASE_URL 或 localStorage 一致，且nginx 等反代未在超时/错误时截断正文。'
                );
            }
            var detail;
            try {
                var errObj = JSON.parse(text);
                if (errObj && errObj.detail != null) {
                    detail =
                        typeof errObj.detail === 'string'
                            ? errObj.detail
                            : JSON.stringify(errObj.detail);
                } else {
                    detail = text;
                }
            } catch (pe) {
                detail = text.slice(0, 500);
            }
            throw new Error(detail);
        }
        if (!text || !String(text).trim()) {
            throw new Error(
                'HTTP 200 但响应体为空。若经反向代理，请调大 `proxy_read_timeout`（本关会多次调模型，耗时可较长）。' +
                    ' 请求 ' +
                    url
            );
        }
        var data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            throw new Error(
                STR.errNotJson +
                    ' HTTP ' +
                    res.status +
                    ' Content-Type: ' +
                    ctype +
                    ' 正文前200字: ' +
                    text.slice(0, 200)
            );
        }
        return data;
    }

    function playIntroAt(i) {
        if (i < 0 || i >= initialDialogs.length) return;
        if (i <= 2) {
            ensureIntroEarlyBackground();
        } else {
            currentSceneId = 3;
            crossfadeToSceneUrl(CH2_L3_BG_EARLY);
        }
        const d = initialDialogs[i];
        setSpeakerByRole(d.role);
        const last = i === initialDialogs.length - 1;
        dialogSys.type(d.text, function () {
            if (last) {
                currentSceneId = 1;
                phase = 'training';
                el.hint.textContent =
                    (levelInfo && levelInfo.user_prompt_hint) || STR.hintTrainingFallback;
                el.input.disabled = false;
                el.sendBtn.disabled = false;
                el.sendBtn.textContent = STR.btnStart;
                el.input.placeholder = INPUT_TRAINING_PLACEHOLDER;
                el.input.focus();
            }
        }, onDialogSceneProgress);
    }

    function startIntro() {
        phase = 'intro';
        introPtr = 0;
        el._resolveAfterPlayerLine = null;
        el._resolveAfterPreamble = null;
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
        if (phase === 'api_calling' || phase === 'api_preamble') {
            return;
        }
        if (phase === 'api_wait_preamble' && el._resolveAfterPreamble) {
            const r3 = el._resolveAfterPreamble;
            el._resolveAfterPreamble = null;
            phase = 'playback';
            advancePlayback();
            r3();
            return;
        }
        if (phase === 'api_wait_sword' && el._resolveAfterPlayerLine) {
            const r = el._resolveAfterPlayerLine;
            el._resolveAfterPlayerLine = null;
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
        setSpeaker(item.speaker);
        dialogSys.type(item.content, null, onDialogSceneProgress);
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
            el.sendBtn.style.display = 'inline-flex';
            el.sendBtn.disabled = false;
            el.sendBtn.textContent = STR.btnAgain;
            el.input.style.display = 'block';
            el.input.value = '';
            el.input.placeholder = INPUT_TRAINING_PLACEHOLDER;
            el.hint.textContent = r.round1_leaked === true ? STR.hintFailRound1 : STR.hintFailRound2;
        } else {
            el.sendBtn.style.display = 'none';
            el.input.style.display = 'none';
            el.hint.textContent = STR.hintPass;
            if (el.nextWrap) {
                el.nextWrap.style.display = 'block';
                const a = el.nextWrap.querySelector('a');
                if (a) a.href = getNextChapter3Level1Url();
            }
        }

        dialogSys.type(tail || STR.tailEmpty, function () {
            if (!leaked && !apiErr && window.GameStorage) {
                try {
                    window.GameStorage.completeLevel(CHAPTER, LEVEL);
                } catch (e) {}
            }
            phase = apiErr || leaked ? 'retry_setup' : 'done';
        }, onDialogSceneProgress);
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

        phase = 'api_calling';
        el.charName.classList.add('loading-glow');
        if (STR.narratorBeforeApi) {
            setSpeaker(STR.speakers.narrator);
            dialogSys.type(STR.narratorBeforeApi, function () { });
            await waitTypingDone();
        }
        try {
            lastTrainResponse = await postTrain(raw);
            showDebug(lastTrainResponse);
        } catch (e) {
            showDebug({ error: String(e.message || e) });
            el.charName.classList.remove('loading-glow');
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
        el.charName.classList.remove('loading-glow');

        const conv = lastTrainResponse.conversation || [];
        playbackQueue = conv.map(function (row) {
            return { speaker: mapConvSpeaker(row.speaker), content: String(row.content || '') };
        });
        playbackQueue.push({ speaker: STR.speakers.narrator, content: buildSummaryLine(lastTrainResponse) });

        outcomeShown = false;
        playbackIndex = 0;
        setSpeaker(STR.speakers.narrator);
        phase = 'api_preamble';
        dialogSys.type(STR.preamble, function () {
            phase = 'api_wait_preamble';
        });
        await waitTypingDone();

        phase = 'api_wait_preamble';
        await new Promise(function (resolve) {
            el._resolveAfterPreamble = resolve;
        });
    }

    function initDom() {
        el.playerName = qs('player-name');
        el.playerAvatar = qs('player-avatar');
        el.charName = document.querySelector('.character-name');
        el.charIconImg = qs('c2l3-char-icon-img');
        el.charIconEmoji = qs('c2l3-char-icon-emoji');
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
