import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

import { scrapers } from "../scrapers/index";
import { normalizeEvents } from "../utils/post-processing";

dotenv.config({ quiet: true });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
);

for (const { source, fn } of scrapers) {
  console.log(`Scraping ${source}...`);

  const events = await fn();

  const normalizedEvents = await normalizeEvents(events);

  for (const event of normalizedEvents) {
    await supabase.from("events").upsert(
      {
        title: event.title,
        startDate: event.startDate,
        endDate: event.endDate,
        location: event.location,
        imageUrl: event.image,
        url: event.url,
        category: event.category,
        source,
      },
      { onConflict: "url" }
    );
  }
}
