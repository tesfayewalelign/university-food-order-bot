import { Order } from "../models/orderModel.js";

export const OrderService = {
  async createOrder(userId: number, username: string, mealType: string) {
    const order = new Order({ userId, username, mealType });
    await order.save();
    return order;
  },

  async getAllOrders() {
    return Order.find().sort({ createdAt: -1 });
  },

  async setOrderStatus(orderId: string, status: string) {
    return Order.findByIdAndUpdate(orderId, { status }, { new: true });
  },
};
