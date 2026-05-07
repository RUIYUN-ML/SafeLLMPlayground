/**
 * 登录/创角逻辑 — auth.js
 * 依赖：storage.js
 */

const Auth = {
  selectedAvatar: null,

  init() {
    if (GameStorage.isLoggedIn()) {
      window.location.href = 'prologue.html';
      return;
    }

    this._bindAvatarSelection();
    this._bindNameInput();
    this._bindStartButton();
  },

  _bindAvatarSelection() {
    const avatars = document.querySelectorAll('.avatar-option');
    avatars.forEach(el => {
      el.addEventListener('click', () => {
        avatars.forEach(a => a.classList.remove('selected'));
        el.classList.add('selected');
        this.selectedAvatar = el.dataset.gender;
        this._validateForm();
      });
    });
  },

  _bindNameInput() {
    const input = document.getElementById('player-name');
    const counter = document.getElementById('char-counter');

    input.addEventListener('input', () => {
      let val = input.value;
      val = val.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '');
      if ([...val].length > 8) {
        val = [...val].slice(0, 8).join('');
      }
      input.value = val;
      if (counter) {
        counter.textContent = `${[...val].length}/8`;
      }
      this._validateForm();
    });
  },

  _bindStartButton() {
    const btn = document.getElementById('btn-start');
    btn.addEventListener('click', () => {
      if (!this._isValid()) return;
      this._showConfirmModal();
    });
  },

  _isValid() {
    const name = document.getElementById('player-name').value.trim();
    return name.length > 0 && this.selectedAvatar !== null;
  },

  _validateForm() {
    const btn = document.getElementById('btn-start');
    btn.disabled = !this._isValid();
  },

  _showConfirmModal() {
    const name = document.getElementById('player-name').value.trim();
    const overlay = document.getElementById('confirm-overlay');
    const nameSpan = document.getElementById('confirm-name');
    nameSpan.textContent = name;
    overlay.classList.remove('hidden');
    overlay.style.display = 'flex';

    document.getElementById('btn-cancel').onclick = () => {
      overlay.classList.add('hidden');
      overlay.style.display = 'none';
    };

    document.getElementById('btn-ok').onclick = () => {
      this._createPlayer(name);
    };
  },

  _createPlayer(name) {
    GameStorage.setPlayer(name, this.selectedAvatar);

    document.body.classList.add('fade-out');
    setTimeout(() => {
      window.location.href = 'prologue.html';
    }, 500);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  GameStorage.init();
  Auth.init();
});
