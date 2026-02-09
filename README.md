# CoFoundersLab Auto-Connect Bot

## Quick Start

### Run with Node.js:
```bash
cd bot
node cofounders-bot.js
```

That's it! The bot will start automatically.

**To stop**: Press `Ctrl+C`

---

## Configuration

Before running, edit `cofounders-bot.js` and set:
- `DISCORD_WEBHOOK_URL` - Your Discord webhook URL (line 6)
- `AUTH_TOKEN` - Your auth token if expired (line 3)
- `currentPage` - Starting page number (line 8, default: 10000)

---

---

## Alternative: Browser Console
1. Copy the entire `cofounders-bot.js` content
2. Paste it into the browser console on cofounderslab.com
3. Set webhook: `setDiscordWebhook('YOUR_WEBHOOK_URL')`
4. Run: `startBot()`
5. To stop: `stopBot()`
6. Check stats: `getStats()`

## Features

- ✅ Fetches profiles from search API (20 per page)
- ✅ Extracts all `_id` values from profiles
- ✅ Sends "hi!" message to each profile
- ✅ Auto-increments page number
- ✅ **Discord alerts with names after each page**
- ✅ Rate limiting (1 second between messages, 2 seconds between pages)
- ✅ Error handling and stats tracking
- ✅ Can be stopped/started anytime

## Stats Tracked

- Profiles fetched
- Messages sent successfully
- Errors encountered
- Current page number
- Bot running status

## Discord Webhook Setup

1. Go to your Discord server settings
2. Integrations → Webhooks → New Webhook
3. Copy the webhook URL
4. Use `setDiscordWebhook('URL')` before starting the bot

**Alert Format:**
```
Page 10000 - Connected with 15 profiles:
John Doe
Jane Smith
Mike Johnson
...
```

## Notes

⚠️ **Important**: The auth token will expire. Update it in the script when needed.

⚠️ **Discord Webhook**: Must be set before starting the bot.

⚠️ **Rate Limiting**: Built-in delays to avoid getting blocked. Adjust if needed.
