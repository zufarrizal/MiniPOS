"use client";

import React, { useState, useEffect } from "react";
import { 
  TrendingUp, 
  ShoppingCart, 
  Package, 
  AlertTriangle, 
  DollarSign,
  ArrowUpRight,
  TrendingDown,
  ShoppingBag
} from "lucide-react";
import { Product, Transaction } from "@/data/mockData";
import { getProducts, getTransactions } from "@/app/actions";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from "recharts";

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [todayTransactions, setTodayTransactions] = useState<Transaction[]>([]);

  const loadData = async () => {
    const prods = await getProducts();
    setDbProducts(prods.map(p => ({
      id: p.id,
      barcode: p.barcode,
      name: p.name,
      categoryId: p.categoryId,
      buyPrice: p.buyPrice,
      sellPrice: p.sellPrice,
      stock: p.stock,
      minStock: p.minStock,
      unit: p.unit,
      isActive: p.isActive === 1
    })));

    const txs = await getTransactions();
    setTodayTransactions(txs.map(t => ({
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
      createdAt: t.createdAt
    })));
  };

  useEffect(() => {
    setMounted(true);
    loadData();
  }, []);

  // Calculate metrics (filtered by today in UTC to match database createdAt)
  const todayPrefix = new Date().toISOString().slice(0, 10);
  const todayTransactionsOnly = todayTransactions.filter(t => t.createdAt && typeof t.createdAt === 'string' && t.createdAt.startsWith(todayPrefix));

  const totalSalesToday = todayTransactionsOnly.reduce((acc, curr) => acc + curr.totalPaid, 0);
  const totalTransactionsCount = todayTransactionsOnly.length;
  
  // Calculate today's profit
  const totalProfitToday = todayTransactionsOnly.reduce((acc, t) => {
    const transactionProfit = (t.items || []).reduce((itemAcc, item) => {
      const profitPerItem = item.sellPrice - item.buyPrice;
      return itemAcc + (profitPerItem * item.quantity);
    }, 0);
    return acc + (transactionProfit - t.discount);
  }, 0);

  // Generate real 7-day trend
  const weeklySalesData = React.useMemo(() => {
    const data = [];
    const daysName = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const label = daysName[d.getDay()];
      
      const dayTxs = todayTransactions.filter(t => t.createdAt && typeof t.createdAt === 'string' && t.createdAt.startsWith(dateStr));
      const revenue = dayTxs.reduce((acc, t) => acc + t.totalPaid, 0);
      const profit = dayTxs.reduce((acc, t) => {
        const txProfit = (t.items || []).reduce((itemAcc, item) => {
          return itemAcc + ((item.sellPrice - item.buyPrice) * item.quantity);
        }, 0);
        return acc + (txProfit - t.discount);
      }, 0);
      
      data.push({
        day: label,
        sales: revenue,
        profit: profit
      });
    }
    return data;
  }, [todayTransactions]);

  // Low stock products
  const lowStockProducts = dbProducts.filter(p => p.stock <= p.minStock);

  // Sales by Category calculation
  const salesByCategory = React.useMemo(() => {
    const catSales: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const catNames: Record<number, string> = {
      1: 'Makanan Ringan',
      2: 'Minuman',
      3: 'Kebutuhan Harian',
      4: 'Sembako',
      5: 'Obat-obatan'
    };

    todayTransactions.forEach(tx => {
      (tx.items || []).forEach(item => {
        const prod = dbProducts.find(p => p.id === item.productId);
        const catId = prod ? prod.categoryId : 4;
        catSales[catId] = (catSales[catId] || 0) + item.subtotal;
      });
    });

    return Object.entries(catSales).map(([id, sales]) => ({
      name: catNames[parseInt(id)],
      value: sales
    }));
  }, [todayTransactions, dbProducts]);

  const CATEGORY_COLORS = ["#8b5cf6", "#10b981", "#3b82f6", "#f59e0b", "#ef4444"];

  if (!mounted) return null;

  return (
    <div className="space-y-6 pb-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Ringkasan Dashboard</h1>
        <p className="text-sm text-zinc-400">Pantau performa penjualan minimarket Anda secara real-time.</p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sales Metric */}
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden transition-all duration-200 hover:border-zinc-600">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Penjualan Hari Ini</p>
              <h3 className="text-2xl font-bold text-zinc-100 mt-2">Rp {totalSalesToday.toLocaleString("id-ID")}</h3>
            </div>
            <div className="p-3 bg-primary/10 text-primary border border-primary/20 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-4 text-[11px] text-emerald-400">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+12.4% dari kemarin</span>
          </div>
          <div className="absolute right-0 bottom-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -mr-6 -mb-6" />
        </div>

        {/* Profit Metric */}
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden transition-all duration-200 hover:border-zinc-600">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Laba Bersih Hari Ini</p>
              <h3 className="text-2xl font-bold text-emerald-400 mt-2">Rp {totalProfitToday.toLocaleString("id-ID")}</h3>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-4 text-[11px] text-emerald-400">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+8.2% margin bersih</span>
          </div>
          <div className="absolute right-0 bottom-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl -mr-6 -mb-6" />
        </div>

        {/* Transactions Metric */}
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden transition-all duration-200 hover:border-zinc-600">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Transaksi Sukses</p>
              <h3 className="text-2xl font-bold text-zinc-100 mt-2">{totalTransactionsCount} Transaksi</h3>
            </div>
            <div className="p-3 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-4 text-[11px] text-zinc-400">
            <span>Rata-rata keranjang: Rp {(totalSalesToday / (totalTransactionsCount || 1)).toLocaleString("id-ID", {maximumFractionDigits:0})}</span>
          </div>
          <div className="absolute right-0 bottom-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl -mr-6 -mb-6" />
        </div>

        {/* Low Stock Warning Metric */}
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden transition-all duration-200 hover:border-red-900/50 hover:bg-red-950/5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Produk Stok Menipis</p>
              <h3 className={`text-2xl font-bold mt-2 ${lowStockProducts.length > 0 ? "text-red-400 animate-pulse" : "text-zinc-100"}`}>
                {lowStockProducts.length} Barang
              </h3>
            </div>
            <div className={`p-3 border rounded-xl ${
              lowStockProducts.length > 0 
                ? "bg-red-500/10 text-red-400 border-red-500/20" 
                : "bg-zinc-800 text-zinc-400 border-zinc-700"
            }`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-4 text-[11px] text-zinc-400">
            <span>Segera lakukan restock barang</span>
          </div>
          <div className="absolute right-0 bottom-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl -mr-6 -mb-6" />
        </div>
      </div>

      {/* Main Grid: Left Column (span-2) & Right Column (span-1) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (span-2): Weekly Trend & Recent Transactions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Weekly Sales Trend */}
          <div className="glass-card rounded-2xl p-6 flex flex-col justify-between">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h4 className="font-bold text-zinc-200">Tren Keuangan Mingguan</h4>
                <p className="text-xs text-zinc-500">Perbandingan omzet penjualan dan laba bersih dalam 7 hari terakhir.</p>
              </div>
            </div>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={weeklySalesData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="day" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `Rp ${(v/1000).toLocaleString()}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#18181b", borderColor: "#3f3f46", borderRadius: "12px", color: "#f4f4f5" }}
                    formatter={(value: any) => [`Rp ${value.toLocaleString()}`, '']}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Area type="monotone" dataKey="sales" name="Omzet Penjualan" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                  <Area type="monotone" dataKey="profit" name="Laba Bersih" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorProfit)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Recent Transactions Widget */}
          <div className="glass-card rounded-2xl p-6 flex flex-col">
            <h4 className="font-bold text-zinc-200 mb-4 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-primary" />
              Transaksi Terakhir Hari Ini
            </h4>
            {todayTransactions.length === 0 ? (
              <p className="text-xs text-zinc-500 py-6 text-center">Belum ada transaksi yang diproses hari ini.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="text-zinc-400 font-bold border-b border-zinc-800">
                      <th className="pb-3">No. Invoice</th>
                      <th className="pb-3">Waktu</th>
                      <th className="pb-3">Kasir</th>
                      <th className="pb-3">Metode</th>
                      <th className="pb-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todayTransactions.slice(0, 5).map((tx) => (
                      <tr key={tx.id} className="text-zinc-300 border-b border-zinc-800/45 hover:bg-zinc-850/20 transition-colors">
                        <td className="py-3 font-bold text-zinc-100">{tx.invoiceNumber}</td>
                        <td className="py-3">{tx.createdAt ? new Date(tx.createdAt).toLocaleTimeString("id-ID", {hour:"2-digit", minute:"2-digit"}) : "-"}</td>
                        <td className="py-3">{tx.cashierName}</td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 border border-zinc-700 text-zinc-300">{tx.paymentMethod}</span>
                        </td>
                        <td className="py-3 text-right font-bold text-emerald-400">Rp {tx.totalPaid.toLocaleString("id-ID")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (span-1): Category Distribution & Low Stock */}
        <div className="space-y-6">
          {/* Category Sales Pie Chart */}
          <div className="glass-card rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-zinc-200">Distribusi Kategori</h4>
              <p className="text-xs text-zinc-500">Persentase omzet berdasarkan kategori produk.</p>
            </div>
            <div className="h-60 w-full relative flex items-center justify-center my-4">
              {salesByCategory.reduce((a, b) => a + b.value, 0) === 0 ? (
                <p className="text-xs text-zinc-500">Belum ada transaksi hari ini.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={salesByCategory.filter(c => c.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {salesByCategory.filter(c => c.value > 0).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: "#18181b", borderColor: "#3f3f46", borderRadius: "12px", color: "#f4f4f5" }}
                      formatter={(value: any) => [`Rp ${value.toLocaleString()}`, '']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {salesByCategory.map((entry, index) => (
                <div key={entry.name} className="flex justify-between items-center text-[10px]">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: CATEGORY_COLORS[index] }} />
                    <span className="text-zinc-300 truncate">{entry.name}</span>
                  </div>
                  <span className="font-bold text-zinc-200 ml-2 shrink-0">Rp {entry.value.toLocaleString("id-ID")}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Low Stock Widget */}
          <div className="glass-card rounded-2xl p-6 flex flex-col">
            <h4 className="font-bold text-zinc-200 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Barang Stok Menipis
            </h4>
            {lowStockProducts.length === 0 ? (
              <p className="text-xs text-zinc-500 py-6 text-center">Semua stok barang dalam kondisi aman.</p>
            ) : (
              <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1 flex-1">
                {lowStockProducts.slice(0, 8).map((p) => (
                  <div key={p.id} className="flex justify-between items-center bg-[#18181b]/60 p-3 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors">
                    <div className="min-w-0 flex-1 pr-3">
                      <p className="text-xs font-semibold text-zinc-200 truncate">{p.name}</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">Barcode: {p.barcode}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-bold text-red-400 bg-red-500/10 px-2.5 py-1 rounded-md border border-red-500/20">
                        Stok: {p.stock}
                      </span>
                      <p className="text-[9px] text-zinc-500 mt-1">Min: {p.minStock}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
