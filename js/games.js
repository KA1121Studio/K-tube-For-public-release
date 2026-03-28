// js/games.js
// ゲーム一覧とゲームプレイ画面

// 仮のゲームデータ（実際の運用ではAPIや別ファイルに分けることを推奨）
const fakeGames = [
    {
        title: "Vex 6",
        thumbnail: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRWlLToXUhgx8YiT35WkYM_qXG4x7mRqRuIAA&s",
        embedUrl: "https://vex6-1.onrender.com/",
        description: "棒人間のアスレチックアクションゲーム"
    },
    {
        title: "Minecraft (Eaglercraft)",
        thumbnail: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSasnIEKy9EZiX4tmC56-EKt8hQuJXW5zybqA&s",
        embedUrl: "https://eaglercraft-java-1-20-1-jw-1.onrender.com/",
        description: "ブロックで世界を構築するサンドボックスゲーム"
    },
    {
        title: "2048",
        thumbnail: "https://i.ytimg.com/vi/4NFZwPhqeRs/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLAW5Gr47WItX8gD0QmCCqeJ4b0w4g",
        embedUrl: "https://rgukt-sklm-abccf.firebaseapp.com/taxa/games/2048-master/index.html",
        description: "数字を合わせて2048を作ろう"
    },
    {
        title: "Snowball.io",
        thumbnail: "https://i.ytimg.com/vi/CAJw0bouacU/maxresdefault.jpg",
        embedUrl: "https://snowball-io.netlify.app/",
        description: "雪玉を大きくして相手を落とす対戦ゲーム"
    },
    {
        title: "Slope Rider 3D",
        thumbnail: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR7kQ3jZMC5Son5dqxGw9WhWcRUuiOL8kunLA&s",
        embedUrl: "https://moonlight.sparks.ddns-ip.net/math/hvtrs8%2F-snorepifep.mre%2Fqlmpg-pifep-1d",
        description: "斜面を滑りながら障害物を避ける"
    },
    {
        title: "ギョ〜転！ガッポリすし",
        thumbnail: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRYM-InT7eFQT9coj75pNJda-Zy_VveJBPcSA&s",
        embedUrl: "https://melodic-crisp-d02b45.netlify.app/",
        description: "寿司にコインを賭けて増やすゲーム"
    }
];

// ゲーム一覧画面を表示
function renderGames() {
    const app = document.getElementById('app');
    if (!app) return;

    app.innerHTML = `
        <section id="gamesSection">
            <div style="margin:16px 0 8px; font-weight:700; font-size:20px; color:#0f0f0f;">
                ゲーム
            </div>
            <div class="video-grid" id="gameGrid"></div>
            <div id="gamesSentinel" style="height:32px"></div>
        </section>
    `;

    loadGames();
}

// ゲームカードを読み込んで表示
function loadGames() {
    const grid = document.getElementById('gameGrid');
    if (!grid) return;

    grid.innerHTML = '';

    fakeGames.forEach(game => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="thumb" data-game="${game.embedUrl}">
                <img src="${game.thumbnail}" alt="${game.title}" 
                     style="aspect-ratio:16/9; object-fit:cover;" loading="lazy">
            </div>
            <div class="meta">
                <div class="info">
                    <div class="title">${window.utils.escapeHtml(game.title)}</div>
                    <div class="sub">${window.utils.escapeHtml(game.description || '')}</div>
                </div>
            </div>
        `;

        // クリックでプレイ画面へ
        card.querySelector('.thumb').addEventListener('click', () => {
            location.hash = `playgame=${encodeURIComponent(game.embedUrl)}`;
            renderGamePlay(game);
        });

        grid.appendChild(card);
    });
}

// ゲームプレイ画面（フルスクリーンiframe）
function renderGamePlay(game) {
    const app = document.getElementById('app');
    if (!app) return;

    app.innerHTML = `
        <div class="play-fullscreen">
            <iframe 
                src="${game.embedUrl}" 
                frameborder="0" 
                allowfullscreen
                style="width:100%; height:100%;">
            </iframe>
        </div>
    `;
}

// ツール一覧（将来的に拡張しやすいように別関数として用意）
function renderTools() {
    const app = document.getElementById('app');
    if (!app) return;

    app.innerHTML = `
        <section id="toolsSection">
            <div style="margin:16px 0 8px; font-weight:700; font-size:20px; color:#0f0f0f;">
                ツール
            </div>
            <div class="video-grid" id="toolGrid"></div>
        </section>
    `;

    // 現在は仮データのみ（必要に応じて拡張）
    loadTools();
}

const fakeTools = [
    {
        title: "QRコード作成",
        thumbnail: "https://img.icons8.com/color/480/qr-code.png",
        embedUrl: "https://www.the-qrcode-generator.com/",
        description: "URLやテキストからQRコードを生成"
    },
    {
        title: "単位変換ツール",
        thumbnail: "https://img.icons8.com/color/480/calculator.png",
        embedUrl: "https://www.unitconverters.net/",
        description: "さまざまな単位を瞬時に変換"
    }
];

function loadTools() {
    const grid = document.getElementById('toolGrid');
    if (!grid) return;

    grid.innerHTML = '';

    fakeTools.forEach(tool => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="thumb" data-tool="${tool.embedUrl}">
                <img src="${tool.thumbnail}" alt="${tool.title}" 
                     style="aspect-ratio:16/9; object-fit:cover;" loading="lazy">
            </div>
            <div class="meta">
                <div class="info">
                    <div class="title">${window.utils.escapeHtml(tool.title)}</div>
                    <div class="sub">${window.utils.escapeHtml(tool.description)}</div>
                </div>
            </div>
        `;

        card.querySelector('.thumb').addEventListener('click', () => {
            location.hash = `playtool=${encodeURIComponent(tool.embedUrl)}`;
            renderToolPlay(tool);
        });

        grid.appendChild(card);
    });
}

function renderToolPlay(tool) {
    const app = document.getElementById('app');
    if (!app) return;

    app.innerHTML = `
        <div class="play-fullscreen">
            <iframe 
                src="${tool.embedUrl}" 
                frameborder="0" 
                allowfullscreen>
            </iframe>
        </div>
    `;
}

// グローバル公開
window.games = {
    renderGames,
    renderGamePlay,
    renderTools,
    renderToolPlay,
    loadGames,
    loadTools
};
