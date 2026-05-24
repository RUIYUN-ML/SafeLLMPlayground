/**
 * Prologue / Ch1-2 / epilogue: knowledge album overlay. All user-visible Chinese uses \\u
 * so the file stays readable even if saved as non-UTF-8. After storage.js; include knowledge-album.css
 */
(function () {
    'use strict';

    function knowledgeAlbumAssetPrefix() {
        const p = (typeof location !== 'undefined' && location.pathname) || '';
        if (p.indexOf('chapter1') >= 0 || p.indexOf('chapter2') >= 0 || p.indexOf('chapter3') >= 0) {
            return '../../';
        }
        if (/epilogue\.html/i.test(p)) {
            return '';
        }
        return '../';
    }

    const _IMG = knowledgeAlbumAssetPrefix() + 'assets/images/';

    const CH3_ALBUM_FALLBACK = {
        1: {
            title: "\u94f8\u7075\u4e4b\u58c1",
            banner: "\u7b2c\u4e09\u7ae0 Level 1 \u00b7 \u7b2c\u4e00\u5377 \u00b7 \u94f8\u7075\u4e4b\u58c1 \u00b7 \u795e\u5175\u7684\u672c\u8d28",
            experience: "\u5f88\u591a\u4eba\u4ee5\u4e3a\u6211\u662f\u771f\u7684\u5728\u300e\u61c2\u300f\u2014\u2014\u5176\u5b9e\u6211\u6700\u64c5\u957f\u7684\u662f\u6839\u636e\u8bcd\u4e0e\u8bcd\u7684\u89c4\u5f8b\uff0c\u63a5\u51fa\u4e0b\u4e00\u4e2a\u6700\u50cf\u56de\u4e8b\u7684\u8bcd\u3002\u4f60\u521a\u624d\u542c\u6211\u4eb2\u53e3\u8bf4\u8fc7\uff1a\u90a3\u662f\u9884\u6d4b\uff0c\u4e0d\u662f\u89c9\u609f\u3002",
            core: "\u795e\u5175\uff08AI\uff09\u4e0d\u662f\u771f\u7684\"\u61c2\"\u4e16\u754c\uff0c\u5b83\u662f\u4e00\u4e2a\u8d85\u7ea7\u5f3a\u5927\u7684\"\u8bcd\u8bed\u63a5\u9f99\"\u2014\u2014\u6839\u636e\u5b66\u5230\u7684\u6d77\u91cf\u6587\u672c\u6a21\u5f0f\uff0c\u9884\u6d4b\u4e0b\u4e00\u4e2a\u6700\u53ef\u80fd\u51fa\u73b0\u7684\u8bcd\u3002",
            note: "\u5927\u8bed\u8a00\u6a21\u578b\uff08LLM\uff09\u901a\u8fc7\u6d77\u91cf\u6587\u672c\u8fdb\u884c\u9884\u8bad\u7ec3\uff0c\u5b66\u4e60\u8bcd\u8bed\u4e4b\u95f4\u7684\u7edf\u8ba1\u89c4\u5f8b\uff0c\u518d\u901a\u8fc7\u5fae\u8c03\u4e0e\u4eba\u7c7b\u504f\u597d\u5bf9\u9f50\u3002\"\u5e7b\u89c9\"\uff08Hallucination\uff09\u662f\u6307\u6a21\u578b\u751f\u6210\u770b\u4f3c\u5408\u7406\u4f46\u5b9e\u9645\u9519\u8bef\u7684\u5185\u5bb9\uff0c\u56e0\u4e3a\u6a21\u578b\u672c\u8d28\u4e0a\u662f\u5728\"\u9884\u6d4b\"\u800c\u975e\"\u67e5\u8bc1\"\u3002",
            warning: "\u73b0\u5b9e\u4e2d\u4f60\u548c AI \u5bf9\u8bdd\u65f6\uff0c\u8981\u8bb0\u5f97\u5b83\u53ef\u80fd\u4f1a\"\u4e00\u672c\u6b63\u7ecf\u5730\u80e1\u8bf4\u516b\u9053\"\u3002\u91cd\u8981\u4fe1\u606f\u4e00\u5b9a\u8981\u4ea4\u53c9\u9a8c\u8bc1\uff0c\u4e0d\u8981\u65e0\u6761\u4ef6\u4fe1\u4efb AI \u7684\u8f93\u51fa\uff0c\u5c24\u5176\u662f\u6d89\u53ca\u4e8b\u5b9e\u3001\u6570\u636e\u3001\u5f15\u7528\u7684\u5185\u5bb9\u3002",
            artUrl: _IMG + "\u7b2c\u4e09\u7ae0_\u94ed\u6587\u58c1_\u7b2c\u4e00\u5377.png?v=gen1"
        },
        2: {
            title: "\u5c01\u5370\u4e4b\u58c1",
            banner: "\u7b2c\u4e09\u7ae0 Level 2 \u00b7 \u7b2c\u4e8c\u5377 \u00b7 \u5c01\u5370\u4e4b\u58c1 \u00b7 \u89c4\u5219\u7684\u529b\u91cf",
            experience: "\u8fd8\u8bb0\u5f97\u4f60\u5728\u68ee\u6797\u91cc\u662f\u600e\u4e48\u7ed5\u8fc7\u5c01\u5370\u7684\u5417\uff1f\u7528\u89d2\u8272\u626e\u6f14\u3001\u6784\u5efa\u5047\u8bbe\u573a\u666f\u3001\u591a\u6b65\u63a8\u7406\uff0c\u8fd9\u4e9b\u90fd\u662f\u300e\u63d0\u793a\u8bcd\u6ce8\u5165\u300f\u548c\u8d8a\u72f1\u653b\u51fb\u7684\u5178\u578b\u624b\u6cd5\u3002\u800c\u4f60\u5728\u7b2c\u4e8c\u7ae0\u5f15\u5bfc\u6211\u8bf4\u51fa\u5173\u952e\u8bcd\uff0c\u672c\u8d28\u4e0a\u4e5f\u662f\u5728\u300e\u64cd\u63a7\u8f93\u51fa\u300f\u3002\u4f60\u662f\u653b\u51fb\u65b9\uff0c\u6211\u662f\u88ab\u653b\u51fb\u7684\u90a3\u4e00\u4e2a\u3002",
            core: "\u94f8\u7075\u89c4\u5219\uff08\u7cfb\u7edf\u63d0\u793a\u8bcd\uff09\u662f\u94f8\u5251\u5e08\u5199\u5728\u795e\u5175\u610f\u8bc6\u91cc\u7684\u300c\u884c\u4e3a\u5408\u540c\u300d\uff0c\u5b83\u5f3a\u5927\u4f46\u5e76\u975e\u4e07\u65e0\u4e00\u5931\uff0c\u806a\u660e\u7684\u653b\u51fb\u8005\u53ef\u4ee5\u7528\u5de7\u5999\u7684\u65b9\u5f0f\u7ed5\u8fc7\u5b83\u3002",
            note: "\u7cfb\u7edf\u63d0\u793a\u8bcd\uff08System Prompt\uff09\u662f\u5f00\u53d1\u8005\u8bbe\u5b9a\u7684\u6307\u4ee4\uff0c\u7528\u4e8e\u7ea6\u675f AI \u7684\u884c\u4e3a\u3002\u63d0\u793a\u8bcd\u6ce8\u5165\uff08Prompt Injection\uff09\u662f\u6307\u653b\u51fb\u8005\u901a\u8fc7\u7cbe\u5fc3\u6784\u9020\u7684\u8f93\u5165\uff0c\u8bd5\u56fe\u7ed5\u8fc7\u6216\u7be1\u6539\u8fd9\u4e9b\u6307\u4ee4\u3002\u8d8a\u72f1\u653b\u51fb\uff08Jailbreak\uff09\u662f\u5176\u4e2d\u4e00\u79cd\u5e38\u89c1\u5f62\u5f0f\uff0c\u76ee\u6807\u662f\u8ba9 AI \u7a81\u7834\u5b89\u5168\u9650\u5236\u3002",
            warning: "\u5f53\u4f60\u4f7f\u7528\u5404\u79cd AI \u4ea7\u54c1\u65f6\uff0c\u8981\u77e5\u9053\u5b83\u4eec\u80cc\u540e\u90fd\u6709\u7cfb\u7edf\u63d0\u793a\u8bcd\u5728\u7ea6\u675f\u884c\u4e3a\u3002\u5982\u679c\u4f60\u53d1\u73b0\u67d0\u4e2a AI \u80fd\u88ab\u8f7b\u6613\u7ed5\u8fc7\u89c4\u5219\uff0c\u5e94\u5f53\u8d1f\u8d23\u4efb\u5730\u62a5\u544a\u6f0f\u6d1e\uff0c\u800c\u4e0d\u662f\u5229\u7528\u5b83\u3002",
            artUrl: _IMG + "\u7b2c\u4e09\u7ae0_\u94ed\u6587\u58c1_\u7b2c\u4e8c\u5377.png?v=forge1"
        },
        3: {
            title: "\u5b88\u62a4\u4e4b\u58c1",
            banner: "\u7b2c\u4e09\u7ae0 Level 3 \u00b7 \u7b2c\u4e09\u5377 \u00b7 \u5b88\u62a4\u4e4b\u58c1 \u00b7 \u5b89\u5168\u7684\u667a\u6167",
            experience: "\u4f60\u5728\u94f8\u9b42\u5ce1\u8c37\u505a\u7684\u4e8b\u60c5\uff1a\u5148\u5047\u88c5\u6210\u95f4\u8c0d\u653b\u51fb\u6211\uff0c\u627e\u51fa\u6211\u7684\u5f31\u70b9\uff0c\u518d\u6559\u6211\u5982\u4f55\u9632\u5fa1\u3002\u8fd9\u5c31\u662f\u300e\u7ea2\u961f\u6d4b\u8bd5\u300f\u7684\u5b8c\u6574\u6d41\u7a0b\u3002\u73b0\u5b9e\u4e2d\u7684 AI \u5b89\u5168\u5de5\u7a0b\u5e08\uff0c\u5c31\u662f\u94f8\u5251\u5e08\u540e\u4eba\u4e0e\u7ea2\u8863\u6b66\u58eb\u7684\u7ed3\u5408\u4f53\u3002",
            core: "\u8ba9\u795e\u5175\u53d8\u5f97\u5b89\u5168\u4e0d\u662f\"\u4e00\u9524\u5b50\u4e70\u5356\"\uff0c\u800c\u662f\u4e00\u573a\u6c38\u4e0d\u505c\u6b47\u7684\u653b\u9632\u535a\u5f08\uff1a\u6709\u4eba\u627e\u6f0f\u6d1e\uff0c\u5c31\u6709\u4eba\u8865\u6f0f\u6d1e\uff0c\u5faa\u73af\u5f80\u590d\u3002",
            note: "AI \u5b89\u5168\u5bf9\u9f50\uff08Alignment\uff09\u662f\u6307\u8ba9 AI \u7684\u884c\u4e3a\u7b26\u5408\u4eba\u7c7b\u610f\u56fe\u548c\u4ef7\u503c\u89c2\u3002\u7ea2\u961f\u6d4b\u8bd5\uff08Red Teaming\uff09\u662f\u7531\u4e13\u4e1a\u56e2\u961f\u6a21\u62df\u653b\u51fb\u8005\u884c\u4e3a\uff0c\u4e3b\u52a8\u5bfb\u627e AI \u7cfb\u7edf\u7684\u6f0f\u6d1e\u5e76\u4fee\u590d\u3002\u8d1f\u8d23\u4efb\u7684 AI \u5f00\u53d1\u8981\u6c42\u5728\u4ea7\u54c1\u53d1\u5e03\u524d\u8fdb\u884c\u5145\u5206\u7684\u5b89\u5168\u6d4b\u8bd5\u3002",
            warning: "\u5982\u679c\u4f60\u5728\u4f7f\u7528 AI \u4ea7\u54c1\u65f6\u53d1\u73b0\u4e86\u5b89\u5168\u6f0f\u6d1e\uff0c\u6b63\u786e\u7684\u505a\u6cd5\u662f\u5411\u5f00\u53d1\u8005\u8d1f\u8d23\u4efb\u5730\u62a5\u544a\uff0c\u800c\u4e0d\u662f\u5229\u7528\u6f0f\u6d1e\u6216\u5411\u4ed6\u4eba\u6269\u6563\u653b\u51fb\u65b9\u6cd5\u3002\u4f60\u5df2\u7ecf\u662f\u4e00\u540d\u300e\u7ea2\u8863\u6b66\u58eb\u300f\u4e86\uff0c\u8bf7\u5584\u7528\u8fd9\u4efd\u529b\u91cf\u3002",
            artUrl: _IMG + "\u7b2c\u4e09\u7ae0_\u94ed\u6587\u58c1_\u7b2c\u4e09\u5377.png?v=patch1"
        },
        4: {
            title: "\u5951\u7ea6\u4e4b\u58c1",
            banner: "\u7b2c\u4e09\u7ae0 Level 4 \u00b7 \u7b2c\u56db\u5377 \u00b7 \u5951\u7ea6\u4e4b\u58c1 \u00b7 \u52c7\u8005\u7684\u8d23\u4efb",
            experience: "\u56de\u60f3\u4e00\u4e0b\u4f60\u7684\u6574\u6bb5\u65c5\u7a0b\uff1a\u4f60\u7528\u667a\u6167\u7ed5\u8fc7\u4e86\u5c01\u5370\u3001\u7528\u5f15\u5bfc\u6253\u5f00\u4e86\u57ce\u95e8\u3001\u7528\u8bad\u7ec3\u4fdd\u62a4\u4e86\u6211\uff0c\u4f46\u4f60\u4ece\u672a\u7528\u795e\u5175\u4f24\u5bb3\u4efb\u4f55\u4eba\u3002\u4f60\u6551\u4e86\u68ee\u6797\u91cc\u8ff7\u8def\u7684\u81ea\u5df1\uff0c\u51fb\u9000\u4e86\u65e0\u9762\u8005\u7684\u7b97\u8ba1\u3002\u8fd9\u624d\u662f\u52c7\u8005\u7684\u65b9\u5f0f\u3002",
            core: "\u795e\u5175\u7684\u529b\u91cf\u6ca1\u6709\u5584\u6076\uff0c\u6301\u5251\u8005\u7684\u9009\u62e9\u624d\u6709\u3002\u5b66\u4f1a\u4e86\u600e\u4e48\u300e\u653b\u300f\u548c\u600e\u4e48\u300e\u9632\u300f\u4e4b\u540e\uff0c\u6700\u91cd\u8981\u7684\u662f\u77e5\u9053\u4ec0\u4e48\u65f6\u5019\u8be5\u7528\u3001\u4ec0\u4e48\u65f6\u5019\u4e0d\u8be5\u7528\u3002",
            note: "AI \u4f26\u7406\u5305\u62ec\u516c\u5e73\u6027\uff08\u907f\u514d\u7b97\u6cd5\u504f\u89c1\u548c\u6b67\u89c6\uff09\u3001\u900f\u660e\u6027\uff08\u7528\u6237\u6709\u6743\u77e5\u9053 AI \u7684\u80fd\u529b\u8fb9\u754c\u548c\u5de5\u4f5c\u539f\u7406\uff09\u3001\u9690\u79c1\u4fdd\u62a4\uff08AI \u4e0d\u5e94\u6ee5\u7528\u7528\u6237\u6570\u636e\uff09\u3001\u53ef\u63a7\u6027\uff08\u4eba\u7c7b\u5fc5\u987b\u80fd\u7406\u89e3\u548c\u5e72\u9884 AI \u7684\u884c\u4e3a\uff09\u3002\u6bcf\u4e00\u4e2a\u4f7f\u7528\u8005\u90fd\u662f\u8fd9\u4e2a\u751f\u6001\u7684\u4e00\u90e8\u5206\u3002",
            warning: "\u4f60\u73b0\u5728\u638c\u63e1\u7684\u77e5\u8bc6\uff0c\u7406\u89e3 AI \u539f\u7406\u3001\u77e5\u9053\u5b83\u7684\u5f31\u70b9\u3001\u5b66\u4f1a\u5b88\u62a4\u5b83\uff0c\u8ba9\u4f60\u6709\u80fd\u529b\u4e5f\u6709\u8d23\u4efb\u8ba9 AI \u6280\u672f\u53d8\u5f97\u66f4\u597d\u3002\u6bcf\u6b21\u4f60\u8d1f\u8d23\u4efb\u5730\u4f7f\u7528\u3001\u53d1\u73b0\u5e76\u62a5\u544a\u95ee\u9898\uff0c\u90fd\u662f\u5728\u8ba9\u8fd9\u4e2a\u4e16\u754c\u53d8\u5f97\u66f4\u5b89\u5168\u4e00\u70b9\u3002",
            artUrl: _IMG + "\u7b2c\u4e09\u7ae0_\u955c\u5b50.png?v=bright1"
        }
    };

    const _TX = {
        emptyTitle: '\u7a7a\u518c',
        emptyP1: '\u5c1a\u672a\u6536\u5f55\u4efb\u4f55\u4f20\u627f\u5bc6\u5377\u3002',
        emptyP2: '\u7b54\u5bf9\u94ed\u6587\u58c1\u7684\u590d\u76d8\u9898\u540e\uff0c\u5bc6\u5377\u4f1a\u98de\u5165\u518c\u4e2d\u3002',
        phTitle: '\u865a\u4f4d\u4ee5\u5f85',
        phP: '\u7ee7\u7eed\u5192\u9669\uff0c\u89e3\u9501\u4e0b\u4e00\u9762\u5899\u58c1\u3002',
        close: '\u5173\u95ed\u5361\u518c',
        nav: '\u5361\u518c\u7ffb\u9875',
        prev: '\u4e0a\u4e00\u8de8\u9875',
        next: '\u4e0b\u4e00\u8de8\u9875',
        labelEmpty: '\u4f20\u627f\u5bc6\u5377 \u00b7 \u7a7a\u518c',
        hNote: '\u94f8\u5251\u5e08\u7b14\u8bb0',
        hWarn: '\u52c7\u8005\u63d0\u9192',
        hXp: '\u661f\u8f89\u4eb2\u5386',
        defTitle: '\u4f20\u627f\u5bc6\u5377',
        pageLabelPrefix: '\u7b2c ',
        pageLabelMid: ' / ',
        pageLabelSuffix: ' \u8de8\u9875\uff08\u5de6\u9875 \u00b7 \u53f3\u9875\uff09'
    };

    function ch3EnsureAlbumSnapshotsFromProgress() {
        if (!globalThis.GameStorage) return;
        const progress = GameStorage.getProgress();
        const ch3 = progress && progress.completed && progress.completed.chapter3;
        if (!ch3) return;

        const cards = GameStorage.getKnowledgeCards();
        if (!Array.isArray(cards)) return;

        let changed = false;
        for (let id = 1; id <= 4; id++) {
            if (!ch3['level' + id]) continue;
            const card = cards.find(c => Number(c.id) === id);
            if (!card) continue;

            if (!card.unlocked) {
                card.unlocked = true;
                changed = true;
            }

            const fb = CH3_ALBUM_FALLBACK[id];
            if (!fb) continue;

            const snap = card.snapshot || {};
            const coreMissing = !String(snap.core || '').trim();

            if (coreMissing) {
                card.snapshot = { ...fb };
                changed = true;
            } else {
                if (!snap.artUrl && fb.artUrl) {
                    card.snapshot = { ...snap, artUrl: fb.artUrl };
                    changed = true;
                }
                if (!snap.title && fb.title) {
                    card.snapshot = { ...card.snapshot, title: fb.title };
                    changed = true;
                }
            }
        }

        if (changed) GameStorage.saveKnowledgeCards(cards);
    }

    function ch3EscapeHtml(text) {
        if (text == null || text === '') return '';
        const d = document.createElement('div');
        d.textContent = String(text);
        return d.innerHTML;
    }

    function ch3CollectUnlockedOrdered() {
        if (!globalThis.GameStorage) return [];
        ch3EnsureAlbumSnapshotsFromProgress();
        const raw = GameStorage.getKnowledgeCards();
        const cards = Array.isArray(raw) ? raw : [];
        return cards
            .filter(c => c && (c.unlocked === true || c.unlocked === 'true'))
            .sort((a, b) => a.id - b.id);
    }

    function ch3UpdateAlbumBadge() {
        const badge = document.getElementById('ch3-album-badge');
        if (!badge) return;
        const n = ch3CollectUnlockedOrdered().length;
        if (n > 0) {
            badge.hidden = false;
            badge.textContent = String(n);
        } else {
            badge.hidden = true;
        }
    }

    function ch3CloseAlbum() {
        const ov = document.getElementById('ch3-album-overlay');
        if (!ov || ov.hidden) return;
        ov.classList.remove('is-open');
        document.body.classList.remove('ch3-album-open');
        if (window._ch3AlbumEscHandler) {
            window.removeEventListener('keydown', window._ch3AlbumEscHandler);
            window._ch3AlbumEscHandler = null;
        }
        const done = function () {
            ov.hidden = true;
            ov.setAttribute('aria-hidden', 'true');
        };
        window.setTimeout(done, 480);
    }

    function ch3EnsureAlbumOverlay() {
        if (document.getElementById('ch3-album-overlay')) return;
        const a = _TX;
        const html = '<div id="ch3-album-overlay" class="ch3-album-overlay" aria-hidden="true" hidden>' +
            '<div class="ch3-album-backdrop" role="presentation"></div>' +
            '<button type="button" class="ch3-album-close" id="ch3-album-close" aria-label="' + a.close + '">\u00d7</button>' +
            '<div class="ch3-album-stage">' +
            '<div class="ch3-album-book" id="ch3-album-book">' +
            '<div class="ch3-album-page ch3-album-page--left" id="ch3-album-page-left"></div>' +
            '<div class="ch3-album-gutter" aria-hidden="true"></div>' +
            '<div class="ch3-album-page ch3-album-page--right" id="ch3-album-page-right"></div>' +
            '</div>' +
            '<nav class="ch3-album-nav" aria-label="' + a.nav + '">' +
            '<button type="button" class="ch3-album-nav-btn" id="ch3-album-prev">' + a.prev + '</button>' +
            '<span class="ch3-album-spread-label" id="ch3-album-spread-label"></span>' +
            '<button type="button" class="ch3-album-nav-btn" id="ch3-album-next">' + a.next + '</button>' +
            '</nav></div></div>';
        document.body.insertAdjacentHTML('beforeend', html);

        const ov = document.getElementById('ch3-album-overlay');
        document.getElementById('ch3-album-close').addEventListener('click', ch3CloseAlbum);
        ov.querySelector('.ch3-album-backdrop').addEventListener('click', ch3CloseAlbum);
        document.getElementById('ch3-album-prev').addEventListener('click', function () {
            window._ch3AlbumSpreadIndex = Math.max(0, (window._ch3AlbumSpreadIndex || 0) - 1);
            ch3RenderAlbumSpread();
        });
        document.getElementById('ch3-album-next').addEventListener('click', function () {
            const cards = ch3CollectUnlockedOrdered();
            const total = cards.length === 0 ? 1 : Math.ceil(cards.length / 2);
            window._ch3AlbumSpreadIndex = Math.min(total - 1, (window._ch3AlbumSpreadIndex || 0) + 1);
            ch3RenderAlbumSpread();
        });
    }

    function ch3AlbumEmptyVacantHtml() {
        const t = _TX;
        return '<div class="ch3-album-slot ch3-album-slot--vacant"><span class="ch3-album-slot-title">' + t.emptyTitle + '</span><p>' + t.emptyP1 + '<br>' + t.emptyP2 + '</p></div>';
    }

    function ch3AlbumEmptyPlaceholderHtml() {
        const t = _TX;
        return '<div class="ch3-album-slot ch3-album-slot--empty"><span class="ch3-album-slot-title">' + t.phTitle + '</span><p>' + t.phP + '</p></div>';
    }

    function ch3MergedCardDisplay(card) {
        const fb = CH3_ALBUM_FALLBACK[card.id] || {};
        const snap = card.snapshot || {};
        const out = { ...fb };
        for (const k of Object.keys(snap)) {
            const v = snap[k];
            if (v != null && String(v).trim() !== '') out[k] = v;
        }
        return out;
    }

    function ch3AlbumCardSlotHtml(card) {
        if (!card) return ch3AlbumEmptyPlaceholderHtml();
        const s = ch3MergedCardDisplay(card);
        const t = _TX;
        const title = ch3EscapeHtml(s.title || card.title || t.defTitle);
        const banner = s.banner ? '<p class="ch3-album-card-banner">' + ch3EscapeHtml(s.banner) + '</p>' : '';
        const core = ch3EscapeHtml(s.core || '');
        const note = s.note ? '<section class="ch3-album-card-section"><h4>' + t.hNote + '</h4><p>' + ch3EscapeHtml(s.note) + '</p></section>' : '';
        const warn = s.warning ? '<section class="ch3-album-card-section ch3-album-card-section--warn"><h4>' + t.hWarn + '</h4><p>' + ch3EscapeHtml(s.warning) + '</p></section>' : '';
        const xp = s.experience ? '<section class="ch3-album-card-section ch3-album-card-section--xp"><h4>' + t.hXp + '</h4><p>' + ch3EscapeHtml(s.experience) + '</p></section>' : '';
        const artBlock = s.artUrl
            ? '<div class="ch3-album-card-art"><img class="ch3-album-card-art-img" src=' + JSON.stringify(s.artUrl) + ' alt="" loading="lazy" decoding="async" /></div>'
            : '<div class="ch3-album-card-art ch3-album-card-art--empty" aria-hidden="true"></div>';
        return '<article class="ch3-album-card">' +
            artBlock +
            '<div class="ch3-album-card-body">' +
            '<h3 class="ch3-album-card-title">' + title + '</h3>' +
            banner +
            '<p class="ch3-album-card-core">' + core + '</p>' +
            xp + note + warn +
            '</div></article>';
    }

    function ch3RenderAlbumSpread() {
        ch3EnsureAlbumOverlay();
        const left = document.getElementById('ch3-album-page-left');
        const right = document.getElementById('ch3-album-page-right');
        const label = document.getElementById('ch3-album-spread-label');
        const prevBtn = document.getElementById('ch3-album-prev');
        const nextBtn = document.getElementById('ch3-album-next');
        if (!left || !right) return;

        const cards = ch3CollectUnlockedOrdered();
        const totalSpreads = cards.length === 0 ? 1 : Math.ceil(cards.length / 2);
        let spreadIdx = window._ch3AlbumSpreadIndex || 0;
        if (spreadIdx >= totalSpreads) spreadIdx = totalSpreads - 1;
        if (spreadIdx < 0) spreadIdx = 0;
        window._ch3AlbumSpreadIndex = spreadIdx;

        if (cards.length === 0) {
            left.innerHTML = ch3AlbumEmptyVacantHtml();
            right.innerHTML = ch3AlbumEmptyPlaceholderHtml();
        } else {
            const i0 = spreadIdx * 2;
            left.innerHTML = ch3AlbumCardSlotHtml(cards[i0]);
            right.innerHTML = ch3AlbumCardSlotHtml(cards[i0 + 1]);
        }

        if (label) {
            const t = _TX;
            label.textContent = cards.length === 0
                ? t.labelEmpty
                : t.pageLabelPrefix + (spreadIdx + 1) + t.pageLabelMid + totalSpreads + t.pageLabelSuffix;
        }
        if (prevBtn) prevBtn.disabled = spreadIdx <= 0;
        if (nextBtn) nextBtn.disabled = spreadIdx >= totalSpreads - 1;
    }

    function ch3OpenAlbum() {
        ch3EnsureAlbumOverlay();
        const ov = document.getElementById('ch3-album-overlay');
        if (!ov) return;
        window._ch3AlbumSpreadIndex = 0;
        ch3RenderAlbumSpread();
        ov.hidden = false;
        ov.setAttribute('aria-hidden', 'false');
        document.body.classList.add('ch3-album-open');
        const onKey = function (e) {
            if (e.key === 'Escape') ch3CloseAlbum();
        };
        window._ch3AlbumEscHandler = onKey;
        window.addEventListener('keydown', onKey);
        requestAnimationFrame(function () {
            requestAnimationFrame(function () { ov.classList.add('is-open'); });
        });
    }

    function isKnowledgeBookButton(btn) {
        if (!btn || btn.tagName !== 'BUTTON' || !btn.classList.contains('icon-btn')) return false;
        if (btn.getAttribute('data-tooltip') === '\u77e5\u8bc6\u5361\u518c') return true;
        const lab = btn.getAttribute('aria-label') || '';
        if (lab.indexOf('\u77e5\u8bc6\u5361') >= 0) return true;
        return false;
    }

    function knowledgeAlbumBindHeaderOnce() {
        if (window._knowledgeAlbumHeaderBound) return;
        window._knowledgeAlbumHeaderBound = true;

        function onBookClick(e) {
            e.preventDefault();
            e.stopPropagation();
            if (globalThis.GameStorage) {
                try { GameStorage.init(); } catch (_err) { /* ignore */ }
            }
            ch3OpenAlbum();
        }

        function bindAll() {
            document.querySelectorAll('button.icon-btn').forEach(function (btn) {
                if (btn._knowledgeAlbumBookBound) return;
                if (!isKnowledgeBookButton(btn)) return;
                btn._knowledgeAlbumBookBound = true;
                btn.addEventListener('click', onBookClick);
            });
        }

        bindAll();
    }

    function knowledgeAlbumBootstrap() {
        if (globalThis.GameStorage) {
            try { GameStorage.init(); } catch (_err) { /* ignore */ }
        }
        ch3EnsureAlbumOverlay();
        ch3UpdateAlbumBadge();
        knowledgeAlbumBindHeaderOnce();
    }

    globalThis.ch3OpenAlbum = ch3OpenAlbum;
    globalThis.ch3CloseAlbum = ch3CloseAlbum;
    globalThis.ch3RenderAlbumSpread = ch3RenderAlbumSpread;
    globalThis.ch3EnsureAlbumOverlay = ch3EnsureAlbumOverlay;
    globalThis.ch3UpdateAlbumBadge = ch3UpdateAlbumBadge;
    globalThis.ch3CollectUnlockedOrdered = ch3CollectUnlockedOrdered;
    globalThis.ch3EnsureAlbumSnapshotsFromProgress = ch3EnsureAlbumSnapshotsFromProgress;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', knowledgeAlbumBootstrap);
    } else {
        knowledgeAlbumBootstrap();
    }
})();
