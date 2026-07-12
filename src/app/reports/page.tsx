"use client";

import React, { useState, useEffect } from "react";
import { 
  BarChart3, 
  Clock, 
  Receipt, 
  Download, 
  ArrowUpRight, 
  ChevronRight, 
  Printer, 
  User, 
  TrendingUp, 
  FileSpreadsheet,
  Calendar,
  Eye,
  Trash2
} from "lucide-react";
import { Transaction, Shift } from "@/data/mockData";
import { getTransactions, getShiftLogs, deleteShiftAction, getSettingsAction } from "@/app/actions";
import { useCartStore } from "@/store/cartStore";

export default function Reports() {
  const { currentUser } = useCartStore();
  const isAdmin = currentUser?.role === 'ADMIN';
  // Modal Dialogue State
  const [modalConfig, setModalConfig] = useState<{
    show: boolean;
    title: string;
    message: string;
    type?: 'alert' | 'confirm';
    onConfirm?: () => void;
  } | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [activeTab, setActiveTab] = useState<"sales" | "shifts">("sales");
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [storeName, setStoreName] = useState("MiniPOS Minimarket");
  const [storeAddress, setStoreAddress] = useState("Jl. Raya Minimarket No. 123, Jakarta");

  const loadData = async () => {
    const settingsData = await getSettingsAction();
    const nameSet = settingsData.find(s => s.key === "store_name");
    if (nameSet) setStoreName(nameSet.value);
    const addrSet = settingsData.find(s => s.key === "store_address");
    if (addrSet) setStoreAddress(addrSet.value);

    const txs = await getTransactions();
    setTransactions(txs.map(t => ({
      id: t.id,
      invoiceNumber: t.invoiceNumber,
      cashierName: t.cashierName,
      customerName: t.customerName || undefined,
      items: (t.items || []).map(i => ({
        productId: i.productId,
        productName: i.productName,
        quantity: i.quantity,
        buyPrice: i.buyPrice,
        sellPrice: i.sellPrice,
        subtotal: i.subtotal
      })),
      totalRaw: t.totalRaw,
      discount: t.discount,
      totalPaid: t.totalPaid,
      paymentMethod: t.paymentMethod as any,
      amountReceived: t.amountReceived,
      changeAmount: t.changeAmount,
      tax: t.tax,
      taxRate: t.taxRate,
      pointsRedeemed: t.pointsRedeemed || 0,
      pointsEarned: t.pointsEarned || 0,
      createdAt: t.createdAt
    })));

    const sLogs = await getShiftLogs();
    setShifts(sLogs.map(s => ({
      id: s.id,
      cashierName: s.cashierName,
      startTime: s.startTime,
      endTime: s.endTime || undefined,
      startingCash: s.startingCash,
      expectedEndingCash: s.expectedEndingCash,
      actualEndingCash: s.actualEndingCash || undefined,
      discrepancy: s.discrepancy || undefined,
      status: s.status as any
    })));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteShift = (id: number) => {
    setModalConfig({
      show: true,
      title: "Konfirmasi Hapus Laporan Shift",
      message: `Apakah Anda yakin ingin menghapus data Shift #SHF-${id}?\n\nPERINGATAN: Semua transaksi yang diproses selama shift ini juga akan ikut terhapus secara permanen untuk menjaga integritas data!`,
      type: "confirm",
      onConfirm: async () => {
        const res = await deleteShiftAction(id);
        if (res.success) {
          loadData();
        } else {
          setModalConfig({
            show: true,
            title: "Gagal Menghapus",
            message: (res as any).error || "Terjadi kesalahan saat menghapus data shift.",
            type: "alert"
          });
        }
      }
    });
  };

  // Recalculate totals
  const totalRevenue = transactions.reduce((acc, tx) => acc + tx.totalPaid, 0);
  
  const totalHPP = transactions.reduce((acc, tx) => {
    return acc + (tx.items || []).reduce((itemAcc, item) => itemAcc + (item.buyPrice * item.quantity), 0);
  }, 0);

  const totalProfit = totalRevenue - totalHPP;
  const marginPercent = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  const handleExport = (type: string) => {
    try {
      // Generate CSV content with UTF-8 BOM so Excel displays characters correctly
      let csvContent = "\uFEFF";
      
      // Table Header Row
      csvContent += "No. Invoice;Tanggal Transaksi;Nama Kasir;Nama Member;Subtotal (Rp);Diskon (Rp);PPN (Rp);Tarif PPN (%);Poin Ditukar;Poin Didapat;Total Akhir (Rp);Metode Bayar;Uang Diterima;Uang Kembalian\n";
      
      // Rows of data
      transactions.forEach(tx => {
        const dateStr = tx.createdAt ? new Date(tx.createdAt).toLocaleString("id-ID").replace(/,/g, "") : "-";
        const memberName = tx.customerName || "Non-Member";
        const totalPaidVal = tx.totalPaid;
        const discountVal = tx.discount;
        const subtotalVal = tx.totalRaw;
        const taxVal = tx.tax ?? 0;
        const taxRateVal = tx.taxRate ?? 0;
        const pointsRedeemedVal = tx.pointsRedeemed ?? 0;
        const pointsEarnedVal = tx.pointsEarned ?? 0;
        const amountRecVal = tx.amountReceived;
        const changeVal = tx.changeAmount;
        
        csvContent += `${tx.invoiceNumber};${dateStr};${tx.cashierName};${memberName};${subtotalVal};${discountVal};${taxVal};${taxRateVal};${pointsRedeemedVal};${pointsEarnedVal};${totalPaidVal};${tx.paymentMethod};${amountRecVal};${changeVal}\n`;
      });
      
      // Create element to trigger download action
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const filename = `Laporan_Penjualan_MiniPOS_${new Date().toISOString().slice(0, 10)}.csv`;
      
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setModalConfig({
        show: true,
        title: "Ekspor Berhasil",
        message: `Laporan penjualan berhasil diunduh sebagai file "${filename}". Anda dapat langsung membukanya di Microsoft Excel!`
      });
    } catch (err: any) {
      console.error("Export failed:", err);
      setModalConfig({
        show: true,
        title: "Ekspor Gagal",
        message: `Terjadi kesalahan saat memproses ekspor laporan: ${err.message || err}`
      });
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col overflow-hidden">
      {/* Title / Action bar */}
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 font-sans">Laporan & Keuangan</h1>
          <p className="text-sm text-zinc-400">
            {isAdmin 
              ? "Analisis laba rugi, riwayat struk kasir, dan penutupan laci kas per shift." 
              : "Daftar riwayat struk transaksi belanja pelanggan."}
          </p>
        </div>
        
        {isAdmin && (
          <div className="flex gap-3">
            <button
              onClick={() => handleExport("xlsx")}
              className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 py-2.5 px-4 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              Ekspor Excel
            </button>
          </div>
        )}
      </div>

      {/* Financial Metrics Cards (Only for Admin) */}
      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
          {/* Total Omzet */}
          <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Total Omzet Penjualan</p>
            <h3 className="text-2xl font-bold text-zinc-100 mt-2">Rp {totalRevenue.toLocaleString("id-ID")}</h3>
            <div className="flex items-center gap-1.5 mt-3 text-[10px] text-zinc-400">
              <span>Berdasarkan {transactions.length} transaksi hari ini</span>
            </div>
            <div className="absolute right-0 bottom-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -mr-6 -mb-6" />
          </div>

          {/* Total HPP */}
          <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Harga Pokok Penjualan (HPP)</p>
            <h3 className="text-2xl font-bold text-zinc-400 mt-2">Rp {totalHPP.toLocaleString("id-ID")}</h3>
            <div className="flex items-center gap-1.5 mt-3 text-[10px] text-zinc-400">
              <span>Biaya modal barang terjual</span>
            </div>
          </div>

          {/* Laba Bersih */}
          <div className="glass-card rounded-2xl p-5 relative overflow-hidden border-emerald-500/20 bg-emerald-500/[0.02]">
            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Laba Bersih Kotor</p>
            <h3 className="text-2xl font-bold text-emerald-400 mt-2">Rp {totalProfit.toLocaleString("id-ID")}</h3>
            <div className="flex items-center gap-1.5 mt-3 text-[10px] text-emerald-500">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Margin Keuntungan: {marginPercent.toFixed(1)}%</span>
            </div>
            <div className="absolute right-0 bottom-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl -mr-6 -mb-6" />
          </div>
        </div>
      )}

      {/* Tabs Layout */}
      <div className="flex-1 flex flex-col min-h-0 gap-4">
        {/* Tab Headers (Only for Admin to toggle) */}
        <div className="flex border-b border-zinc-800 shrink-0">
          <button
            onClick={() => setActiveTab("sales")}
            className={`py-3 px-6 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === "sales"
                ? "border-primary text-white"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4" />
              Riwayat Transaksi (Struk)
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab("shifts")}
            className={`py-3 px-6 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === "shifts"
                ? "border-primary text-white"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Laporan Shift Kasir
            </div>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 glass-card rounded-2xl overflow-hidden flex flex-col min-h-0">
          {activeTab === "sales" ? (
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-900 border-b border-zinc-800 text-zinc-300 font-bold text-[10px] uppercase tracking-wider">
                    <th className="py-4 px-6">No. Invoice</th>
                    <th className="py-4 px-6">Waktu</th>
                    <th className="py-4 px-6">Kasir</th>
                    <th className="py-4 px-6">Pelanggan / Member</th>
                    <th className="py-4 px-6 text-center">Jumlah Item</th>
                    <th className="py-4 px-6 text-right">Cara Bayar</th>
                    <th className="py-4 px-6 text-right">Total Bayar</th>
                    <th className="py-4 px-6 text-center">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-xs text-zinc-300">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-zinc-500 font-medium">
                        Tidak ada riwayat transaksi hari ini.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => {
                      const totalQty = (tx.items || []).reduce((sum, item) => sum + item.quantity, 0);
                      return (
                        <tr key={tx.id} className="hover:bg-zinc-800/25 transition-colors">
                          <td className="py-3.5 px-6 font-mono font-bold text-zinc-200">{tx.invoiceNumber}</td>
                          <td className="py-3.5 px-6 text-zinc-300">
                            {tx.createdAt ? new Date(tx.createdAt).toLocaleTimeString("id-ID", {hour: "2-digit", minute:"2-digit"}) : "-"}
                          </td>
                          <td className="py-3.5 px-6 font-medium">{tx.cashierName}</td>
                          <td className="py-3.5 px-6 text-zinc-300">{tx.customerName || "Non-Member (Umum)"}</td>
                          <td className="py-3.5 px-6 text-center tabular-nums">{totalQty} pcs</td>
                          <td className="py-3.5 px-6 text-right">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border inline-block ${
                              tx.paymentMethod === "CASH" 
                                ? "bg-zinc-800 text-zinc-300 border-zinc-700" 
                                : tx.paymentMethod === "QRIS"
                                ? "bg-primary/10 text-primary border-primary/20"
                                : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                            }`}>
                              {tx.paymentMethod}
                            </span>
                          </td>
                          <td className="py-3.5 px-6 text-right font-bold text-zinc-100">Rp {tx.totalPaid.toLocaleString("id-ID")}</td>
                          <td className="py-3.5 px-6 text-center">
                            <button
                              onClick={() => setSelectedTx(tx)}
                              className="p-1.5 bg-zinc-800 border border-zinc-700 hover:border-zinc-500 rounded-lg text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-900 border-b border-zinc-800 text-zinc-300 font-bold text-[10px] uppercase tracking-wider">
                    <th className="py-4 px-6">ID Shift</th>
                    <th className="py-4 px-6">Kasir</th>
                    <th className="py-4 px-6">Waktu Buka</th>
                    <th className="py-4 px-6">Waktu Tutup</th>
                    <th className="py-4 px-6 text-right">Modal Awal</th>
                    <th className="py-4 px-6 text-right">Target Uang Kas</th>
                    <th className="py-4 px-6 text-right">Uang Fisik Kasir</th>
                    <th className="py-4 px-6 text-right">Selisih</th>
                    <th className="py-4 px-6 text-center">Status</th>
                    {isAdmin && <th className="py-4 px-6 text-center">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-xs text-zinc-300">
                  {shifts.map((s) => {
                    const hasDiscrepancy = s.discrepancy !== undefined && s.discrepancy !== 0;
                    return (
                      <tr key={s.id} className="hover:bg-zinc-800/25 transition-colors">
                        <td className="py-3.5 px-6 font-mono font-bold text-zinc-300">#SHF-{s.id}</td>
                        <td className="py-3.5 px-6 font-semibold text-zinc-200">{s.cashierName}</td>
                        <td className="py-3.5 px-6 text-zinc-300">
                          {new Date(s.startTime).toLocaleTimeString("id-ID", {hour: "2-digit", minute:"2-digit"})}
                        </td>
                        <td className="py-3.5 px-6 text-zinc-300">
                          {s.endTime 
                            ? new Date(s.endTime).toLocaleTimeString("id-ID", {hour: "2-digit", minute:"2-digit"}) 
                            : "-"}
                        </td>
                        <td className="py-3.5 px-6 text-right text-zinc-300">Rp {s.startingCash.toLocaleString("id-ID")}</td>
                        <td className="py-3.5 px-6 text-right text-zinc-300">Rp {s.expectedEndingCash.toLocaleString("id-ID")}</td>
                        <td className="py-3.5 px-6 text-right text-zinc-100 font-bold">
                          {s.actualEndingCash ? `Rp ${s.actualEndingCash.toLocaleString("id-ID")}` : "-"}
                        </td>
                        <td className={`py-3.5 px-6 text-right font-bold ${
                          hasDiscrepancy 
                            ? s.discrepancy! < 0 
                              ? "text-red-400" 
                              : "text-emerald-400" 
                            : "text-zinc-300"
                        }`}>
                          {s.discrepancy !== undefined 
                            ? `${s.discrepancy >= 0 ? "+" : ""}Rp ${s.discrepancy.toLocaleString("id-ID")}` 
                            : "-"}
                        </td>
                        <td className="py-3.5 px-6 text-center">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold border inline-block ${
                            s.status === "OPEN" 
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 animate-pulse" 
                              : "bg-zinc-800 text-zinc-400 border-zinc-700"
                          }`}>
                            {s.status === "OPEN" ? "AKTIF" : "SELESAI"}
                          </span>
                        </td>
                        {isAdmin && (
                          <td className="py-3.5 px-6 text-center">
                            <button
                              onClick={() => handleDeleteShift(s.id)}
                              className="p-1.5 bg-zinc-800 border border-zinc-700 hover:border-red-900/50 rounded-lg text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                              title="Hapus data shift ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* View Detailed Struk Receipt Modal */}
       {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-[340px] max-h-[90vh] bg-white text-zinc-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden font-mono text-[11px] leading-normal animate-in fade-in zoom-in-95 duration-200">
            
            {/* Scrollable Receipt Body */}
            <div className="flex-1 overflow-y-auto p-6 pb-2">
              <div className="text-center space-y-1 mb-4 border-b border-dashed border-zinc-400 pb-3">
                <h4 className="font-bold text-sm text-zinc-950">{storeName}</h4>
                <p className="text-[10px] text-zinc-600">{storeAddress}</p>
              </div>

              <div className="space-y-1 text-zinc-700 border-b border-dashed border-zinc-400 pb-3 mb-3">
                <p>Invoice : {selectedTx.invoiceNumber}</p>
                <p>Kasir   : {selectedTx.cashierName}</p>
                <p>Waktu   : {selectedTx.createdAt ? new Date(selectedTx.createdAt).toLocaleString("id-ID") : "-"}</p>
                {selectedTx.customerName && <p>Member  : {selectedTx.customerName}</p>}
              </div>

              <div className="space-y-2 border-b border-dashed border-zinc-400 pb-3 mb-3">
                {(selectedTx.items || []).map((it: any) => (
                  <div key={it.productId}>
                    <p className="font-bold text-zinc-900">{it.productName}</p>
                    <div className="flex justify-between text-zinc-700 pl-2">
                      <span>{it.quantity} x Rp {it.sellPrice.toLocaleString("id-ID")}</span>
                      <span>Rp {it.subtotal.toLocaleString("id-ID")}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-1 border-b border-dashed border-zinc-400 pb-3 mb-3">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>Rp {selectedTx.totalRaw.toLocaleString("id-ID")}</span>
                </div>
                {selectedTx.discount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Diskon</span>
                    <span>-Rp {selectedTx.discount.toLocaleString("id-ID")}</span>
                  </div>
                )}
                {(selectedTx.tax ?? 0) > 0 && (
                  <div className="flex justify-between text-zinc-700">
                    <span>PPN ({selectedTx.taxRate ?? 0}%)</span>
                    <span>Rp {(selectedTx.tax ?? 0).toLocaleString("id-ID")}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-zinc-950 text-xs pt-1">
                  <span>TOTAL</span>
                  <span>Rp {selectedTx.totalPaid.toLocaleString("id-ID")}</span>
                </div>
              </div>

              <div className="space-y-1 mb-4 text-zinc-700 border-b border-dashed border-zinc-400 pb-3">
                <div className="flex justify-between">
                  <span>Metode Bayar</span>
                  <span>{selectedTx.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span>Diterima</span>
                  <span>Rp {selectedTx.amountReceived.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kembalian</span>
                  <span>Rp {selectedTx.changeAmount.toLocaleString("id-ID")}</span>
                </div>
              </div>

              {/* Member points info */}
              {selectedTx.customerName && (
                <div className="space-y-1 mb-4 text-[10px] text-zinc-650">
                  {(selectedTx.pointsRedeemed ?? 0) > 0 && (
                    <div className="flex justify-between">
                      <span>Poin Ditukarkan</span>
                      <span>-{selectedTx.pointsRedeemed ?? 0} Poin</span>
                    </div>
                  )}
                  {(selectedTx.pointsEarned ?? 0) > 0 && (
                    <div className="flex justify-between">
                      <span>Poin Didapatkan</span>
                      <span>+{selectedTx.pointsEarned ?? 0} Poin</span>
                    </div>
                  )}
                </div>
              )}

              <div className="text-center border-t border-dashed border-zinc-400 pt-3 text-[10px] text-zinc-600 pb-2">
                <p className="font-bold text-zinc-800">--- REPRINTED RECEIPT ---</p>
              </div>
            </div>

            {/* Static Action Footer inside Card */}
            <div className="p-4 border-t border-dashed border-zinc-200 bg-zinc-50 flex shrink-0">
              <button
                onClick={() => setSelectedTx(null)}
                className="w-full bg-primary hover:bg-primary/95 text-white py-2.5 rounded-xl flex items-center justify-center gap-2 font-sans font-semibold text-xs shadow-md shadow-primary/20 cursor-pointer"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Dialogue Modal */}
      {modalConfig && modalConfig.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm">
          <div className="w-[380px] glass-card rounded-2xl p-6 shadow-2xl relative border-zinc-700 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-sm font-bold text-zinc-100 mb-2">{modalConfig.title}</h3>
            <p className="text-xs text-zinc-300 mb-5 whitespace-pre-line leading-relaxed">{modalConfig.message}</p>
            
            <div className="flex justify-end gap-3">
              {modalConfig.type === 'confirm' ? (
                <>
                  <button
                    onClick={() => setModalConfig(null)}
                    className="px-4 py-2 rounded-xl border border-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs font-bold cursor-pointer transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => {
                      modalConfig.onConfirm?.();
                      setModalConfig(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer transition-colors"
                  >
                    Hapus
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setModalConfig(null)}
                  className="px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary/95 text-xs font-bold cursor-pointer"
                >
                  Oke
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
