import { scrapeAgendaCulturalPorto } from "./agenda-cultural-porto";

export const scrapers = [
  { source: "agenda-cultural-porto", fn: scrapeAgendaCulturalPorto },
  { source: "egeac", fn: scrapeAgendaCulturalPorto },
];
