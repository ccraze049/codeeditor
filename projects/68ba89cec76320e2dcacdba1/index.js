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

      // Bot launch करो
      bot.launch();
      console.log("✅ Bot चल रहा है...");

      // Graceful stop (Heroku/Render/Railway deploy में काम आता है)
      process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));