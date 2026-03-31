/* =========================
   Watch Page
========================= */

async function setupComments(videoId) {
  const list = document.getElementById('commentsList');
  if (!list) {
    console.error('commentsList が見つかりません');
    return;
  }

  list.innerHTML = '<div style="padding: 20px; text-align: center; color: #606060;">コメントを読み込んでいます...</div>';

  commentsPageToken[videoId] = null;
  let loading = false;
  let hasMore = true;

  const loadMore = async () => {
    if (loading || !hasMore) return;
    loading = true;

    try {
      const params = { sort_by: 'top' };
      if (commentsPageToken[videoId]) {
        params.nextpage = commentsPageToken[videoId];
      }

      const res = await pipedFetch(`/comments/${videoId}`, params);
      console.log(`コメント取得 (${videoId}):`, res);

      commentsPageToken[videoId] = res.nextpage || null;
      hasMore = !!res.nextpage && res.nextpage !== null;

      if (list.innerHTML.includes('読み込んでいます')) {
        list.innerHTML = '';
      }

      if (res.comments && res.comments.length > 0) {
        res.comments.forEach(c => {
          let thumbUrl = c.thumbnail || '';

          const proxiedThumb = thumbUrl && thumbUrl.includes('proxy.piped.private.coffee')
            ? `/thumb-proxy?url=${encodeURIComponent(thumbUrl)}`
            : 'https://www.gstatic.com/youtube/img/no_thumbnail_140-vflXmJqzd.png';

          const div = document.createElement('div');
          div.className = 'comment';
          div.innerHTML = `
            <img src="${proxiedThumb}" alt=""
                 style="width:40px; height:40px; border-radius:50%; object-fit: cover; flex-shrink:0;"
                 loading="lazy"
                 referrerpolicy="no-referrer"
                 crossorigin="anonymous"
                 onerror="this.src='https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png'; this.onerror=null;">
            <div class="c-body">
              <div class="name" style="display:flex; align-items:center; gap:6px; font-size:13px;">
                <span style="font-weight:500;">${escapeHtml(c.author || '匿名ユーザー')}</span>
                <span style="color:#606060; font-size:12px;">
                  ${timeAgo(c.commentedTime || '')}
                </span>
              </div>
              <div class="text" style="margin-top:4px; line-height:1.4; font-size:14px; white-space: pre-wrap; word-break: break-word; color:#0f0f0f;">${escapeHtml(c.commentText || '(内容がありません)')
                .replace(/&lt;br\s*\/?&gt;/gi, '<br>')
                .replace(/\r?\n/g, '<br>')
                .replace(/^(?:\s|　|<br>)+/gi, '')
              }</div>
            </div>
          `;
          list.appendChild(div);
        });
      }

      if (list.children.length === 0 && !hasMore) {
        list.innerHTML = '<div style="padding: 20px; text-align: center; color: #606060; font-size:14px;">コメントは非表示に設定されているか、コメントがありません</div>';
      }

    } catch (e) {
      console.error('コメント読み込みエラー:', e);
      list.innerHTML += `<div style="color:#c00; padding:12px; font-size:14px;">コメントの読み込みに失敗しました</div>`;
    } finally {
      loading = false;
    }
  };

  await loadMore();

  const sentinel = document.getElementById('commentsSentinel');
  if (sentinel) {
    const io = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMore();
      }
    }, {
      root: document.querySelector('.comments'),
      rootMargin: '400px 0px 200px 0px'
    });
    io.observe(sentinel);
    observerMap.set(`comments_${videoId}`, io);
  }
}

