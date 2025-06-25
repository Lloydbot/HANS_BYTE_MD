const { cmd } = require('../command');

cmd(
  {
    pattern: "online",
    alias: ["on"],
    desc: "Mention all online users in the group.",
    react: "🟢",
    category: "main",
    filename: __filename,
  },
  async (robin, mek, m, { from, isGroup, reply, sender }) => {
    try {
      if (!isGroup) return reply("❌ This command only works in groups.");

      // Access the presence info from the message metadata if available
      // Note: Baileys presence is available in event 'presence.update' usually,
      // but here we try to get from message directly if possible
      const presences = m.presences || {}; // presences object: jid -> presence info

      // Filter online users
      const onlineUsers = Object.entries(presences)
        .filter(([jid, presence]) => presence?.lastKnownPresence === "available")
        .map(([jid]) => jid);

      if (onlineUsers.length === 0) return reply("No users are online right now.");

      // Build mention text
      let mentionText = "🟢 Online users:\n";
      onlineUsers.forEach((jid) => {
        // Use part before @ as username fallback
        const username = jid.split("@")[0];
        mentionText += `@${username}\n`;
      });

      // Context info for mentions
      const contextInfo = { mentionedJid: onlineUsers };

      await robin.sendMessage(
        from,
        { text: mentionText, contextInfo },
        { quoted: mek }
      );
    } catch (e) {
      console.error("Error in online command:", e);
      reply("❌ Failed to get online users.");
    }
  }
);
