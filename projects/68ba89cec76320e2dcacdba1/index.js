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
  console.error('Bot error:', err);
});

// Bot launch करो - async function के साथ
async function startBot() {
  try {
    await bot.launch();
    console.log("✅ Bot चल रहा है...");
    console.log("🔄 Bot continuously running... Press Ctrl+C to stop");
    
    // Keep the process alive
    process.stdin.resume();
    
  } catch (error) {
    console.error("❌ Bot start करने में error:", error);
    process.exit(1);
  }
}

// Graceful stop (Heroku/Render/Railway deploy में काम आता है)
process.once("SIGINT", () => {
  console.log("🛑 Bot को बंद कर रहे हैं...");
  bot.stop("SIGINT");
});

process.once("SIGTERM", () => {
  console.log("🛑 Bot को बंद कर रहे हैं...");
  bot.stop("SIGTERM");
});

// Bot start करो
startBot();