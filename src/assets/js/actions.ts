"use server";

import { db } from "@/db/db";
import { 
  products, 
  categories, 
  customers, 
  shifts, 
  transactions, 
  transactionItems, 
  users,
  settings 
} from "@/db/schema";
import { eq, desc, and, sql, ne } from "drizzle-orm";

// ----------------------------------------------------
// PRODUCT ACTIONS
// ----------------------------------------------------

export async function getProducts() {
  try {
    return await db.select().from(products).where(eq(products.isActive, 1));
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

export async function saveProductAction(payload: {
  id?: number;
  barcode: string;
  name: string;
  categoryId: number;
  buyPrice: number;
  sellPrice: number;
  stock: number;
  minStock: number;
  unit: string;
  discountPercent?: number;
}): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    if (payload.id) {
      // Edit mode
      await db.update(products)
        .set({
          barcode: payload.barcode,
          name: payload.name,
          categoryId: payload.categoryId,
          buyPrice: payload.buyPrice,
          sellPrice: payload.sellPrice,
          stock: payload.stock,
          minStock: payload.minStock,
          unit: payload.unit,
          discountPercent: payload.discountPercent ?? 0
        })
        .where(eq(products.id, payload.id));
      return { success: true, message: "Produk berhasil diperbarui." };
    } else {
      // Add mode
      // Check for duplicate barcode
      const existing = await db.select()
        .from(products)
        .where(and(eq(products.barcode, payload.barcode), eq(products.isActive, 1)))
        .limit(1);

      if (existing.length > 0) {
        return { success: false, error: "Barcode sudah digunakan oleh produk lain." };
      }

      await db.insert(products).values({
        barcode: payload.barcode,
        name: payload.name,
        categoryId: payload.categoryId,
        buyPrice: payload.buyPrice,
        sellPrice: payload.sellPrice,
        stock: payload.stock,
        minStock: payload.minStock,
        unit: payload.unit,
        isActive: 1,
        discountPercent: payload.discountPercent ?? 0
      });
      return { success: true, message: "Produk berhasil ditambahkan." };
    }
  } catch (error: any) {
    console.error("Error saving product:", error);
    return { success: false, error: error.message || "Gagal menyimpan produk." };
  }
}

export async function deleteProductAction(id: number): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    // Soft delete to prevent transaction foreign key errors
    await db.update(products)
      .set({ isActive: 0 })
      .where(eq(products.id, id));
    return { success: true, message: "Produk berhasil dihapus dari katalog." };
  } catch (error: any) {
    console.error("Error deleting product:", error);
    return { success: false, error: error.message || "Gagal menghapus produk." };
  }
}

// ----------------------------------------------------
// CATEGORY ACTIONS
// ----------------------------------------------------

