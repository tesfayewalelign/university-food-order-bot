import { bot } from "../bot.js";

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "👋 Welcome to FoodBot! Use /add <food> to order."
  );
});
