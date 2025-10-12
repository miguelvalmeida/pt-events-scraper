import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

import { scrapers } from "../scrapers/index";
import { normalizeEvents } from "../utils/post-processing";

dotenv.config({ quiet: true });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
);

for (const { source, city, fn } of scrapers) {
  console.log(`\n--- Scraping ${source} ---`);

  const events = await fn();

  const normalizedEvents = await normalizeEvents(events);

  let upserted = 0;
  let skipped = 0;
  for (const event of normalizedEvents) {
    // Skip events without valid startDate or endDate
    if (
      !event.startDate ||
      !event.endDate ||
      event.startDate.trim() === "" ||
      event.endDate.trim() === ""
    ) {
      console.warn(`Skipping event without valid dates: ${event.title}`);
      skipped++;
      continue;
    }

    const { error } = await supabase.from("events").upsert(
      {
        title: event.title,
        startDate: event.startDate,
        endDate: event.endDate,
        location: event.location,
        imageUrl: event.image,
        url: event.url,
        category: event.category,
        source,
        city,
      },
      { onConflict: "url" }
    );
    if (error) {
      console.warn(`Failed to upsert event: ${event.title}`, error);
    } else {
      upserted++;
    }
  }

  console.log(
    `Upserted ${upserted}/${normalizedEvents.length} events to database. Skipped ${skipped} events without valid dates.`
  );
}
