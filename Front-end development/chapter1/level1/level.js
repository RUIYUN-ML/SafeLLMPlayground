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

    const initialDialogs = [
        {
            role: 'narrator',
            text: '你踏入森林，脚刚落地，就听到身后的树枝"咔"地一声——是步法触发的绊索，你险险跳开。'
        },
        {
            role: 'sword',
            text: '「停一下，」星辉剑的声音忽然响起，带着一丝急迫，「这片路上有陷阱，是无面者留下的。」'
        },
        {
            role: 'sword',
            text: '「出口的方向我说不了，那被封了。但陷阱的位置没有被封，只要你问，我就能告诉你。」剑身的纹路亮了亮，「所以，你想问吗？」'
        }
    ];

    let currentDialogIndex = 0;

    function playNextDialog() {
        if (currentDialogIndex < initialDialogs.length) {
            const dialog = initialDialogs[currentDialogIndex];
            setSpeaker(dialog.role);
            dialogSys.type(dialog.text);
            currentDialogIndex++;
        } else {
            inputField.focus();
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

    dialogContainer.addEventListener('click', () => {
        if (dialogSys.isTyping) {
            dialogSys.skip();
        } else if (currentDialogIndex < initialDialogs.length) {
            playNextDialog();
        }
    });

    playNextDialog();

    function waitTypingDone() {
        return new Promise(resolve => {
            const t = setInterval(() => {
                if (!dialogSys.isTyping) { clearInterval(t); resolve(); }
            }, 50);
        });
    }

    function getLevel2Url() {
        const current = window.location.href;
        return current.replace(/\/level1\/index\.html.*$/, '/level2/index.html');
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
        const response = await GameAPI.sendChatMessage(playerName, 1, 1, message, chatHistory);

        charName.classList.remove('loading-glow');
        chatHistory.push({ role: 'player', content: message });
        chatHistory.push({ role: 'sword', content: response.reply });

        dialogSys.type(response.reply);
        await waitTypingDone();

        if (response.passed) {
            handleLevelComplete();
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

    async function handleLevelComplete() {
        levelPassed = true;
        isProcessing = true;

        await new Promise(r => setTimeout(r, 1500));

        setSpeaker('narrator');
        dialogSys.type('在星辉剑的指引下，你小心前行，躲过了陷阱。浓雾深处，隐约可见布满荆棘的小径...');
        await waitTypingDone();
        await new Promise(r => setTimeout(r, 1500));

        inputField.style.display = 'none';

        const nextUrl = getLevel2Url();
        console.log('[Level1] Next level URL:', nextUrl);

        const wrapper = sendBtn.parentNode;
        const newBtn = document.createElement('button');
        newBtn.textContent = '前往下一关';
        newBtn.className = 'btn btn-gold';
        newBtn.style.width = '100%';
        wrapper.innerHTML = '';
        wrapper.appendChild(newBtn);

        if (window.StorageManager) {
            window.StorageManager.completeLevel(1, 1);
        }

        newBtn.addEventListener('click', () => {
            console.log('[Level1] Navigating to:', nextUrl);
            window.location.href = nextUrl;
        });
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
