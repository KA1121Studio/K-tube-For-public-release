/* =========================
   Home Page
========================= */

async function renderHome() {
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = `
    <div class="home-container">
      <div id="videoGrid" class="video-grid"></div>
      <div id="homeLoading" class="loading">読み込み中...</div>
    </div>
  `;

  homeLoading = false;
  loadHome();
}

async function loadHome() {
  if (homeLoading) return;
  homeLoading = true;

  const grid = document.getElementById('videoGrid');
  const loading = document.getElementById('homeLoading');
  if (!grid || !loading) return;

  loading.style.display = 'block';

  try {
    const data = await pipedFetch(`/trending?region=JP`);
    const videos = data?.videos || data || [];

    videos.slice(0, MAX_RESULTS).forEach(video => {
      const normalized = normalizeMetadata(video);
      const card = makeVideoCard(normalized);
      grid.appendChild(card);
    });

  } catch (err) {
    console.error(err);
  }

  loading.style.display = 'none';
  homeLoading = false;
}

function makeVideoCard(video) {
  const div = document.createElement('div');
  div.className = 'video-card';

  div.innerHTML = `
    <a href="#watch=${video.id}">
      <img src="${video.thumbnail}" alt="">
      <div class="video-info">
        <h3>${escapeHtml(video.title)}</h3>
        <p>${escapeHtml(video.uploader)}</p>
        <p>${fmtNum(video.views)} 回視聴・${timeAgo(video.uploadedDate)}</p>
      </div>
    </a>
  `;

  return div;
}

async function loadStats(videoId, el) {
  if (!videoId || !el) return;

  try {
    const data = await pipedFetch(`/streams/${videoId}`);
    if (data?.views) {
      el.textContent = fmtNum(data.views) + ' 回視聴';
    }
  } catch (e) {
    console.error(e);
  }
}
