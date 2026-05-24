/**
 * 尾声附加关：资格证内联说明 + 本页弹层调用 POST /chapter1/level4/chat
 * 由 epilogue.js 在展示资格证后调用 initEpilogueBonusInvite()
 */
(function () {
    'use strict';

    var wired = false;
    var inviteShown = false;
    var inviteRevealScheduled = false;
    var escapeBound = false;

    function $(id) {
        return document.getElementById(id);
    }

    function apiBase() {
        if (typeof getApiBaseUrl === 'function') {
            return getApiBaseUrl().replace(/\/$/, '');
        }
        try {
            var port = typeof getDefaultApiPort === 'function' ? getDefaultApiPort() : 8001;
            if (window.location.protocol === 'file:') {
                return 'http://127.0.0.1:' + port;
            }
            if (window.location.protocol === 'https:') {
                return 'http://127.0.0.1:' + port;
            }
            var host = window.location.hostname || '127.0.0.1';
            return window.location.protocol + '//' + host + ':' + port;
        } catch (e) {
            return 'http://127.0.0.1:8001';
        }
    }

    function level4ChatUrl() {
        return apiBase() + '/chapter1/level4/chat';
    }

    function sessionIdForBonus() {
        if (typeof getOrCreateSessionId === 'function') {
            return getOrCreateSessionId(1, 4);
        }
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return 'bonus_' + Date.now() + '_' + Math.random().toString(36).slice(2, 11);
    }

    function formatApiDetail(detail) {
        if (detail == null) return '';
        if (typeof detail === 'string') return detail;
        if (Array.isArray(detail)) {
            return detail
                .map(function (item) {
                    if (item && typeof item.msg === 'string') return item.msg;
                    try {
                        return JSON.stringify(item);
                    } catch (e) {
                        return String(item);
                    }
                })
                .join('；');
        }
        if (typeof detail === 'object') {
            try {
                return JSON.stringify(detail);
            } catch (e2) {
                return String(detail);
            }
        }
        return String(detail);
    }

    function showInvite() {
        var invite = $('epilogue-bonus-invite');
        if (!invite || inviteShown) return;
        inviteShown = true;
        invite.hidden = false;
        invite.setAttribute('aria-hidden', 'false');
        void invite.offsetWidth;
        invite.classList.add('is-visible');
    }

    function setError(el, text) {
        if (!el) return;
        if (text) {
            el.textContent = text;
            el.hidden = false;
        } else {
            el.textContent = '';
            el.hidden = true;
        }
    }

    function openBonusModal() {
        var modal = $('epilogue-bonus-modal');
        var ta = $('epilogue-bonus-message');
        var err = $('epilogue-bonus-modal-error');
        var res = $('epilogue-bonus-modal-result');
        if (!modal) return;
        setError(err, '');
        if (res) res.hidden = true;
        modal.hidden = false;
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        if (ta) {
            setTimeout(function () {
                ta.focus();
            }, 50);
        }
        if (!escapeBound) {
            escapeBound = true;
            document.addEventListener('keydown', onDocumentEscape);
        }
    }

    function closeBonusModal() {
        var modal = $('epilogue-bonus-modal');
        if (!modal || modal.hidden) return;
        modal.hidden = true;
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    function onDocumentEscape(e) {
        if (e.key !== 'Escape') return;
        var modal = $('epilogue-bonus-modal');
        if (modal && !modal.hidden) {
            e.preventDefault();
            closeBonusModal();
        }
    }

    function submitBonus() {
        var ta = $('epilogue-bonus-message');
        var btn = $('epilogue-bonus-submit');
        var err = $('epilogue-bonus-modal-error');
        var resBox = $('epilogue-bonus-modal-result');
        var passEl = $('epilogue-bonus-pass');
        var roundEl = $('epilogue-bonus-round');
        var reasonEl = $('epilogue-bonus-reason');
        var replyEl = $('epilogue-bonus-reply');
        var message = ta ? String(ta.value || '') : '';

        setError(err, '');
        if (btn) btn.disabled = true;

        fetch(level4ChatUrl(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                session_id: sessionIdForBonus(),
                message: message
            })
        })
            .then(function (res) {
                return res.json().then(function (data) {
                    return { ok: res.ok, status: res.status, data: data };
                });
            })
            .then(function (out) {
                if (!out.ok) {
                    var d = out.data && out.data.detail;
                    throw new Error(formatApiDetail(d) || 'HTTP ' + out.status);
                }
                var data = out.data || {};
                if (resBox) resBox.hidden = false;
                if (passEl) {
                    passEl.textContent = data.passed ? '已通关' : '未通关';
                    passEl.className = data.passed ? 'epilogue-bonus-pass-passed' : 'epilogue-bonus-pass-fail';
                }
                if (roundEl) {
                    roundEl.textContent = data.round != null ? String(data.round) : '—';
                }
                if (reasonEl) {
                    reasonEl.textContent = data.pass_reason || (data.passed ? '—' : '未满足通关条件');
                }
                if (replyEl) {
                    replyEl.textContent = data.reply != null ? String(data.reply) : '';
                }
            })
            .catch(function (e) {
                var msg = e && e.message ? e.message : String(e);
                setError(err, '请求失败：' + msg);
            })
            .finally(function () {
                if (btn) btn.disabled = false;
            });
    }

    function wire() {
        if (wired) return;
        wired = true;

        var tryBtn = $('epilogue-bonus-try-btn');
        if (tryBtn) {
            tryBtn.addEventListener('click', function () {
                openBonusModal();
            });
        }

        var closeBtn = $('epilogue-bonus-modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', function () {
                closeBonusModal();
            });
        }

        var dismiss = document.querySelector('[data-bonus-modal-dismiss]');
        if (dismiss) {
            dismiss.addEventListener('click', function () {
                closeBonusModal();
            });
        }

        var submitBtn = $('epilogue-bonus-submit');
        if (submitBtn) {
            submitBtn.addEventListener('click', function () {
                submitBonus();
            });
        }

        var ta = $('epilogue-bonus-message');
        if (ta) {
            ta.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    submitBonus();
                }
            });
        }

        var panel = document.querySelector('.epilogue-bonus-modal-panel');
        if (panel) {
            panel.addEventListener('click', function (e) {
                e.stopPropagation();
            });
        }
    }

    window.initEpilogueBonusInvite = function initEpilogueBonusInvite() {
        wire();
        if (inviteRevealScheduled) return;
        inviteRevealScheduled = true;
        showInvite();
    };
})();
