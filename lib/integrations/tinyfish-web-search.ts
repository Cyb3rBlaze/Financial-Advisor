/**
 * Runs public web searches through a Tinyfish remote browser (CDP) and returns
 * lightweight snippets for downstream LLM grounding — not a compliance-grade crawler.
 */

export type WebSearchSnippet = {
  title: string;
  url: string;
  content: string;
};

export async function scrapeWebViaTinyfishCdp(
  cdpUrl: string,
  queries: readonly string[],
  perQueryMax: number,
  totalCap: number
): Promise<WebSearchSnippet[]> {
  const { chromium } = await import("playwright-core");
  const browser = await chromium.connectOverCDP(cdpUrl, { timeout: 120_000 });

  try {
    let context = browser.contexts()[0];
    if (!context) {
      context = await browser.newContext();
    }
    let page = context.pages()[0];
    if (!page) {
      page = await context.newPage();
    }

    const merged: WebSearchSnippet[] = [];
    const seen = new Set<string>();

    for (const query of queries) {
      if (merged.length >= totalCap) break;

      const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 90_000 });

      const rows = await page.evaluate((max: number) => {
        const out: { title: string; url: string; content: string }[] = [];
        const used = new Set<string>();
        const anchors = Array.from(document.querySelectorAll<HTMLAnchorElement>("a.result__a"));

        for (const a of anchors) {
          const href = a.href || "";
          if (!href || used.has(href)) continue;
          used.add(href);
          const block =
            a.closest(".result") || a.closest(".web-result") || a.closest(".results_links") || a.parentElement;
          const blob = (block?.textContent || a.textContent || "")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 480);
          out.push({
            title: (a.textContent || "").trim() || href,
            url: href,
            content: blob
          });
          if (out.length >= max) break;
        }
        return out;
      }, perQueryMax);

      for (const row of rows) {
        if (!row.url || seen.has(row.url)) continue;
        seen.add(row.url);
        merged.push(row);
        if (merged.length >= totalCap) break;
      }
    }

    return merged;
  } finally {
    await browser.close().catch(() => {});
  }
}
