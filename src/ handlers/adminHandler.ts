import { Telegraf, Markup } from "telegraf";
import { OrderService } from "../services/orderService.js";

export const registerAdminHandlers = (bot: Telegraf) => {
  bot.command("orders", async (ctx) => {
    const orders = await OrderService.getAllOrders();

    if (!orders.length) {
      return ctx.reply("📦 No orders found.");
    }

    const orderList = orders
      .map(
        (o, i) =>
          `${i + 1}. ${o.username || o.userId} — ${o.mealType} — ${o.status}`
      )
      .join("\n");

    ctx.reply(`📋 *Orders:*\n${orderList}`, { parse_mode: "Markdown" });
  });

  bot.command("setstatus", async (ctx) => {
    const [_, id, status] = ctx.message.text.split(" ");
    if (!id || !status)
      return ctx.reply("Usage: /setstatus <orderId> <Pending|Completed>");

    const updated = await OrderService.setOrderStatus(id, status);
    if (!updated) return ctx.reply("❌ Order not found.");
    ctx.reply(`✅ Order status updated to ${status}`);
  });
};
