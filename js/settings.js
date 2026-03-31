/* =========================
   Settings Page
========================= */

function renderSettings() {
  const app = document.getElementById('app');
  if (!app) return;

  const defaultPlayer = localStorage.getItem('defaultPlayer') || 'official';

  app.innerHTML = `
    <div class="settings-container" style="max-width:800px;margin:40px auto;padding:0 16px;">

      <h1 style="margin-bottom:24px;">設定</h1>

      <div class="setting-group" style="margin-bottom:32px;">
        <h2 style="font-size:18px;margin-bottom:12px;">デフォルトプレイヤー</h2>

        <select id="defaultPlayerSelect" style="padding:8px 12px;font-size:14px;">
          <option value="official" ${defaultPlayer === 'official' ? 'selected' : ''}>
            公式プレイヤー（YouTube埋め込み）
          </option>
          <option value="api1-original1" ${defaultPlayer === 'api1-original1' ? 'selected' : ''}>
            API1・オリジナル1（高画質）
          </option>
          <option value="api1-original2" ${defaultPlayer === 'api1-original2' ? 'selected' : ''}>
            API1・オリジナル2（音声込み）
          </option>
          <option value="api2-original1" ${defaultPlayer === 'api2-original1' ? 'selected' : ''}>
            API2・オリジナル1（yt-dlp 高画質）
          </option>
          <option value="api2-original2" ${defaultPlayer === 'api2-original2' ? 'selected' : ''}>
            API2・オリジナル2（yt-dlp 音声込み）
          </option>
        </select>

        <div style="margin-top:12px;color:#606060;font-size:14px;">
          再生ページを開いたときに自動で選択されるプレイヤーです。
        </div>
      </div>

      <div class="setting-group" style="margin-bottom:32px;">
        <h2 style="font-size:18px;margin-bottom:12px;">履歴</h2>
        <button id="clearHistoryBtn"
                style="padding:8px 16px;background:#c00;color:#fff;border:none;border-radius:4px;cursor:pointer;">
          再生履歴を削除
        </button>
      </div>

    </div>
  `;

  const playerSelect = document.getElementById('defaultPlayerSelect');
  if (playerSelect) {
    playerSelect.addEventListener('change', () => {
      localStorage.setItem('defaultPlayer', playerSelect.value);
    });
  }

  const clearBtn = document.getElementById('clearHistoryBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (confirm('再生履歴をすべて削除しますか？')) {
        localStorage.removeItem('watchHistory');
        alert('再生履歴を削除しました');
      }
    });
  }
}
