import express from "express";
import fetch from "node-fetch";
import { fileURLToPath } from "url";
import path from "path";
import { execSync } from "child_process";   // ← これを追加！（yt-dlpで必須）

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 静的ファイル配信（css, js, API.json などを公開）
app.use(express.static(__dirname));

// ====================== グローバル変数 ======================
let totalAccesses = 0;
let todayAccesses = 0;
let todayDate = new Date().toISOString().split('T')[0];
let activeUsers = new Map();
const ONLINE_TIMEOUT = 5 * 60 * 1000;

// yt-dlp キャッシュ
const videoCache = new Map();
const CACHE_TIME = 1000 * 60 * 60 * 3; // 3時間

// ====================== ルート ======================
app.get("/", (req, res) => {
  totalAccesses++;
  todayAccesses++;
  updateTodayCount();
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/watch.html", (req, res) => {
  totalAccesses++;
  todayAccesses++;
  updateTodayCount();
  res.sendFile(path.join(__dirname, "watch.html"));
});

// 今日の日付が変わったらリセット
function updateTodayCount() {
  const currentDate = new Date().toISOString().split('T')[0];
  if (currentDate !== todayDate) {
    todayAccesses = 0;
    todayDate = currentDate;
  }
}

app.get("/video", async (req, res) => {
  const videoId = req.query.id;
  if (!videoId) return res.status(400).json({ error: "video id required" });

  // キャッシュ確認
  const cached = videoCache.get("video_" + videoId);
  if (cached && Date.now() - cached.time < CACHE_TIME) {
    console.log("CACHE HIT:", videoId);
    return res.json(cached.data);
  }

  try {
    const output = execSync(
      `yt-dlp --cookies youtube-cookies.txt --js-runtimes node --remote-components ejs:github --sleep-requests 1 --user-agent "Mozilla/5.0" --get-url -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]" https://youtu.be/${videoId}`
    ).toString().trim().split("\n");

    const videoUrl = output[0] || "";
    const audioUrl = output[1] || videoUrl;

    if (!videoUrl) {
      throw new Error("No valid stream URL extracted. Cookies may be expired.");
    }

    const data = {
      video: videoUrl,
      audio: audioUrl,
      source: "yt-dlp"
    };

    // キャッシュ保存
    videoCache.set("video_" + videoId, {
      data,
      time: Date.now()
    });

    console.log("CACHE SAVE:", videoId);

    res.json(data);

  } catch (e) {
    console.error("yt-dlp error:", e.message, e.stack);
    res.status(500).json({
      error: "failed_to_extract_video",
      message: e.message.includes("Sign in") 
        ? "YouTubeがボット判定しました。youtube-cookies.txtを最新のものに更新してください" 
        : e.message
    });
  }
});


// ★ 360p・音声＋映像 合体（キャッシュ付き）
app.get("/video360", async (req, res) => {
  const videoId = req.query.id;
  if (!videoId) return res.status(400).json({ error: "video id required" });

  // キャッシュ確認
  const cached = videoCache.get("video360_" + videoId);
  if (cached && Date.now() - cached.time < CACHE_TIME) {
    console.log("CACHE HIT 360:", videoId);
    return res.json(cached.data);
  }

  try {
    const output = execSync(
      `yt-dlp --cookies youtube-cookies.txt \
--js-runtimes node \
--remote-components ejs:github \
--sleep-requests 1 \
--user-agent "Mozilla/5.0" \
--get-url \
-f "best[ext=mp4][height<=360]/best[ext=mp4]/best" \
https://youtu.be/${videoId}`
    ).toString().trim();

    if (!output) throw new Error("No valid 360p stream");

    const data = {
      video: output,
      audio: output,
      source: "yt-dlp-360p-progressive"
    };

    // キャッシュ保存
    videoCache.set("video360_" + videoId, {
      data,
      time: Date.now()
    });

    console.log("CACHE SAVE 360:", videoId);

    res.json(data);

  } catch (e) {
    console.error("yt-dlp 360p error:", e.message);
    res.status(500).json({
      error: "failed_to_extract_video_360",
      message: e.message
    });
  }
});

