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

// Bot launch करो
bot.launch().then(() => {
  console.log("✅ Bot चल रहा है...");
  console.log("🔄 Bot continuously running... Press Ctrl+C to stop");
  
  // Keep alive mechanism - हर 30 seconds में alive message
  setInterval(() => {
    console.log("💚 Bot is running...", new Date().toLocaleTimeString());
  }, 30000);
  
}).catch((error) => {
  console.error("❌ Bot start करने में error:", error);
  process.exit(1);
});

// Graceful stop
process.once("SIGINT", () => {
  console.log("\n🛑 Bot को बंद कर रहे हैं...");
  bot.stop("SIGINT");
  process.exit(0);
});

process.once("SIGTERM", () => {
  console.log("\n🛑 Bot को बंद कर रहे हैं...");
  bot.stop("SIGTERM");
  process.exit(0);
});

// Keep process alive
process.stdin.resume();
process.stdin.setEncoding('utf8');

// Prevent the process from exiting
process.on('exit', (code) => {
  console.log(`🔴 Process exiting with code: ${code}`);
});