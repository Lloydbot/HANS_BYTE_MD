const { cmd } = require("../command");
const config = require("../config");
const fetch = require("node-fetch");

const fetchJson = async (url) => {
  const res = await fetch(url);
  return res.json();
};

cmd({
    pattern: "tagall",
    react: "🔊",
    alias: ["f_tagall"],
    desc: "To Tag all Members with optional message and group info",
    category: "group",
    use: '.tagall [your message]',
    filename: __filename
},
async (conn, mek, m, {
    from, isGroup, isAdmins, isBotAdmins, isDev,
    groupMetadata, participants, reply, args
}) => {
    try {
        const msr = (await fetchJson('https://raw.githubusercontent.com/Um4r719/UD-MD-DATA/refs/heads/main/DATABASE/mreply.json')).replyMsg;

        if (!isGroup) return reply(msr.only_gp);
        if (!isAdmins && !isDev) return reply(msr.you_adm);
        if (!isBotAdmins) return reply(msr.give_adm);

        const groupName = groupMetadata.subject;
        const groupDesc = groupMetadata.desc || "No description";
        const totalMembers = participants.length;
        const totalAdmins = groupMetadata.participants.filter(p => p.admin !== null).length;

        const extraMsg = args.length > 0 ? args.join(" ") : "*HI ALL! GIVE YOUR ATTENTION PLEASE!*";

        let teks = `📣 *Group Tag*\n`;
        teks += `🏷️ *Group:* ${groupName}\n`;
        teks += `👥 *Members:* ${totalMembers}\n`;
        teks += `🛡️ *Admins:* ${totalAdmins}\n`;
        teks += `\n💬 *Message:* ${extraMsg}\n\n`;

        for (let mem of participants) {
            teks += `👤 @${mem.id.split('@')[0]}\n`;
        }

        await conn.sendMessage(from, {
            text: teks,
            mentions: participants.map(p => p.id)
        }, { quoted: mek });

    } catch (e) {
        console.error(e);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        reply(`❌ *An Error Occurred!!*\n\n${e}`);
    }
});
