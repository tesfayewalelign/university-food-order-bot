import { bot } from "../bot.js";
import { addOrder } from "../services/orderService.js";

bot.onText(/\/add (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const food = match?.[1];
  if (!food) return bot.sendMessage(chatId, "❌ Please provide a food name!");

  try {
    const message = await addOrder(chatId, food);
    bot.sendMessage(chatId, message);
  } catch (error) {
    bot.sendMessage(chatId, "⚠️ Failed to add order. Try again later.");
  }
});