// server.js に追加

app.get('/api/v2/video', async (req, res) => {
  const videoId = req.query.v;
  if (!videoId) return res.status(400).json({ error: "video id required" });

  const invidiousInstances = [
    "https://nyc1.iv.ggtyler.dev",
    "https://invid-api.poketube.fun",
    "https://cal1.iv.ggtyler.dev",
    "https://invidious.nikkosphere.com",
    "https://lekker.gay",
    "https://invidious.f5.si",
    "https://invidious.lunivers.trade"
    // 必要に応じて追加
  ];

  for (const base of invidiousInstances) {
    try {
      const url = `${base}/api/v1/videos/${videoId}`;
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; K-tube/1.0)' }
      });

      if (!response.ok) continue;

      const data = await response.json();

      // 必要なフィールドだけ整形して返す（フロントと合わせる）
      const result = {
        title: data.title || "不明",
        description: data.description || "",
        viewCount: data.viewCount || 0,
        likeCount: data.likeCount || 0,
        published: data.published 
          ? new Date(data.published * 1000).toISOString() 
          : null,
        uploader: data.author || "不明",
        uploaderUrl: `/channel/${data.authorId || ""}`,
        uploaderAvatar: data.authorThumbnails?.[data.authorThumbnails.length-1]?.url || "",
        thumbnail: data.videoThumbnails?.find(t => t.quality === "maxres")?.url 
                 || data.videoThumbnails?.[0]?.url || "",
        lengthSeconds: data.lengthSeconds || 0,
        // 再生用ストリーム（高画質adaptive + 音声込みprogressive）
        adaptiveFormats: data.adaptiveFormats || [],
        formatStreams: data.formatStreams || [],     // ← ここに360pなどが入る
        relatedStreams: data.recommendedVideos || [] // 関連動画も取れる
      };

      return res.json(result);
    } catch (err) {
      console.warn(`Invidious ${base} failed:`, err.message);
      // 次を試す
    }
  }

  res.status(503).json({ error: "All Invidious instances failed" });
});

// プロキシ（動画チャンク配信用）
app.get("/proxy", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send("URL required");

  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const now = Date.now();

  const lastAccess = activeUsers.get(ip) || 0;
  if (now - lastAccess > ONLINE_TIMEOUT) {
    activeUsers.set(ip, now);
  }

  const currentDate = new Date().toISOString().split('T')[0];
  if (currentDate !== todayDate) {
    todayAccesses = 0;
    todayDate = currentDate;
  }

  // ここもアクセス数としてカウント（必要に応じてコメントアウト可）
  totalAccesses++;
  todayAccesses++;

  const range = req.headers.range || "bytes=0-";

  try {
    const response = await fetch(url, {
      headers: { Range: range }
    });

    const headers = {
      "Content-Type": response.headers.get("content-type") || "video/mp4",
      "Accept-Ranges": "bytes",
      "Content-Range": response.headers.get("content-range") || range,
      "Content-Length": response.headers.get("content-length")
    };

    res.writeHead(response.status, headers);
    response.body.pipe(res);
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).send("Proxy failed");
  }
});

// サムネイルプロキシ
app.get("/thumb-proxy", async (req, res) => {
  const url = req.query.url;
  if (!url) {
    console.log("No thumbnail URL");
    return res.status(400).send("URL required");
  }

  console.log(`Proxying thumbnail: ${url}`);

  const allowedHosts = ['yt3.ggpht.com', 'ggpht.com', 'googleusercontent.com', 'pipedproxy', 'private.coffee', 'kavin.rocks'];
  try {
    const urlObj = new URL(url);
    if (!allowedHosts.some(h => urlObj.hostname.includes(h))) {
      console.log(`Blocked invalid host: ${urlObj.hostname}`);
      return res.status(403).send("Invalid host");
    }

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Referer": "https://www.youtube.com/",
        "Origin": "https://www.youtube.com",
        "Accept": "image/webp,*/*;q=0.8"
      },
      redirect: 'follow'
    });

    if (!response.ok) {
      const err = await response.text().catch(() => '');
      console.error(`Fetch failed ${response.status}: ${err}`);
      return res.status(response.status).send("Fetch error");
    }

    const buffer = await response.arrayBuffer();

    const headers = {
      "Content-Type": response.headers.get("content-type") || "image/webp",
      "Content-Length": buffer.byteLength,
      "Cache-Control": "public, max-age=604800",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
      "Vary": "Origin"
    };

    res.writeHead(200, headers);
    res.end(Buffer.from(buffer));
  } catch (err) {
    console.error("Proxy error:", err.message);
    res.status(500).send("Proxy failed");
  }
});

