const { cmd } = require("../command");
const axios = require("axios");

// Toggle debug logs here:
const DEBUG = false;

cmd({
  pattern: "urlscan",
  react: "🔍",
  desc: "Scan a URL using urlscan.io and get a summary",
  category: "fun",
  use: ".urlscan <url>",
  filename: __filename,
}, async (_ctx, msg, _args, { reply, sender }) => {
  const newsletterContext = {
    mentionedJid: [sender],
    forwardingScore: 1000,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
      newsletterJid: '120363292876277898@newsletter',
      newsletterName: "𝐇𝐀𝐍𝐒 𝐁𝐘𝐓𝐄 𝐌𝐃",
      serverMessageId: 143,
    },
  };

  try {
    const inputText = msg.text || msg.body || "";
    if (DEBUG) console.log("Input Text:", inputText);

    const parts = inputText.trim().split(/\s+/);
    if (DEBUG) console.log("Split Parts:", parts);

    if (parts.length < 2) {
      return reply("❗ Please provide a URL to scan.\nUsage: .urlscan https://example.com");
    }

    let rawUrl = parts[1].trim();

    // Validate URL with fallback adding https://
    let url;
    try {
      url = new URL(rawUrl).href;
    } catch {
      try {
        url = new URL("https://" + rawUrl).href;
      } catch {
        return reply("❗ Invalid URL format. Please provide a valid URL.", { contextInfo: newsletterContext });
      }
    }

    if (DEBUG) console.log("Validated URL:", url);

    // Submit scan request
    const submitRes = await axios.post(
      "https://urlscan.io/api/v1/scan/",
      { url, visibility: "public" },
      {
        headers: {
          "Content-Type": "application/json",
          "API-Key": "01979afd-419e-74f3-b39c-254f99a327fe",
        },
      }
    );

    if (DEBUG) console.log("Submit Response:", submitRes.data);

    const { uuid } = submitRes.data;
    if (!uuid) throw new Error("No UUID returned from urlscan.io");

    // Poll result with timeout & interval
    const scanResult = await waitForScanResult(uuid, 30000, 3000);

    const { page, verdicts, stats } = scanResult;

    const screenshotUrl = page.screenshot ? `https://urlscan.io${page.screenshot}` : "N/A";

    const summary =
      `🔍 URL Scan Result\n` +
      `• URL: ${page.url}\n` +
      `• Domain: ${page.domain}\n` +
      `• Screenshot: ${screenshotUrl}\n` +
      `• Verdicts:\n` +
      `   - Harmless: ${verdicts?.harmless ?? "N/A"}\n` +
      `   - Malicious: ${verdicts?.malicious ?? "N/A"}\n` +
      `   - Suspicious: ${verdicts?.suspicious ?? "N/A"}\n` +
      `• Stats:\n` +
      `   - Requests: ${stats?.requests ?? "N/A"}\n` +
      `   - Scripts: ${stats?.scripts ?? "N/A"}\n` +
      `   - Links: ${stats?.links ?? "N/A"}\n\n` +
      `By 𝐇𝐀𝐍𝐒 𝐁𝐘𝐓𝐄 𝐌𝐃`;

    await reply(summary, { contextInfo: newsletterContext });

  } catch (error) {
    if (DEBUG) console.error("URLScan error:", error);
    await reply("❌ Failed to scan URL. Please try again later.", { contextInfo: newsletterContext });
  }
});

// Helper function to poll the scan result until ready or timeout
async function waitForScanResult(uuid, maxWaitMs = 30000, intervalMs = 3000) {
  const startTime = Date.now();

  while (true) {
    try {
      const res = await axios.get(`https://urlscan.io/api/v1/result/${uuid}/`);
      if (res.status === 200 && res.data) return res.data;
    } catch (e) {
      // Scan not ready yet - keep polling
      if (
        e.response?.status === 404 &&
        e.response.data?.message === "Scan has not finished yet"
      ) {
        if (Date.now() - startTime > maxWaitMs) {
          throw new Error("Timeout waiting for scan result");
        }
        await new Promise((r) => setTimeout(r, intervalMs));
        continue;
      }
      // Unexpected error - rethrow
      throw e;
    }
  }
}
