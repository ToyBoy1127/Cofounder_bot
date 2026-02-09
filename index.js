// CoFoundersLab Auto-Connect Bot
const fs = require('fs');
const path = require('path');

const API_BASE = 'https://cofounderslab.com/api/backend';
const AUTH_TOKEN = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZjkyOWI3MDY1ZjlhMjE1OTAyNTc3MyIsImVtYWlsIjoibWljaGFsZTAyMjVAb3V0bG9vay5jb20iLCJwcm9maWxlIjoiNjhmOTJhMDYwNjVmOWEyMTU5MDI1OTNmIiwiaWF0IjoxNzcwNjMxMjc1LCJleHAiOjE3NzEyMzYwNzV9.gM3YYMycTpfu3zldyHH28DivkB5YLtYLIAiJNoexmQw';

// SET YOUR DISCORD WEBHOOK URL HERE
let DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1470416656864907434/ACecuVYrZr986MpLQ_QOevajfJbRHyo0KcCQWWWFXk6EGTYxtbXVn5d-czlkjhI88s4Q';

// Save current page to this file
function savePageToFile(page) {
  try {
    const filePath = __filename;
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace the currentPage value in the file
    content = content.replace(/let currentPage = \d+;/, `let currentPage = ${page};`);
    content = content.replace(/currentPage: \d+/, `currentPage: ${page}`);
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`💾 Saved current page ${page} to file`);
  } catch (error) {
    console.error('Error saving page to file:', error);
  }
}

let currentPage = 10056;
let isRunning = false;
let stats = {
  profilesFetched: 0,
  messagesSent: 0,
  errors: 0,
  skipped: 0,
  currentPage: 10056
};

