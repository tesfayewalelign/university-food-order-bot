import { Telegraf } from "telegraf";

export const notifyDrivers = async (bot: Telegraf, message: string) => {
  const driverIds = process.env.DRIVER_IDS?.split(",") || [];
  for (const id of driverIds) {
    await bot.telegram.sendMessage(id.trim(), message);
  }
};
