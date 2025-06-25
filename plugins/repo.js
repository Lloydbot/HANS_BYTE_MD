const fetch = require('node-fetch');
const { cmd } = require('../command');

cmd({
    pattern: "repo",
    alias: ["sc", "script", "info"],
    desc: "Fetch information about a GitHub repository.",
    react: "📂",
    category: "info",
    filename: __filename,
}, 
async (conn, mek, m, { from, reply }) => {
    // Your GitHub repo URL
    const githubRepoURL = 'https://github.com/HaroldMth/HANS_BYTE_MD';

    // Newsletter context info to be included with the message
    const newsletterContext = {
        mentionedJid: [m.sender],
        forwardingScore: 1000,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363292876277898@newsletter',
          newsletterName: "𝐇𝐀𝐍𝐒 𝐁𝐘𝐓𝐄 𝐌𝐃",
          serverMessageId: 147,
        },
    };

    try {
        // Extract username and repo name from the URL
        const [, username, repoName] = githubRepoURL.match(/github\.com\/([^/]+)\/([^/]+)/);

        // Fetch repository details using GitHub API
        const response = await fetch(`https://api.github.com/repos/${username}/${repoName}`);

        if (!response.ok) {
            throw new Error(`GitHub API request failed with status ${response.status}`);
        }

        const repoData = await response.json();

        // Format the repository information message
        const formattedInfo = 
`*BOT NAME:*\n> ${repoData.name}
\n*OWNER NAME:*\n> ${repoData.owner.login}
\n*STARS:*\n> ${repoData.stargazers_count}
\n*FORKS:*\n> ${repoData.forks_count}
\n*GITHUB LINK:*\n> ${repoData.html_url}
\n*DESCRIPTION:*\n> ${repoData.description || 'No description'}
\n*Don't Forget To Star and Fork Repository*
\n> *© Powered By 𝐇𝐀𝐍𝐒 𝐁𝐘𝐓𝐄 𝐌𝐃 🖤*`;

        // Send an image with the repo info caption and your newsletter context
        await conn.sendMessage(from, {
            image: { url: 'https://files.catbox.moe/juroe8.jpg' },
            caption: formattedInfo,
            contextInfo: newsletterContext
        }, { quoted: mek });

    } catch (error) {
        console.error("Error in repo command:", error);
        reply("Sorry, something went wrong while fetching the repository information. Please try again later.");
    }
});
