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

// Bot को launch करने का main function
async function startBot() {
  try {
    console.log("🔄 Bot को start कर रहे हैं...");
    
    // Bot launch करो
    await bot.launch();
    console.log("✅ Bot चल रहा है...");
    console.log("🔄 Bot continuously running... Press Ctrl+C to stop");
    
    // Keep alive - हर 30 seconds में status दिखाओ
    const keepAliveInterval = setInterval(() => {
      console.log("💚 Bot is alive and running...", new Date().toLocaleTimeString());
    }, 30000);
    
    // Process को alive रखने के लिए
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    
    // अगर कोई input आए तो handle करो (लेकिन कुछ न करो, बस alive रखो)
    process.stdin.on('data', () => {
      // Do nothing, just keep process alive
    });
    
    return keepAliveInterval;
    
  } catch (error) {
    console.error("❌ Bot start करने में error:", error);
    process.exit(1);
  }
}

// Graceful shutdown function
function gracefulShutdown(signal) {
  console.log(`\n🛑 ${signal} signal received. Bot को बंद कर रहे हैं...`);
  bot.stop(signal);
  console.log("👋 Bot successfully stopped!");
  process.exit(0);
}

// Signal handlers
process.once("SIGINT", () => gracefulShutdown("SIGINT"));
process.once("SIGTERM", () => gracefulShutdown("SIGTERM"));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  gracefulShutdown("uncaughtException");
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown("unhandledRejection");
});

// Exit handler
process.on('exit', (code) => {
  console.log(`🔴 Process exiting with code: ${code}`);
});

// Start the bot
startBot().then((interval) => {
  console.log("🚀 Bot server started successfully!");
  
  // Keep the process running indefinitely
  const infiniteLoop = () => {
    setTimeout(() => {
      infiniteLoop();
    }, 1000000); // 1000 seconds - keeps running
  };
  
  infiniteLoop();
}).catch((error) => {
  console.error("💥 Failed to start bot:", error);
  process.exit(1);
});