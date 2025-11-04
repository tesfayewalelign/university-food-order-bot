import { Markup, Telegraf } from "telegraf";
import { OrderService } from "../services/orderService.js";
import { notifyDrivers } from "../services/notificationService.js";

export const registerUserHandlers = (bot: Telegraf) => {
  bot.start((ctx) => {
    ctx.reply(
      "Welcome! Please choose your meal type:",
      Markup.keyboard([["Contract"], ["Non-Contract"]])
        .oneTime()
        .resize()
    );
  });

  bot.hears(["Contract", "Non-Contract"], async (ctx) => {
    const mealType = ctx.message.text;
    const userId = ctx.from.id;
    const username = ctx.from.username || ctx.from.first_name;

    const order = await OrderService.createOrder(userId, username, mealType);

    ctx.reply(`✅ Your ${mealType} order has been placed!`);
    await notifyDrivers(
      bot,
      `🚗 New ${mealType} order from @${username || userId}`
    );
  });
};
