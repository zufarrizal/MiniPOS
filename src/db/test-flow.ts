import { 
  getOpenShift, 
  openShiftAction, 
  closeShiftAction, 
  getProducts, 
  createTransactionAction, 
  getTransactions, 
  getShiftLogs 
} from "../app/actions";
import { db } from "./db";
import { shifts, transactions, transactionItems, products } from "./schema";
import { eq } from "drizzle-orm";

async function runTests() {
  console.log("=== MEMULAI PENGUJIAN INTEGRASI PROGRAMATIK BACKEND POS ===");

  try {
    // 1. Bersihkan data transaksi/shift sebelumnya agar testing bersih
    console.log("\n[1/7] Membersihkan data transaksi & shift lama di SQLite...");
    await db.delete(transactionItems);
    await db.delete(transactions);
    await db.delete(shifts);
    // Reset stok produk testing ke kondisi awal seeder
    await db.update(products).set({ stock: 120 }).where(eq(products.id, 1)); // Indomie
    await db.update(products).set({ stock: 85 }).where(eq(products.id, 2));  // Aqua
    console.log("✓ Database dibersihkan & stok produk di-reset.");

    // 2. Test Buka Shift Kasir
    console.log("\n[2/7] Menguji Fitur Buka Shift Kasir...");
    const startingCash = 200000;
    const openRes = await openShiftAction(startingCash, "Kasir Siti Testing");
    
    if (!openRes.success || !openRes.shift) {
      throw new Error("Gagal membuka shift kasir: " + openRes.error);
    }
    
    const activeShiftId = openRes.shift.id;
    console.log(`✓ Shift berhasil dibuka. ID Shift: #SHF-${activeShiftId}`);
    console.log(`  Modal Awal: Rp ${openRes.shift.startingCash.toLocaleString("id-ID")}`);

    // 3. Ambil data produk & verifikasi stok awal
    console.log("\n[3/7] Menguji Pengambilan Produk & Verifikasi Stok Awal...");
    const allProds = await getProducts();
    const indomie = allProds.find(p => p.id === 1);
    const aqua = allProds.find(p => p.id === 2);
    
    if (!indomie || !aqua) {
      throw new Error("Produk Indomie atau Aqua tidak ditemukan di database!");
    }
    
    console.log(`✓ Produk berhasil dibaca.`);
    console.log(`  Stok Indomie awal: ${indomie.stock} ${indomie.unit}`);
    console.log(`  Stok Aqua awal: ${aqua.stock} ${aqua.unit}`);

    // 4. Proses Transaksi Baru (Indomie x3, Aqua x2)
    console.log("\n[4/7] Menguji Pembelian Barang (Transaksi Kasir)...");
    
    const invoiceNumber = `TEST-INV-${Date.now().toString().slice(-6)}`;
    const txPayload = {
      invoiceNumber,
      shiftId: activeShiftId,
      cashierName: "Kasir Siti Testing",
      totalRaw: 16600, // (3 * 3200) + (2 * 3500) = 9600 + 7000 = 16600
      discount: 1600,  // Diskon Rp 1.600
      totalPaid: 15000, // Total bayar akhir Rp 15.000
      paymentMethod: "CASH" as const,
      amountReceived: 20000,
      changeAmount: 5000,
      tax: 0,
      taxRate: 0,
      items: [
        {
          productId: 1,
          productName: indomie.name,
          quantity: 3,
          buyPrice: indomie.buyPrice,
          sellPrice: indomie.sellPrice,
          subtotal: 9600
        },
        {
          productId: 2,
          productName: aqua.name,
          quantity: 2,
          buyPrice: aqua.buyPrice,
          sellPrice: aqua.sellPrice,
          subtotal: 7000
        }
      ]
    };

    const txRes = await createTransactionAction(txPayload);
    if (!txRes.success) {
      throw new Error("Gagal memproses transaksi kasir: " + txRes.error);
    }
    console.log(`✓ Transaksi berhasil diproses. No Invoice: ${invoiceNumber}`);

    // 5. Verifikasi Pemotongan Stok
    console.log("\n[5/7] Memverifikasi Pemotongan Stok di Database SQLite...");
    const updatedProds = await getProducts();
    const updatedIndomie = updatedProds.find(p => p.id === 1)!;
    const updatedAqua = updatedProds.find(p => p.id === 2)!;

    console.log(`  Stok Indomie akhir: ${updatedIndomie.stock} (Sebelumnya: 120, Terpotong: 3)`);
    console.log(`  Stok Aqua akhir: ${updatedAqua.stock} (Sebelumnya: 85, Terpotong: 2)`);

    if (updatedIndomie.stock !== 117 || updatedAqua.stock !== 83) {
      throw new Error("Gagal memvalidasi pemotongan stok!");
    }
    console.log("✓ Pengurangan stok terbukti akurat.");

    // 6. Verifikasi Akumulasi Kas Shift & Histori Transaksi
    console.log("\n[6/7] Memverifikasi Kas Laci Kasir & Histori Transaksi...");
    const activeShift = await getOpenShift();
    if (!activeShift) {
      throw new Error("Gagal mengambil shift aktif pasca transaksi!");
    }

    console.log(`  Target kas kasir saat ini: Rp ${activeShift.expectedEndingCash.toLocaleString("id-ID")} (Modal: Rp 200k + Belanja: Rp 15k)`);
    if (activeShift.expectedEndingCash !== 215000) {
      throw new Error("Target kas di shift tidak bertambah sesuai total belanja tunai!");
    }

    const txList = await getTransactions();
    console.log(`✓ Histori transaksi berhasil dibaca. Jumlah struk tersimpan: ${txList.length}`);
    if (txList.length !== 1 || txList[0].invoiceNumber !== invoiceNumber) {
      throw new Error("Transaksi tidak tercatat dalam histori dengan benar!");
    }
    console.log("✓ Akumulasi kas laci & histori transaksi terbukti valid.");

    // 7. Test Tutup Shift Kasir & Rekonsiliasi Kas
    console.log("\n[7/7] Menguji Tutup Shift Kasir & Audit Selisih...");
    // Uang fisik di laci dimasukkan kasir adalah Rp 217.000 (ada kelebihan Rp 2.000)
    const actualEndingCash = 217000;
    const closeRes = await closeShiftAction(activeShiftId, actualEndingCash);
    
    if (!closeRes.success || !closeRes.shift) {
      throw new Error("Gagal menutup shift kasir: " + closeRes.error);
    }

    console.log(`✓ Shift berhasil ditutup.`);
    console.log(`  Expected Ending Cash : Rp ${closeRes.shift.expectedEndingCash.toLocaleString("id-ID")}`);
    console.log(`  Actual Ending Cash   : Rp ${closeRes.shift.actualEndingCash?.toLocaleString("id-ID")}`);
    console.log(`  Selisih Kas Laci     : Rp ${closeRes.shift.discrepancy?.toLocaleString("id-ID")} (Kelebihan Kas)`);

    if (closeRes.shift.status !== "CLOSED" || closeRes.shift.discrepancy !== 2000) {
      throw new Error("Gagal mengaudit selisih kas pada penutupan shift!");
    }

    console.log("\n========================================================");
    console.log("🎉 SELURUH PENGUJIAN INTEGRASI PROGRAMATIK BACKEND BERHASIL!");
    console.log("✓ Semua Server Actions terintegrasi dengan database SQLite secara akurat.");
    console.log("========================================================");

  } catch (error: any) {
    console.error("\n❌ PENGUJIAN GAGAL:", error.message || error);
    process.exit(1);
  }
}

runTests();
