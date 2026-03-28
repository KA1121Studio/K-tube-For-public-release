// js/utils.js
// 共通ユーティリティ関数（元のコードからほぼそのまま抽出）

const PIPED_API_BASE = '/piped';
const MAX_RESULTS = 12;

const el = id => document.getElementById(id);

// 数値フォーマット
function fmtNum(n) {
    if (n == null || isNaN(n)) return '0';
    return Number(n).toLocaleString('en-US');
}

// 時間前表示
function timeAgo(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;

    const s = Math.floor((Date.now() - d.getTime()) / 1000);

    if (s < 60) return s + '秒前';
    if (s < 3600) return Math.floor(s / 60) + '分前';
    if (s < 86400) return Math.floor(s / 3600) + '時間前';
    if (s < 2592000) return Math.floor(s / 86400) + '日前';
    if (s < 31536000) return Math.floor(s / 2592000) + 'ヶ月前';
    return Math.floor(s / 31536000) + '年以上前';
}

// HTMLエスケープ
function escapeHtml(s = '') {
    return String(s)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

// Piped API フェッチ
async function pipedFetch(endpoint, params = {}) {
    let path = endpoint.startsWith('/') ? endpoint : '/' + endpoint;
    const queryString = new URLSearchParams(params).toString();
    const fullPath = queryString ? `${path}?${queryString}` : path;

    const response = await fetch(`${PIPED_API_BASE}${fullPath}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
        throw new Error(`Piped proxy error: ${response.status} ${response.statusText}`);
    }
    return response.json();
}

// チャンネルサムネイル（キャッシュ付き）
let channelThumbCache = {};

async function getChannelThumbPiped(channelId) {
    if (channelThumbCache[channelId]) return channelThumbCache[channelId];

    try {
        const data = await pipedFetch(`/channel/${channelId}`);
        const thumb = data.avatarUrl || '';
        channelThumbCache[channelId] = thumb;
        return thumb;
    } catch (e) {
        console.warn('channel thumb failed', e);
        return '';
    }
}

// 動画カード作成（元のコードに忠実）
async function makeVideoCard(item) {
    const vid = item.url?.split('v=')[1] || item.url?.split('/').pop() || '';
    const title = item.title || '';
    const th = item.thumbnail || '';
    const chId = item.uploaderUrl?.split('/').pop() || '';
    const chTitle = item.uploaderName || '';
    const views = item.views || 0;
    const publishedAt = item.uploadedDate || item.uploaded || '';

    const channelThumb = await getChannelThumbPiped(chId);

    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = `
        <div class="thumb" data-vid="${vid}">
            <img src="${th}" alt="">
        </div>
        <div class="meta">
            <div class="channel-thumb"><img src="${channelThumb}" alt=""></div>
            <div class="info">
                <div class="title">${escapeHtml(title)}</div>
                <div class="sub">
                    <a href="#channel=${chId}" data-channel="${chId}" class="ch-link">${escapeHtml(chTitle)}</a>
                    ・ ${fmtNum(views)} 回視聴 ・ ${timeAgo(publishedAt)}
                </div>
            </div>
        </div>
    `;

    div.querySelector('.thumb').addEventListener('click', () => {
        location.hash = `watch=${vid}`;
    });

    div.querySelector('.ch-link').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        location.hash = `channel=${chId}`;
    });

    return div;
}

// グローバル公開
window.utils = {
    el,
    fmtNum,
    timeAgo,
    escapeHtml,
    pipedFetch,
    getChannelThumbPiped,
    makeVideoCard
};
