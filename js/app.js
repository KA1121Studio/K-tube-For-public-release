// js/app.js
// メインアプリケーション（ルーティング・初期化）

let observerMap = new Map();
let commentsPageToken = {};

// 現在のページをレンダリングするメイン関数
function renderByHash() {
    const hash = location.hash.slice(1);
    
    // watchページ用のクラスをリセット
    document.body.classList.remove('watch-page');

    if (!hash) {
        renderHome();
    } else {
        const [key, value] = hash.split('=');
        
        switch (key) {
            case 'watch':
                renderWatch(value);
                document.body.classList.add('watch-page');
                break;
                
            case 'channel':
                renderChannel(value);
                break;
                
            case 'search':
                const query = decodeURIComponent(value || '');
                document.getElementById('searchInput').value = query;
                performSearch(query);
                break;
                
            case 'games':
                renderGames();
                break;
                
            case 'tools':
                renderTools();
                break;
                
            case 'history':
                renderHistory();
                break;
                
            case 'settings':
                renderSettings();
                break;
                
            case 'about':
                renderAbout();
                break;
                
            case 'contact':
                renderContact();
                break;
                
            case 'playgame':
                const gameUrl = decodeURIComponent(value || '');
                renderGamePlay({ embedUrl: gameUrl, title: "ゲームプレイ中" });
                break;
                
            case 'playtool':
                const toolUrl = decodeURIComponent(value || '');
                renderToolPlay({ embedUrl: toolUrl, title: "ツール実行中" });
                break;
                
            default:
                renderHome();
        }
    }

    updateSidebarActive();
}

// ページ読み込み時の初期化
function initApp() {
    // ダークモードの復元
    const isDark = localStorage.getItem('darkMode') === 'true';
    document.body.classList.toggle('dark-mode', isDark);

    // ハッシュ変更を監視
    window.addEventListener('hashchange', renderByHash);

    // 検索バーのEnterキー対応
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const q = searchInput.value.trim();
                if (q) {
                    location.hash = `search=${encodeURIComponent(q)}`;
                } else {
                    location.hash = '';
                }
            }
        });
    }

    // ホームボタン
    const homeBtn = document.getElementById('homeBtn');
    if (homeBtn) {
        homeBtn.addEventListener('click', () => {
            location.hash = '';
        });
    }

    // 初回レンダリング
    renderByHash();
}

// ページロード完了時に実行
window.addEventListener('load', () => {
    initApp();
    
    // ページオープン時にアクセス数を+1（統計用）
    fetch('/fake-views?times=1')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
            if (data) console.log('アクセス数 +1 完了', data);
        })
        .catch(() => {});
});

// 他のファイルで使用できるようにグローバル公開
window.app = {
    renderByHash,
    initApp,
    observerMap,
    commentsPageToken
};
