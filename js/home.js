// js/home.js
// ホーム画面 + 検索 + 統計（元のコードにかなり忠実）

let homeLoading = false;

// ホーム画面描画
function renderHome() {
    const app = document.getElementById('app');
    if (!app) return;

    app.innerHTML = `
        <section id="homeSection">
            <div style="margin:16px 0 8px; font-weight:700; font-size:20px; color:#0f0f0f;">
                おすすめ
            </div>
            <div class="video-grid" id="videoGrid"></div>

            <!-- 統計ブロック -->
            <div id="statsBlock" style="
                margin: 24px auto 16px; max-width: 1000px; padding: 24px 16px;
                background: linear-gradient(135deg, #f8f9fa, #ffffff); border-radius: 12px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.08); text-align: center;
            ">
                <div style="display: flex; justify-content: center; gap: 60px; flex-wrap: wrap;">
                    <div style="min-width: 140px;">
                        <div id="totalViews" style="font-size:36px; font-weight:800; color:#065fd4;">---</div>
                        <div style="margin-top:6px; font-size:14px; color:#606060;">総合アクセス数</div>
                    </div>
                    <div style="min-width: 140px;">
                        <div id="todayViews" style="font-size:36px; font-weight:800; color:#065fd4;">---</div>
                        <div style="margin-top:6px; font-size:14px; color:#606060;">今日のアクセス数</div>
                    </div>
                </div>
                <h3 style="margin:20px 0 0; font-size:18px; font-weight:700; color:#6c6c6c;">
                    ⓒ K-tube　V.1.32
                </h3>
                <div style="margin-top:20px; font-size:15px; color:#065fd4;">
                    <span id="aboutLink" style="cursor:pointer; margin:0 16px; text-decoration:underline;">K-tubeについて</span>
                    <span id="contactLink" style="cursor:pointer; margin:0 16px; text-decoration:underline;">お問い合わせ</span>
                </div>
            </div>

            <div id="homeSentinel" style="height:0px"></div>
        </section>
    `;

    loadHome();
    loadStats();

    // リンクイベント
    setTimeout(() => {
        document.getElementById('aboutLink')?.addEventListener('click', () => location.hash = 'about');
        document.getElementById('contactLink')?.addEventListener('click', () => location.hash = 'contact');
    }, 100);
}

// おすすめ動画読み込み（Trending）
async function loadHome() {
    if (homeLoading) return;
    homeLoading = true;

    const grid = document.getElementById('videoGrid');
    if (!grid) return;

    try {
        const data = await window.utils.pipedFetch('/trending', { region: 'JP' });

        for (const item of data || []) {
            const card = await window.utils.makeVideoCard(item);
            grid.appendChild(card);
        }
    } catch (e) {
        console.error(e);
        grid.innerHTML += `<div style="color:#c00; padding:16px; text-align:center;">
            読み込み失敗: ${window.utils.escapeHtml(e.message)}
        </div>`;
    } finally {
        homeLoading = false;
    }
}

// 統計読み込み
async function loadStats() {
    try {
        const res = await fetch('/stats');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();

        document.getElementById('totalViews').textContent = window.utils.fmtNum(data.total_views || 0);
        document.getElementById('todayViews').textContent = window.utils.fmtNum(data.today_views || 0);
    } catch (err) {
        console.warn('統計読み込みエラー:', err);
    }
}

// 検索実行
async function performSearch(q) {
    if (!q) return renderHome();

    location.hash = `search=${encodeURIComponent(q)}`;

    const app = document.getElementById('app');
    app.innerHTML = `
        <section>
            <div style="margin:12px 0; font-weight:700; font-size:18px;">
                検索結果: ${window.utils.escapeHtml(q)}
            </div>
            <div class="video-grid" id="videoGrid"></div>
            <div id="searchSentinel" style="height:32px"></div>
        </section>
    `;

    const grid = document.getElementById('videoGrid');
    let loading = false;

    const loadMore = async () => {
        if (loading) return;
        loading = true;

        try {
            const data = await window.utils.pipedFetch('/search', { q, filter: 'videos' });
            const items = Array.isArray(data) ? data : (data?.items || data?.results || data || []);

            for (const item of items) {
                const card = await window.utils.makeVideoCard(item);
                grid.appendChild(card);
            }
        } catch (e) {
            console.error(e);
            grid.innerHTML += `<div style="color:#c00; padding:16px;">読み込み失敗</div>`;
        } finally {
            loading = false;
        }
    };

    const sentinel = document.getElementById('searchSentinel');
    if (sentinel) {
        const io = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) loadMore();
        }, { rootMargin: '400px' });
        io.observe(sentinel);
        window.app.observerMap.set('search', io);
    }

    loadMore();
}

// グローバル公開
window.home = {
    renderHome,
    loadHome,
    loadStats,
    performSearch
};
