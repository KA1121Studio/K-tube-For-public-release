// js/ui.js
// UI関連：メニュー、サイドバー、オーバーレイの制御

// メニュー開閉
function toggleMenu() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    if (sidebar && overlay) {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('open');
    }
}

// サイドバーのアクティブ状態を更新
function updateSidebarActive() {
    const hash = location.hash.slice(1);
    const items = document.querySelectorAll('.sidebar-item, .menu-item');

    items.forEach(item => {
        item.classList.remove('active');
        const target = item.dataset.target;

        if (!hash && target === 'home') {
            item.classList.add('active');
        } 
        else if (hash === 'games' && target === 'games') {
            item.classList.add('active');
        } 
        else if (hash === 'tools' && target === 'tools') {
            item.classList.add('active');
        } 
        else if (hash === 'history' && target === 'history') {
            item.classList.add('active');
        } 
        else if (hash === 'settings' && target === 'settings') {
            item.classList.add('active');
        }
    });
}

// サイドメニュー（スライドメニュー）と固定サイドバーのHTMLを動的に生成
function initSidebars() {
    // スライドメニュー（モバイル用）
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.innerHTML = `
            <div style="padding:16px; border-bottom:1px solid #eee; font-weight:700; font-size:18px;">
                メニュー
            </div>
            <div class="menu-item" data-target="home">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="m11.485 2.143-8 4.8-2 1.2a1 1 0 001.03 1.714L3 9.567V20a2 2 0 002 2h6v-7h2v7h6a2 2 0 002-2V9.567l.485.29a1 1 0 001.03-1.714l-2-1.2-8-4.8a1 1 0 00-1.03 0ZM5 8.366l7-4.2 7 4.2V20h-4v-5.5a1.5 1.5 0 00-1.5-1.5h-3A1.5 1.5 0 009 14.5V20H5V8.366Z"></path></svg>
                <span>ホーム</span>
            </div>
            <div class="menu-item" data-target="tools">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"></path></svg>
                <span>ツール</span>
            </div>
            <div class="menu-item" data-target="games">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 9c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3zm7-6h-4v2h4v-2zm0 4h-4v2h4v-2z"></path></svg>
                <span>ゲーム</span>
            </div>
            <div class="menu-item" data-target="history">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M8.76 1.487a11 11 0 11-7.54 12.706 1 1 0 011.96-.4 9 9 0 0014.254 5.38A9 9 0 0016.79 4.38 9 9 0 004.518 7H7a1 1 0 010 2H1V3a1 1 0 012 0v2.678a11 11 0 015.76-4.192ZM12 6a1 1 0 00-1 1v5.58l.504.288 3.5 2a1 1 0 10.992-1.736L13 11.42V7a1 1 0 00-1-1Z"></path></svg>
                <span>履歴</span>
            </div>
            <div class="menu-item" data-target="settings">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12.844 1h-1.687a2 2 0 00-1.962 1.616 3 3 0 01-3.92 2.263 2 2 0 00-2.38.891l-.842 1.46a2 2 0 00.417 2.507 3 3 0 010 4.525 2 2 0 00-.417 2.507l.843 1.46a2 2 0 002.38.892 3.001 3.001 0 013.918 2.263A2 2 0 0011.157 23h1.686a2 2 0 001.963-1.615 3.002 3.002 0 013.92-2.263 2 2 0 002.38-.892l.842-1.46a2 2 0 00-.418-2.507 3 3 0 010-4.526 2 2 0 00.418-2.508l-.843-1.46a2 2 0 00-2.38-.891 3 3 0 01-3.919-2.263A2 2 0 0012.844 1Zm-1.767 2.347a6 6 0 00.08-.347h1.687a4.98 4.98 0 002.407 3.37 4.98 4.98 0 004.122.4l.843 1.46A4.98 4.98 0 0018.5 12a4.98 4.98 0 001.716 3.77l-.843 1.46a4.98 4.98 0 00-4.123.4A4.979 4.979 0 0012.843 21h-1.686a4.98 4.98 0 00-2.408-3.371 4.999 4.999 0 00-4.12-.399l-.844-1.46A4.979 4.979 0 005.5 12a4.98 4.98 0 00-1.715-3.77l.842-1.459a4.98 4.98 0 004.123-.399 4.981 4.981 0 002.327-3.025ZM16 12a4 4 0 11-7.999 0 4 4 0 018 0Zm-4 2a2 2 0 100-4 2 2 0 000 4Z"></path></svg>
                <span>設定</span>
            </div>
        `;
    }

    // 固定左サイドバー
    const sidebarFixed = document.getElementById('sidebarFixed');
    if (sidebarFixed) {
        sidebarFixed.innerHTML = `
            <div class="sidebar-item active" data-target="home">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="m11.485 2.143-8 4.8-2 1.2a1 1 0 001.03 1.714L3 9.567V20a2 2 0 002 2h6v-7h2v7h6a2 2 0 002-2V9.567l.485.29a1 1 0 001.03-1.714l-2-1.2-8-4.8a1 1 0 00-1.03 0ZM5 8.366l7-4.2 7 4.2V20h-4v-5.5a1.5 1.5 0 00-1.5-1.5h-3A1.5 1.5 0 009 14.5V20H5V8.366Z"></path></svg>
                <span>ホーム</span>
            </div>
            <div class="sidebar-item" data-target="tools">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"></path></svg>
                <span>ツール</span>
            </div>
            <div class="sidebar-item" data-target="games">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 9c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3zm7-6h-4v2h4v-2zm0 4h-4v2h4v-2z"></path></svg>
                <span>ゲーム</span>
            </div>
            <div class="sidebar-item" data-target="history">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M8.76 1.487a11 11 0 11-7.54 12.706 1 1 0 011.96-.4 9 9 0 0014.254 5.38A9 9 0 0016.79 4.38 9 9 0 004.518 7H7a1 1 0 010 2H1V3a1 1 0 012 0v2.678a11 11 0 015.76-4.192ZM12 6a1 1 0 00-1 1v5.58l.504.288 3.5 2a1 1 0 10.992-1.736L13 11.42V7a1 1 0 00-1-1Z"></path></svg>
                <span>履歴</span>
            </div>
            <div class="sidebar-item" data-target="settings">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12.844 1h-1.687a2 2 0 00-1.962 1.616 3 3 0 01-3.92 2.263 2 2 0 00-2.38.891l-.842 1.46a2 2 0 00.417 2.507 3 3 0 010 4.525 2 2 0 00-.417 2.507l.843 1.46a2 2 0 002.38.892 3.001 3.001 0 013.918 2.263A2 2 0 0011.157 23h1.686a2 2 0 001.963-1.615 3.002 3.002 0 013.92-2.263 2 2 0 002.38-.892l.842-1.46a2 2 0 00-.418-2.507 3 3 0 010-4.526 2 2 0 00.418-2.508l-.843-1.46a2 2 0 00-2.38-.891 3 3 0 01-3.919-2.263A2 2 0 0012.844 1Zm-1.767 2.347a6 6 0 00.08-.347h1.687a4.98 4.98 0 002.407 3.37 4.98 4.98 0 004.122.4l.843 1.46A4.98 4.98 0 0018.5 12a4.98 4.98 0 001.716 3.77l-.843 1.46a4.98 4.98 0 00-4.123.4A4.979 4.979 0 0012.843 21h-1.686a4.98 4.98 0 00-2.408-3.371 4.999 4.999 0 00-4.12-.399l-.844-1.46A4.979 4.979 0 005.5 12a4.98 4.98 0 00-1.715-3.77l.842-1.459a4.98 4.98 0 004.123-.399 4.981 4.981 0 002.327-3.025ZM16 12a4 4 0 11-7.999 0 4 4 0 018 0Zm-4 2a2 2 0 100-4 2 2 0 000 4Z"></path></svg>
                <span>設定</span>
            </div>
        `;
    }
}

