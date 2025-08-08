import { scrapeAgendaCulturalPorto } from "./agenda-cultural-porto";
import { scrapeEgeac } from "./egeac";
import { scrapeCmFaro } from "./cm-faro";

export const scrapers = [
  {
    source: "agenda-cultural-porto",
    city: "Porto",
    fn: scrapeAgendaCulturalPorto,
  },
  { source: "egeac", city: "Lisboa", fn: scrapeEgeac },
  { source: "cm-faro", city: "Faro", fn: scrapeCmFaro },
];