// Fetch profiles from search API
async function fetchProfiles(page) {
  try {
    const response = await fetch(`${API_BASE}/founder/search?limit=20&page=${page}`, {
      method: 'GET',
      headers: {
        'Authorization': AUTH_TOKEN,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.profiles || [];
  } catch (error) {
    console.error('Error fetching profiles:', error);
    stats.errors++;
    return null;
  }
}

// Send connection request with message
async function sendConnectionRequest(profileId, profileName) {
  try {
    const response = await fetch(`${API_BASE}/connection/connect`, {
      method: 'POST',
      headers: {
        'Authorization': AUTH_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        profile: profileId,
        message: "Hi! It's a pleasure to meet you. I hope you're doing well. Thank you so much for taking a moment to read my message—I really appreciate it! I'm a software engineer with over four years of experience, mainly working as a freelancer on technical and blockchain projects like analytics, development support, and consulting through platforms like Freelancer.com and Upwork.com. Most of my work involves collaborating with clients from around the world, where they post their development needs and hire developers to bring their projects to life. I'm excited about the idea of partnering with a trustworthy collaborator based in America or Europe to build a long-term working relationship. In this partnership: - I will take care of all technical development tasks. - You would help with client communication and managing the accounts. - We will keep earnings transparent. - Profits will be shared monthly (for example, an 80/20 split). I typically earn between $2,000 and $3,000 each month. This setup requires no technical work from you and is designed to be beneficial for both of us, built on mutual trust and clarity. Since many clients prefer developers from America or Europe, freelancing platforms tend to favor accounts from these regions. That's why I'm looking for an American or European partner. Setting up the account is simple, and I plan to use a VPN to ensure everything remains secure and running smoothly. Because I will be using the account with your information, you will have full control over all aspects, including income management. At first, you would receive 20% of all earnings, and you can transfer the remaining 80%.  Our collaboration will be completely transparent, based on a clear revenue-sharing agreement. If this sounds good to you, please feel free to reply here—I'm happy to discuss further details. Looking forward to hearing from you! Email: toyboy1127@gmaildotcom Telegram: @GmTrader007 Discord: @martins_009"
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      
      // 422 usually means already connected or invalid request
      if (response.status === 422) {
        console.log(`⚠️  Skipped ${profileName} (${profileId}): Already connected or invalid`);
        return false;
      }
      
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }

    stats.messagesSent++;
    console.log(`✓ Message sent to ${profileName} (${profileId})`);
    return true;
  } catch (error) {
    console.error(`✗ Error sending to ${profileId}:`, error.message);
    stats.errors++;
    return false;
  }
}

// Send Discord notification
async function sendDiscordAlert(names, page) {
  if (!DISCORD_WEBHOOK_URL) {
    console.warn('⚠️ Discord webhook URL not set. Skipping notification.');
    return;
  }

  try {
    const message = {
      content: `**Page ${page} - Connected with ${names.length} profiles**`
    };

    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(message)
    });

    if (!response.ok) {
      throw new Error(`Discord webhook failed: ${response.status}`);
    }

    console.log(`📢 Discord alert sent for page ${page}`);
  } catch (error) {
    console.error('❌ Failed to send Discord alert:', error);
  }
}

// Extract name from profile
function getProfileName(profile) {
  if (profile.name) return profile.name;
  if (profile.firstName && profile.lastName) return `${profile.firstName} ${profile.lastName}`;
  if (profile.firstName) return profile.firstName;
  if (profile.username) return profile.username;
  return `Profile ${profile._id}`;
}

// Add delay between requests to avoid rate limiting
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Process a single page
async function processPage(page) {
  console.log(`\n📄 Processing page ${page}...`);
  
  const profiles = await fetchProfiles(page);
  
  if (!profiles || profiles.length === 0) {
    console.log('No profiles found on this page.');
    return false;
  }

  stats.profilesFetched += profiles.length;
  console.log(`Found ${profiles.length} profiles`);

  const successfulNames = [];

  // Send message to each profile
  for (const profile of profiles) {
    if (!isRunning) {
      console.log('Bot stopped by user');
      return false;
    }

    if (profile._id) {
      const name = getProfileName(profile);
      const success = await sendConnectionRequest(profile._id, name);
      if (success) {
        successfulNames.push(name);
      }
      await delay(100); // 0.1 second delay between messages
    }
  }

  // Send Discord alert with successful connections
  if (successfulNames.length > 0) {
    await sendDiscordAlert(successfulNames, page);
  }

  return true;
}

// Main bot loop
async function startBot() {
  if (isRunning) {
    console.log('Bot is already running!');
    return;
  }

  isRunning = true;
  console.log('🤖 Bot started!');
  console.log(`Starting from page ${currentPage}`);

  while (isRunning) {
    stats.currentPage = currentPage;
    const success = await processPage(currentPage);
    
    if (!success) {
      console.log('Stopping bot - no more profiles or error occurred');
      break;
    }

    currentPage++;
    savePageToFile(currentPage); // Save progress to file after each page
    await delay(1000); // 1 second delay between pages
    
    // Log stats every 5 pages
    if (currentPage % 5 === 0) {
      console.log('\n📊 Stats:', stats);
    }
  }

  isRunning = false;
  savePageToFile(currentPage); // Save current page to file when bot stops
  console.log('\n🛑 Bot stopped');
  console.log('Final stats:', stats);
}

// Stop the bot
function stopBot() {
  isRunning = false;
  console.log('Stopping bot...');
}

// Get current stats
function getStats() {
  return { ...stats, isRunning };
}

// Reset to a specific page
function setPage(page) {
  currentPage = page;
  stats.currentPage = page;
  console.log(`Page set to ${page}`);
}

// Set Discord webhook URL
function setDiscordWebhook(url) {
  DISCORD_WEBHOOK_URL = url;
  console.log('✅ Discord webhook URL set');
}

// Export functions for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { startBot, stopBot, getStats, setPage, setDiscordWebhook };
}

// Auto-run if executed directly with Node.js
if (typeof require !== 'undefined' && require.main === module) {
  console.log('🤖 CoFoundersLab Bot Starting...\n');
  
  // Check if Discord webhook is set
  if (!DISCORD_WEBHOOK_URL) {
    console.log('⚠️  WARNING: Discord webhook URL not set!');
    console.log('Edit the DISCORD_WEBHOOK_URL variable in the script.\n');
  }
  
  // Keep-alive web server for Replit
  const http = require('http');
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(`Bot is running!\nCurrent page: ${currentPage}\nMessages sent: ${stats.messagesSent}`);
  });
  server.listen(3000, () => {
    console.log('✅ Keep-alive server running on port 3000');
  });
  
  // Start the bot automatically
  startBot();
  
  // Handle Ctrl+C to stop gracefully
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Stopping bot...');
    stopBot();
    setTimeout(() => {
      savePageToFile(currentPage); // Save to file before exit
      console.log('Final stats:', getStats());
      process.exit(0);
    }, 1000);
  });
}
