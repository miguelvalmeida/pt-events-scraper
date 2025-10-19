import { chromium } from "playwright";

export async function scrapeEgeac() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto("https://egeac.pt/programacao-espacos-culturais/", {
    waitUntil: "domcontentloaded",
  });

  // Scroll to the bottom of the page to trigger lazy loading of images
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve(undefined);
        }
      }, 100);
    });
  });

  // Wait a bit more for images to load after scrolling
  await page.waitForTimeout(2000);

  const events = await page.$$eval(".evento-card", (cards) => {
    return cards.map((card) => {
      const titleEl = card.querySelector(".h5");
      const dateEl = card.querySelector(".date");
      const locationEl = card.querySelector(".location");
      const urlEl = card.querySelector("a");
      const imageEl = card.querySelector("img");

      return {
        title: titleEl?.textContent?.trim() || null,
        url: urlEl?.getAttribute("href") || null,
        date: dateEl?.textContent?.trim() || null,
        location: locationEl?.textContent?.trim() || null,
        image: imageEl?.getAttribute("src") || null,
      };
    });
  });

  await browser.close();

  return events;
}
