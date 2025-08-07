import { scrapeAgendaCulturalPorto } from "./agenda-cultural-porto";
import { scrapeEgeac } from "./egeac";

export const scrapers = [
  {
    source: "agenda-cultural-porto",
    city: "Porto",
    fn: scrapeAgendaCulturalPorto,
  },
  { source: "egeac", city: "Lisboa", fn: scrapeEgeac },
];
