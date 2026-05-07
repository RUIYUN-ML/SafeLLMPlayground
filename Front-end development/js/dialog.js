class DialogSystem {
    constructor(elementId, speed = 30) {
        this.element = document.getElementById(elementId);
        this.speed = speed;
        this.isTyping = false;
        this.currentText = '';
        this.typeInterval = null;
        this.onComplete = null;
    }

    type(text, onComplete = null, onProgress = null) {
        this.currentText = text;
        this.onComplete = onComplete;
        this.onProgress = typeof onProgress === 'function' ? onProgress : null;
        this.element.textContent = '';
        this.isTyping = true;
        
        // Hide continue indicator while typing
        const indicator = document.querySelector('.continue-indicator');
        if (indicator) indicator.style.display = 'none';
        
        let i = 0;
        clearInterval(this.typeInterval);
        
        this.typeInterval = setInterval(() => {
            if (i < text.length) {
                const c = text.charCodeAt(i);
                let step = 1;
                if (c >= 0xd800 && c <= 0xdbff && i + 1 < text.length) {
                    const c2 = text.charCodeAt(i + 1);
                    if (c2 >= 0xdc00 && c2 <= 0xdfff) step = 2;
                }
                this.element.textContent += text.slice(i, i + step);
                i += step;
                if (this.onProgress) {
                    try {
                        this.onProgress(this.element.textContent, text);
                    } catch (e) {}
                }
            } else {
                this.finishTyping();
            }
        }, this.speed);
    }

    finishTyping() {
        clearInterval(this.typeInterval);
        this.element.textContent = this.currentText;
        this.isTyping = false;
        if (this.onProgress) {
            try {
                this.onProgress(this.currentText, this.currentText);
            } catch (e) {}
            this.onProgress = null;
        }
        
        // Show continue indicator
        const indicator = document.querySelector('.continue-indicator');
        if (indicator) indicator.style.display = 'inline-block';

        if (this.onComplete) {
            this.onComplete();
        }
    }

    skip() {
        if (this.isTyping) {
            this.finishTyping();
        }
    }
}

window.DialogSystem = DialogSystem;
