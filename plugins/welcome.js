// ⚠️ Give Credit if Using This File
// 🔧 Modified & Branded by ⌬ HANS BYTE MD 💜
// 🪪 Partial Credits: KHAN-MD (JawadTechX)

const { isJidGroup } = require('@whiskeysockets/baileys');
const config = require('../config');

const getContextInfo = (m) => ({
    mentionedJid: [sender],
            forwardingScore: 1000,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: '120363292876277898@newsletter',
                newsletterName: "𝐇𝐀𝐍𝐒 𝐁𝐘𝐓𝐄 𝐌𝐃",
                serverMessageId: Math.floor(Math.random() * 1000),
    },
});

const ppUrls = [
    'https://i.ibb.co/KhYC4FY/1221bc0bdd2354b42b293317ff2adbcf-icon.png',
    'https://i.ibb.co/KhYC4FY/1221bc0bdd2354b42b293317ff2adbcf-icon.png',
    'https://i.ibb.co/KhYC4FY/1221bc0bdd2354b42b293317ff2adbcf-icon.png',
];

const GroupEvents = async (conn, update) => {
    try {
        if (!isJidGroup(update.id)) return;

        const metadata = await conn.groupMetadata(update.id);
        const participants = update.participants;
        const description = metadata.desc || '✘ No group description provided ✘';
        const memberCount = metadata.participants.length;

        let profilePicUrl;
        try {
            profilePicUrl = await conn.profilePictureUrl(update.id, 'image');
        } catch {
            profilePicUrl = ppUrls[Math.floor(Math.random() * ppUrls.length)];
        }

        for (const user of participants) {
            const username = user.split('@')[0];
            const time = new Date().toLocaleString();

            if (update.action === 'add' && config.WELCOME === 'true') {
                const welcomeMsg = [
                    `┏━━━━━━━━━━━━━━━━━┓`,
                    `┃ 👋 𝖶𝖤𝖫𝖢𝖮𝖬𝖤     ┃`,
                    `┣━━━━━━━━━━━━━━━━━┫`,
                    `┃ ➥ @${username} has joined the squad!`,
                    `┃ ➥ Group: *${metadata.subject}*`,
                    `┃ ➥ You are member #${memberCount} 🎉`,
                    `┃ ➥ Joined at: *${time}*`,
                    `┃ ➥ ℹ️ Group Info:`,
                    `┃    ${description}`,
                    `┣━━━━━━━━━━━━━━━━━━━┫`,
                    `┃  ⌬ *HANS BYTE MD*`,
                    `┗━━━━━━━━━━━━━━━━━━━┛`,
                ].join('\n');

                await conn.sendMessage(update.id, {
                    image: { url: profilePicUrl },
                    caption: welcomeMsg,
                    mentions: [user],
                    contextInfo: getContextInfo({ sender: user }),
                });

            } else if (update.action === 'remove' && config.WELCOME === 'true') {
                const goodbyeMsg = [
                    `┏━━━━━━━━━━━━━━━━━━━━┓`,
                    `┃ 𝖦𝖮𝖮𝖣𝖡𝖸𝖤 𝖬𝖤𝖲𝖲𝖠𝖦𝖤   ┃`,
                    `┣━━━━━━━━━━━━━━━━━━━━┫`,
                    `┃ ➥ @${username} has left the chat...`,
                    `┃ ➥ Group: *${metadata.subject}*`,
                    `┃ ➥ Time: *${time}*`,
                    `┃ ➥ Remaining members: ${memberCount}`,
                    `┣━━━━━━━━━━━━━━━━━━━━┫`,
                    `┃  ⌬ *HANS BYTE MD*`,
                    `┗━━━━━━━━━━━━━━━━━━━━┛`,
                ].join('\n');

                await conn.sendMessage(update.id, {
                    image: { url: profilePicUrl },
                    caption: goodbyeMsg,
                    mentions: [user],
                    contextInfo: getContextInfo({ sender: user }),
                });

            } else if (update.action === 'demote' && config.ADMIN_EVENTS === 'true') {
                const demoter = update.author.split('@')[0];
                const demoteMsg = [
                    `╭─⌬ 𝖠𝖣𝖬𝖨𝖭 𝖴𝖯𝖣𝖠𝖳𝖤 ⌬─╮`,
                    `│ 👤 @${demoter} has *demoted*`,
                    `│ @${username} from admin status.`,
                    `│ 🕒 Time: ${time}`,
                    `│ 🏷️ Group: *${metadata.subject}*`,
                    `╰────────────────────╯`,
                ].join('\n');

                await conn.sendMessage(update.id, {
                    text: demoteMsg,
                    mentions: [update.author, user],
                    contextInfo: getContextInfo({ sender: update.author }),
                });

            } else if (update.action === 'promote' && config.ADMIN_EVENTS === 'true') {
                const promoter = update.author.split('@')[0];
                const promoteMsg = [
                    `╭─⌬ 𝖠𝖣𝖬𝖨𝖭 𝖴𝖯𝖣𝖠𝖳𝖤 ⌬──╮`,
                    `│ 🎉 @${promoter} has *promoted*`,
                    `│ @${username} to group admin!`,
                    `│ 🕒 Time: ${time}`,
                    `│ 🏷️ Group: *${metadata.subject}*`,
                    `╰─────────────────────╯`,
                ].join('\n');

                await conn.sendMessage(update.id, {
                    text: promoteMsg,
                    mentions: [update.author, user],
                    contextInfo: getContextInfo({ sender: update.author }),
                });
            }
        }
    } catch (err) {
        console.error('💥 HANS BYTE MD | Group Event Error:', err);
    }
};

module.exports = GroupEvents;
