// js/history.js
// 再生履歴の管理

const HISTORY_KEY = 'kTube_watch_history';
const MAX_HISTORY = 50;

// 再生履歴に追加
function addToHistory(videoId, title, thumbnail, uploaderName, channelId) {
    if (!videoId || !title) return;

    let history = getHistory();

    // 同じ動画があれば一旦削除（最新視聴として先頭に移動）
    history = history.filter(item => item.videoId !== videoId);

    // 新しい履歴を先頭に追加
    history.unshift({
        videoId,
        title: title || '（タイトル不明）',
        thumbnail: thumbnail || '',
        uploaderName: uploaderName || '不明',
        channelId: channelId || '',
        watchedAt: new Date().toISOString()
    });

    // 最大件数を超えたら古いものを削除
    if (history.length > MAX_HISTORY) {
        history = history.slice(0, MAX_HISTORY);
    }

    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

// 履歴を取得
function getHistory() {
    try {
        const data = localStorage.getItem(HISTORY_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.warn('履歴の読み込みに失敗しました', e);
        return [];
    }
}

// すべての履歴を削除
function clearHistory() {
    localStorage.removeItem(HISTORY_KEY);
    // 現在履歴画面を表示中なら即時更新
    if (location.hash === '#history') {
        renderHistory();
    }
}

// 履歴画面を表示
function renderHistory() {
    const app = document.getElementById('app');
    if (!app) return;

    const history = getHistory();

    app.innerHTML = `
        <section>
            <div style="margin:16px 0 8px; font-weight:700; font-size:20px; color:#0f0f0f; 
                        display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
                再生履歴
                <button id="clearHistoryBtn" style="padding:8px 16px; background:#dc3545; color:white; 
                         border:none; border-radius:20px; cursor:pointer; font-weight:600;">
                    すべてクリア
                </button>
            </div>
            
            <div class="video-grid" id="historyGrid"></div>
            
            <div id="historyEmpty" style="display:none; padding:80px 20px; text-align:center; color:#606060; font-size:16px;">
                まだ視聴履歴がありません
            </div>
        </section>
    `;

    const grid = document.getElementById('historyGrid');
    const emptyMsg = document.getElementById('historyEmpty');

    if (history.length === 0) {
        emptyMsg.style.display = 'block';
        return;
    }

    history.forEach(item => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="thumb" data-vid="${item.videoId}">
                <img src="${item.thumbnail}" alt="${window.utils.escapeHtml(item.title)}" 
                     loading="lazy" onerror="this.src='https://via.placeholder.com/320x180?text=No+Thumb';">
            </div>
            <div class="meta">
                <div class="info">
                    <div class="title" style="display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">
                        ${window.utils.escapeHtml(item.title)}
                    </div>
                    <div class="sub">
                        ${window.utils.escapeHtml(item.uploaderName)} ・ ${window.utils.timeAgo(item.watchedAt)}
                    </div>
                </div>
            </div>
        `;

        card.querySelector('.thumb').addEventListener('click', () => {
            location.hash = `watch=${item.videoId}`;
        });

        grid.appendChild(card);
    });

    // クリアボタン
    const clearBtn = document.getElementById('clearHistoryBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (confirm('すべての再生履歴を削除してもよろしいですか？')) {
                clearHistory();
            }
        });
    }
}

// グローバル公開
window.historyModule = {
    addToHistory,
    getHistory,
    clearHistory,
    renderHistory
};