export async function getCategories() {
  try {
    return await db.select().from(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

export async function addCategoryAction(name: string, description?: string) {
  try {
    const res = await db.insert(categories).values({
      name,
      description
    }).returning();
    return { success: true, category: res[0] };
  } catch (error: any) {
    console.error("Error adding category:", error);
    return { success: false, error: error.message || "Gagal menambah kategori." };
  }
}

// ----------------------------------------------------
// CUSTOMER ACTIONS
// ----------------------------------------------------

export async function getCustomers() {
  try {
    return await db.select().from(customers);
  } catch (error) {
    console.error("Error fetching customers:", error);
    return [];
  }
}

export async function saveCustomerAction(customer: { id?: number; name: string; phone?: string; points?: number }) {
  try {
    const phoneVal = customer.phone?.trim() || null;
    
    if (customer.id) {
      // Check existing phone for other customers
      if (phoneVal) {
        const existing = await db.select().from(customers)
          .where(and(
            eq(customers.phone, phoneVal),
            ne(customers.id, customer.id)
          ))
          .limit(1);
        if (existing.length > 0) {
          return { success: false, error: "Nomor telepon sudah digunakan member lain." };
        }
      }
      
      // Update
      const res = await db.update(customers)
        .set({
          name: customer.name.trim(),
          phone: phoneVal,
          points: customer.points ?? 0
        })
        .where(eq(customers.id, customer.id))
        .returning();
      return { success: true, customer: res[0] };
    } else {
      // Check existing phone
      if (phoneVal) {
        const existing = await db.select().from(customers).where(eq(customers.phone, phoneVal)).limit(1);
        if (existing.length > 0) {
          return { success: false, error: "Nomor telepon sudah digunakan member lain." };
        }
      }
      
      // Insert
      const res = await db.insert(customers).values({
        name: customer.name.trim(),
        phone: phoneVal,
        points: customer.points ?? 0,
        createdAt: new Date().toISOString()
      }).returning();
      return { success: true, customer: res[0] };
    }
  } catch (error: any) {
    console.error("Error saving customer:", error);
    return { success: false, error: error.message || "Gagal menyimpan data member." };
  }
}

export async function deleteCustomerAction(id: number) {
  try {
    await db.delete(customers).where(eq(customers.id, id));
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting customer:", error);
    return { success: false, error: error.message || "Gagal menghapus data member." };
  }
}

// ----------------------------------------------------
// SHIFT ACTIONS
// ----------------------------------------------------

export async function getOpenShift() {
  try {
    const res = await db.select()
      .from(shifts)
      .where(eq(shifts.status, "OPEN"))
      .limit(1);
    return res[0] || null;
  } catch (error) {
    console.error("Error fetching open shift:", error);
    return null;
  }
}

export async function openShiftAction(startingCash: number, cashierName: string) {
  try {
    // Check if there is already an open shift
    const existing = await getOpenShift();
    if (existing) {
      return { success: false, error: "Sudah ada shift kasir yang aktif." };
    }

    const res = await db.insert(shifts).values({
      cashierName,
      startTime: new Date().toISOString(),
      startingCash,
      expectedEndingCash: startingCash,
      status: "OPEN"
    }).returning();

    return { success: true, shift: res[0] };
  } catch (error: any) {
    console.error("Error opening shift:", error);
    return { success: false, error: error.message || "Gagal membuka shift kasir." };
  }
}

export async function closeShiftAction(shiftId: number, actualEndingCash: number) {
  try {
    const shiftList = await db.select().from(shifts).where(eq(shifts.id, shiftId)).limit(1);
    if (shiftList.length === 0) {
      return { success: false, error: "Shift tidak ditemukan." };
    }

    const shift = shiftList[0];
    const discrepancy = actualEndingCash - shift.expectedEndingCash;

    const res = await db.update(shifts)
      .set({
        endTime: new Date().toISOString(),
        actualEndingCash,
        discrepancy,
        status: "CLOSED"
      })
      .where(eq(shifts.id, shiftId))
      .returning();

    return { success: true, shift: res[0] };
  } catch (error: any) {
    console.error("Error closing shift:", error);
    return { success: false, error: error.message || "Gagal menutup shift kasir." };
  }
}

export async function getShiftLogs() {
  try {
    return await db.select().from(shifts).orderBy(desc(shifts.startTime));
  } catch (error) {
    console.error("Error fetching shift logs:", error);
    return [];
  }
}

// ----------------------------------------------------
// TRANSACTION ACTIONS
// ----------------------------------------------------

export interface TransactionPayload {
  invoiceNumber: string;
  shiftId: number;
  cashierName: string;
  customerName?: string;
  customerId?: number;
  totalRaw: number;
  discount: number;
  totalPaid: number;
  paymentMethod: "CASH" | "QRIS" | "CARD";
  amountReceived: number;
  changeAmount: number;
  tax: number;
  taxRate: number;
  pointsRedeemed?: number;
  items: {
    productId: number;
    productName: string;
    quantity: number;
    buyPrice: number;
    sellPrice: number;
    subtotal: number;
  }[];
}

export async function createTransactionAction(payload: TransactionPayload): Promise<{ success: boolean; transactionId?: number; error?: string }> {
  try {
    // Load point multiplier from settings dynamically
    const multSetting = await db.select().from(settings).where(eq(settings.key, "points_per_multiplier")).limit(1);
    const multiplier = multSetting.length > 0 ? (parseInt(multSetting[0].value) || 10000) : 10000;

    return db.transaction((tx) => {
      // 1. Insert transaction record
      const earnedPoints = payload.customerId ? Math.floor(payload.totalPaid / multiplier) : 0;

      const txInsert = tx.insert(transactions).values({
        invoiceNumber: payload.invoiceNumber,
        shiftId: payload.shiftId,
        cashierName: payload.cashierName,
        customerName: payload.customerName || null,
        totalRaw: payload.totalRaw,
        discount: payload.discount,
        totalPaid: payload.totalPaid,
        paymentMethod: payload.paymentMethod,
        amountReceived: payload.amountReceived,
        changeAmount: payload.changeAmount,
        tax: payload.tax,
        taxRate: payload.taxRate,
        pointsRedeemed: payload.pointsRedeemed || 0,
        pointsEarned: earnedPoints,
        createdAt: new Date().toISOString()
      }).returning().all();

      const txRecordId = txInsert[0].id;

      // 2. Insert items and decrement product stocks
      for (const item of payload.items) {
        tx.insert(transactionItems).values({
          transactionId: txRecordId,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          buyPrice: item.buyPrice,
          sellPrice: item.sellPrice,
          subtotal: item.subtotal
        }).run();

        // Decrement stock
        tx.update(products)
          .set({
            stock: sql`${products.stock} - ${item.quantity}`
          })
          .where(eq(products.id, item.productId))
          .run();
      }

      // 3. Update customer points if member is active
      if (payload.customerId) {
        let pointsChange = 0;

        // Deduct redeemed points
        if (payload.pointsRedeemed && payload.pointsRedeemed > 0) {
          pointsChange -= payload.pointsRedeemed;
        }

        // Add earned points from current purchase
        if (earnedPoints > 0) {
          pointsChange += earnedPoints;
        }

        if (pointsChange !== 0) {
          tx.update(customers)
            .set({
              points: sql`${customers.points} + ${pointsChange}`
            })
            .where(eq(customers.id, payload.customerId))
            .run();
        }
      }

      // 4. Update expected cash in active shift if paymentMethod = CASH
      if (payload.paymentMethod === "CASH") {
        tx.update(shifts)
          .set({
            expectedEndingCash: sql`${shifts.expectedEndingCash} + ${payload.totalPaid}`
          })
          .where(eq(shifts.id, payload.shiftId))
          .run();
      }

      return { success: true, transactionId: txRecordId };
    });
  } catch (error: any) {
    console.error("Error creating transaction:", error);
    return { success: false, error: error.message || "Gagal memproses transaksi." };
  }
}

export async function getTransactions() {
  try {
    const txRecords = await db.select().from(transactions).orderBy(desc(transactions.createdAt));
    
    // Map with their respective items
    const fullTransactions = [];
    for (const tx of txRecords) {
      const itemsList = await db.select()
        .from(transactionItems)
        .where(eq(transactionItems.transactionId, tx.id));
      fullTransactions.push({
        ...tx,
        items: itemsList
      });
    }
    return fullTransactions;
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }
}

// ----------------------------------------------------
// USER/STAFF MANAGEMENT ACTIONS
// ----------------------------------------------------

export async function authenticateUserAction(username: string, password: string) {
  try {
    const res = await db.select()
      .from(users)
      .where(eq(users.username, username.toLowerCase()))
      .limit(1);
    
    if (res.length === 0) {
      return { success: false, error: "Username tidak ditemukan." };
    }
    
    const user = res[0];
    if (user.passwordHash !== password) {
      return { success: false, error: "Password salah." };
    }
    
    return { 
      success: true, 
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role as 'ADMIN' | 'CASHIER'
      }
    };
  } catch (error: any) {
    console.error("Error authenticating user:", error);
    return { success: false, error: error.message || "Gagal masuk." };
  }
}

export async function getUsers() {
  try {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
}

export async function saveUserAction(user: { id?: number; username: string; passwordHash: string; name: string; role: 'ADMIN' | 'CASHIER' }) {
  try {
    if (user.id) {
      // Check existing username for other users
      const existing = await db.select().from(users)
        .where(and(
          eq(users.username, user.username.toLowerCase()),
          ne(users.id, user.id)
        ))
        .limit(1);
      if (existing.length > 0) {
        return { success: false, error: "Username sudah digunakan staf lain." };
      }

      // Update
      const res = await db.update(users)
        .set({
          username: user.username.toLowerCase(),
          passwordHash: user.passwordHash,
          name: user.name,
          role: user.role
        })
        .where(eq(users.id, user.id))
        .returning();
      return { success: true, user: res[0] };
    } else {
      // Check existing username
      const existing = await db.select().from(users).where(eq(users.username, user.username.toLowerCase())).limit(1);
      if (existing.length > 0) {
        return { success: false, error: "Username sudah digunakan staf lain." };
      }
      
      // Insert
      const res = await db.insert(users).values({
        username: user.username.toLowerCase(),
        passwordHash: user.passwordHash,
        name: user.name,
        role: user.role,
        createdAt: new Date().toISOString()
      }).returning();
      return { success: true, user: res[0] };
    }
  } catch (error: any) {
    console.error("Error saving user:", error);
    return { success: false, error: error.message || "Gagal menyimpan data staf." };
  }
}

export async function deleteUserAction(id: number) {
  try {
    await db.delete(users).where(eq(users.id, id));
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting user:", error);
    return { success: false, error: error.message || "Gagal menghapus data staf." };
  }
}

// ----------------------------------------------------
// SYSTEM SETTINGS ACTIONS
// ----------------------------------------------------

export async function getSettingsAction() {
  try {
    const list = await db.select().from(settings);
    
    // Default settings to seed if empty
    const defaultSettings = [
      { key: "store_name", value: "MiniPOS Minimarket", description: "Nama Minimarket / Toko yang ditampilkan di web dan struk" },
      { key: "store_address", value: "Jl. Raya Minimarket No. 123, Jakarta", description: "Alamat Toko yang tercetak di bagian atas struk" },
      { key: "store_phone", value: "081234567890", description: "Nomor Telepon Toko untuk informasi struk" },
      { key: "receipt_footer", value: "Terima Kasih Telah Berbelanja!", description: "Pesan kaki / footer di bagian bawah struk belanja" },
      { key: "starting_cash_default", value: "200000", description: "Nominal default Uang Modal Awal ketika membuka shift kasir baru" },
      { key: "points_per_multiplier", value: "10000", description: "Kelipatan nominal belanja (Rupiah) untuk mendapatkan 1 poin member" },
      { key: "enable_tax", value: "false", description: "Mengaktifkan perhitungan Pajak PPN (true / false)" },
      { key: "tax_rate", value: "11", description: "Persentase Pajak PPN yang berlaku (dalam persen %)" },
      { key: "point_redeem_value", value: "100", description: "Nilai nominal Rupiah diskon potongan belanja per 1 poin member yang ditukarkan" },
      { key: "min_stock_default", value: "5", description: "Batas minimum stok default ketika menambahkan produk barang baru" },
      { key: "enable_member_discount", value: "true", description: "Mengaktifkan diskon otomatis member loyalitas (true / false)" },
      { key: "member_discount_rate", value: "2", description: "Persentase diskon otomatis member (dalam persen %)" },
      { key: "enable_grosir_discount", value: "true", description: "Mengaktifkan diskon otomatis grosir promo volume (true / false)" },
      { key: "grosir_min_qty", value: "5", description: "Jumlah minimum kuantitas item untuk memicu diskon grosir" },
      { key: "grosir_discount_rate", value: "5", description: "Persentase diskon grosir (dalam persen %)" }
    ];

    if (list.length === 0) {
      const seeded = [];
      for (const item of defaultSettings) {
        const res = await db.insert(settings).values({
          key: item.key,
          value: item.value,
          description: item.description,
          updatedAt: new Date().toISOString()
        }).returning().all();
        seeded.push(res[0]);
      }
      return seeded;
    }

    // Ensure all default keys exist
    const existingKeys = new Set(list.map(s => s.key));
    const missingSettings = defaultSettings.filter(d => !existingKeys.has(d.key));
    if (missingSettings.length > 0) {
      for (const item of missingSettings) {
        const res = await db.insert(settings).values({
          key: item.key,
          value: item.value,
          description: item.description,
          updatedAt: new Date().toISOString()
        }).returning().all();
        list.push(res[0]);
      }
    }

    return list;
  } catch (error) {
    console.error("Error fetching settings:", error);
    return [];
  }
}

export async function saveSettingsAction(settingsList: { key: string; value: string }[]) {
  try {
    for (const item of settingsList) {
      await db.update(settings)
        .set({
          value: item.value.trim(),
          updatedAt: new Date().toISOString()
        })
        .where(eq(settings.key, item.key))
        .run();
    }
    return { success: true };
  } catch (error: any) {
    console.error("Error saving settings:", error);
    return { success: false, error: error.message || "Gagal menyimpan konfigurasi pengaturan." };
  }
}

export async function deleteShiftAction(id: number) {
  try {
    return db.transaction((tx) => {
      // First delete transactions that reference this shift to maintain foreign key integrity
      const txs = tx.select().from(transactions).where(eq(transactions.shiftId, id)).all();
      for (const t of txs) {
        tx.delete(transactionItems).where(eq(transactionItems.transactionId, t.id)).run();
      }
      tx.delete(transactions).where(eq(transactions.shiftId, id)).run();
      
      // Finally delete the shift
      tx.delete(shifts).where(eq(shifts.id, id)).run();
      return { success: true };
    });
  } catch (error: any) {
    console.error("Error deleting shift:", error);
    return { success: false, error: error.message || "Gagal menghapus data shift." };
  }
}
