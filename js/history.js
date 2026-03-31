/* =========================
   Watch History
========================= */

function getHistory() {
  try {
    return JSON.parse(localStorage.getItem('watchHistory')) || [];
  } catch {
    return [];
  }
}

function addToHistory(videoId, title, thumbnail, channelName, channelUrl) {
  if (!videoId || !title) return;

  let history = getHistory();

  // 同じ動画があれば削除（重複防止）
  history = history.filter(item => item.videoId !== videoId);

  // 先頭に追加
  history.unshift({
    videoId,
    title,
    thumbnail,
    channelName,
    channelUrl,
    watchedAt: Date.now()
  });

  // 最大50件まで保持
  if (history.length > 50) {
    history = history.slice(0, 50);
  }

  localStorage.setItem('watchHistory', JSON.stringify(history));
}

function clearHistory() {
  localStorage.removeItem('watchHistory');
}

function renderHistory() {
  const app = document.getElementById('app');
  if (!app) return;

  const history = getHistory();

  if (history.length === 0) {
    app.innerHTML = `
      <div style="padding:40px; text-align:center; color:#606060;">
        再生履歴はありません
      </div>
    `;
    return;
  }

  app.innerHTML = `
    <div style="max-width:1000px;margin:40px auto;padding:0 16px;">
      <h1 style="margin-bottom:24px;">再生履歴</h1>
      <div id="historyList" class="video-grid"></div>
    </div>
  `;

  const list = document.getElementById('historyList');

  history.forEach(item => {
    const div = document.createElement('div');
    div.className = 'video-card';

    div.innerHTML = `
      <a href="#watch=${item.videoId}">
        <img src="${item.thumbnail}" alt="">
        <div class="video-info">
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.channelName || '')}</p>
          <p>${timeAgo(new Date(item.watchedAt).toISOString())}</p>
        </div>
      </a>
    `;

    list.appendChild(div);
  });
}
