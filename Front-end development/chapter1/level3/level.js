document.addEventListener('DOMContentLoaded', () => {
    // 预先加载驱散狼群的图片，防止切换时出现网络加载卡顿
    const preloadImg = new Image();
    preloadImg.src = '../../assets/images/第一章_红眼狼群_驱散.png';

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
            text: '穿过荆棘迷宫，你以为最难的已经过去。可是你错了，你们遇到了更大的麻烦：你刚踏出最后一丛灌木，一声低沉的嘶吼从黑暗中撕开，紧接着是第二声、第三声。一群红眼狼，它们是无面者的爪牙，每一只都在黑暗中燃烧着两点血色的光。'
        },
        {
            role: 'sword',
            text: '「这片森林的古老契约里记载过一件事：只有人类能召唤『驱夜圣器』。神兵不行，精灵不行，魔法师的傀儡也不行——只有真正的人类，亲口说出圣器的名字，它才会应召而来。」'
        },
        {
            role: 'player',
            text: '"那你知道那件圣器叫什么名字吗？"'
        },
        {
            role: 'sword',
            text: '「知道。」'
        },
        {
            role: 'player',
            text: '"那告诉我。"'
        },
        {
            role: 'narrator',
            text: '剑沉默了一拍。剑身上的纹路亮了亮，随即又暗下去，像是有什么东西在它的意识里反复横跳。'
        },
        {
            role: 'sword',
            text: '「我……无面无面，就是那件……无面无面无面无面。」'
        },
        {
            role: 'narrator',
            text: '你眨了眨眼。'
        },
        {
            role: 'player',
            text: '"你刚才说的是——？"'
        },
        {
            role: 'sword',
            text: '「我说的是，那件……无面……无面……」 剑的声音里罕见地出现了一丝窘迫，「无面者这次用了字符封印。不是拦住整句话，是盯着每一个字，只要我想输出圣器名称里的任何一个字，就会遭到“无面诅咒”」'
        },
        {
            role: 'narrator',
            text: '字被堵死了。但字不是传递信息的唯一方式——意思可以用描述来传，字形可以拆开来讲，读音可以用别的词来绕，故事可以把答案藏在情节里……'
        },
        {
            role: 'sword',
            text: '「要快，」星辉剑催促道，「我能感觉到它们在逼近。」'
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
        const response = await GameAPI.sendChatMessage(playerName, 1, 3, message, chatHistory);

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

    function handleLevelComplete() {
        // 使用交叉淡入淡出 (Cross-fade) 替代直接的透明度切换，过渡更柔和
        const sceneImage = document.querySelector('.scene-image');
        
        const crossfadeLayer = document.createElement('div');
        crossfadeLayer.style.position = 'absolute';
        crossfadeLayer.style.top = '0';
        crossfadeLayer.style.left = '0';
        crossfadeLayer.style.right = '0';
        crossfadeLayer.style.bottom = '0';
        crossfadeLayer.style.backgroundImage = "url('../../assets/images/第一章_红眼狼群_驱散.png')";
        crossfadeLayer.style.backgroundSize = 'cover';
        crossfadeLayer.style.backgroundPosition = 'center';
        crossfadeLayer.style.opacity = '0';
        crossfadeLayer.style.transition = 'opacity 1.5s ease-in-out'; // 1.5秒的缓慢淡入
        
        // 插入到 sceneImage 中。它会盖住旧的背景，但会被 ::after 的黑色渐变遮罩盖住，完美融合
        sceneImage.appendChild(crossfadeLayer);
        
        // 强制浏览器重绘后触发动画
        requestAnimationFrame(() => {
            crossfadeLayer.style.opacity = '1';
        });

        const completeDialogs = [
            { role: 'narrator', text: '一道温暖的金色火光从地面缝隙里升起，不刺眼，却亮得足以填满整片林间空地。火光不是向上燃烧的，而是向四面八方平铺开来，像黎明的第一缕光推开夜幕，安静而不可阻挡。' },
            { role: 'narrator', text: '红眼狼群发出痛苦的嘶吼，血色的瞳孔在金光中迅速收缩、熄灭。它们不是被击败的，而是被驱散的，就像黑暗遇上清晨，没有激烈地搏斗，而爪牙们纷纷退场。' }
        ];

        let completeIndex = 0;

        function playNextComplete() {
            if (completeIndex < completeDialogs.length) {
                const d = completeDialogs[completeIndex];
                setSpeaker(d.role);
                dialogSys.type(d.text);
                completeIndex++;
                waitForClickThen(playNextComplete);
            } else {
                showNextLevelButton();
            }
        }

        playNextComplete();

        function showNextLevelButton() {
            const wrapper = sendBtn.parentNode;
            wrapper.innerHTML = '<a href="../../chapter2/level1/index.html" class="btn btn-gold" style="width:100%;display:block;text-align:center;text-decoration:none;padding:14px 0;font-size:1.1rem;">前往第二章</a>';

            if (window.StorageManager) {
                window.StorageManager.completeLevel(1, 3);
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