// HLS用プロキシ
app.get("/proxy-hls", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send("URL required");

  try {
    const r = await fetch(url);
    let text = await r.text();

    text = text.replace(
      /(https?:\/\/[^\s]+)/g,
      (m) => m.includes("googlevideo.com") ? `/proxy?url=${encodeURIComponent(m)}` : m
    );

    res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
    res.send(text);
  } catch (err) {
    res.status(500).send("HLS proxy failed");
  }
});

// Piped API プロキシ
const pipedInstances = [
  'https://api.piped.private.coffee',
  'https://pipedapi.kavin.rocks',
  'https://pipedapi.tokhmi.xyz'
];

app.get('/piped/*', async (req, res) => {
  const path = req.path.replace('/piped', '');
  const query = new URLSearchParams(req.query).toString();

  for (const base of pipedInstances) {
    const targetUrl = `${base}${path}${query ? '?' + query : ''}`;
    try {
      const response = await fetch(targetUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      if (response.ok) {
        const contentType = response.headers.get('content-type');
        res.setHeader('Content-Type', contentType || 'application/json');
        return response.body.pipe(res);
      }
      console.log(`Instance ${base} failed with ${response.status}`);
    } catch (e) {
      console.error(`Instance ${base} error:`, e.message);
    }
  }

  res.status(503).json({ error: 'All Piped instances failed' });
});

app.get("/download", async (req, res) => {
  const url = req.query.url;
  if (!url) {
    return res.status(400).send("URL required");
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    if (!response.ok) {
      console.error("Download fetch failed:", response.status);
      return res.status(response.status).send("Download fetch failed");
    }

    res.setHeader(
      "Content-Disposition",
      'attachment; filename="video_360p.mp4"'
    );

    res.setHeader(
      "Content-Type",
      response.headers.get("content-type") || "video/mp4"
    );

    response.body.pipe(res);

  } catch (err) {
    console.error("Download proxy error:", err);
    res.status(500).send("Download failed");
  }
});

// 統計取得API
app.get("/stats", (req, res) => {
  const now = Date.now();
  let onlineCount = 0;

  for (const [ip, timestamp] of activeUsers.entries()) {
    if (now - timestamp <= ONLINE_TIMEOUT) {
      onlineCount++;
    } else {
      activeUsers.delete(ip);
    }
  }

  const currentDate = new Date().toISOString().split('T')[0];
  if (currentDate !== todayDate) {
    todayAccesses = 0;
    todayDate = currentDate;
  }

  res.json({
    total_views: totalAccesses,
    today_views: todayAccesses,
    online_now: onlineCount
  });
});

// テスト用：指定回数だけ統計を増やす（本番では削除推奨）
app.get("/fake-views", (req, res) => {
  try {
    const times = parseInt(req.query.times) || 1;
    if (isNaN(times) || times < 1 || times > 1000) {
      return res.status(400).json({ error: "回数は1〜1000の間で指定してください" });
    }

    totalAccesses += times;
    todayAccesses += times;

    console.log(`[FAKE] ${times}回分追加 → total:${totalAccesses} today:${todayAccesses}`);

    res.json({
      success: true,
      added: times,
      total_views: totalAccesses,
      today_views: todayAccesses
    });
  } catch (err) {
    console.error("fake-views error:", err);
    res.status(500).json({ error: "サーバー内部エラー", message: err.message });
  }
});


// 最後にサーバー起動
app.listen(PORT, () => {
  console.log(`K-tube Server running on port ${PORT}`);
});
