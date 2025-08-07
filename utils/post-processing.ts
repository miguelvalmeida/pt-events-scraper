import { Groq } from "groq-sdk";
import * as dotenv from "dotenv";

dotenv.config({ quiet: true });

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

type InputEvent = {
  title: string | null;
  url: string | null;
  date: string | null;
  location: string | null;
  image: string | null;
};

type NormalizedEvent = InputEvent & {
  startDate: string;
  endDate: string;
  category: string;
};

const BATCH_SIZE = 50;

function chunk<T>(arr: T[], size: number): T[][] {
  const res: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    res.push(arr.slice(i, i + size));
  }
  return res;
}

function buildPrompt(events: InputEvent[]) {
  const minimalEvents = events.map(({ title, date }) => ({ title, date }));
  return `
### System
You are a data transformation bot. You must return ONLY a valid JSON array, with NO extra text, comments, or formatting.

### Instructions
For each event, use the "title" and "date" properties to infer:
- "startDate": the event's start date (ISO8601 format, e.g. "2025-08-06")
- "endDate": the event's end date (ISO8601 format, e.g. "2025-08-06")
- "category": chosen from the list below based on the event's "title".
  - Use EXACTLY one of: ["concerts", "theatre", "cinema", "exhibitions", "festivals", "outdoor", "family", "workshops", "nightlife", "heritage", "community", "markets", "other"]
  - If none fit, use "other"

**Return ONLY a JSON array of objects, each with ONLY these three properties, in the same order as the input.**
**Do NOT include any extra properties, text, explanations, or comments.**

### Input
${JSON.stringify(minimalEvents, null, 2)}

### Expected Output
[
  { "startDate": "2025-08-06", "endDate": "2025-08-06", "category": "heritage" },
  ...
]
`.trim();
}

export async function normalizeEvents(
  events: InputEvent[]
): Promise<NormalizedEvent[]> {
  const batches = chunk(events, BATCH_SIZE);
  const allResults: NormalizedEvent[] = [];

  for (const batch of batches) {
    const prompt = buildPrompt(batch);

    const completion = await groq.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_completion_tokens: 2048,
    });

    const rawText = completion.choices[0]?.message?.content ?? "";

    // Extract only the first JSON array from the response
    const jsonMatch = rawText.match(/\[\s*{[\s\S]+?}\s*\]/);
    if (!jsonMatch) {
      console.warn("No JSON array found in LLM response:", rawText);
      continue;
    }
    try {
      // Truncate after the first closing bracket, just in case
      const arrayEnd = jsonMatch[0].lastIndexOf("]");
      const jsonString = jsonMatch[0].slice(0, arrayEnd + 1).trim();
      const parsed = JSON.parse(jsonString) as Array<{
        startDate: string;
        endDate: string;
        category: string;
      }>;
      const merged = batch.map((event, idx) => ({
        ...event,
        ...parsed[idx],
      }));
      allResults.push(...merged);
    } catch (e) {
      console.warn("Failed to parse JSON array:", jsonMatch[0]);
      continue;
    }
  }

  return allResults;
}

/* (async () => {
  await normalizeEvents([
    {
      title: "Museu do Vitral – Porto",
      url: "https://agendaculturalporto.org/eventos/museu-do-vitral-porto/",
      date: "07 Agosto 2025",
      location: "Museu do Vitral, Rua de D. Hugo, n.º 2 a 6, 4050-305 Porto",
      image:
        "https://agendaculturalporto.org/wp-content/uploads/2022/03/Museu-do-Vitral-300x257.jpg",
    },
  ]);
})(); */
