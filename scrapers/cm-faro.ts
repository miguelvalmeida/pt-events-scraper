import { chromium } from "playwright";

export async function scrapeCmFaro() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const BASE_URL = "https://www.cm-faro.pt";

  await page.goto(`${BASE_URL}/pt/agenda.aspx`, {
    waitUntil: "domcontentloaded",
  });

  const allEvents = [];

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const endMonth = 12;

  for (let month = currentMonth; month <= endMonth; month++) {
    const monthUrl = `${BASE_URL}/pt/agenda.aspx?cat=0&month=${month}`;

    try {
      await page.goto(monthUrl, { waitUntil: "domcontentloaded" });
    } catch (error) {
      continue;
    }

    await page.waitForSelector(".list_agenda");

    let pageNumber = 1;
    let monthEvents = 0;

    while (true) {
      const pageEvents = await page.$$eval(
        ".list_agenda ul",
        (cards, baseUrl) => {
          return cards.map((card) => {
            const titleEl = card.querySelector(".title");
            const dateEl = card.querySelector(".data");
            const urlEl = card.querySelector("p.title a");
            const imageEl = card.querySelector("img");

            const urlSrc = urlEl?.getAttribute("href");
            const imageSrc = imageEl?.getAttribute("src");
            const completeUrl = urlSrc ? `${baseUrl}${urlSrc}` : null;
            const completeImageUrl = imageSrc ? `${baseUrl}${imageSrc}` : null;

            return {
              title: titleEl?.textContent?.trim() || null,
              url: completeUrl,
              date: dateEl?.textContent?.replace(/\s+/g, " ").trim() || null,
              location: null,
              image: completeImageUrl,
            };
          });
        },
        BASE_URL
      );

      const filteredPageEvents = pageEvents.filter((event) => event.title);

      if (filteredPageEvents.length > 0) {
        allEvents.push(...filteredPageEvents);
        monthEvents += filteredPageEvents.length;
      }

      const paginationExists = await page.$("li.pagerNext");

      if (!paginationExists) {
        break;
      }

      const nextLink = await page.$("li.pagerNext a:not(.disable)");

      if (!nextLink) {
        break;
      }

      try {
        await nextLink.click();
        await page.waitForLoadState("networkidle");
        pageNumber++;
      } catch (error) {
        break;
      }
    }
  }

  await browser.close();

  return allEvents;
}
