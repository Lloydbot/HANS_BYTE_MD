const { cmd } = require('../command');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

cmd({
    pattern: "rent",
    react: "🤖",
    desc: "🚀 Launch a subbot using S-ID",
    category: "👥 User Panel",
    filename: __filename
},
async (conn, mek, m, { q, reply }) => {
    try {
        if (!q || !q.startsWith("HANS-BYTE~")) return reply("❌ *Provide a valid S-ID starting with `HANS-BYTE~`*");

        const sessionId = q.trim();
        const timestamp = Date.now();
        const folderName = `bot_${timestamp}`;
        const subbotPath = path.join(__dirname, `../subbots/${folderName}`);

        const gitRepoUrl = 'https://github.com/HaroldMth/HANS_BYTE.git'; // replace if needed

        // Step 1: Clone the repo
        await execShell(`git clone ${gitRepoUrl} ${subbotPath}`);

        // Step 2: Inject session into config.js
        const configPath = path.join(subbotPath, 'config.js');
        if (!fs.existsSync(configPath)) return reply("❌ *config.js not found in cloned bot.*");

        let configContent = fs.readFileSync(configPath, 'utf-8');
        configContent = configContent.replace(/SESSION_ID:\s*["'`].*?["'`]/, `SESSION_ID: "${sessionId}"`);
        fs.writeFileSync(configPath, configContent);

        // Step 3: Install and launch
        await execShell(`cd ${subbotPath} && npm install && npm start`);

        reply(`✅ *Subbot launched successfully as:* \`/subbots/${folderName}\``);
    } catch (err) {
        console.error(err);
        reply("❌ *Error launching subbot. Check console.*");
    }
});

function execShell(command) {
    return new Promise((resolve, reject) => {
        exec(command, (err, stdout, stderr) => {
            if (err) return reject(err);
            resolve(stdout || stderr);
        });
    });
}
