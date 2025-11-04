import { Telegraf } from "telegraf";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { registerUserHandlers } from "./ handlers/userHandler.js";
import { registerAdminHandlers } from "./ handlers/adminHandler.js";
import { registerOrderHandlers } from "./ handlers/orderHandler.js";

dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const MONGO_URI = process.env.MONGODB_URI;

if (!BOT_TOKEN) {
  console.error("❌ BOT_TOKEN is missing in your .env file");
  process.exit(1);
}

if (!MONGO_URI) {
  console.error("❌ MONGO_URI is missing in your .env file");
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI!);
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ Failed to connect to MongoDB:", err);
    process.exit(1);
  }
}

async function startBot() {
  try {
    await connectDB();

    registerUserHandlers(bot);
    registerAdminHandlers(bot);
    registerOrderHandlers();

    await bot.launch();
    console.log("🤖 University Food Bot is running...");

    process.once("SIGINT", () => bot.stop("SIGINT"));
    process.once("SIGTERM", () => bot.stop("SIGTERM"));
  } catch (err) {
    console.error("❌ Bot failed to start:", err);
  }
}

startBot();
