/* =========================
   Core (Global Constants / State / Utils)
========================= */

// ===== 定数 =====
const PIPED_API_BASE = '/piped';
const MAX_RESULTS = 12;

// ===== グローバル状態 =====
let channelThumbCache = {};
let homeLoading = false;
let observerMap = new Map();
let commentsPageToken = {};

// ===== ユーティリティ =====

// 数値フォーマット
function fmtNum(n) {
  if (!n && n !== 0) return '';
  n = Number(n);
  if (n >= 100000000) return (n / 100000000).toFixed(1) + '億';
  if (n >= 10000) return (n / 10000).toFixed(1) + '万';
  return n.toLocaleString();
}

// 経過時間表示
function timeAgo(dateString) {
  if (!dateString) return '';
  const now = new Date();
  const past = new Date(dateString);
  const diff = Math.floor((now - past) / 1000);

  if (diff < 60) return 'たった今';
  if (diff < 3600) return Math.floor(diff / 60) + '分前';
  if (diff < 86400) return Math.floor(diff / 3600) + '時間前';
  if (diff < 2592000) return Math.floor(diff / 86400) + '日前';
  if (diff < 31536000) return Math.floor(diff / 2592000) + 'ヶ月前';
  return Math.floor(diff / 31536000) + '年前';
}

// HTMLエスケープ
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ===== Piped API =====

// Piped fetch
async function pipedFetch(endpoint) {
  const res = await fetch(`${PIPED_API_BASE}${endpoint}`);
  if (!res.ok) throw new Error('Piped API error');
  return res.json();
}

// チャンネルサムネ取得（キャッシュ付き）
async function getChannelThumbPiped(channelId) {
  if (!channelId) return '';
  if (channelThumbCache[channelId]) {
    return channelThumbCache[channelId];
  }
  try {
    const data = await pipedFetch(`/channel/${channelId}`);
    const thumb = data?.avatarUrl || '';
    channelThumbCache[channelId] = thumb;
    return thumb;
  } catch {
    return '';
  }
}

// ===== メタデータ正規化 =====

function normalizeMetadata(video) {
  return {
    id: video.id || video.videoId,
    title: video.title || '',
    uploader: video.uploader || video.author || '',
    uploaderUrl: video.uploaderUrl || '',
    uploaderAvatar: video.uploaderAvatar || '',
    views: video.views || video.viewCount || 0,
    duration: video.duration || 0,
    uploadedDate: video.uploadedDate || video.published || '',
    thumbnail: video.thumbnail || video.thumbnailUrl || ''
  };
}

// ===== 高速Netlify取得（Promise.any） =====

async function fetchFastestNetlify(urls) {
  return Promise.any(
    urls.map(url =>
      fetch(url).then(res => {
        if (!res.ok) throw new Error('fail');
        return res.json();
      })
    )
  );
}
