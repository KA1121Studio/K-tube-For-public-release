// js/settings.js
// 設定画面

function renderSettings() {
    const app = document.getElementById('app');
    if (!app) return;

    // 現在の設定を読み込み
    const settings = {
        darkMode: localStorage.getItem('darkMode') === 'true',
        autoPlay: localStorage.getItem('autoPlay') !== 'false',
        defaultPlayer: localStorage.getItem('defaultPlayer') || 'official',
        defaultRegion: localStorage.getItem('defaultRegion') || 'JP',
        commentSort: localStorage.getItem('commentSort') || 'top',
        notifications: localStorage.getItem('notifications') === 'true',
        playlistEnabled: localStorage.getItem('playlistEnabled') !== 'false'
    };

    app.innerHTML = `
        <section style="max-width:800px; margin:0 auto; padding:24px 16px;">
            <h1 style="font-size:28px; font-weight:700; margin:0 0 32px; color:#0f0f0f;">設定</h1>

            <!-- 外観 -->
            <div class="setting-group">
                <h2>外観</h2>
                <label class="setting-label">
                    <input type="checkbox" id="darkModeToggle" ${settings.darkMode ? 'checked' : ''}>
                    ダークモードを有効にする
                </label>
            </div>

            <!-- 再生設定 -->
            <div class="setting-group">
                <h2>再生</h2>
                <label class="setting-label">
                    <input type="checkbox" id="autoPlayToggle" ${settings.autoPlay ? 'checked' : ''}>
                    自動再生を有効にする
                </label>
                
                <div style="margin:20px 0 10px;">
                    <label>デフォルト再生方法</label>
                    <select id="defaultPlayerSelect" style="width:100%; padding:10px; margin-top:8px; border-radius:8px;">
                        <option value="official" ${settings.defaultPlayer === 'official' ? 'selected' : ''}>公式プレイヤー（YouTube埋め込み）</option>
                        <option value="api2-original1" ${settings.defaultPlayer === 'api2-original1' ? 'selected' : ''}>API2・オリジナル1（高画質）</option>
                        <option value="api2-original2" ${settings.defaultPlayer === 'api2-original2' ? 'selected' : ''}>API2・オリジナル2（360p音声込み）</option>
                    </select>
                </div>
            </div>

            <!-- 検索・地域 -->
            <div class="setting-group">
                <h2>検索・地域</h2>
                <label>デフォルト地域</label>
                <select id="defaultRegionSelect" style="width:100%; padding:10px; margin-top:8px; border-radius:8px;">
                    <option value="JP" ${settings.defaultRegion === 'JP' ? 'selected' : ''}>日本</option>
                    <option value="Global" ${settings.defaultRegion === 'Global' ? 'selected' : ''}>全世界</option>
                    <option value="US" ${settings.defaultRegion === 'US' ? 'selected' : ''}>アメリカ</option>
                </select>
            </div>

            <!-- コメント -->
            <div class="setting-group">
                <h2>コメント</h2>
                <label>デフォルト表示順</label>
                <select id="commentSortSelect" style="width:100%; padding:10px; margin-top:8px; border-radius:8px;">
                    <option value="top" ${settings.commentSort === 'top' ? 'selected' : ''}>トップコメント</option>
                    <option value="new" ${settings.commentSort === 'new' ? 'selected' : ''}>新着順</option>
                </select>
            </div>

            <!-- 通知 -->
            <div class="setting-group">
                <h2>通知</h2>
                <label class="setting-label">
                    <input type="checkbox" id="notificationsToggle" ${settings.notifications ? 'checked' : ''}>
                    新着動画の通知を受け取る
                </label>
            </div>

            <!-- データ管理 -->
            <div class="setting-group">
                <h2>データ管理</h2>
                <button id="clearHistoryBtn" class="danger-btn">すべての再生履歴を削除</button>
                <button id="clearCacheBtn" class="danger-btn" style="margin-top:12px;">すべての設定とデータをリセット</button>
            </div>

            <!-- バージョン情報 -->
            <div style="text-align:center; margin:60px 0 20px; color:#606060; font-size:14px;">
                K-tube バージョン 1.32<br>
                © 2025-2026 K-tube
            </div>
        </section>
    `;

    // イベントリスナーを設定
    setupSettingsListeners();
}

// 設定画面の各種イベントを設定
function setupSettingsListeners() {
    // ダークモード
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', (e) => {
            const enabled = e.target.checked;
            localStorage.setItem('darkMode', enabled);
            document.body.classList.toggle('dark-mode', enabled);
        });
    }

    // 自動再生
    const autoPlayToggle = document.getElementById('autoPlayToggle');
    if (autoPlayToggle) {
        autoPlayToggle.addEventListener('change', (e) => {
            localStorage.setItem('autoPlay', e.target.checked);
        });
    }

    // デフォルトプレイヤー
    const defaultPlayerSelect = document.getElementById('defaultPlayerSelect');
    if (defaultPlayerSelect) {
        defaultPlayerSelect.addEventListener('change', (e) => {
            localStorage.setItem('defaultPlayer', e.target.value);
            alert('デフォルト再生方法を変更しました。次に開く動画から適用されます。');
        });
    }

    // デフォルト地域
    const defaultRegionSelect = document.getElementById('defaultRegionSelect');
    if (defaultRegionSelect) {
        defaultRegionSelect.addEventListener('change', (e) => {
            localStorage.setItem('defaultRegion', e.target.value);
        });
    }

    // コメントソート
    const commentSortSelect = document.getElementById('commentSortSelect');
    if (commentSortSelect) {
        commentSortSelect.addEventListener('change', (e) => {
            localStorage.setItem('commentSort', e.target.value);
        });
    }

    // 通知
    const notificationsToggle = document.getElementById('notificationsToggle');
    if (notificationsToggle) {
        notificationsToggle.addEventListener('change', async (e) => {
            const enabled = e.target.checked;
            if (enabled && Notification.permission === 'default') {
                await Notification.requestPermission();
            }
            localStorage.setItem('notifications', enabled);
        });
    }

    // 履歴全削除
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', () => {
            if (confirm('すべての再生履歴を削除しますか？この操作は元に戻せません。')) {
                clearHistory();
                alert('履歴をすべて削除しました');
            }
        });
    }

    // 全データリセット
    const clearCacheBtn = document.getElementById('clearCacheBtn');
    if (clearCacheBtn) {
        clearCacheBtn.addEventListener('click', () => {
            if (confirm('すべての設定・履歴・データを削除しますか？アプリが再読み込みされます。')) {
                localStorage.clear();
                location.reload();
            }
        });
    }
}

// グローバル公開
window.settings = {
    renderSettings
};
