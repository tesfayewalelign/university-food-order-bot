import { Telegraf, session, Context, Markup } from "telegraf";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();
console.log("✅ Environment loaded");

type Stage =
  | "MENU"
  | "CHOOSE_CONTRACT_TYPE"
  | "USERNAME"
  | "PHONE"
  | "CAFE"
  | "FOOD"
  | "FOOD_ADD_MORE"
  | "MEALTYPE"
  | "CAMPUS"
  | "DORM";

interface TempOrder {
  cafe?: string;
  foods?: string[];
  mealType?: string;
  campus?: string;
  dorm?: string;
}

interface TempUser {
  username?: string;
  phone?: string;
  contract_type?: "Contract" | "Non-Contract";
}

interface MySession {
  stage?: Stage;
  tempOrder?: TempOrder;
  tempUser?: TempUser;
}

interface MyContext extends Context {
  session: MySession;
}

if (
  !process.env.BOT_TOKEN ||
  !process.env.SUPABASE_URL ||
  !process.env.SUPABASE_SERVICE_KEY ||
  !process.env.ADMIN_GROUP_ID
) {
  console.error("❌ Missing environment variables.");
  process.exit(1);
}

const bot = new Telegraf<MyContext>(process.env.BOT_TOKEN);
bot.use(session({ defaultSession: () => ({}) }));

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const cafes = [
  "Fike",
  "Mesi",
  "Pepsi",
  "Adonay",
  "Shewit",
  "AM",
  "Ahadu",
  "Selema",
  "Askual",
];
const foods = ["Tegabino", "Beyaynet", "Shiro", "Firfir", "Mekoreni", "Misr"];
const campuses = ["Techno", "Main"];
const dorms = ["Female Dorm", "Male Dorm"];
const CONTRACT_MEALS_LIMIT = 30;
const RIDER_CHAT_ID = parseInt(process.env.ADMIN_GROUP_ID!);

bot.start(async (ctx) => {
  ctx.session.stage = "CHOOSE_CONTRACT_TYPE";
  ctx.session.tempUser = {};
  return ctx.reply("💳 Are you a Contract or Non-Contract student?", {
    ...Markup.keyboard([["Contract"], ["Non-Contract"]]).resize(),
  });
});

