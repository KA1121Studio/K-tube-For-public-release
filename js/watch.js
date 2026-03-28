// js/watch.js
// 動画視聴ページのメイン処理

async function renderWatch(videoId) {
    const app = document.getElementById('app');
    if (!app) return;

    app.innerHTML = `<div style="padding:40px; text-align:center; color:#606060;">読み込み中...</div>`;

    let metaData = {};
    let source = "none";

    try {
        // メタデータ取得（複数バックエンドを順に試す）
        const backends = [
            { name: "Netlify Fast API", custom: () => fetchFastestNetlify(videoId) },
            { name: "Piped Streams", url: `/piped/streams/${videoId}` },
            { name: "Invidious", url: `https://inv.tube/api/v1/videos/${videoId}` }
        ];

        for (const backend of backends) {
            try {
                let data;
                if (backend.custom) {
                    data = await backend.custom();
                } else {
                    const res = await fetch(backend.url);
                    if (!res.ok) continue;
                    data = await res.json();
                }

                if (data && !data.error) {
                    metaData = normalizeMetadata(data, backend.name);
                    source = backend.name;
                    console.log(`Metadata from: ${source}`);
                    break;
                }
            } catch (e) {
                console.warn(`${backend.name} failed:`, e.message);
            }
        }

        // 最終フォールバック
        if (!metaData.title) {
            const searchData = await window.utils.pipedFetch('/search', { q: videoId, filter: 'videos' });
            const item = (searchData?.items || searchData || []).find(it => 
                it.url?.includes(videoId)
            );
            if (item) {
                metaData = {
                    title: item.title || `動画（${videoId}）`,
                    description: item.shortDescription || '',
                    thumbnail: item.thumbnail || '',
                    uploader: item.uploaderName || '不明',
                    viewCount: item.views || 0,
                    uploaded: item.uploaded || '',
                    channelId: item.uploaderUrl?.split('/').pop() || ''
                };
            }
        }

        const title = metaData.title || `動画（${videoId}）`;
        const views = window.utils.fmtNum(metaData.viewCount ?? 0);
        const likes = window.utils.fmtNum(metaData.likeCount ?? 0);
        const uploaded = metaData.published ? window.utils.timeAgo(metaData.published) : '---';

        let rawDesc = metaData.description || '説明文はありません';
        rawDesc = rawDesc.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" style="color:#065fd4;">$1</a>');

        const chName = metaData.uploader || '不明';
        let chId = metaData.channelId || '';
        let chThumb = metaData.uploaderAvatar || '';

        // チャンネル情報で上書き
        if (chId) {
            try {
                const chData = await window.utils.pipedFetch(`/channel/${chId}`);
                if (chData.avatarUrl) chThumb = chData.avatarUrl;
                if (chData.subscriberCount > 0) metaData.subscriberCount = chData.subscriberCount;
            } catch (e) {}
        }

        const chSubs = metaData.subscriberCount ? window.utils.fmtNum(metaData.subscriberCount) + ' 人' : '---';

        // 履歴に追加
        addToHistory(videoId, title, metaData.thumbnail || '', chName, chId);

        app.innerHTML = `
            <div class="watch-container">
                <div class="main-col">
                    <div class="player-box">
                        <iframe id="videoIframe" 
                            src="https://www.youtube.com/embed/${videoId}?rel=0"
                            frameborder="0" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowfullscreen
                            style="width:100%; height:100%;"></iframe>
                    </div>

                    <div class="player-meta">
                        <h1>${window.utils.escapeHtml(title)}</h1>
                        <div class="stats">
                            <div>${views} 回視聴</div>
                            <div>・</div>
                            <div>${uploaded}</div>
                            <div style="margin-left:auto; font-weight:700">${likes} 👍</div>
                        </div>

                        <div class="channel-row">
                            <img src="${chThumb}" alt="" style="width:48px;height:48px;border-radius:50%;object-fit:cover;" 
                                 onerror="this.src='https://via.placeholder.com/48?text=Ch'">
                            <div class="ch-info">
                                <div style="font-weight:700">
                                    <a href="#channel=${chId}" class="watch-ch-link">${window.utils.escapeHtml(chName)}</a>
                                </div>
                                <div style="color:#606060;font-size:13px">${chSubs} 人の登録者</div>
                            </div>
                            <button class="btn-sub" id="downloadMainBtn">ダウンロード</button>
                        </div>

                        <div id="descriptionArea" style="margin-top:16px; line-height:1.5;">
                            <div id="descriptionContainer" style="max-height:4.8em; overflow:hidden;">
                                ${rawDesc}
                            </div>
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

        // コメント読み込み
        setupComments(videoId);

        // 関連動画
        loadRelatedVideos(title, videoId);

        // ダウンロードボタン
        const downloadBtn = document.getElementById('downloadMainBtn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => handleDownload(videoId));
        }

    } catch (err) {
        console.error('renderWatch error:', err);
        app.innerHTML = `
            <div style="padding:40px; text-align:center; color:#c00;">
                <h2>読み込みに失敗しました</h2>
                <p>${window.utils.escapeHtml(err.message)}</p>
                <a href="https://www.youtube.com/watch?v=${videoId}" target="_blank" style="color:#065fd4;">
                    YouTube公式で開く
                </a>
            </div>
        `;
    }
}

// Netlify高速API（複数試行）
async function fetchFastestNetlify(videoId) {
    try {
        const apiRes = await fetch('/API.json');
        const apiList = await apiRes.json();
        
        const requests = apiList.map(base => 
            fetch(`${base}/video?v=${videoId}`)
                .then(res => res.ok ? res.json() : Promise.reject())
        );

        return await Promise.any(requests);
    } catch (e) {
        console.warn('Netlify Fast API failed');
        return null;
    }
}

// ダウンロード処理
async function handleDownload(videoId) {
    try {
        let videoData = await fetchFastestNetlify(videoId);
        
        if (!videoData) {
            const res = await fetch(`/api/v2/video?v=${videoId}`);
            if (res.ok) videoData = await res.json();
        }

        if (!videoData) throw new Error('データ取得失敗');

        const prog = videoData.formatStreams?.find(f => 
            f.itag === 18 || f.qualityLabel?.includes('360')
        ) || videoData.videoFormats?.[0];

        if (prog?.url) {
            window.open(prog.url, '_blank');
        } else {
            alert('ダウンロード可能なストリームが見つかりませんでした');
        }
    } catch (e) {
        console.error(e);
        alert('ダウンロードの準備に失敗しました');
    }
}

// コメント読み込み
async function setupComments(videoId) {
    const list = document.getElementById('commentsList');
    if (!list) return;

    list.innerHTML = '<div style="padding:20px; text-align:center; color:#606060;">コメントを読み込んでいます...</div>';

    try {
        const res = await window.utils.pipedFetch(`/comments/${videoId}`, { sort_by: 'top' });
        
        list.innerHTML = '';

        if (res.comments && res.comments.length > 0) {
            res.comments.forEach(c => {
                const div = document.createElement('div');
                div.className = 'comment';
                div.innerHTML = `
                    <img src="${c.thumbnail || 'https://www.gstatic.com/youtube/img/no_thumbnail_140-vflXmJqzd.png'}" 
                         style="width:40px;height:40px;border-radius:50%;object-fit:cover;">
                    <div class="c-body">
                        <div class="name">${window.utils.escapeHtml(c.author || '匿名')}</div>
                        <div class="text">${window.utils.escapeHtml(c.commentText || '').replace(/\n/g, '<br>')}</div>
                    </div>
                `;
                list.appendChild(div);
            });
        } else {
            list.innerHTML = '<div style="padding:20px; text-align:center; color:#606060;">コメントはありません</div>';
        }
    } catch (e) {
        list.innerHTML = '<div style="color:#c00; padding:12px;">コメントの読み込みに失敗しました</div>';
    }
}

// 関連動画読み込み
async function loadRelatedVideos(title, currentVideoId) {
    const relatedList = document.getElementById('relatedList');
    if (!relatedList) return;

    relatedList.innerHTML = '<div style="padding:20px; text-align:center; color:#606060;">読み込み中...</div>';

    try {
        const data = await window.utils.pipedFetch('/search', { q: title, filter: 'videos' });
        const items = Array.isArray(data) ? data : (data?.items || []);

        relatedList.innerHTML = '';

        items.slice(0, 6).forEach(item => {
            const vid = item.url?.split('v=')[1] || item.url?.split('/').pop() || '';
            if (vid === currentVideoId) return;

            const div = document.createElement('div');
            div.className = 'related-item';
            div.innerHTML = `
                <div class="related-thumb">
                    <img src="${item.thumbnail}" alt="" loading="lazy">
                </div>
                <div class="related-info">
                    <div class="title">${window.utils.escapeHtml(item.title || '')}</div>
                    <div style="color:#606060; font-size:13px;">
                        ${window.utils.escapeHtml(item.uploaderName || '')}
                    </div>
                </div>
            `;
            div.addEventListener('click', () => {
                location.hash = `watch=${vid}`;
            });
            relatedList.appendChild(div);
        });
    } catch (e) {
        relatedList.innerHTML = '<div style="padding:20px; color:#c00;">関連動画の取得に失敗しました</div>';
    }
}

// メタデータ正規化
function normalizeMetadata(data, source) {
    return {
        title: data.title || '',
        description: data.description || data.shortDescription || '',
        viewCount: data.viewCount || data.views || 0,
        likeCount: data.likeCount || data.likes || 0,
        published: data.published || data.uploadDate || data.uploaded || '',
        uploader: data.uploader || data.author || data.channelName || '',
        channelId: data.channelId || data.authorId || '',
        uploaderAvatar: data.uploaderAvatar || data.avatar || '',
        subscriberCount: data.subscriberCount || 0,
        source
    };
}

// グローバル公開
window.watch = {
    renderWatch,
    setupComments,
    handleDownload
};
