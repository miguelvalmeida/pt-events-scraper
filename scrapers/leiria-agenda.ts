import { chromium } from "playwright";

// TODO: Missing images

export async function scrapeLeiriaAgenda() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(
    "https://leiriagenda.cm-leiria.pt/pt/agenda/proximos-eventos",
    {
      waitUntil: "domcontentloaded",
    }
  );

  const allEvents = [];

  await page.waitForSelector(".listing-container");

  while (true) {
    const pageEvents = await page.$$eval(
      ".listing-container-inner a",
      (cards) => {
        return cards.map((card) => {
          const titleEl = card.querySelector(".proximo_title");
          const dateEl = card.querySelector(".date");
          const url = card.getAttribute("href");
          const locationEl = card.querySelector(".location");

          return {
            title: titleEl?.textContent?.trim() || null,
            url: url || null,
            date: dateEl?.textContent?.replace(/\s+/g, " ").trim() || null,
            location:
              locationEl?.textContent?.replace(/\s+/g, " ").trim() || null,
            image: null,
          };
        });
      }
    );

    const filteredPageEvents = pageEvents.filter((event) => event.title);

    if (filteredPageEvents.length > 0) {
      allEvents.push(...filteredPageEvents);
    }

    const paginationExists = await page.$("ul.pagination");

    if (!paginationExists) {
      break;
    }

    const nextLink = page.getByRole("link", { name: "Próxima página" });

    if (!nextLink) {
      break;
    }

    try {
      await nextLink.click();
      await page.waitForLoadState("networkidle");
    } catch (error) {
      break;
    }
  }

  await browser.close();

  return allEvents;
}

scrapeLeiriaAgenda().then((events) => {
  console.log(events);
});
