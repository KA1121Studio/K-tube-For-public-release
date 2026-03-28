// server.js（分割構成対応版）
import express from "express";
import fetch from "node-fetch";
import { fileURLToPath } from "url";
import path from "path";
import { execSync } from "child_process";

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 統計用変数
let totalAccesses = 0;
let todayAccesses = 0;
let todayDate = new Date().toISOString().split('T')[0];
let activeUsers = new Map();
const ONLINE_TIMEOUT = 5 * 60 * 1000; // 5分

// 動画URLキャッシュ
const videoCache = new Map();
const CACHE_TIME = 1000 * 60 * 60 * 3; // 3時間

// 静的ファイル配信（css, js, index.html など）
app.use(express.static(__dirname));

// ルートで index.html を返す
app.get("/", (req, res) => {
    updateAccessStats();
    res.sendFile(path.join(__dirname, "index.html"));
});

// 統計API
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

// アクセス数増加用（ページロード時などに使用）
app.get("/fake-views", (req, res) => {
    const times = parseInt(req.query.times) || 1;
    if (times < 1 || times > 1000) {
        return res.status(400).json({ error: "times は1〜1000の間で指定してください" });
    }

    totalAccesses += times;
    todayAccesses += times;

    console.log(`[FAKE VIEWS] ${times}回追加 → Total:${totalAccesses} Today:${todayAccesses}`);
    res.json({ success: true, added: times });
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
                    'User-Agent': 'Mozilla/5.0'
                }
            });

            if (response.ok) {
                res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json');
                return response.body.pipe(res);
            }
        } catch (e) {
            console.warn(`Piped instance ${base} failed`);
        }
    }

    res.status(503).json({ error: 'All Piped instances failed' });
});

// Invidious経由の動画情報API
app.get('/api/v2/video', async (req, res) => {
    const videoId = req.query.v;
    if (!videoId) return res.status(400).json({ error: "video id required" });

    const invidiousInstances = [
        "https://nyc1.iv.ggtyler.dev",
        "https://invid-api.poketube.fun",
        "https://cal1.iv.ggtyler.dev",
        "https://invidious.nikkosphere.com"
    ];

    for (const base of invidiousInstances) {
        try {
            const url = `${base}/api/v1/videos/${videoId}`;
            const response = await fetch(url, {
                headers: { 'User-Agent': 'Mozilla/5.0 (compatible; K-tube/1.0)' }
            });

            if (response.ok) {
                const data = await response.json();
                return res.json({
                    title: data.title,
                    description: data.description,
                    viewCount: data.viewCount,
                    likeCount: data.likeCount,
                    published: data.published,
                    uploader: data.author,
                    channelId: data.authorId,
                    uploaderAvatar: data.authorThumbnails?.[data.authorThumbnails.length-1]?.url || "",
                    formatStreams: data.formatStreams || [],
                    adaptiveFormats: data.adaptiveFormats || []
                });
            }
        } catch (err) {
            console.warn(`Invidious ${base} failed`);
        }
    }

    res.status(503).json({ error: "All Invidious instances failed" });
});

// サムネイルプロキシ
app.get("/thumb-proxy", async (req, res) => {
    const url = req.query.url;
    if (!url) return res.status(400).send("URL required");

    try {
        const response = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0",
                "Referer": "https://www.youtube.com/"
            }
        });

        if (!response.ok) return res.status(response.status).send("Fetch error");

        const buffer = await response.arrayBuffer();
        res.setHeader("Content-Type", response.headers.get("content-type") || "image/webp");
        res.setHeader("Cache-Control", "public, max-age=604800");
        res.end(Buffer.from(buffer));
    } catch (err) {
        res.status(500).send("Proxy failed");
    }
});

// アクセス統計更新関数
function updateAccessStats() {
    totalAccesses++;
    todayAccesses++;

    const currentDate = new Date().toISOString().split('T')[0];
    if (currentDate !== todayDate) {
        todayAccesses = 0;
        todayDate = currentDate;
    }

    const ip = "unknown"; // 本番では req.ip を使用
    activeUsers.set(ip, Date.now());
}

app.listen(PORT, () => {
    console.log(`🚀 K-tube Server running on http://localhost:${PORT}`);
});
