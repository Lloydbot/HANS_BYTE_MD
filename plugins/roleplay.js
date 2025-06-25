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

cmd({
  pattern: "roleplay",
  alias: ["rp"],
  react: "🎭",
  desc: "Generate a roleplay scene with Gemini AI",
  category: "fun",
  use: ".roleplay <character or scene>",
  filename: __filename
}, async (_context, _message, _args, { sender, q, reply, pushname }) => {
  try {
    if (!q) return reply("❗️ Please provide a roleplay character or scene, e.g., `.roleplay vampire`");

    const prompt = `You are a creative roleplay AI called HANS BYTE. Create a vivid and engaging short roleplay dialogue or scene for this topic: "${q}". Write it in character, with emotions fully. use simple english or any lang and keep it cool make the use of emojis and immersive descriptions.`;

    const requestBody = {
      contents: [{ parts: [{ text: prompt }] }]
    };

    const response = await axios.post(GEMINI_API_URL, requestBody, {
      headers: { "Content-Type": "application/json" }
    });

    if (!response.data?.candidates?.[0]?.content?.parts) {
      return reply("❌ Error: No response from AI.");
    }

    newsletterContext.mentionedJid = [sender];
    const aiResponse = response.data.candidates[0].content.parts[0].text;

    // Reply with the AI generated roleplay text
    await reply(aiResponse, { contextInfo: newsletterContext });
  } catch (error) {
    console.error("Roleplay plugin error:", error.response?.data || error.message);
    reply("❌ Error generating roleplay scene 😢");
  }
});
