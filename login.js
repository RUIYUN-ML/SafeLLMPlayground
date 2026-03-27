document.addEventListener('DOMContentLoaded', () => {
    const initialBtn = document.getElementById('initial-btn');
    const initialView = document.getElementById('initial-view');
    const creationView = document.getElementById('creation-view');
    const mainHeader = document.getElementById('main-header');
    const mainFooter = document.getElementById('main-footer');
    
    const avatarOptions = document.querySelectorAll('.avatar-option');
    const nameInput = document.getElementById('hero-name');
    const startBtn = document.getElementById('start-btn');
    
    let selectedGender = null;

    // 1. 点击“开启勇者之旅”，切换到创角视图
    initialBtn.addEventListener('click', () => {
        // 隐藏初始按钮和底部引言
        initialView.classList.add('hidden');
        mainFooter.classList.add('hidden');
        
        // 标题稍微上移
        mainHeader.classList.add('shifted');
        
        // 延迟一小会儿显示创角卡片，让过渡更平滑
        setTimeout(() => {
            initialView.style.display = 'none'; // 彻底移出文档流
            creationView.classList.remove('hidden');
            creationView.style.position = 'relative';
        }, 400);
    });

    // 2. 头像选择逻辑
    avatarOptions.forEach(option => {
        option.addEventListener('click', () => {
            // 移除其他选中状态
            avatarOptions.forEach(opt => opt.classList.remove('selected'));
            // 添加当前选中状态
            option.classList.add('selected');
            selectedGender = option.dataset.gender;
            
            checkFormValidity();
        });
    });

    // 3. 名称输入逻辑
    nameInput.addEventListener('input', () => {
        checkFormValidity();
    });

    // 检查表单是否填完
    function checkFormValidity() {
        const name = nameInput.value.trim();
        if (selectedGender && name.length > 0) {
            startBtn.removeAttribute('disabled');
        } else {
            startBtn.setAttribute('disabled', 'true');
        }
    }

    // 4. 开始冒险按钮点击
    startBtn.addEventListener('click', () => {
        const name = nameInput.value.trim();
        if (!selectedGender || !name) return;

        const confirmMsg = `勇者名称一旦确定，便无法更改。\n\n确认以「${name}」之名踏上旅程吗？`;
        if (confirm(confirmMsg)) {
            // 保存数据到 localStorage
            const playerData = {
                name: name,
                avatar: selectedGender,
                created_at: new Date().toISOString()
            };
            localStorage.setItem('star_sword_player', JSON.stringify(playerData));
            
            // 动画过渡后跳转到序章
            document.body.style.transition = "opacity 1s ease";
            document.body.style.opacity = 0;
            
            setTimeout(() => {
                alert("即将跳转到序章页面 (prologue.html)...");
                // 实际开发中解开这行注释
                // window.location.href = '../prologue.html';
            }, 1000);
        }
    });
});
