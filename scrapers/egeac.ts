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

  // Wait for images to load with a more robust approach
  await page.waitForFunction(
    () => {
      const images = document.querySelectorAll(".evento-card img");
      if (images.length === 0) return false;

      let loadedImages = 0;
      images.forEach((img) => {
        const src = (img as HTMLImageElement).src;
        // Check for actual image URLs (not placeholders) and that they're loaded
        if (
          src &&
          src.includes("wp-content/uploads/") &&
          !src.includes("placeholder") &&
          (img as HTMLImageElement).complete &&
          (img as HTMLImageElement).naturalHeight > 0
        ) {
          loadedImages++;
        }
      });

      // Wait until at least 70% of images have loaded (higher threshold for CI)
      return (
        loadedImages >=
        Math.min(images.length, Math.max(1, Math.floor(images.length * 0.7)))
      );
    },
    { timeout: 30000 }
  ); // Increased timeout for CI environment

  // Additional wait to ensure all images are fully loaded
  await page.waitForTimeout(3000);

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
