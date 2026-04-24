/**
 * Smoke test: node --env-file=.env test-tinyfish.mjs
 * Creates a session via Tinyfish Browser API (same as the app route).
 */

async function testTinyfish() {
  const apiKey = process.env.TINYFISH_API_KEY;
  const startUrl = process.env.TINYFISH_ACTION_URL?.trim();

  if (!apiKey || apiKey === "replace_me") {
    console.error("Set TINYFISH_API_KEY in .env (not replace_me).");
    process.exit(1);
  }

  const body = { timeout_seconds: 300, ...(startUrl ? { url: startUrl } : {}) };

  console.log("POST https://api.browser.tinyfish.ai");
  console.log("Initial URL:", startUrl || "(omitted → about:blank)");

  try {
    const response = await fetch("https://api.browser.tinyfish.ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120_000)
    });

    const text = await response.text();
    console.log(`HTTP ${response.status} ${response.statusText}`);
    console.log(text);
    process.exit(response.ok ? 0 : 1);
  } catch (error) {
    console.error("Request failed:", error);
    process.exit(1);
  }
}

testTinyfish();
