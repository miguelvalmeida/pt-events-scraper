import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ quiet: true });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
);

console.log("--- Starting cleanup of past events ---");

const currentDate = new Date().toISOString();
console.log(`Current date: ${currentDate}`);

const { data, error } = await supabase
  .from("events")
  .delete()
  .lt("endDate", currentDate)
  .select();

if (error) {
  console.error("Failed to delete past events:", error);
  process.exit(1);
}

const deletedCount = data?.length || 0;
console.log(`Successfully deleted ${deletedCount} past events.`);

if (deletedCount > 0) {
  console.log("Deleted events:");
  data?.forEach((event) => {
    console.log(`- ${event.title} (ended: ${event.endDate})`);
  });
}

console.log("--- Cleanup completed ---");
