const { cmd } = require("../command");
const axios = require("axios");

const config = require("../config");
const GEMINI_API_KEY = config.GEMINI_API_KEY;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

const newsletterContext = {
  mentionedJid: [],
  forwardingScore: 1000,
  isForwarded: true,
  forwardedNewsletterMessageInfo: {
    newsletterJid: "120363292876277898@newsletter",
    newsletterName: "𝐇𝐀𝐍𝐒 𝐁𝐘𝐓𝐄 𝐌𝐃",
    serverMessageId: 143,
  },
};

// Helper function to extract text from quoted message robustly
function getQuotedText(quoted) {
  if (!quoted || !quoted.message) return null;

  if (quoted.message.conversation) return quoted.message.conversation;
  if (quoted.message.extendedTextMessage?.text) return quoted.message.extendedTextMessage.text;
  if (quoted.message.imageMessage?.caption) return quoted.message.imageMessage.caption;
  if (quoted.message.videoMessage?.caption) return quoted.message.videoMessage.caption;
  if (quoted.message.documentMessage?.caption) return quoted.message.documentMessage.caption;

  return null;
}

cmd(
  {
    pattern: "summarize",
    alias: ["sum", "summary"],
    react: "📝",
    desc: "Summarize long text. Reply to text or provide text directly.",
    category: "ai",
    filename: __filename,
  },
  async (
    conn,
    mek,
    m,
    { from, quoted, args, q, sender, reply }
  ) => {
    try {
      // Extract text to summarize either from reply or command args
      let textToSummarize = "";

      if (quoted) {
        textToSummarize = getQuotedText(quoted);
        if (!textToSummarize) {
          return conn.sendMessage(
            from,
            { text: "❗️ Please reply to a text message or provide text to summarize.", contextInfo: newsletterContext },
            { quoted: mek }
          );
        }
      } else if (q) {
        textToSummarize = q;
      } else {
        return conn.sendMessage(
          from,
          { text: `❗️ Please reply to a message or provide text. Example: *${m.prefix}summarize Your long text here*`, contextInfo: newsletterContext },
          { quoted: mek }
        );
      }

      // Prepare prompt for Gemini AI summarization
      const prompt = `Please provide a detailed, well-structured summary of the following text:\n\n${textToSummarize}`;

      const requestBody = {
        contents: [{ parts: [{ text: prompt }] }],
      };

      const response = await axios.post(GEMINI_API_URL, requestBody, {
        headers: { "Content-Type": "application/json" },
      });

      if (!response.data?.candidates?.[0]?.content?.parts) {
        return conn.sendMessage(
          from,
          { text: "❌ Error: No response from AI.", contextInfo: newsletterContext },
          { quoted: mek }
        );
      }

      newsletterContext.mentionedJid = [sender];
      const summary = response.data.candidates[0].content.parts[0].text;

      await conn.sendMessage(
        from,
        { text: summary, contextInfo: newsletterContext },
        { quoted: mek }
      );
    } catch (e) {
      console.error("Error in summarize command:", e.response?.data || e.message || e);
      await conn.sendMessage(
        from,
        { text: `❎ Error occurred: ${e.message || e}`, contextInfo: newsletterContext },
        { quoted: mek }
      );
    }
  }
);
