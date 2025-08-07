import { chromium } from "playwright";

export async function scrapeAgendaCulturalPorto() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto("https://agendaculturalporto.org/eventos-hoje-no-norte/", {
    waitUntil: "domcontentloaded",
  });

  const events = await page.$$eval(".mec-event-article", (cards) => {
    return cards.map((card) => {
      const titleEl = card.querySelector(".mec-event-title a");
      const dateEl = card.querySelector(".mec-event-date");
      const locationEl = card.querySelector(".mec-grid-event-location");
      const urlEl = card.querySelector(".mec-booking-button");
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
