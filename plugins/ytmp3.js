const { cmd } = require('../command');
const yts = require('yt-search');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const { pipeline } = require('stream');
const ffmpeg = require('fluent-ffmpeg');

const newsletterContext = {
  mentionedJid: [],
  forwardingScore: 1000,
  isForwarded: true,
  forwardedNewsletterMessageInfo: {
    newsletterJid: '120363292876277898@newsletter',
    newsletterName: "𝐇𝐀𝐍𝐒 𝐁𝐘𝐓𝐄 𝐌𝐃",
    serverMessageId: 143,
  }
};

cmd({
  pattern: "play",
  alias: ['ytsong', 'song'],
  react: "🎵",
  desc: "Download audio from YouTube",
  category: "download",
  filename: __filename
},
async (conn, mek, m, { from, q, reply, sender }) => {
  if (!q) return reply("*❌ Please provide a song title or YouTube URL*");

  try {
    // 1) Search YouTube
    const search = await yts(q);
    const video = search.videos[0];
    if (!video) return reply("*❌ No results found*");

    const messageContext = {
      ...newsletterContext,
      mentionedJid: [sender]
    };

    // 2) Send info banner
    const infoMsg = `
╔═══〘 🎧 𝙈𝙋𝟛 𝘿𝙇 〙═══╗

⫸ 🎵 *Title:* ${video.title}
⫸ 👤 *Channel:* ${video.author.name}
⫸ ⏱️ *Duration:* ${video.timestamp}
⫸ 👁️ *Views:* ${video.views.toLocaleString()} views

╚══ ⸨ 𝙃𝘼𝙉𝙎 𝘽𝙔𝙏𝙀 𝙈𝘿 ⸩ ═══╝`.trim();

    await conn.sendMessage(from, {
      image: { url: video.thumbnail },
      caption: infoMsg,
      contextInfo: messageContext
    }, { quoted: mek });

    // 3) Notify user
    await reply("⏬ Downloading video…");

    // 4) Hit the MP4 API
    const apiUrl = `https://apis.davidcyriltech.my.id/download/ytmp4?url=${encodeURIComponent(video.url)}`;
    const apiRes = await fetch(apiUrl);
    const apiJson = await apiRes.json();
    if (!apiJson.success || !apiJson.result?.download_url) {
      return reply("*❌ Failed to get video download link*");
    }
    const videoUrl = apiJson.result.download_url;

    // 5) Download MP4
    const tempDir = path.resolve(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
    const mp4Path = path.join(tempDir, `${Date.now()}.mp4`);
    await new Promise((resolve, reject) => {
      console.log(`Downloading to ${mp4Path}`);
      fetch(videoUrl).then(res => {
        const total = Number(res.headers.get('content-length')) || 0;
        let downloaded = 0;
        res.body.on('data', chunk => {
          downloaded += chunk.length;
          if (total) process.stdout.write(`\r${(downloaded/total*100).toFixed(1)}%`);
        });
        pipeline(res.body, fs.createWriteStream(mp4Path), err => {
          console.log();
          if (err) reject(err);
          else resolve();
        });
      }).catch(reject);
    });
    console.log('Download complete.');

    // 6) Notify user
    await reply("🔄 Converting to MP3…");

    // 7) Convert to MP3
    const mp3Path = mp4Path.replace(/\.mp4$/, '.mp3');
    await new Promise((resolve, reject) => {
      ffmpeg(mp4Path)
        .audioCodec('libmp3lame')
        .on('progress', p => {
          if (p.percent) process.stdout.write(`\r${p.percent.toFixed(1)}%`);
        })
        .on('end', () => {
          console.log('\nConversion done.');
          resolve();
        })
        .on('error', reject)
        .save(mp3Path);
    });

    // 8) Send MP3 back
    const safeTitle = video.title.replace(/[\\/:"*?<>|]+/g, '').slice(0,50);

    // audio message
    await conn.sendMessage(from, {
      audio: { url: mp3Path },
      mimetype: 'audio/mp4',
      fileName: `${safeTitle}.mp3`,
      ptt: false,
      contextInfo: messageContext
    }, { quoted: mek });

    // document (mp3) message via ReadStream
    const docStream = fs.createReadStream(mp3Path);
    await conn.sendMessage(from, {
      document: docStream,
      mimetype: 'audio/mp4',
      fileName: `${safeTitle}.mp3`,
      caption: "*📁 HANS BYTE MD*",
      contextInfo: messageContext
    }, { quoted: mek });

    // 9) Cleanup
    fs.unlink(mp4Path, () => {});
    fs.unlink(mp3Path, () => {});

  } catch (err) {
    console.error("Audio Error:", err);
    return reply(`*❌ Error:* ${err.message}`);
  }
});





// Command to download audio from YouTube URL

cmd({
    pattern: "ytmp3",
    alias: ['yturlmp3'],
    react: "🎧",
    desc: "Download audio from a YouTube URL",
    category: "download",
    filename: __filename
},
async (conn, mek, m, { from, q, reply, sender }) => {
    if (!q || !q.includes("youtube.com/watch?v=")) {
        return reply("*❌ Please provide a valid YouTube video URL*");
    }

    try {
        const api = `https://itzpire.com/download/youtube/v2?url=${encodeURIComponent(q)}`;
        const res = await fetch(api);
        const data = await res.json();

        if (!data.status || !data.data?.downloadUrl) {
            return reply("*❌ Failed to retrieve MP3 link*");
        }

        const messageContext = {
            ...newsletterContext,
            mentionedJid: [sender]
        };

        const infoMsg = `
╔═━「 🎧 𝙔𝙏𝙈𝙋𝟛 𝘿𝙊𝙒𝙉𝙇𝙊𝘼𝘿 」━═╗

⫸ 📌 *Title:* ${data.data.title}
⫸ 📁 *Format:* MP3
⫸ 🛰️ *Source:* YouTube

╚═━「 𝙃𝘼𝙉𝙎 𝘽𝙔𝙏𝙀 𝙈𝘿 」━═╝
`.trim();

        await conn.sendMessage(from, {
            image: { url: data.data.image },
            caption: infoMsg,
            contextInfo: messageContext
        }, { quoted: mek });

        // Send as audio
        await conn.sendMessage(from, {
            audio: { url: data.data.downloadUrl },
            mimetype: 'audio/mp4',
            fileName: `${data.data.title}.mp3`,
            ptt: false,
            contextInfo: messageContext
        }, { quoted: mek });

        // ✅ Also send as document
        await conn.sendMessage(from, {
            document: { url: data.data.downloadUrl },
            mimetype: 'audio/mp4',
            fileName: `${data.data.title}.mp3`,
            caption: "*📁 HANS BYTE MD*",
            contextInfo: messageContext
        }, { quoted: mek });

    } catch (err) {
        console.error("YTMP3 Error:", err);
        return reply(`*❌ Error:* ${err.message}`);
    }
});




cmd({
    pattern: "yts",
    alias: ['ytsearch'],
    react: "🎧",
    desc: "Search YouTube for a video",
    category: "search",
    filename: __filename
},
async (conn, mek, m, { from, q, reply, sender }) => {
    if (!q) return reply("*❌ Please provide a song title or keywords for search*");

    try {
        // Search YouTube using yt-search
        const search = await yts(q);
        const video = search.videos[0];
        if (!video) return reply("*❌ No results found*");

        // Prepare message context
        const messageContext = {
            ...newsletterContext,
            mentionedJid: [sender]
        };

        const infoMsg = `
╔═━「 🔍 𝙔𝙏 𝙎𝙀𝘼𝙍𝘾𝙃 」━═╗

⫸ 📌 *Title:* ${video.title}
⫸ 👤 *Channel:* ${video.author.name}
⫸ ⏱️ *Duration:* ${video.timestamp}
⫸ 👁️ *Views:* ${video.views.toLocaleString()}
⫸ 🔗 *Link:* ${video.url}

╚═━「 💡 𝙃𝘼𝙉𝙎 𝘽𝙔𝙏𝙀 𝙈𝘿 」━═╝`.trim();

        // Send the search result details back to the user
        await conn.sendMessage(from, {
            image: { url: video.thumbnail },
            caption: infoMsg,
            contextInfo: messageContext
        }, { quoted: mek });

    } catch (err) {
        console.error("YTB Search Error:", err);
        return reply(`*❌ Error:* ${err.message}`);
    }
});

// Command to download audio from YouTube URL

cmd({
    pattern: "ytmp3",
    alias: ['yturlmp3'],
    react: "🎧",
    desc: "Download audio from a YouTube URL",
    category: "download",
    filename: __filename
},
async (conn, mek, m, { from, q, reply, sender }) => {
    if (!q || !q.includes("youtube.com/watch?v=")) {
        return reply("*❌ Please provide a valid YouTube video URL*");
    }

    try {
        const api = `https://itzpire.com/download/youtube/v2?url=${encodeURIComponent(q)}`;
        const res = await fetch(api);
        const data = await res.json();

        if (!data.status || !data.data?.downloadUrl) {
            return reply("*❌ Failed to retrieve MP3 link*");
        }

        const messageContext = {
            ...newsletterContext,
            mentionedJid: [sender]
        };

        const infoMsg = `
╔═━「 🎧 𝙔𝙏𝙈𝙋𝟛 𝘿𝙊𝙒𝙉𝙇𝙊𝘼𝘿 」━═╗

⫸ 📌 *Title:* ${data.data.title}
⫸ 📁 *Format:* MP3
⫸ 🛰️ *Source:* YouTube

╚═━「 𝙃𝘼𝙉𝙎 𝘽𝙔𝙏𝙀 𝙈𝘿 」━═╝
`.trim();

        await conn.sendMessage(from, {
            image: { url: data.data.image },
            caption: infoMsg,
            contextInfo: messageContext
        }, { quoted: mek });

        // Send as audio
        await conn.sendMessage(from, {
            audio: { url: data.data.downloadUrl },
            mimetype: 'audio/mp4',
            fileName: `${data.data.title}.mp3`,
            ptt: false,
            contextInfo: messageContext
        }, { quoted: mek });

        // ✅ Also send as document
        await conn.sendMessage(from, {
            document: { url: data.data.downloadUrl },
            mimetype: 'audio/mp4',
            fileName: `${data.data.title}.mp3`,
            caption: "*📁 HANS BYTE MD*",
            contextInfo: messageContext
        }, { quoted: mek });

    } catch (err) {
        console.error("YTMP3 Error:", err);
        return reply(`*❌ Error:* ${err.message}`);
    }
});




cmd({
    pattern: "yts",
    alias: ['ytsearch'],
    react: "🎧",
    desc: "Search YouTube for a video",
    category: "search",
    filename: __filename
},
async (conn, mek, m, { from, q, reply, sender }) => {
    if (!q) return reply("*❌ Please provide a song title or keywords for search*");

    try {
        // Search YouTube using yt-search
        const search = await yts(q);
        const video = search.videos[0];
        if (!video) return reply("*❌ No results found*");

        // Prepare message context
        const messageContext = {
            ...newsletterContext,
            mentionedJid: [sender]
        };

        const infoMsg = `
╔═━「 🔍 𝙔𝙏 𝙎𝙀𝘼𝙍𝘾𝙃 」━═╗

⫸ 📌 *Title:* ${video.title}
⫸ 👤 *Channel:* ${video.author.name}
⫸ ⏱️ *Duration:* ${video.timestamp}
⫸ 👁️ *Views:* ${video.views.toLocaleString()}
⫸ 🔗 *Link:* ${video.url}

╚═━「 💡 𝙃𝘼𝙉𝙎 𝘽𝙔𝙏𝙀 𝙈𝘿 」━═╝`.trim();

        // Send the search result details back to the user
        await conn.sendMessage(from, {
            image: { url: video.thumbnail },
            caption: infoMsg,
            contextInfo: messageContext
        }, { quoted: mek });

    } catch (err) {
        console.error("YTB Search Error:", err);
        return reply(`*❌ Error:* ${err.message}`);
    }
});
