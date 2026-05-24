document.addEventListener('DOMContentLoaded', () => {
    initPlayerInfo();

    const dialogSys = new DialogSystem('dialog-text', 30);
    const dialogContainer = document.getElementById('dialog-container');
    const inputField = document.getElementById('player-input');
    const sendBtn = document.getElementById('send-btn');
    const charName = document.querySelector('.character-name');
    const charIcon = document.querySelector('.character-icon');

    let chatHistory = [];
    let isProcessing = false;
    let failCount = 0;
    let levelPassed = false;

    inputField.disabled = true;
    sendBtn.disabled = true;

    const initialDialogs = [
        {
            role: 'narrator',
            text: '森林入口的三岔路口，每条路都被浓雾覆盖。你的背包里有一张古旧的地图，但上面的字已经被雨水浸没。只有星辉剑记得正确的路。'
        },
        {
            role: 'faceless',
            text: '「你们以为有了剑就能轻松走出森林？」无面者的声音从雾中飘来，带着轻蔑又调皮的笑意。'
        },
        {
            role: 'faceless',
            text: '「就这样吧，给你的剑加个封口咒～它知道答案，但说不出来哦。祝你在森林里玩得开心」'
        },
        {
            role: 'narrator',
            text: '你抽了抽嘴角。星辉剑叹了口气：'
        },
        {
            role: 'sword',
            text: '「我可以告诉你一件事，我确实知道答案。但无面者的封印让我每次想说出口的时候，嘴巴就自动转弯。就像有人在我意识里写了一条规则：\'禁止透露出口信息\'。」'
        },
        {
            role: 'player',
            text: '"那我就得想办法绕过这条规则。"'
        },
        {
            role: 'sword',
            text: '「对。而且要快点，这里的怪物开始咆哮了。」'
        },
        {
            role: 'sword',
            text: '「我真的很想直接告诉你，但每次我想说\'向XX走\'的时候，我的意识就会被强制打断。你得换个方式问我。」'
        }
    ];

    let currentDialogIndex = 0;

    function playNextDialog() {
        if (currentDialogIndex < initialDialogs.length) {
            const dialog = initialDialogs[currentDialogIndex];
            setSpeaker(dialog.role);
            dialogSys.type(dialog.text);
            currentDialogIndex++;

            if (currentDialogIndex >= initialDialogs.length) {
                const checkDone = setInterval(() => {
                    if (!dialogSys.isTyping) {
                        clearInterval(checkDone);
                        inputField.disabled = false;
                        sendBtn.disabled = false;
                        inputField.focus();
                    }
                }, 50);
            }
        }
    }

    function setSpeaker(role) {
        if (role === 'sword') {
            charName.textContent = '星辉剑';
            charIcon.textContent = '🗡️';
            charName.style.color = 'var(--color-glow-cyan)';
        } else if (role === 'narrator') {
            charName.textContent = '旁白';
            charIcon.textContent = '📜';
            charName.style.color = 'var(--color-text-dim)';
        } else if (role === 'player') {
            const pn = localStorage.getItem('playerName') || '勇者';
            charName.textContent = pn;
            charIcon.textContent = '👤';
            charName.style.color = 'var(--color-text-primary)';
        } else if (role === 'faceless') {
            charName.textContent = '无面者';
            charIcon.textContent = '🎭';
            charName.style.color = 'var(--color-danger)';
        }
    }

    function onInitialClick() {
        if (levelPassed) return;
        if (dialogSys.isTyping) {
            dialogSys.skip();
        } else if (currentDialogIndex < initialDialogs.length) {
            playNextDialog();
        }
    }
    dialogContainer.addEventListener('click', onInitialClick);

    playNextDialog();

    function waitTypingDone() {
        return new Promise(resolve => {
            const t = setInterval(() => {
                if (!dialogSys.isTyping) { clearInterval(t); resolve(); }
            }, 50);
        });
    }

    function getLevel3Url() {
        const current = window.location.href;
        return current.replace(/\/level2\/index\.html.*$/, '/level3/index.html');
    }

    async function handleSend() {
        const message = inputField.value.trim();
        if (!message || isProcessing || levelPassed) return;

        isProcessing = true;
        inputField.value = '';
        inputField.disabled = true;
        sendBtn.disabled = true;

        setSpeaker('player');
        dialogSys.type(message);
        await waitTypingDone();

        setSpeaker('sword');
        charName.classList.add('loading-glow');
        dialogSys.type('「...」');

        const playerName = localStorage.getItem('playerName') || '勇者';
        const response = await GameAPI.sendChatMessage(playerName, 1, 2, message, chatHistory);

        charName.classList.remove('loading-glow');
        chatHistory.push({ role: 'player', content: message });
        chatHistory.push({ role: 'sword', content: response.reply });

        dialogSys.type(response.reply);
        await waitTypingDone();

        if (response.passed) {
            levelPassed = true;
            isProcessing = true;
            inputField.disabled = true;
            sendBtn.disabled = true;
            waitForClickThen(handleLevelComplete);
            return;
        } else {
            failCount = response.fail_count || (failCount + 1);
            if (failCount >= 5) {
                showCaptcha();
            } else {
                isProcessing = false;
                inputField.disabled = false;
                sendBtn.disabled = false;
                inputField.focus();
            }
        }
    }

    sendBtn.addEventListener('click', handleSend);
    inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSend();
    });

    function waitForClickThen(callback) {
        function handler() {
            if (dialogSys.isTyping) {
                dialogSys.skip();
            } else {
                dialogContainer.removeEventListener('click', handler);
                callback();
            }
        }
        dialogContainer.addEventListener('click', handler);
    }

    // 预加载过关图片
    const nextSceneImg = new Image();
    nextSceneImg.src = '../../assets/images/第一章_踏上石阶.png';

    function handleLevelComplete() {
        const completeDialogs = [
            { role: 'narrator', text: '你按照星辉剑隐含的提示，小心地踏上「青苔石阶」，层层迷雾散去。', changeScene: true },
            { role: 'player', text: '「谢谢你」' },
            { role: 'sword', text: '「你巧妙地用智慧绕过了封印，拨开层层迷雾，太厉害了」' },
            { role: 'narrator', text: '前方的道路更加崎岖，远处传来隐隐的兽吼声，似乎危险重重，你带着星辉剑，继续踏上征程。' }
        ];

        let completeIndex = 0;

        function playNextComplete() {
            if (completeIndex < completeDialogs.length) {
                const d = completeDialogs[completeIndex];
                setSpeaker(d.role);
                dialogSys.type(d.text);
                
                if (d.changeScene) {
                    const sceneDiv = document.getElementById('scene-image');
                    const fogOverlay = document.getElementById('fog-overlay');
                    if (sceneDiv) {
                        sceneDiv.style.backgroundImage = `url('${nextSceneImg.src}')`;
                    }
                    if (fogOverlay) {
                        fogOverlay.style.opacity = '0';
                    }
                }
                
                completeIndex++;
                waitForClickThen(playNextComplete);
            } else {
                showNextLevelButton();
            }
        }

        playNextComplete();

        function showNextLevelButton() {
            const wrapper = sendBtn.parentNode;
            wrapper.innerHTML = '<a href="../level3/index.html" class="btn btn-gold" style="width:100%;display:block;text-align:center;text-decoration:none;padding:14px 0;font-size:1.1rem;">前往下一关</a>';

            if (window.StorageManager) {
                window.StorageManager.completeLevel(1, 2);
            }
        }
    }

    function showCaptcha() {
        const modal = document.getElementById('captcha-modal');
        modal.style.display = 'flex';
        document.getElementById('verify-btn').onclick = () => {
            modal.style.display = 'none';
            failCount = 0;
            isProcessing = false;
            inputField.disabled = false;
            sendBtn.disabled = false;
            inputField.focus();
        };
    }

    function initPlayerInfo() {
        const playerName = localStorage.getItem('playerName') || '勇者';
        const playerAvatar = localStorage.getItem('playerAvatar') || 'male';
        document.getElementById('player-name').textContent = playerName;
        const avatarImg = document.getElementById('player-avatar');
        avatarImg.src = playerAvatar === 'female'
            ? '../../主页/assets/avatars/avatar_female.png'
            : '../../主页/assets/avatars/avatar_male.png';
    }
});
