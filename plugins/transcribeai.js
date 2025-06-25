const { cmd } = require('../command');
const axios = require('axios');
const fs = require('fs');

const ASSEMBLY_API_KEY = '4d39a0a74a184fac810c7adaa01a5538';

cmd(
  {
    pattern: "transcribeai",
    alias: ['transcribe', 'aivoice'],
    desc: "Transcribe voice/audio to text using AssemblyAI",
    category: "tools",
    react: "🧠",
    filename: __filename,
  },
  async (conn, mek, m, { from, quoted, mime, reply }) => {
    try {
      const q = quoted || m.quoted;
      const msg = q?.message || {};

      // ✅ Check all known audio types
      const isAudio =
        !!msg.audioMessage ||
        !!msg.voiceMessage ||
        (!!msg.documentMessage &&
          msg.documentMessage.mimetype &&
          msg.documentMessage.mimetype.startsWith("audio"));

      if (!q || !isAudio) {
        return reply("🎙️ *Please reply to a voice message or audio file.*");
      }

      reply("📥 Downloading audio...");

      const mediaPath = await conn.downloadAndSaveMediaMessage(q);
      const fileStream = fs.createReadStream(mediaPath);

      // Upload to AssemblyAI
      const uploadRes = await axios.post(
        "https://api.assemblyai.com/v2/upload",
        fileStream,
        {
          headers: {
            authorization: ASSEMBLY_API_KEY,
            'content-type': 'application/octet-stream',
          },
        }
      );

      const audio_url = uploadRes.data.upload_url;
      reply("📤 Audio uploaded. Transcribing...");

      // Transcription request
      const transcriptRes = await axios.post(
        "https://api.assemblyai.com/v2/transcript",
        { audio_url },
        {
          headers: {
            authorization: ASSEMBLY_API_KEY,
            'content-type': 'application/json',
          },
        }
      );

      const transcriptId = transcriptRes.data.id;

      // Poll for result
      let transcriptText = "⌛ Transcribing...";
      for (let i = 0; i < 15; i++) {
        await new Promise((res) => setTimeout(res, 4000));
        const polling = await axios.get(
          `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
          { headers: { authorization: ASSEMBLY_API_KEY } }
        );

        if (polling.data.status === "completed") {
          transcriptText = polling.data.text;
          break;
        } else if (polling.data.status === "error") {
          transcriptText = `❌ Transcription Error: ${polling.data.error}`;
          break;
        }
      }

      fs.unlinkSync(mediaPath); // delete downloaded file

      await conn.sendMessage(
        from,
        { text: `📝 *Transcription Result:*\n\n${transcriptText}` },
        { quoted: mek }
      );
    } catch (err) {
      console.error(err);
      await conn.sendMessage(
        from,
        { text: `❎ Error: ${err.message || err}` },
        { quoted: mek }
      );
    }
  }
);