// メニュー項目にクリックイベントを付与
function attachMenuListeners() {
    const items = document.querySelectorAll('.sidebar-item, .menu-item');
    
    items.forEach(item => {
        item.addEventListener('click', () => {
            const target = item.dataset.target;
            
            // アクティブ状態を切り替え
            document.querySelectorAll('.sidebar-item, .menu-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            // ページ遷移
            if (target === 'home') {
                location.hash = '';
            } else if (target === 'games') {
                location.hash = 'games';
            } else if (target === 'tools') {
                location.hash = 'tools';
            } else if (target === 'history') {
                location.hash = 'history';
            } else if (target === 'settings') {
                location.hash = 'settings';
            }

            // モバイルのスライドメニューを閉じる
            const sidebar = document.getElementById('sidebar');
            if (sidebar && sidebar.classList.contains('open')) {
                toggleMenu();
            }
        });
    });
}

// ハンバーガーメニューとオーバーレイのイベント設定
function initMenuEvents() {
    const menuBtn = document.getElementById('menuBtn');
    const overlay = document.getElementById('overlay');

    if (menuBtn) {
        menuBtn.addEventListener('click', toggleMenu);
    }
    if (overlay) {
        overlay.addEventListener('click', toggleMenu);
    }
}

// UI全体の初期化
function initUI() {
    initSidebars();
    initMenuEvents();
    attachMenuListeners();
}

// グローバル公開
window.ui = {
    toggleMenu,
    updateSidebarActive,
    initUI
};
