# PT Events Scraper

This project is a Node.js + TypeScript application for scraping, normalizing, and storing cultural event data from various Portuguese event sources.

## Features

- **Scraping**: Collects event data from multiple sources.
- **Normalization**: Uses an LLM to standardize event dates and categorize events, ensuring consistent data across sources.
- **Database integration**: Upserts normalized events into a database.
- **Automation**: Includes GitHub Actions workflows for scheduled daily scraping and automatic cleanup of past events.
- **Cleanup**: Automatically removes events that have ended to keep the database clean and efficient.