async function renderWatch(videoId) {
  try {
    observerMap.forEach(o => o.disconnect());
    observerMap.clear();
    app.innerHTML = `<div style="padding:40px; text-align:center; color:#606060;">読み込み中...</div>`;

    let metaData = {};
    let source = "none";

    const backends = [
      { name: "Netlify Fast API (race)", custom: () => fetchFastestNetlify(videoId) },
      { name: "Piped Streams", url: () => `/piped/streams/${videoId}` },
    ];

    for (const backend of backends) {
      try {
        console.log(`Trying metadata backend: ${backend.name}`);

        let data;

        if (backend.custom) {
          data = await backend.custom();
        } else {
          const res = await fetch(backend.url(), {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
          });
          if (!res.ok) continue;
          data = await res.json();
        }

        if (!data || data.error || data.status === "fail") continue;

        metaData = normalizeMetadata(data, backend.name);
        source = backend.name;
        console.log(`Metadata obtained from: ${source} (成功)`);
        break;

      } catch (err) {
        console.warn(`${backend.name} failed:`, err.message);
      }
    }

    if (!metaData.title) {
      try {
        const searchData = await pipedFetch('/search', { q: videoId, filter: 'videos' });
        const item = (searchData?.items || searchData || []).find(it =>
          it.url?.includes(videoId) || it.url?.includes(`v=${videoId}`)
        );
        if (item) {
          metaData = {
            title: item.title || `動画（ID: ${videoId}）`,
            description: item.shortDescription || '説明文なし',
            thumbnail: item.thumbnail || '',
            uploader: item.uploaderName || '不明',
            viewCount: item.views || 0,
            uploaded: item.uploaded || '',
            channelName: item.uploaderName || '',
            channelId: item.uploaderUrl?.split('/').pop() || '',
          };
          source = "Piped Search (minimal)";
        }
      } catch (e) {
        console.warn("最終フォールバック失敗", e);
      }
    }

    const title = metaData.title || `動画（ID: ${videoId}）`;
    const views = fmtNum(metaData.viewCount ?? metaData.views ?? 0);
    const likes = fmtNum(metaData.likeCount ?? 0);
    let uploaded = '---';
    if (metaData.published || metaData.uploadDate || metaData.uploaded) {
      try {
        uploaded = timeAgo(new Date(metaData.published || metaData.uploadDate || metaData.uploaded).toISOString());
      } catch {}
    }

    let rawDesc = metaData.description || metaData.shortDescription || '説明文は現在取得できませんでした';
    rawDesc = rawDesc.trim();
    rawDesc = rawDesc.replace(/^\s+|\s+$/g, '');
    rawDesc = rawDesc.replace(/^(?:\r\n|\r|\n|　)+/, '');
    rawDesc = rawDesc.replace(/\s{2,}/g, ' ');
    rawDesc = rawDesc.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" style="color:#065fd4; text-decoration:underline;">$1</a>');
    const escapedDesc = rawDesc;

    const chName = metaData.uploader || metaData.author || metaData.channelName || metaData.uploaderName || '不明';
    let chId = metaData.channelId || metaData.authorId || (metaData.uploaderUrl?.split('/').pop() || '');
    let chThumb = metaData.uploaderAvatar || metaData.avatar || metaData.thumbnail || '';

    let subscriberCount = metaData.subscriberCount ?? 0;
    if (chId) {
      try {
        const channelData = await pipedFetch(`/channel/${chId}`);
        if (channelData) {
          if (channelData.avatarUrl && !channelData.avatarUrl.includes('/vi/') && !channelData.avatarUrl.includes('thumbnail')) {
            chThumb = channelData.avatarUrl;
          }
          if (typeof channelData.subscriberCount === 'number' && channelData.subscriberCount > 0) {
            subscriberCount = channelData.subscriberCount;
            console.log(`登録者数を /channel から上書き: ${subscriberCount}`);
          } else if (channelData.subscriberCount === -1 || channelData.subscriberCount === null) {
            subscriberCount = '非公開';
          }
        }
      } catch (err) {
        console.warn('チャンネル情報取得失敗（登録者数/アイコン）:', err);
      }
    }

    const chSubs = typeof subscriberCount === 'number'
      ? fmtNum(subscriberCount)
      : (subscriberCount === '非公開' ? '非公開' : '---');

    if (metaData.title) {
      addToHistory(videoId, metaData.title, metaData.thumbnail || '', chName, metaData.uploaderUrl || (chId ? `/channel/${chId}` : ''));
    }

    const defaultPlayer = localStorage.getItem('defaultPlayer') || 'api2-original2';

    app.innerHTML = `
      <div class="watch-container">
        <div class="main-col">

          <div class="player-box">
            <iframe id="videoIframe"
                    src="https://www.youtube.com/embed/${videoId}"
                    frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowfullscreen
                    style="width:100%;height:100%;">
            </iframe>
          </div>

          <div class="player-meta">
            <h1>${escapeHtml(title)}</h1>
            <div class="stats">
              <div>${views} 回視聴</div>
              <div>・</div>
              <div>${uploaded}</div>
              <div style="margin-left:auto;font-weight:700">${likes} 👍</div>
              <select id="playerSelect">
                <option value="official" ${defaultPlayer === 'official' ? 'selected' : ''}>
                  公式プレイヤー（YouTube埋め込み）
                </option>
                <option value="api1-original1" ${defaultPlayer === 'api1-original1' ? 'selected' : ''}>
                  API1・オリジナル1（高画質）
                </option>
                <option value="api1-original2" ${defaultPlayer === 'api1-original2' ? 'selected' : ''}>
                  API1・オリジナル2（音声込み）
                </option>
                <option value="api2-original1" ${defaultPlayer === 'api2-original1' ? 'selected' : ''}>
                  API2・オリジナル1（高画質）
                </option>
                <option value="api2-original2" ${defaultPlayer === 'api2-original2' ? 'selected' : ''}>
                  API2・オリジナル2（音声込み）
                </option>
              </select>
            </div>

            <div class="channel-row">
              <img src="${chThumb}" alt="" onerror="this.src='https://via.placeholder.com/48?text=Ch'" style="width:48px;height:48px;border-radius:50%;object-fit:cover;">
              <div class="ch-info">
                <div style="font-weight:700">
                  <a href="#channel=${chId}" class="watch-ch-link" style="text-decoration:none;color:inherit">
                    ${escapeHtml(chName)}
                  </a>
                </div>
                <div style="color:#606060;font-size:13px">${chSubs} 人の登録者</div>
              </div>
              <button class="btn-sub" id="downloadMainBtn">ダウンロード</button>
            </div>

            <div id="descriptionArea" style="margin-top:16px; color:#333; line-height:1.5; word-break:break-word;">
              <div id="descriptionContainer" style="max-height:4.8em; overflow:hidden; transition:max-height 0.4s ease;">
                ${escapedDesc || '（説明がありません）'}
              </div>
              ${escapedDesc.length > 300 ? `
                <div style="margin-top:8px;">
                  <a id="expandDesc" href="#" style="color:#065fd4; font-weight:500; cursor:pointer; text-decoration:none; display:block;">
                    もっと見る
                  </a>
                  <a id="collapseDesc" href="#" style="color:#065fd4; font-weight:500; cursor:pointer; text-decoration:none; display:none;">
                    折りたたむ
                  </a>
                </div>
              ` : ''}
            </div>

            <div class="comments" id="commentsArea">
              <h3 style="margin:24px 0 12px;">コメント</h3>
              <div id="commentsList"></div>
              <div id="commentsSentinel" style="height:32px"></div>
            </div>
          </div>
        </div>

        <aside class="side-col">
          <div style="font-weight:700; margin-bottom:12px;">次に再生</div>
          <div id="relatedList"></div>
        </aside>
      </div>
    `;

    const playerSelect = document.getElementById('playerSelect');
    const iframe = document.getElementById('videoIframe');

    if (playerSelect && iframe) {
      const defaultPlayer = localStorage.getItem('defaultPlayer') || 'official';
      let initialSrc = `https://www.youtube.com/embed/${videoId}?rel=0`;
      let selectedValue = 'official';

      switch (defaultPlayer) {
        case 'official':
          initialSrc = `https://www.youtube.com/embed/${videoId}?rel=0`;
          selectedValue = 'official';
          break;

        case 'api1-original1':
          initialSrc = `/watch.html?id=${videoId}&mode=api1-high`;
          selectedValue = 'api1-original1';
          break;

        case 'api1-original2':
          initialSrc = `/watch.html?id=${videoId}&mode=api1-prog`;
          selectedValue = 'api1-original2';
          break;

        case 'api2-original1':
          initialSrc = `/watch.html?id=${videoId}`;
          selectedValue = 'api2-original1';
          break;

        case 'api2-original2':
          initialSrc = `/watch.html?id=${videoId}&mode=360`;
          selectedValue = 'api2-original2';
          break;

        default:
          initialSrc = `https://www.youtube.com/embed/${videoId}?rel=0`;
          selectedValue = 'official';
      }

      iframe.src = initialSrc;
      playerSelect.value = selectedValue;

      playerSelect.addEventListener('change', () => {
        const val = playerSelect.value;
        let newSrc = `https://www.youtube.com/embed/${videoId}?rel=0`;

        switch (val) {
          case 'official':
            newSrc = `https://www.youtube.com/embed/${videoId}?rel=0`;
            break;
          case 'api1-original1':
            newSrc = `/watch.html?id=${videoId}&mode=api1-high`;
            break;
          case 'api1-original2':
            newSrc = `/watch.html?id=${videoId}&mode=api1-prog`;
            break;
          case 'api2-original1':
            newSrc = `/watch.html?id=${videoId}`;
            break;
          case 'api2-original2':
            newSrc = `/watch.html?id=${videoId}&mode=360`;
            break;
        }

        iframe.src = newSrc;
      });
    }

    const downloadBtn = document.getElementById('downloadMainBtn');
    if (downloadBtn) {
      downloadBtn.classList.remove('disabled');
      downloadBtn.addEventListener('click', async () => {
        try {
          let videoData = null;

          try {
            videoData = await fetchFastestNetlify(videoId);
            if (videoData) {
              console.log('ダウンロード用データ: K-tube API成功');
            }
          } catch (e) {
            console.warn('K-tubeダウンロードAPI失敗:', e);
          }

          if (!videoData) {
            const proxyRes = await fetch(`/api/v2/video?v=${videoId}`);
            if (proxyRes.ok) {
              videoData = await proxyRes.json();
              console.log('ダウンロード用データ: /api/v2/video から取得');
            }
          }

          if (!videoData) {
            throw new Error('ダウンロード用メタデータを取得できませんでした');
          }

          const prog = videoData.videoFormats?.find(f =>
            f.type?.includes('video/mp4') &&
            (f.qualityLabel?.includes('360') || f.itag === '18' || f.itag === 18)
          ) || videoData.formatStreams?.find(f => f.itag === '18');

          if (prog?.url) {
            let downloadUrl = prog.url;
            if (!downloadUrl.startsWith('http')) {
              downloadUrl = `https://splendid-jelly-e731bd.netlify.app/${downloadUrl}`;
            }
            window.open(downloadUrl, '_blank');
          } else {
            alert("音声込み360pのストリームが見つかりませんでした。\n他の画質を試すか、後ほどお試しください。");
          }

        } catch (e) {
          console.error('ダウンロードエラー:', e);
          alert("ダウンロードの準備に失敗しました。\nコンソールを確認するか、後ほどお試しください。");
        }
      });
    }

    const watchChLink = app.querySelector('.watch-ch-link');
    if (watchChLink) {
      watchChLink.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        if (chId) location.hash = `channel=${chId}`;
      });
    }

    const commentsArea = document.getElementById('commentsArea');
    if (commentsArea) setupComments(videoId);

    const relatedList = document.getElementById('relatedList');
    if (relatedList) {
      relatedList.innerHTML = '<div style="padding:20px; text-align:center; color:#606060;">読み込み中...</div>';
      try {
        const searchQuery = metaData.title || videoId;
        const relatedData = await pipedFetch('/search', { q: searchQuery, filter: 'videos' });
        let items = Array.isArray(relatedData) ? relatedData :
                    (relatedData?.items || relatedData?.results || relatedData?.videos || []);
        if (items.length > 1) {
          relatedList.innerHTML = '';
          items.slice(0, 6).forEach(item => {
            const relVid = item.url?.split('v=')[1] || item.url?.split('/').pop() || '';
            if (relVid && relVid !== videoId) {
              const div = document.createElement('div');
              div.className = 'related-item';
              div.innerHTML = `
                <div class="related-thumb">
                  <img src="${item.thumbnail || ''}" alt="" loading="lazy" onerror="this.src='https://via.placeholder.com/168x94?text=No+Thumb'">
                </div>
                <div class="related-info">
                  <div class="title">${escapeHtml(item.title || '(タイトルなし)')}</div>
                  <div style="color:#606060;font-size:13px">
                    ${escapeHtml(item.uploaderName || '不明')} ・ ${fmtNum(item.views || 0)} 回
                  </div>
                </div>
              `;
              div.addEventListener('click', () => location.hash = `watch=${relVid}`);
              relatedList.appendChild(div);
            }
          });
        } else {
          relatedList.innerHTML = '<div style="padding:20px; color:#606060;">関連動画が見つかりませんでした</div>';
        }
      } catch (e) {
        console.error('関連動画取得失敗:', e);
        relatedList.innerHTML = '<div style="padding:20px; color:#c00;">関連動画の読み込みに失敗しました</div>';
      }
    }

    setTimeout(() => {
      const container = document.getElementById('descriptionContainer');
      const expandLink = document.getElementById('expandDesc');
      const collapseLink = document.getElementById('collapseDesc');

      if (container && expandLink) {
        expandLink.addEventListener('click', e => {
          e.preventDefault();
          container.style.maxHeight = 'none';
          expandLink.style.display = 'none';
          if (collapseLink) collapseLink.style.display = 'block';
        });
      }

      if (collapseLink) {
        collapseLink.addEventListener('click', e => {
          e.preventDefault();
          container.style.maxHeight = '4.8em';
          collapseLink.style.display = 'none';
          if (expandLink) expandLink.style.display = 'block';
        });
      }
    }, 300);

  } catch (fatalErr) {
    console.error('renderWatch 全体エラー:', fatalErr);
    app.innerHTML = `
      <div style="padding:40px; text-align:center; color:#c00;">
        <h2>再生ページの読み込みに失敗しました</h2>
        <p>${escapeHtml(fatalErr.message || '不明なエラー')}</p>
        <p style="margin-top:16px;">
          公式YouTubeプレイヤーなら再生できる可能性があります。<br>
          <a href="https://www.youtube.com/watch?v=${videoId}" target="_blank" style="color:#065fd4;">YouTubeで開く</a>
        </p>
      </div>
    `;
  }
}