bot.on("text", async (ctx) => {
  const text = ctx.message.text.trim();
  const userId = ctx.from.id;
  const session = ctx.session;
  if (text === "🔄 Start Over") {
    ctx.session = {};
    return ctx
      .reply("🔄 Restarting...", {
        ...Markup.removeKeyboard(),
      })
      .then(() => ctx.reply("/start to begin again."));
  }
  switch (session.stage) {
    case "CHOOSE_CONTRACT_TYPE":
      if (!["Contract", "Non-Contract"].includes(text))
        return ctx.reply("❌ Please select Contract or Non-Contract.");
      session.tempUser = { contract_type: text as "Contract" | "Non-Contract" };
      session.stage = "USERNAME";
      return ctx.reply("👋 Please enter your full name:");
    case "USERNAME":
      session.tempUser!.username = text;
      session.stage = "PHONE";
      return ctx.reply("📞 Please enter your phone number:");
    case "PHONE":
      session.tempUser!.phone = text;
      const { contract_type, username, phone } = session.tempUser!;
      const remainingMeals =
        contract_type === "Contract" ? CONTRACT_MEALS_LIMIT : null;
      const { error: insertError } = await supabase.from("users").upsert([
        {
          id: userId,
          username,
          phone,
          contract_type,
          remaining_meals: remainingMeals,
          is_active: true,
        },
      ]);
      if (insertError) {
        console.error(insertError);
        return ctx.reply("⚠️ Failed to save your info.");
      }
      session.stage = "MENU";
      return ctx.reply("✅ Registration complete!", {
        ...Markup.keyboard([
          ["🛒 New Order", "📜 My Orders"],
          ["🔄 Start Over"],
        ]).resize(),
      });
    case "MENU":
      if (text === "🛒 New Order") {
        const { data: user } = await supabase
          .from("users")
          .select("*")
          .eq("id", userId)
          .single();
        if (!user?.is_active)
          return ctx.reply("🚫 You are not active. Contact admin.");
        if (user.contract_type === "Contract" && user.remaining_meals <= 0)
          return ctx.reply("⚠️ You have no meals left. Contact admin.");
        session.stage = "CAFE";
        return ctx.reply("☕ Choose a café:", {
          ...Markup.keyboard(cafes).resize(),
        });
      }
      if (text === "📜 My Orders") {
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });
        if (error) return ctx.reply("⚠️ Couldn't fetch orders.");
        if (!data?.length) return ctx.reply("📭 You have no orders yet.");
        const list = data
          .map(
            (o) =>
              `☕ *${o.cafe}*\n🍽️ ${o.food}\n🍱 ${o.meal_type}\n🏫 ${
                o.campus
              }\n🏠 ${o.dorm}\n👤 ${o.name} | 📞 ${o.phone}\n🕒 ${new Date(
                o.created_at
              ).toLocaleString()}`
          )
          .join("\n\n");
        return ctx.reply(`📜 *Your Orders:*\n\n${list}`, {
          parse_mode: "Markdown",
        });
      }
      return ctx.reply("Please choose 🛒 New Order or 📜 My Orders.");
    case "CAFE":
      if (!cafes.includes(text))
        return ctx.reply("❌ Please select a valid café.");
      session.tempOrder = { cafe: text, foods: [] };
      session.stage = "FOOD";
      return ctx.reply("🍽️ Select your food:", {
        ...Markup.keyboard(foods).resize(),
      });
    case "FOOD":
      if (!foods.includes(text))
        return ctx.reply("❌ Please select a valid food.");
      session.tempOrder!.foods!.push(text);
      session.stage = "FOOD_ADD_MORE";
      return ctx.reply(`✅ Added ${text}. Add more?`, {
        ...Markup.keyboard([["Yes"], ["No"]]).resize(),
      });
    case "FOOD_ADD_MORE":
      if (text === "Yes") {
        session.stage = "FOOD";
        return ctx.reply("🍽️ Select another food:", {
          ...Markup.keyboard(foods).resize(),
        });
      } else if (text === "No") {
        session.stage = "MEALTYPE";
        return ctx.reply("🥗 Choose meal type:", {
          ...Markup.keyboard([["Lunch"], ["Dinner"]]).resize(),
        });
      } else return ctx.reply("❌ Please answer Yes or No.");
    case "MEALTYPE":
      if (!["Lunch", "Dinner"].includes(text))
        return ctx.reply("❌ Please select Lunch or Dinner.");
      session.tempOrder!.mealType = text;
      session.stage = "CAMPUS";
      return ctx.reply("🏫 Choose your campus:", {
        ...Markup.keyboard(campuses).resize(),
      });
    case "CAMPUS":
      if (!campuses.includes(text))
        return ctx.reply("❌ Please select a valid campus.");
      session.tempOrder!.campus = text;
      session.stage = "DORM";
      return ctx.reply("🏠 Choose your dorm:", {
        ...Markup.keyboard(dorms).resize(),
      });
    case "DORM":
      if (!dorms.includes(text))
        return ctx.reply("❌ Please select a valid dorm.");
      session.tempOrder!.dorm = text;
      const { data: fullUser } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();
      if (!fullUser) return ctx.reply("⚠️ User not found.");
      const order = {
        user_id: userId,
        name: fullUser.username,
        phone: fullUser.phone,
        cafe: session.tempOrder!.cafe!,
        food: session.tempOrder!.foods!.join(", "),
        meal_type: session.tempOrder!.mealType!,
        campus: session.tempOrder!.campus!,
        dorm: session.tempOrder!.dorm!,
      };
      const { error: orderError } = await supabase
        .from("orders")
        .insert([order]);
      if (orderError) {
        console.error(orderError);
        return ctx.reply("⚠️ Failed to save your order.");
      }
      if (fullUser.contract_type === "Contract") {
        const newRemaining = Math.max((fullUser.remaining_meals || 0) - 1, 0);
        await supabase
          .from("users")
          .update({ remaining_meals: newRemaining })
          .eq("id", userId);
      }
      const riderMessage = `
📦 *New Order Received!*
👤 ${fullUser.username}
📞 ${fullUser.phone}
☕ ${order.cafe}
🍽️ ${order.food}
🍱 ${order.meal_type}
🏫 ${order.campus}
🏠 ${order.dorm}
`;
      await bot.telegram.sendMessage(RIDER_CHAT_ID, riderMessage, {
        parse_mode: "Markdown",
      });
      session.stage = "MENU";
      return ctx.reply(
        `✅ *Order Saved!*\n👤 ${fullUser.username} | 📞 ${fullUser.phone}\n🍴 ${order.food}\n☕ ${order.cafe}\n🏫 ${order.campus} | 🏠 ${order.dorm}`,
        {
          parse_mode: "Markdown",
          ...Markup.keyboard([
            ["🛒 New Order", "📜 My Orders"],
            ["🔄 Start Over"],
          ]).resize(),
        }
      );
    default:
      return ctx.reply("❌ Use /start to begin again.");
  }
});

console.log("🚀 Starting bot...");
bot.launch().then(() => console.log("✅ Bot is running..."));
