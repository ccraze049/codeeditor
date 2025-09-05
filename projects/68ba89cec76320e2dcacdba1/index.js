const { Telegraf } = require("telegraf");

// 👉 यहाँ अपना BotFather से लिया हुआ token डालो
const bot = new Telegraf("8099788986:AAHH7dVkRntzDYmb6m5Zp4iVKhUqi9nQFkw");

// Start command
bot.start((ctx) => ctx.reply("👋 नमस्ते! मैं आपका Telegram Bot हूँ।"));

// Help command
bot.help((ctx) =>
  ctx.reply("मैं आपकी मदद कर सकता हूँ!\n/start - शुरू करो\n/help - मदद लो\n/hello - हेलो बोलो")
);

// Custom command
bot.command("hello", (ctx) => {
  ctx.reply("🙌 हेलो भाई!");
});

// Text listener (सिर्फ text आने पर)
bot.on("text", (ctx) => {
  ctx.reply(`आपने लिखा: ${ctx.message.text}`);
});

// Error handling
bot.catch((err, ctx) => {
  console.error('❌ Bot error:', err);
});

// Main function to start bot
async function startBot() {
  try {
    console.log("🔄 Starting Telegram Bot...");
    await bot.launch();
    console.log("✅ Bot चल रहा है...");
    console.log("🔄 Bot running continuously... Use 'pkill -f node' to stop");
    
    // Keep alive interval
    const aliveInterval = setInterval(() => {
      console.log("💚 Bot is running...", new Date().toLocaleTimeString());
    }, 30000);
    
    return aliveInterval;
  } catch (error) {
    console.error("❌ Bot start error:", error);
    process.exit(1);
  }
}

// Graceful shutdown
function stopBot(signal) {
  console.log(`\n🛑 ${signal} received. Stopping bot...`);
  bot.stop(signal);
  console.log("👋 Bot stopped successfully!");
  process.exit(0);
}

// Multiple signal handlers for better control
process.on("SIGINT", () => stopBot("SIGINT"));
process.on("SIGTERM", () => stopBot("SIGTERM"));
process.on("SIGHUP", () => stopBot("SIGHUP"));

// Start the bot and keep it alive
startBot().then(() => {
  console.log("🚀 Bot server started!");
  
  // Keep process alive with stdin
  process.stdin.resume();
  process.stdin.setEncoding('utf8');
  
  // Listen for 'exit' command on stdin to allow manual stop
  process.stdin.on('data', (input) => {
    const command = input.toString().trim();
    if (command === 'exit' || command === 'quit' || command === 'stop') {
      console.log("📝 Manual stop command received...");
      stopBot("MANUAL");
    }
  });
  
}).catch((error) => {
  console.error("💥 Failed to start bot:", error);
  process.exit(1);
});