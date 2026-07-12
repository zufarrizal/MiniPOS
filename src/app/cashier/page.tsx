"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Search, 
  Trash2, 
  Plus, 
  Minus, 
  FolderLock, 
  BadgePercent, 
  User, 
  CreditCard, 
  QrCode, 
  Coins, 
  Printer, 
  DollarSign, 
  FileText,
  AlertCircle,
  ShoppingCart
} from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { Product, Customer } from "@/data/mockData";
import { getProducts, getCustomers, createTransactionAction, getSettingsAction, getCategories } from "@/app/actions";

export default function Cashier() {
  const {
    activeShift,
    items,
    activeCustomer,
    discount,
    paymentMethod,
    amountReceived,
    heldCarts,
    addItem,
    removeItem,
    updateQuantity,
    setDiscount,
    selectCustomer,
    setPaymentMethod,
    setAmountReceived,
    holdCart,
    resumeCart,
    deleteHeldCart,
    clearCart
  } = useCartStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<number | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [lastInvoice, setLastInvoice] = useState<any>(null);
  
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [dbCustomers, setDbCustomers] = useState<Customer[]>([]);
  const { syncShift } = useCartStore();

  // Modal Dialogue State
  const [modalConfig, setModalConfig] = useState<{
    show: boolean;
    title: string;
    message: string;
    type: 'alert' | 'success';
  } | null>(null);

  // Dynamic Settings States
  const [storeName, setStoreName] = useState("MiniPOS Minimarket");
  const [storeAddress, setStoreAddress] = useState("Jl. Raya Minimarket No. 123, Jakarta");
  const [storePhone, setStorePhone] = useState("081234567890");
  const [receiptFooter, setReceiptFooter] = useState("Terima Kasih Telah Berbelanja!");
  const [enableTax, setEnableTax] = useState(false);
  const [taxRate, setTaxRate] = useState(11);
  const [pointRedeemValue, setPointRedeemValue] = useState(100);
  const [pointsRedeemed, setPointsRedeemed] = useState(0);
  const [pointsMultiplier, setPointsMultiplier] = useState(10000);
  
  // Dynamic Discount Configurations
  const [enableMemberDiscount, setEnableMemberDiscount] = useState(true);
  const [memberDiscountRate, setMemberDiscountRate] = useState(2);
  const [enableGrosirDiscount, setEnableGrosirDiscount] = useState(true);
  const [grosirMinQty, setGrosirMinQty] = useState(5);
  const [grosirDiscountRate, setGrosirDiscountRate] = useState(5);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    // Load settings from database
    const settingsData = await getSettingsAction();
    const nameSet = settingsData.find(s => s.key === "store_name");
    if (nameSet) setStoreName(nameSet.value);
    const addrSet = settingsData.find(s => s.key === "store_address");
    if (addrSet) setStoreAddress(addrSet.value);
    const phoneSet = settingsData.find(s => s.key === "store_phone");
    if (phoneSet) setStorePhone(phoneSet.value);
    const footerSet = settingsData.find(s => s.key === "receipt_footer");
    if (footerSet) setReceiptFooter(footerSet.value);
    const enableTaxSet = settingsData.find(s => s.key === "enable_tax");
    if (enableTaxSet) setEnableTax(enableTaxSet.value === "true");
    const taxRateSet = settingsData.find(s => s.key === "tax_rate");
    if (taxRateSet) setTaxRate(parseInt(taxRateSet.value) || 0);
    const redeemSet = settingsData.find(s => s.key === "point_redeem_value");
    if (redeemSet) setPointRedeemValue(parseInt(redeemSet.value) || 0);
    const multiplierSet = settingsData.find(s => s.key === "points_per_multiplier");
    if (multiplierSet) setPointsMultiplier(parseInt(multiplierSet.value) || 10000);

    const enableMemberSet = settingsData.find(s => s.key === "enable_member_discount");
    if (enableMemberSet) setEnableMemberDiscount(enableMemberSet.value === "true");
    const memberRateSet = settingsData.find(s => s.key === "member_discount_rate");
    if (memberRateSet) setMemberDiscountRate(parseInt(memberRateSet.value) || 0);
    const enableGrosirSet = settingsData.find(s => s.key === "enable_grosir_discount");
    if (enableGrosirSet) setEnableGrosirDiscount(enableGrosirSet.value === "true");
    const grosirMinQtySet = settingsData.find(s => s.key === "grosir_min_qty");
    if (grosirMinQtySet) setGrosirMinQty(parseInt(grosirMinQtySet.value) || 5);
    const grosirRateSet = settingsData.find(s => s.key === "grosir_discount_rate");
    if (grosirRateSet) setGrosirDiscountRate(parseInt(grosirRateSet.value) || 0);

    const prods = await getProducts();
    const mappedProds: Product[] = prods.map(p => ({
      id: p.id,
      barcode: p.barcode || "",
      name: p.name || "Produk Tanpa Nama",
      categoryId: p.categoryId,
      buyPrice: Number(p.buyPrice) || 0,
      sellPrice: Number(p.sellPrice) || 0,
      stock: Number(p.stock) || 0,
      minStock: Number(p.minStock) || 0,
      unit: p.unit || "pcs",
      isActive: p.isActive === 1,
      discountPercent: p.discountPercent ?? 0
    }));
    setDbProducts(mappedProds);

    const custs = await getCustomers();
    const mappedCusts: Customer[] = custs.map(c => ({
      id: c.id,
      name: c.name || "Member Tanpa Nama",
      phone: c.phone || "",
      points: Number(c.points) || 0
    }));
    setDbCustomers(mappedCusts);

    const cats = await getCategories();
    setCategories(cats);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setPointsRedeemed(0);
  }, [activeCustomer]);

  // Focus search input on mount and F2 keypress
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === "F8") {
        e.preventDefault();
        if (items.length > 0 && activeShift) {
          setShowPaymentModal(true);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [items, activeShift]);

  // Product filtering logic
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredProducts([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    
    // Barcode auto-add logic: if matches barcode exactly, add item and clear input
    const exactBarcodeMatch = dbProducts.find(
      p => p.barcode === searchQuery && p.isActive
    );
    if (exactBarcodeMatch) {
      addItem(exactBarcodeMatch, 1);
      setSearchQuery("");
      setFilteredProducts([]);
      return;
    }

    const filtered = dbProducts.filter(
      p => p.isActive && (p.name.toLowerCase().includes(query) || p.barcode.includes(query))
    );
    setFilteredProducts(filtered.slice(0, 5)); // limit results to 5
  }, [searchQuery, dbProducts, addItem]);

  // Calculations
  const pointsDiscount = pointsRedeemed * pointRedeemValue;
  const totalRaw = items.reduce((acc, item) => acc + item.subtotal, 0);

  // Grosir Discount (Promo Volume): dynamic from settings
  const grosirDiscount = enableGrosirDiscount
    ? items.reduce((acc, item) => {
        if (item.quantity >= grosirMinQty) {
          return acc + Math.round(item.subtotal * (grosirDiscountRate / 100));
        }
        return acc;
      }, 0)
    : 0;

  // Member Discount (Promo Loyalitas): dynamic from settings
  const memberDiscount = (enableMemberDiscount && activeCustomer)
    ? Math.round(totalRaw * (memberDiscountRate / 100))
    : 0;

  const totalDiscount = discount + pointsDiscount + grosirDiscount + memberDiscount;
  const taxableAmount = Math.max(0, totalRaw - totalDiscount);
  const tax = enableTax ? Math.round(taxableAmount * (taxRate / 100)) : 0;
  const totalPaid = taxableAmount + tax;
  const changeAmount = Math.max(0, amountReceived - totalPaid);
  const totalItemsCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const handlePay = async () => {
    if (!activeShift) return;

    if (paymentMethod === "CASH" && amountReceived < totalPaid) {
      setModalConfig({
        show: true,
        title: "Pembayaran Kurang",
        message: "Uang tunai yang diterima kurang dari total tagihan belanja!",
        type: "alert"
      });
      return;
    }

    const invoiceNumber = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9005)}`;
    
    const payload = {
      invoiceNumber,
      shiftId: activeShift.id,
      cashierName: activeShift.cashierName,
      customerName: activeCustomer?.name || undefined,
      customerId: activeCustomer?.id || undefined,
      totalRaw,
      discount: totalDiscount,
      totalPaid,
      paymentMethod,
      amountReceived: paymentMethod === "CASH" ? amountReceived : totalPaid,
      changeAmount: paymentMethod === "CASH" ? changeAmount : 0,
      tax,
      taxRate: enableTax ? taxRate : 0,
      pointsRedeemed: pointsRedeemed || 0,
      items: items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        buyPrice: item.buyPrice,
        sellPrice: item.sellPrice,
        subtotal: item.subtotal
      }))
    };

    const res = await createTransactionAction(payload);
    
    if (res.success) {
      await syncShift();

      const invoice = {
        invoiceNumber,
        cashierName: activeShift.cashierName,
        customerName: activeCustomer?.name || undefined,
        items: [...items],
        totalRaw,
        discount: totalDiscount,
        manualDiscount: discount,
        grosirDiscount,
        memberDiscount,
        pointsDiscount,
        totalPaid,
        paymentMethod,
        amountReceived: paymentMethod === "CASH" ? amountReceived : totalPaid,
        changeAmount: paymentMethod === "CASH" ? changeAmount : 0,
        tax,
        taxRate: enableTax ? taxRate : 0,
        pointsRedeemed: pointsRedeemed || 0,
        createdAt: new Date().toISOString()
      };

      setLastInvoice(invoice);
      setShowPaymentModal(false);
      setShowReceiptModal(true);
      clearCart();
      
      await loadData();
    } else {
      setModalConfig({
        show: true,
        title: "Transaksi Gagal",
        message: res.error || "Gagal memproses transaksi kasir di database.",
        type: "alert"
      });
    }
  };

  if (!activeShift) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-zinc-100">Shift Belum Dibuka</h3>
        <p className="text-sm text-zinc-400 max-w-sm mt-2 mb-6">
          Harap aktifkan shift kasir Anda di bagian kiri bawah menu sebelum melakukan pemrosesan belanja pelanggan.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-6 h-full overflow-hidden">
      {/* Left Column: Product Search & Catalog Grid (66% width) */}
      <div className="col-span-12 lg:col-span-8 flex flex-col h-full overflow-hidden">
        
        {/* Search Bar / Barcode Input & Category Tabs */}
        <div className="flex flex-col gap-3.5 shrink-0 mb-4">
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-350">
              <Search className="w-5 h-5" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Scan Barcode / Cari nama produk (Tekan F2)..."
              className="w-full bg-[#18181b] border border-zinc-650 rounded-2xl py-3 pl-12 pr-4 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-primary text-sm font-semibold transition-all shadow-inner"
            />
          </div>

          {/* Categories Tab Scrollbar */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-zinc-805">
            <button
              onClick={() => setSelectedCatId(null)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedCatId === null
                  ? "bg-primary text-white shadow-md shadow-primary/20"
                  : "bg-zinc-800/60 border border-zinc-700/80 text-zinc-300 hover:text-zinc-100"
              }`}
            >
              Semua Produk
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCatId(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedCatId === cat.id
                    ? "bg-primary text-white shadow-md shadow-primary/20"
                    : "bg-zinc-800/60 border border-zinc-700/80 text-zinc-300 hover:text-zinc-100"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Catalog Grid Area */}
        <div className="flex-1 overflow-y-auto bg-zinc-950/20 border border-zinc-850 rounded-3xl p-4 min-h-0">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {dbProducts.filter(p => p.isActive && (selectedCatId === null || p.categoryId === selectedCatId) && (searchQuery === "" || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.barcode.includes(searchQuery))).map((p) => {
              const isLow = p.stock <= p.minStock;
              const hasDiscount = p.discountPercent && p.discountPercent > 0;
              return (
                <button
                  key={p.id}
                  onClick={() => addItem(p, 1)}
                  className="text-left bg-zinc-950/60 hover:bg-zinc-800/80 p-3 rounded-2xl border border-zinc-700 hover:border-zinc-500 transition-all flex flex-col justify-between h-28 relative overflow-hidden group cursor-pointer"
                >
                  {hasDiscount && (
                    <div className="absolute top-0 right-0 bg-red-600 text-white font-extrabold text-[8.5px] px-2 py-0.7 rounded-bl-lg z-10 shadow-sm animate-pulse">
                      -{p.discountPercent}%
                    </div>
                  )}
                  <div>
                    <h6 className="text-[11.5px] font-extrabold text-zinc-100 group-hover:text-primary transition-colors truncate pr-8">{p.name}</h6>
                    <span className={`text-[8.5px] px-1.5 py-0.5 rounded border inline-block mt-1 font-bold ${
                      isLow ? "bg-red-500/10 border-red-500/30 text-red-400 animate-pulse" : "bg-zinc-800 border-zinc-650 text-zinc-250"
                    }`}>
                      Stok: {p.stock} {p.unit}
                    </span>
                  </div>
                  <div className="flex justify-between items-end w-full mt-2">
                    <div className="flex flex-col">
                      {hasDiscount ? (
                        <>
                          <span className="text-[10.5px] font-black text-emerald-400 font-mono">
                            Rp {Math.round(p.sellPrice * (1 - (p.discountPercent ?? 0) / 100)).toLocaleString("id-ID")}
                          </span>
                          <span className="text-[8.5px] text-zinc-400 line-through font-mono mt-0.5">
                            Rp {p.sellPrice.toLocaleString("id-ID")}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs font-black text-emerald-400 font-mono">
                          Rp {p.sellPrice.toLocaleString("id-ID")}
                        </span>
                      )}
                    </div>
                    <span className="text-[9.5px] text-zinc-350 font-bold group-hover:text-zinc-100">Tambah +</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Column: POS Cart & Checkout Panel (34% width) */}
      <div className="col-span-12 lg:col-span-4 flex flex-col h-full overflow-hidden bg-zinc-900/40 border border-zinc-800 rounded-3xl p-5 min-h-0">
        
        {/* Cart Header */}
        <div className="h-10 border-b border-zinc-800 flex items-center shrink-0 justify-between mb-2">
          <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-zinc-300" />
            Keranjang ({totalItemsCount})
          </span>
          {items.length > 0 && (
            <button 
              onClick={clearCart}
              className="text-[10px] text-zinc-350 hover:text-red-400 flex items-center gap-1 transition-colors font-bold cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              Reset
            </button>
          )}
        </div>

        {/* Scrollable Cart Items */}
        <div className="flex-1 overflow-y-auto pr-1 py-2 space-y-2 min-h-0">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-zinc-400 p-4">
              <ShoppingCart className="w-8 h-8 mb-2 text-zinc-500" />
              <p className="text-xs font-bold text-zinc-300">Keranjang kosong</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">Pilih produk di katalog sebelah kiri</p>
            </div>
          ) : (
            items.map((item) => {
              const p = dbProducts.find(prod => prod.id === item.productId);
              const hasDiscount = item.discountPercent && item.discountPercent > 0;
              return (
                <div key={item.productId} className="flex flex-col bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-700 space-y-2">
                  <div className="min-w-0">
                    <h5 className="text-[11px] font-bold text-zinc-100 truncate">{item.productName}</h5>
                    {hasDiscount ? (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[9px] text-emerald-400 font-bold font-mono">
                          Rp {Math.round(item.sellPrice * (1 - (item.discountPercent ?? 0) / 100)).toLocaleString("id-ID")}
                        </span>
                        <span className="text-[8px] text-zinc-400 line-through font-mono">
                          Rp {item.sellPrice.toLocaleString("id-ID")}
                        </span>
                        <span className="text-[8px] font-extrabold bg-red-500/10 border border-red-500/20 text-red-400 px-1 rounded">
                          -{item.discountPercent}%
                        </span>
                      </div>
                    ) : (
                      <p className="text-[9px] text-zinc-400 mt-0.5 font-medium">Rp {item.sellPrice.toLocaleString("id-ID")} / {p?.unit || "pcs"}</p>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="w-5.5 h-5.5 rounded-md bg-zinc-800 hover:bg-zinc-700 border border-zinc-650 flex items-center justify-center text-zinc-200 cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold text-zinc-100 min-w-4 text-center tabular-nums">{item.quantity}</span>
                      <button
                        onClick={() => {
                          const prod = dbProducts.find(prodItem => prodItem.id === item.productId);
                          if (prod) addItem(prod, 1);
                        }}
                        className="w-5.5 h-5.5 rounded-md bg-zinc-800 hover:bg-zinc-700 border border-zinc-650 flex items-center justify-center text-zinc-200 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="text-xs font-extrabold text-zinc-150">Rp {item.subtotal.toLocaleString("id-ID")}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Member, Discount & Totals Section (Locked/Sticky at Bottom) */}
        <div className="shrink-0 border-t border-zinc-800 pt-3 space-y-3">
          
          {/* Member Selection */}
          <div className="space-y-2">
            <select
              value={activeCustomer?.id || ""}
              onChange={(e) => {
                const cust = dbCustomers.find(c => c.id === parseInt(e.target.value));
                selectCustomer(cust || null);
              }}
              className="w-full bg-[#18181b] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-250 focus:outline-none focus:border-primary font-bold"
            >
              <option value="">-- Non-Member (Umum) --</option>
              {dbCustomers.map((cust) => (
                <option key={cust.id} value={cust.id}>
                  {cust.name} ({cust.phone})
                </option>
              ))}
            </select>

            {activeCustomer && (
              <div className="space-y-1.5">
                <div className="bg-primary/15 border border-primary/20 rounded-xl p-2.5 flex justify-between items-center">
                  <div>
                    <p className="text-[9px] text-zinc-300 uppercase font-bold tracking-wider">Loyalitas Poin</p>
                    <p className="text-[10px] font-bold text-zinc-100 mt-0.5">{activeCustomer.name}</p>
                  </div>
                  <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/35">
                    {activeCustomer.points} Poin
                  </span>
                </div>
                
                {pointRedeemValue > 0 && activeCustomer.points > 0 && (
                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-2.5 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider">Tukarkan Poin</span>
                      <span className="text-[8px] text-zinc-400 font-medium">1 Poin = Rp {pointRedeemValue}</span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={pointsRedeemed || ""}
                        onChange={(e) => {
                          const val = Math.min(activeCustomer.points, Math.max(0, parseInt(e.target.value) || 0));
                          setPointsRedeemed(val);
                        }}
                        className="flex-1 bg-[#18181b] border border-zinc-650 rounded-lg py-1 px-2.5 text-xs text-zinc-100 focus:outline-none focus:border-primary font-bold font-mono"
                        placeholder="Jumlah poin..."
                        max={activeCustomer.points}
                        min="0"
                      />
                      <button
                        type="button"
                        onClick={() => setPointsRedeemed(activeCustomer.points)}
                        className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 text-emerald-400 text-[9px] font-bold px-2 py-1 rounded-md cursor-pointer transition-colors"
                      >
                        Semua
                      </button>
                    </div>
                    {pointsDiscount > 0 && (
                      <p className="text-[8px] text-emerald-400 font-semibold text-right">
                        Potongan Poin: -Rp {pointsDiscount.toLocaleString("id-ID")}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Draft Tangguhkan Panel */}
          {heldCarts.length > 0 && (
            <div className="bg-zinc-950/40 border border-zinc-800 rounded-xl p-2.5 space-y-1.5 max-h-20 overflow-y-auto">
              <span className="text-[9px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1">
                <FolderLock className="w-3.5 h-3.5 text-amber-400" />
                Daftar Draft ({heldCarts.length})
              </span>
              <div className="space-y-1.5">
                {heldCarts.map((hc) => (
                  <div key={hc.id} className="flex justify-between items-center bg-amber-500/10 border border-amber-500/20 p-2 rounded-lg">
                    <p className="text-[9px] font-extrabold text-amber-400">Draft #{hc.id.substring(0, 4)}...</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => deleteHeldCart(hc.id)}
                        className="text-[9px] text-zinc-400 hover:text-red-400 font-bold cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        onClick={() => resumeCart(hc.id)}
                        className="bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[9px] font-bold px-1.5 py-0.5 rounded hover:bg-amber-500/30 transition-all cursor-pointer"
                      >
                        Panggil
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transaction manual discount input */}
          <div className="flex justify-between items-center gap-3">
            <label className="text-[10px] text-zinc-300 font-bold flex items-center gap-1 uppercase tracking-wider">
              <BadgePercent className="w-3.5 h-3.5 text-zinc-300" />
              Diskon Manual
            </label>
            <div className="relative w-36">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-350 text-[10px] font-bold">Rp</span>
              <input
                type="number"
                value={discount || ""}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#18181b] border border-zinc-650 rounded-xl py-1.5 pl-7 pr-2.5 text-xs text-zinc-100 focus:outline-none focus:border-primary font-bold text-right transition-all placeholder-zinc-500"
                placeholder="0"
              />
            </div>
          </div>

          {/* Checkout calculations summary display */}
          <div className="bg-[#18181b] border border-zinc-800 rounded-2xl p-4 text-right">
            <span className="text-[9px] text-zinc-400 uppercase font-bold tracking-wider">Total Akhir</span>
            <h2 className="text-2xl font-black text-white mt-0.5 tabular-nums">
              Rp {totalPaid.toLocaleString("id-ID")}
            </h2>
            
            {/* Breakdowns */}
            <div className="flex flex-col gap-0.5 mt-2 text-[9px] font-semibold text-zinc-400">
              {discount > 0 && (
                <div className="flex justify-between text-red-400">
                  <span>Diskon Manual:</span>
                  <span>-Rp {discount.toLocaleString("id-ID")}</span>
                </div>
              )}
              {grosirDiscount > 0 && (
                <div className="flex justify-between text-amber-400">
                  <span>Promo Grosir ({grosirDiscountRate}%):</span>
                  <span>-Rp {grosirDiscount.toLocaleString("id-ID")}</span>
                </div>
              )}
              {memberDiscount > 0 && (
                <div className="flex justify-between text-violet-400">
                  <span>Diskon Member ({memberDiscountRate}%):</span>
                  <span>-Rp {memberDiscount.toLocaleString("id-ID")}</span>
                </div>
              )}
              {pointsDiscount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Diskon Poin:</span>
                  <span>-Rp {pointsDiscount.toLocaleString("id-ID")}</span>
                </div>
              )}
              {enableTax && tax > 0 && (
                <div className="flex justify-between text-blue-400">
                  <span>PPN ({taxRate}%):</span>
                  <span>+Rp {tax.toLocaleString("id-ID")}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-3 gap-2 pb-1">
            <button
              onClick={holdCart}
              disabled={items.length === 0}
              className="py-3 px-3 rounded-xl border border-zinc-700 hover:border-zinc-500 text-zinc-350 hover:text-zinc-100 disabled:opacity-40 disabled:pointer-events-none text-[10px] font-bold transition-all cursor-pointer"
            >
              Simpan
            </button>
            <button
              onClick={() => setShowPaymentModal(true)}
              disabled={items.length === 0}
              className="col-span-2 py-3 px-4 rounded-xl bg-primary text-white hover:bg-primary/95 shadow-lg shadow-primary/20 hover:shadow-primary/30 disabled:opacity-40 disabled:pointer-events-none text-xs font-black transition-all cursor-pointer"
            >
              Bayar (F8)
            </button>
          </div>

        </div>

      </div>

      {/* Payment Processing Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm">
          <div className="w-[450px] glass-card rounded-2xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-zinc-100 mb-2">Metode & Nominal Pembayaran</h3>
            <p className="text-xs text-zinc-400 mb-5">Selesaikan transaksi kasir.</p>

            <div className="space-y-5">
              {/* Payment Method Select */}
              <div>
                <label className="text-xs text-zinc-400 font-semibold block mb-2">Pilih Cara Bayar</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "CASH", label: "Tunai", icon: Coins },
                    { id: "QRIS", label: "QRIS", icon: QrCode },
                    { id: "CARD", label: "Kartu Debit", icon: CreditCard }
                  ].map((m) => {
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.id}
                        onClick={() => setPaymentMethod(m.id as any)}
                        className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border transition-all cursor-pointer ${
                          paymentMethod === m.id
                            ? "bg-primary border-primary text-white shadow-lg shadow-primary/20 font-bold"
                            : "bg-[#18181b] border-zinc-650 text-zinc-200 hover:text-zinc-100 hover:border-zinc-500"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-[10px]">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Amount Display */}
              <div className="bg-[#18181b] border border-zinc-650 rounded-xl p-4 space-y-2">
                <div className="flex justify-between items-center text-zinc-400 text-xs">
                  <span>Subtotal</span>
                  <span>Rp {totalRaw.toLocaleString("id-ID")}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between items-center text-red-400 text-xs">
                    <span>Diskon Manual</span>
                    <span>-Rp {discount.toLocaleString("id-ID")}</span>
                  </div>
                )}
                {grosirDiscount > 0 && (
                  <div className="flex justify-between items-center text-amber-400 text-xs">
                    <span>Promo Grosir ({grosirDiscountRate}%)</span>
                    <span>-Rp {grosirDiscount.toLocaleString("id-ID")}</span>
                  </div>
                )}
                {memberDiscount > 0 && (
                  <div className="flex justify-between items-center text-violet-400 text-xs">
                    <span>Diskon Member ({memberDiscountRate}%)</span>
                    <span>-Rp {memberDiscount.toLocaleString("id-ID")}</span>
                  </div>
                )}
                {pointsDiscount > 0 && (
                  <div className="flex justify-between items-center text-emerald-400 text-xs">
                    <span>Diskon Poin ({pointsRedeemed} Poin)</span>
                    <span>-Rp {pointsDiscount.toLocaleString("id-ID")}</span>
                  </div>
                )}
                {enableTax && tax > 0 && (
                  <div className="flex justify-between items-center text-blue-400 text-xs">
                    <span>PPN ({taxRate}%)</span>
                    <span>+Rp {tax.toLocaleString("id-ID")}</span>
                  </div>
                )}
                <div className="flex justify-between items-center border-t border-zinc-750 pt-2">
                  <span className="text-xs text-zinc-200 font-bold">Tagihan Akhir</span>
                  <span className="text-lg font-black text-zinc-100">Rp {totalPaid.toLocaleString("id-ID")}</span>
                </div>
              </div>

              {/* Cash Input (Only for CASH payment method) */}
              {paymentMethod === "CASH" ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-zinc-300 font-bold block mb-1.5">Uang Diterima Kasir (Nominal)</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-300 font-bold text-sm">Rp</span>
                      <input
                        type="number"
                        value={amountReceived || ""}
                        onChange={(e) => setAmountReceived(parseFloat(e.target.value) || 0)}
                        className="w-full bg-[#18181b] border border-zinc-500 rounded-xl py-3 pl-10 pr-4 text-zinc-100 focus:outline-none focus:border-primary font-bold text-base transition-colors"
                        placeholder="0"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Cash Suggestion shortcuts */}
                  <div className="flex gap-1.5 overflow-x-auto pb-1">
                    {[totalPaid, 5000, 10000, 20000, 50000, 100000].map((cash) => {
                      // Filter if cash is less than totalPaid (unless equal to totalPaid)
                      if (cash < totalPaid && cash !== totalPaid) return null;
                      return (
                        <button
                          key={cash}
                          type="button"
                          onClick={() => setAmountReceived(cash)}
                          className="px-3 py-1.5 shrink-0 bg-zinc-800 hover:bg-zinc-700 border border-zinc-650 text-zinc-200 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          Rp {cash.toLocaleString("id-ID")}
                        </button>
                      );
                    })}
                  </div>

                  {/* Change calculations */}
                  <div className="flex justify-between items-center bg-zinc-950/60 border border-dashed border-zinc-600 p-3.5 rounded-xl">
                    <span className="text-xs text-zinc-350 font-bold">Uang Kembalian</span>
                    <span className={`text-base font-extrabold ${changeAmount > 0 ? "text-emerald-400" : "text-zinc-300"}`}>
                      Rp {changeAmount.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="bg-primary/5 border border-dashed border-primary/20 p-4 rounded-xl text-center">
                  <p className="text-xs text-primary font-bold">Menunggu Pembayaran Non-Tunai / EDC / QRIS</p>
                  <p className="text-[10px] text-zinc-300 mt-1 font-medium">Harap pastikan pelanggan telah memindai struk/EDC sebelum konfirmasi bayar.</p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Kembali
                </button>
                <button
                  onClick={handlePay}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-white hover:bg-primary/95 text-xs font-bold transition-colors cursor-pointer shadow-lg shadow-primary/20"
                >
                  Konfirmasi Lunas
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Simulated Thermal Receipt Modal */}
      {showReceiptModal && lastInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-[340px] max-h-[90vh] bg-white text-zinc-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden font-mono text-[11px] animate-in fade-in zoom-in-95 duration-200 leading-normal">
            
            {/* Scrollable Receipt Body */}
            <div className="flex-1 overflow-y-auto p-6 pb-2">
              {/* Simulation Thermal Styling Header */}
              <div className="text-center space-y-1 mb-4 border-b border-dashed border-zinc-400 pb-3">
                <h4 className="font-bold text-sm text-zinc-950 uppercase">{storeName}</h4>
                <p className="text-[10px] text-zinc-600">{storeAddress}</p>
                <p className="text-[9px] text-zinc-500">Telp: {storePhone}</p>
              </div>

              {/* Receipt Metadata */}
              <div className="space-y-1 text-zinc-700 border-b border-dashed border-zinc-400 pb-3 mb-3">
                <p>Invoice : {lastInvoice.invoiceNumber}</p>
                <p>Kasir   : {lastInvoice.cashierName}</p>
                <p>Waktu   : {lastInvoice.createdAt ? new Date(lastInvoice.createdAt).toLocaleString("id-ID") : "-"}</p>
                {lastInvoice.customerName && <p>Member  : {lastInvoice.customerName}</p>}
              </div>

              {/* Invoice Items */}
              <div className="space-y-2 border-b border-dashed border-zinc-400 pb-3 mb-3">
                {(lastInvoice.items || []).map((it: any) => (
                  <div key={it.productId}>
                    <p className="font-bold text-zinc-900">{it.productName}</p>
                    <div className="flex justify-between text-zinc-700 pl-2">
                      <span>{it.quantity} x Rp {it.sellPrice.toLocaleString("id-ID")}</span>
                      <span>Rp {it.subtotal.toLocaleString("id-ID")}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Calculations block */}
              <div className="space-y-1 border-b border-dashed border-zinc-400 pb-3 mb-3">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>Rp {lastInvoice.totalRaw.toLocaleString("id-ID")}</span>
                </div>
                {(lastInvoice.manualDiscount ?? 0) > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Diskon Manual</span>
                    <span>-Rp {(lastInvoice.manualDiscount ?? 0).toLocaleString("id-ID")}</span>
                  </div>
                )}
                {(lastInvoice.grosirDiscount ?? 0) > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Promo Grosir ({grosirDiscountRate}%)</span>
                    <span>-Rp {(lastInvoice.grosirDiscount ?? 0).toLocaleString("id-ID")}</span>
                  </div>
                )}
                {(lastInvoice.memberDiscount ?? 0) > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Diskon Member ({memberDiscountRate}%)</span>
                    <span>-Rp {(lastInvoice.memberDiscount ?? 0).toLocaleString("id-ID")}</span>
                  </div>
                )}
                {(lastInvoice.pointsDiscount ?? 0) > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Diskon Poin</span>
                    <span>-Rp {(lastInvoice.pointsDiscount ?? 0).toLocaleString("id-ID")}</span>
                  </div>
                )}
                {!(lastInvoice.manualDiscount !== undefined || lastInvoice.grosirDiscount !== undefined || lastInvoice.memberDiscount !== undefined || lastInvoice.pointsDiscount !== undefined) && lastInvoice.discount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Diskon</span>
                    <span>-Rp {lastInvoice.discount.toLocaleString("id-ID")}</span>
                  </div>
                )}
                {lastInvoice.tax > 0 && (
                  <div className="flex justify-between text-zinc-700">
                    <span>PPN ({lastInvoice.taxRate}%)</span>
                    <span>Rp {lastInvoice.tax.toLocaleString("id-ID")}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-zinc-950 text-xs pt-1">
                  <span>TOTAL</span>
                  <span>Rp {lastInvoice.totalPaid.toLocaleString("id-ID")}</span>
                </div>
              </div>

              {/* Payment info */}
              <div className="space-y-1 mb-4 text-zinc-700 border-b border-dashed border-zinc-400 pb-3">
                <div className="flex justify-between">
                  <span>Metode Bayar</span>
                  <span>{lastInvoice.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span>Diterima</span>
                  <span>Rp {lastInvoice.amountReceived.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kembalian</span>
                  <span>Rp {lastInvoice.changeAmount.toLocaleString("id-ID")}</span>
                </div>
              </div>

              {/* Member loyalty points summary */}
              {lastInvoice.customerName && (
                <div className="space-y-1 mb-4 text-[10px] text-zinc-600">
                  {lastInvoice.pointsRedeemed > 0 && (
                    <div className="flex justify-between">
                      <span>Poin Ditukarkan</span>
                      <span>-{lastInvoice.pointsRedeemed} Poin</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Poin Didapatkan</span>
                    <span>+{Math.floor(lastInvoice.totalPaid / pointsMultiplier)} Poin</span>
                  </div>
                </div>
              )}

              {/* Receipt Footer */}
              <div className="text-center border-t border-dashed border-zinc-400 pt-3 text-[10px] text-zinc-600 pb-2">
                <p className="font-bold text-zinc-800">--- TERIMA KASIH ---</p>
                <p className="mt-1">{receiptFooter}</p>
              </div>
            </div>

            {/* Static Action Footer inside Card */}
            <div className="p-4 border-t border-dashed border-zinc-200 bg-zinc-50 flex gap-3 shrink-0">
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-2.5 rounded-xl flex items-center justify-center gap-2 font-sans font-semibold text-xs border border-zinc-700 shadow-md cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Cetak Struk
              </button>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="flex-1 bg-primary hover:bg-primary/95 text-white py-2.5 rounded-xl flex items-center justify-center gap-2 font-sans font-semibold text-xs shadow-md shadow-primary/20 cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                Selesai (F2)
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Dialogue Alert Modal */}
      {modalConfig && modalConfig.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm">
          <div className="w-[380px] glass-card rounded-2xl p-6 shadow-2xl relative border-zinc-700 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-sm font-bold text-zinc-100 mb-2">{modalConfig.title}</h3>
            <p className="text-xs text-zinc-300 mb-5 whitespace-pre-line leading-relaxed">{modalConfig.message}</p>
            
            <div className="flex justify-end">
              <button
                onClick={() => setModalConfig(null)}
                className="px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary/95 text-xs font-bold cursor-pointer"
              >
                Oke
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
