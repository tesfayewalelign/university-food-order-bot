import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.TELEGRAM_BOT_TOKEN) {
  throw new Error("❌ Telegram Bot Token not provided in .env file!");
}

export const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
  polling: true,
});
