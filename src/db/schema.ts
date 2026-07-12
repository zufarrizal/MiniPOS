import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// Users Table
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(), // 'ADMIN' | 'CASHIER'
  createdAt: text("created_at").notNull(),
});

// Categories Table
export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
});

// Products Table
export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  barcode: text("barcode").notNull().unique(),
  name: text("name").notNull(),
  categoryId: integer("category_id").notNull().references(() => categories.id),
  buyPrice: real("buy_price").notNull(),
  sellPrice: real("sell_price").notNull(),
  stock: integer("stock").notNull(),
  minStock: integer("min_stock").notNull(),
  unit: text("unit").notNull(),
  isActive: integer("is_active").notNull().default(1), // 1 = active, 0 = inactive
  discountPercent: integer("discount_percent").notNull().default(0),
});

// Customers Table
export const customers = sqliteTable("customers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  phone: text("phone").unique(),
  points: integer("points").notNull().default(0),
  createdAt: text("created_at").notNull(),
});

// Shifts Table
export const shifts = sqliteTable("shifts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  cashierName: text("cashier_name").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time"),
  startingCash: real("starting_cash").notNull(),
  expectedEndingCash: real("expected_ending_cash").notNull(),
  actualEndingCash: real("actual_ending_cash"),
  discrepancy: real("discrepancy"),
  status: text("status").notNull(), // 'OPEN' | 'CLOSED'
});

// Transactions Table
export const transactions = sqliteTable("transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  invoiceNumber: text("invoice_number").notNull().unique(),
  shiftId: integer("shift_id").notNull().references(() => shifts.id),
  cashierName: text("cashier_name").notNull(),
  customerName: text("customer_name"),
  totalRaw: real("total_raw").notNull(),
  discount: real("discount").notNull(),
  totalPaid: real("total_paid").notNull(),
  paymentMethod: text("payment_method").notNull(), // 'CASH' | 'QRIS' | 'CARD'
  amountReceived: real("amount_received").notNull(),
  changeAmount: real("change_amount").notNull(),
  tax: real("tax").notNull().default(0),
  taxRate: real("tax_rate").notNull().default(0),
  pointsRedeemed: integer("points_redeemed").notNull().default(0),
  pointsEarned: integer("points_earned").notNull().default(0),
  createdAt: text("created_at").notNull(),
});

// Transaction Items Table
export const transactionItems = sqliteTable("transaction_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  transactionId: integer("transaction_id").notNull().references(() => transactions.id),
  productId: integer("product_id").notNull().references(() => products.id),
  productName: text("product_name").notNull(),
  quantity: integer("quantity").notNull(),
  buyPrice: real("buy_price").notNull(),
  sellPrice: real("sell_price").notNull(),
  subtotal: real("subtotal").notNull(),
});

// Stock Adjustments Table
export const stockAdjustments = sqliteTable("stock_adjustments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id").notNull().references(() => products.id),
  type: text("type").notNull(), // 'IN' | 'OUT'
  quantity: integer("quantity").notNull(),
  reason: text("reason").notNull(),
  createdAt: text("created_at").notNull(),
});

// Settings Table
export const settings = sqliteTable("settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedAt: text("updated_at").notNull(),
});
