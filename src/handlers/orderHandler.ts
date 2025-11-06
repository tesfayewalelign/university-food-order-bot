import { supabase } from "../helpers/supabaseClient.js";

export const createOrder = async (userId: number, food: string) => {
  const { data, error } = await supabase
    .from("orders")
    .insert([{ user_id: userId, food }]);

  if (error) {
    console.error("❌ Failed to insert order:", error.message);
  } else {
    console.log("✅ Order created:", data);
  }
};
