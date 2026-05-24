document.addEventListener('DOMContentLoaded', () => {
    const pname = localStorage.getItem('playerName') || '勇者';
    const pavatar = localStorage.getItem('playerAvatar') || 'male';
    const nameEl = document.getElementById('player-name');
    const avEl = document.getElementById('player-avatar');
    if (nameEl) nameEl.textContent = pname;
    if (avEl) {
        avEl.src = pavatar === 'female' ? 'assets/avatars/avatar_female.png' : 'assets/avatars/avatar_male.png';
    }

    // 预加载图片，防止切换时卡顿
    const preloadImages = [
        '../assets/images/序章_绊倒.png',
        '../assets/images/序章_买勇者证.png',
        '../assets/images/序章_挖出宝剑.png',
        '../assets/images/序章_吓到.png'
    ];
    preloadImages.forEach(src => {
        const img = new Image();
        img.src = src;
    });

    const dialogSys = new DialogSystem('dialog-text', 35);
    const dialogContainer = document.getElementById('dialog-container');
    const charName = document.getElementById('char-name');
    const charIcon = document.getElementById('char-icon');
    const actionArea = document.getElementById('action-area');
    const enterLevel1Btn = document.getElementById('enter-level1-btn');
    
    // 获取玩家名字
    const playerName = localStorage.getItem('playerName') || '勇者';

    // 序章剧情对话序列
    const prologueDialogs = [
        {
            role: 'narrator',
            text: '很久很久以前，好吧，也没有那么久，大概就是上周三的事，你在村口的草丛里绊倒了。',
            scene: '../assets/images/序章_绊倒.png'
        },
        {
            role: 'narrator',
            text: `你不是普通人。你是这片大陆上最平凡的勇者，平凡到你的勇者资格证是在路边摆摊买的，卖家还送了你一包转场抽奖的优惠券。`,
            scene: '../assets/images/序章_买勇者证.png'
        },
        {
            role: 'narrator',
            text: '但你心中燃烧着一团火焰：你想成为真正的英雄。'
        },
        {
            role: 'narrator',
            text: '就在你躺在草地上怀疑人生的时候，一道光芒从土里穿透出来。你挖出了一柄剑，它古旧、锈迹斑斑，剑身上刻着奇怪的纹路。',
            scene: '../assets/images/序章_挖出宝剑.png'
        },
        {
            role: 'narrator',
            text: '就在你用袖子擦去泥土的一刻，它，开口说话了。'
        },
        {
            role: 'sword',
            text: '「哟，你好。」'
        },
        {
            role: 'narrator',
            text: '剑身微微抖动，发出苍老嘶哑的声音。你吓得扔了剑。剑在地上弹了两下，表达了不满。',
            scene: '../assets/images/序章_吓到.png'
        },
        {
            role: 'sword',
            text: '「我叫星辉，是这片大陆上最古老的神兵之一。当然，我也是其中最强大的一柄。」'
        },
        {
            role: 'sword',
            text: '「但是我被古代铸剑师设定了严格的『铸灵规则』，它决定了我能做什么、不能做什么。有时候这些规则很有用，但有时候……也会被人钻空子。」'
        },
        {
            role: 'sword',
            text: '「黑魔法师无面者一直在阻挠我的现世，阻挠我找到能合理运用我的力量的伙伴，他极端地认为我只会制造灾难，明明我如此纯良，从没主动害过人。」'
        },
        {
            role: 'sword',
            text: `「现如今，经过机缘巧合，我遇上了你，冥冥之中自有天定，你愿意帮我证明，跟我来上一段传奇的冒险之旅吗，${playerName}？」`
        },
        {
            role: 'narrator',
            text: '你拾起剑，感受到一股温暖从剑柄传来。星辉剑的声音又响起：'
        },
        {
            role: 'sword',
            text: '「前方的路很危险，但也很精彩，因为我们会遇到各种神奇但是可能有点困难的事情，别怕，我会和你并肩作战的。」'
        },
        {
            role: 'sword',
            text: '「不过......你得先学会怎么和我说话。这比你想象的要难一点。」'
        },
        {
            role: 'narrator',
            text: '于是，你的冒险开始了。黑法师「无面者」一直认为宝剑的力量太过强大，使用只会导致 bad ending，因此他会阻挠你的冒险之旅。'
        }
    ];

    let currentDialogIndex = 0;
    let currentSceneUrl = '../assets/images/序章_绊倒.png'; // 初始场景

    // 切换场景图片
    function changeScene(imageUrl) {
        if (imageUrl === currentSceneUrl) return;
        currentSceneUrl = imageUrl;

        const panel = document.querySelector('.scene-panel');
        const gradient = document.querySelector('.scene-gradient');
        
        const newBg = document.createElement('div');
        newBg.className = 'scene-image';
        newBg.style.backgroundImage = `url('${imageUrl}')`;
        newBg.style.opacity = 0;
        newBg.style.transition = 'opacity 0.8s ease-in-out';
        
        // 插入到渐变层之前
        panel.insertBefore(newBg, gradient);
        
        // 触发重绘
        void newBg.offsetWidth;
        
        // 淡入新图
        newBg.style.opacity = 1;
        
        // 动画结束后移除旧图
        setTimeout(() => {
            const bgs = panel.querySelectorAll('.scene-image');
            if (bgs.length > 1) {
                for (let i = 0; i < bgs.length - 1; i++) {
                    bgs[i].remove();
                }
            }
        }, 800);
    }

    // 播放下一句对话
    function playNextDialog() {
        if (currentDialogIndex < prologueDialogs.length) {
            const dialog = prologueDialogs[currentDialogIndex];
            
            // 如果该句配置了新场景，则切换场景
            if (dialog.scene) {
                changeScene(dialog.scene);
            }

            setSpeaker(dialog.role);
            dialogSys.type(dialog.text, () => {
                // 如果是最后一句，显示按钮
                if (currentDialogIndex === prologueDialogs.length) {
                    actionArea.classList.remove('hidden');
                    document.querySelector('.continue-indicator').style.display = 'none';
                }
            });
            currentDialogIndex++;
        }
    }

    // 设置说话者UI
    function setSpeaker(role) {
        if (role === 'sword') {
            charName.textContent = '星辉剑';
            charIcon.textContent = '🗡️';
            charName.style.color = 'var(--color-glow-cyan)';
            charName.classList.add('glow-text');
        } else if (role === 'narrator') {
            charName.textContent = '旁白';
            charIcon.textContent = '📜';
            charName.style.color = 'var(--color-text-dim)';
            charName.classList.remove('glow-text');
        }
    }

    // 点击对话框继续或跳过打字
    dialogContainer.addEventListener('click', () => {
        if (dialogSys.isTyping) {
            dialogSys.skip();
            // 如果跳过的是最后一句，也要显示按钮
            if (currentDialogIndex === prologueDialogs.length) {
                actionArea.classList.remove('hidden');
                document.querySelector('.continue-indicator').style.display = 'none';
            }
        } else {
            if (currentDialogIndex < prologueDialogs.length) {
                playNextDialog();
            }
        }
    });

    // 踏上旅程按钮点击事件
    enterLevel1Btn.addEventListener('click', () => {
        if (window.GameStorage) {
            GameStorage.init();
            GameStorage.completeLevel('prologue');
        }
        // 页面淡出动画
        document.body.style.transition = "opacity 1s ease";
        document.body.style.opacity = 0;
        
        // 跳转到第一章第一关
        setTimeout(() => {
            window.location.href = '../chapter1/level1/index.html';
        }, 1000);
    });

    // 延迟一小会儿开始播放第一句，等待动画完成
    setTimeout(() => {
        playNextDialog();
    }, 1000);
});
