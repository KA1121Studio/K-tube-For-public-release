// js/app.js
// メインルーティングとアプリ初期化（元の renderByHash を中心に再構成）

let observerMap = new Map();
let commentsPageToken = {};

// ハッシュに基づいてページをレンダリングするメイン関数
function renderByHash() {
    const h = location.hash.slice(1);
    
    // watchページ用のクラスをリセット
    document.body.classList.remove('watch-page');

    if (!h) {
        renderHome();
    } else {
        const [k, v] = h.split('=');

        if (k === 'watch') {
            renderWatch(v);
            document.body.classList.add('watch-page');
        } 
        else if (k === 'channel') {
            renderChannel(v);
        } 
        else if (k === 'search') {
            const query = decodeURIComponent(v || '');
            document.getElementById('searchInput').value = query;
            performSearch(query);
        } 
        else if (k === 'games') {
            renderGames();
        } 
        else if (k === 'tools') {
            renderTools();
        } 
        else if (k === 'history') {
            renderHistory();
        } 
        else if (k === 'settings') {
            renderSettings();
        } 
        else if (k === 'about') {
            renderAbout();
        } 
        else if (k === 'contact') {
            renderContact();
        } 
        else if (k === 'playgame') {
            const url = decodeURIComponent(v || '');
            const fakeGame = { embedUrl: url, title: "ゲームプレイ中" };
            renderGamePlay(fakeGame);
        } 
        else if (k === 'playtool') {
            const url = decodeURIComponent(v || '');
            const fakeTool = { embedUrl: url, title: "ツール実行中" };
            renderToolPlay(fakeTool);
        } 
        else {
            renderHome();
        }
    }

    updateSidebarActive();
}

// アプリの初期化
function initApp() {
    // ダークモード復元
    const darkMode = localStorage.getItem('darkMode') === 'true';
    document.body.classList.toggle('dark-mode', darkMode);

    // イベント設定
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                performSearch(searchInput.value.trim());
            }
        });
    }

    const homeBtn = document.getElementById('homeBtn');
    if (homeBtn) {
        homeBtn.addEventListener('click', () => location.hash = '');
    }

    // 初回実行
    renderByHash();
}

// ページロード時に初期化
window.addEventListener('load', () => {
    initApp();

    // ページオープン時にアクセス数 +1
    fetch('/fake-views?times=1')
        .catch(() => {});
});

// グローバル公開
window.app = {
    renderByHash,
    initApp,
    observerMap,
    commentsPageToken
};
