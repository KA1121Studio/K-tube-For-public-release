/* =========================
   App Entry / Router
========================= */

const app = document.getElementById('app');
const searchInput = document.getElementById('searchInput');

// ===== ルーティング =====

function renderByHash() {
  const h = location.hash.slice(1);

  document.body.classList.remove('watch-page');

  if (!h) {
    renderHome();
  } else {
    const [k, v] = h.split('=');

    if (k === 'watch') {
      renderWatch(v);
      document.body.classList.add('watch-page');
    } else if (k === 'channel') {
      renderChannel(v);
    } else if (k === 'search') {
      if (searchInput) {
        searchInput.value = decodeURIComponent(v || '');
      }
      performSearch?.(decodeURIComponent(v || ''));
    } else if (k === 'history') {
      renderHistory();
    } else if (k === 'settings') {
      renderSettings();
    } else {
      renderHome();
    }
  }

  updateSidebarActive?.();
}

// ===== ハッシュ変更監視 =====
window.addEventListener('hashchange', renderByHash);

// ===== 初期ロード =====
window.addEventListener('load', () => {
  renderByHash();
});

// ===== 検索フォーム =====
const searchForm = document.getElementById('searchForm');
if (searchForm) {
  searchForm.addEventListener('submit', e => {
    e.preventDefault();
    const q = searchInput?.value.trim();
    if (q) {
      location.hash = `search=${encodeURIComponent(q)}`;
    }
  });
}
