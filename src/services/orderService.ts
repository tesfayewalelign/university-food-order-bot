import { supabase } from "../database.js";

export async function addOrder(userId: number, food: string) {
  const { error } = await supabase
    .from("orders")
    .insert([{ user_id: userId, food }]);
  if (error) throw error;
  return "✅ Order added successfully!";
}

export async function listOrders(userId: number) {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", userId);
  if (error) throw error;
  if (!data || data.length === 0) return "You have no orders yet!";
  return data.map((o) => `🍽️ ${o.food}`).join("\n");
}
