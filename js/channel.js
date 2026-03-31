/* =========================
   Channel Page
========================= */

async function renderChannel(channelId) {
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = `
    <div style="padding:40px; text-align:center; color:#606060;">
      読み込み中...
    </div>
  `;

  try {
    const data = await pipedFetch(`/channel/${channelId}`);

    if (!data) throw new Error('チャンネル情報取得失敗');

    const banner = data.bannerUrl || '';
    const avatar = data.avatarUrl || '';
    const name = data.name || '不明';
    const subs = data.subscriberCount === -1
      ? '非公開'
      : fmtNum(data.subscriberCount || 0);
    const description = data.description || '';

    app.innerHTML = `
      <div class="channel-container">

        <div class="channel-header">
          ${banner ? `<img src="${banner}" class="channel-banner" alt="">` : ''}

          <div class="channel-info">
            <img src="${avatar}" class="channel-avatar"
                 onerror="this.src='https://via.placeholder.com/100?text=Ch'">
            <div>
              <h1>${escapeHtml(name)}</h1>
              <div style="color:#606060; font-size:14px;">
                ${subs} 人の登録者
              </div>
            </div>
          </div>
        </div>

        <div class="channel-description"
             style="margin-top:16px; white-space:pre-wrap; line-height:1.5;">
          ${escapeHtml(description)}
        </div>

        <h2 style="margin-top:32px;">動画</h2>
        <div id="channelVideos" class="video-grid"></div>

      </div>
    `;

    const grid = document.getElementById('channelVideos');

    if (data.relatedStreams && Array.isArray(data.relatedStreams)) {
      data.relatedStreams.forEach(video => {
        const normalized = normalizeMetadata(video);
        const card = makeVideoCard(normalized);
        grid.appendChild(card);
      });
    }

  } catch (e) {
    console.error('renderChannel error:', e);
    app.innerHTML = `
      <div style="padding:40px; text-align:center; color:#c00;">
        チャンネルの読み込みに失敗しました
      </div>
    `;
  }
}
