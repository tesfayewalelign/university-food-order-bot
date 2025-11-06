import { bot } from "../bot.js";
import { listOrders } from "../services/orderService.js";

bot.onText(/\/list/, async (msg) => {
  try {
    const message = await listOrders(msg.chat.id);
    bot.sendMessage(msg.chat.id, message);
  } catch (error) {
    bot.sendMessage(msg.chat.id, "⚠️ Failed to fetch orders.");
  }
});
