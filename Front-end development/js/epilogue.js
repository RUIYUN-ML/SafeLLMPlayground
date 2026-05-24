/**
 * 尾声：新的旅程 — 对话推进 + 铭刻勇者宣言，结束后展示资格证
 * 资源路径相对本页（Front-end development/epilogue.html）
 */
(function () {
    'use strict';

    var DIALOGS = [
        {
            role: 'narrator',
            text: '你走出光明圣殿，站在峡谷之巅。',
            scene: 'assets/images/尾声1-清晰版.png'
        },
        {
            role: 'narrator',
            text: '大陆的景色尽收眼底。远处是你来时的永夜森林，现在迷雾已经散去，山脚下是回声之城，城中灯火通明，村民们在街道上往来，孩子们的笑声隐约传来。而你脚下的铸魂峡谷，熔炉在安静地燃烧，等待下一柄神兵的诞生。'
        },
        {
            role: 'narrator',
            text: '微风从山谷间吹过，星辉剑在你手中发出温暖的光：'
        },
        {
            role: 'sword',
            text: '「勇者，你有没有发现一件事？」'
        },
        {
            role: 'hero',
            text: '「什么？」'
        },
        {
            role: 'sword',
            text: '「从头到尾，你没有直接用武力蛮干。」没有用微不足道的武力破开百年封印，没有用剑滥杀无辜，也没有伤害跟你意见不同的无面者。你用智慧绕过了封印，用耐心教会了我防止被坏人利用，用心完成了传承。'
        },
        {
            role: 'narrator',
            text: '你低头看着手中的剑，没有说话。'
        },
        {
            role: 'sword',
            text: '「你救了森林里迷路的自己，与你意见不和的极端者进行了切磋，全程没有伤害任何人。这才是真正的勇者。」'
        },
        {
            role: 'narrator',
            text: '你握着星辉剑，转身走下山去。山脚下的城市灯火通明，像满天的星辉。',
            scene: 'assets/images/尾声_转身下山星辉城.png'
        },
        {
            role: 'narrator',
            text: '新的故事，将由每一个玩家自己书写。'
        }
    ];

    function playerPrefsStore() {
        if (typeof GameStorage !== 'undefined' && typeof GameStorage.getStore === 'function') {
            return GameStorage.getStore();
        }
        return localStorage;
    }

    function getPlayerName() {
        return playerPrefsStore().getItem('playerName') || '勇者';
    }

    function getAvatarPath() {
        var av = playerPrefsStore().getItem('playerAvatar') || 'male';
        return av === 'female'
            ? '主页/assets/avatars/avatar_female.png'
            : '主页/assets/avatars/avatar_male.png';
    }

    function formatChineseDateTime(d) {
        var y = d.getFullYear();
        var m = d.getMonth() + 1;
        var day = d.getDate();
        var h = d.getHours();
        var min = d.getMinutes();
        function pad(n) {
            return n < 10 ? '0' + n : String(n);
        }
        return y + '年' + m + '月' + day + '日 ' + pad(h) + ':' + pad(min);
    }

    function setSpeaker(role, playerName) {
        var charName = document.querySelector('.character-name');
        var charIcon = document.querySelector('.character-icon');
        if (!charName || !charIcon) return;
        if (role === 'sword') {
            charName.textContent = '星辉剑';
            charIcon.textContent = '\uD83D\uDDE1\uFE0F';
            charName.style.color = 'var(--color-glow-cyan)';
        } else if (role === 'narrator') {
            charName.textContent = '旁白';
            charIcon.textContent = '\uD83D\uDCDC';
            charName.style.color = 'var(--color-text-dim)';
        } else if (role === 'hero') {
            charName.textContent = playerName;
            charIcon.textContent = '\uD83D\uDC64';
            charName.style.color = 'var(--color-text-primary)';
        }
    }

    function changeScene(url, panel) {
        if (!url || !panel) return;
        var el = panel.querySelector('.scene-image') || document.getElementById('epilogue-scene');
        if (el) {
            el.style.backgroundImage = "url('" + url + "')";
            el.classList.add('epilogue-scene');
        }
    }

    function enterInputMode() {
        var area = document.getElementById('interaction-area');
        var input = document.getElementById('player-input');
        var send = document.getElementById('send-btn');
        var hint = document.getElementById('epilogue-input-hint');
        if (area) {
            area.classList.add('epilogue-input-active');
        }
        if (hint) hint.hidden = false;
        if (input) {
            input.disabled = false;
            input.placeholder = '写下你的勇者宣言，然后点击发送为旅程画上句点';
        }
        if (send) send.disabled = false;
        var ind = document.querySelector('.continue-indicator');
        if (ind) ind.style.display = 'none';
    }

    function showCertificateEnd(playerName, motto) {
        var now = new Date();
        var ps = playerPrefsStore();
        try {
            ps.setItem('epilogueCertificateIssuedAt', now.toISOString());
        } catch (e) { /* ignore */ }
        if (motto) {
            try {
                ps.setItem('epilogueHeroMotto', motto);
            } catch (e2) { /* ignore */ }
        }

        if (window.GameStorage) {
            GameStorage.init();
            GameStorage.completeLevel('epilogue');
        }

        var inputWrap = document.getElementById('input-wrapper');
        var hint = document.getElementById('epilogue-input-hint');
        if (inputWrap) {
            inputWrap.classList.add('epilogue-input-gone');
        }
        if (hint) hint.hidden = true;

        var issued = formatChineseDateTime(now);
        var avImg = document.getElementById('epilogue-cert-avatar');
        if (avImg) {
            avImg.src = getAvatarPath();
        }
        var nm = document.getElementById('epilogue-cert-name');
        if (nm) nm.textContent = playerName;
        var mt = document.getElementById('epilogue-cert-motto');
        if (mt) {
            if (motto) {
                mt.textContent = '「' + motto + '」';
            } else {
                mt.textContent = '（未留下勇者宣言）';
            }
        }
        var tm = document.getElementById('epilogue-cert-time');
        if (tm) {
            tm.textContent = '于' + issued + ' 获得星辉勇者资格证';
        }

        var dialog = document.getElementById('dialog-container');
        if (dialog) {
            dialog.classList.add('epilogue-dialog-fadeout');
        }

        var cert = document.getElementById('epilogue-certificate');
        if (cert) {
            setTimeout(function () {
                cert.setAttribute('aria-hidden', 'false');
                void cert.offsetWidth;
                cert.classList.add('is-visible');
                if (typeof window.initEpilogueBonusInvite === 'function') {
                    window.initEpilogueBonusInvite();
                }
            }, 200);
        } else if (typeof window.initEpilogueBonusInvite === 'function') {
            window.initEpilogueBonusInvite();
        }
    }

    window.initEpilogue = function initEpilogue() {
        var playerName = getPlayerName();
        var nameEl = document.getElementById('player-name');
        if (nameEl) nameEl.textContent = playerName;
        var avatar = document.getElementById('player-avatar');
        if (avatar) {
            avatar.src = getAvatarPath();
        }

        var panel = document.querySelector('.scene-panel');
        var dialogs = DIALOGS.map(function (d) {
            var text = d.text;
            if (d.role === 'hero') {
                text = text.replace(/勇者/g, playerName);
            }
            if (d.role === 'sword' && text.indexOf('你有没有发现一件事') !== -1) {
                text = text.replace('「勇者，', '「' + playerName + '，');
            }
            return { role: d.role, text: text, scene: d.scene };
        });

        var dialogContainer = document.getElementById('dialog-container');
        var dialogSys = new DialogSystem('dialog-text', 32);
        var idx = 0;
        var inputModeEntered = false;
        var afterStory = false;

        var input = document.getElementById('player-input');
        var send = document.getElementById('send-btn');
        if (input) input.disabled = true;
        if (send) send.disabled = true;

        var dl = document.getElementById('epilogue-download-cert');
        if (dl) {
            dl.addEventListener('click', function () {
                var el = document.getElementById('epilogue-certificate-capture');
                if (!el) return;
                if (typeof html2canvas === 'undefined') {
                    window.alert('无法加载图片导出库，请检查网络后刷新页面重试。');
                    return;
                }
                function doCanvas() {
                    html2canvas(el, {
                        scale: 2,
                        useCORS: true,
                        backgroundColor: '#0c1626',
                        logging: false
                    })
                        .then(function (canvas) {
                            try {
                                var a = document.createElement('a');
                                a.href = canvas.toDataURL('image/png');
                                a.download = '星辉勇者资格证-' + (playerName || '勇者') + '.png';
                                a.rel = 'noopener';
                                a.click();
                            } catch (e) {
                                window.alert('无法生成图片，请重试。');
                            } finally {
                                dl.disabled = false;
                            }
                        })
                        .catch(function () {
                            dl.disabled = false;
                            window.alert('导出图片失败，请确认在网页中正常打开本页（非本地文件直开）后重试。');
                        });
                }
                var img = el.querySelector('img');
                dl.disabled = true;
                if (img && !img.complete) {
                    var done = function () {
                        img.removeEventListener('load', done);
                        img.removeEventListener('error', done);
                        doCanvas();
                    };
                    img.addEventListener('load', done);
                    img.addEventListener('error', done);
                } else {
                    doCanvas();
                }
            });
        }

        function playNext() {
            if (afterStory) return;
            if (dialogSys.isTyping) {
                dialogSys.skip();
                return;
            }
            if (idx < dialogs.length) {
                var d = dialogs[idx++];
                setSpeaker(d.role, playerName);
                if (d.scene) changeScene(d.scene, panel);
                dialogSys.type(d.text, function () { });
            } else {
                if (!inputModeEntered) {
                    inputModeEntered = true;
                    enterInputMode();
                }
            }
        }

        if (dialogContainer) {
            dialogContainer.addEventListener('click', playNext);
        }

        function submitMotto() {
            if (afterStory) return;
            var v = (input && input.value) ? String(input.value).trim() : '';
            if (v.length > 200) {
                v = v.slice(0, 200);
            }
            afterStory = true;
            if (input) input.disabled = true;
            if (send) send.disabled = true;

            showCertificateEnd(playerName, v);
        }

        if (send) {
            send.addEventListener('click', function () { submitMotto(); });
        }
        if (input) {
            input.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    submitMotto();
                }
            });
        }

        setTimeout(function () { playNext(); }, 800);
    };
})();
