"use client";

import React, { useState, useEffect } from "react";
import { 
  Package, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  AlertTriangle, 
  Layers, 
  ArrowUpDown,
  Check,
  X,
  TrendingUp,
  Settings2
} from "lucide-react";
import { Product, Category } from "@/data/mockData";
import { 
  getProducts, 
  getCategories, 
  saveProductAction, 
  deleteProductAction, 
  addCategoryAction,
  getSettingsAction
} from "@/app/actions";

export default function Inventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [sortBy, setSortBy] = useState<"name" | "stock" | "price">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Modals state
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Modal Dialogue State
  const [modalConfig, setModalConfig] = useState<{
    show: boolean;
    title: string;
    message: string;
    type: 'alert' | 'confirm' | 'success';
    onConfirm?: () => void;
  } | null>(null);

  const [defaultMinStock, setDefaultMinStock] = useState("5");

  // Form states
  const [barcode, setBarcode] = useState("");
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [stock, setStock] = useState("");
  const [minStock, setMinStock] = useState("");
  const [unit, setUnit] = useState("Pcs");
  const [discountPercent, setDiscountPercent] = useState("0");

  // Category Form State
  const [newCatName, setNewCatName] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");

  const loadData = async () => {
    const prods = await getProducts();
    setProducts(prods.map(p => ({
      id: p.id,
      barcode: p.barcode,
      name: p.name,
      categoryId: p.categoryId,
      buyPrice: p.buyPrice,
      sellPrice: p.sellPrice,
      stock: p.stock,
      minStock: p.minStock,
      unit: p.unit,
      isActive: p.isActive === 1,
      discountPercent: p.discountPercent ?? 0
    })));

    const cats = await getCategories();
    setCategories(cats.map(c => ({
      id: c.id,
      name: c.name,
      description: c.description || ""
    })));
  };

  useEffect(() => {
    loadData();
    getSettingsAction().then(data => {
      const minStockSet = data.find(s => s.key === "min_stock_default");
      if (minStockSet) setDefaultMinStock(minStockSet.value);
    });
  }, []);

  // Filter & Sort Logic
  const handleSort = (field: "name" | "stock" | "price") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const filteredProducts = products
    .filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.barcode.includes(searchQuery);
      const matchesCategory = selectedCategory === "all" || p.categoryId === parseInt(selectedCategory);
      const matchesLowStock = !filterLowStock || p.stock <= p.minStock;
      return matchesSearch && matchesCategory && matchesLowStock;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === "name") {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === "stock") {
        comparison = a.stock - b.stock;
      } else if (sortBy === "price") {
        comparison = a.sellPrice - b.sellPrice;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

  // Product actions
  const openAddProduct = () => {
    setEditingProduct(null);
    setBarcode("");
    setName("");
    setCategoryId(categories[0]?.id.toString() || "");
    setBuyPrice("");
    setSellPrice("");
    setStock("");
    setMinStock(defaultMinStock);
    setUnit("Pcs");
    setDiscountPercent("0");
    setShowProductModal(true);
  };

  const openEditProduct = (p: Product) => {
    setEditingProduct(p);
    setBarcode(p.barcode);
    setName(p.name);
    setCategoryId(p.categoryId.toString());
    setBuyPrice(p.buyPrice.toString());
    setSellPrice(p.sellPrice.toString());
    setStock(p.stock.toString());
    setMinStock(p.minStock.toString());
    setUnit(p.unit);
    setDiscountPercent((p.discountPercent ?? 0).toString());
    setShowProductModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !barcode || !categoryId || !buyPrice || !sellPrice || !stock || !minStock) {
      setModalConfig({
        show: true,
        title: "Kolom Belum Lengkap",
        message: "Harap isi semua kolom data produk sebelum menyimpan!",
        type: "alert"
      });
      return;
    }

    const payload = {
      id: editingProduct ? editingProduct.id : undefined,
      barcode,
      name,
      categoryId: parseInt(categoryId),
      buyPrice: parseFloat(buyPrice),
      sellPrice: parseFloat(sellPrice),
      stock: parseInt(stock),
      minStock: parseInt(minStock),
      unit,
      discountPercent: parseInt(discountPercent) || 0
    };

    const res = await saveProductAction(payload);
    
    if (res.success) {
      setShowProductModal(false);
      await loadData();
    } else {
      setModalConfig({
        show: true,
        title: "Gagal Menyimpan",
        message: res.error || "Gagal menyimpan data produk di database.",
        type: "alert"
      });
    }
  };

  const handleDeleteProduct = async (id: number) => {
    setModalConfig({
      show: true,
      title: "Konfirmasi Hapus Produk",
      message: "Apakah Anda yakin ingin menghapus produk ini dari katalog?",
      type: "confirm",
      onConfirm: async () => {
        const res = await deleteProductAction(id);
        if (res.success) {
          await loadData();
        } else {
          setModalConfig({
            show: true,
            title: "Gagal Menghapus",
            message: res.error || "Gagal menghapus produk dari database.",
            type: "alert"
          });
        }
      }
    });
  };

  // Category action
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;

    const res = await addCategoryAction(newCatName, newCatDesc || undefined);
    
    if (res.success) {
      setNewCatName("");
      setNewCatDesc("");
      await loadData();
    } else {
      setModalConfig({
        show: true,
        title: "Gagal Menambahkan",
        message: res.error || "Gagal menambahkan kategori baru.",
        type: "alert"
      });
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col overflow-hidden">
      {/* Title & Actions bar */}
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 font-sans">Katalog Inventaris</h1>
          <p className="text-sm text-zinc-400">Kelola daftar produk, stok barang, kategori, dan batas stok minimum.</p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => setShowCategoryModal(true)}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 py-2.5 px-4 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            <Layers className="w-4 h-4" />
            Manajemen Kategori
          </button>
          
          <button
            onClick={openAddProduct}
            className="flex items-center gap-2 bg-primary hover:bg-primary/95 text-white py-2.5 px-4 rounded-xl text-xs font-semibold transition-all shadow-lg shadow-primary/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Tambah Produk Baru
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card rounded-2xl p-4 shrink-0 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari barcode / nama produk..."
            className="w-full bg-[#121214] border border-zinc-800 rounded-xl py-2 pl-9 pr-4 text-xs text-zinc-200 focus:outline-none focus:border-primary placeholder-zinc-500 transition-colors"
          />
        </div>

        {/* Category selector & Filters */}
        <div className="flex flex-wrap gap-3 items-center w-full md:w-auto justify-end">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-[#121214] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-400 focus:outline-none focus:border-primary font-medium"
          >
            <option value="all">Semua Kategori</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>

          <button
            onClick={() => setFilterLowStock(!filterLowStock)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              filterLowStock
                ? "bg-red-500/10 border-red-500/30 text-red-400 shadow-md"
                : "bg-[#121214] border-zinc-800 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Stok Menipis
          </button>
        </div>
      </div>

      {/* Products Table container */}
      <div className="flex-1 glass-card rounded-2xl overflow-hidden flex flex-col min-h-0">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-900 border-b border-zinc-800 text-zinc-300 font-bold text-[10px] uppercase tracking-wider">
                <th className="py-4 px-6">Barcode / SKU</th>
                <th className="py-4 px-6 cursor-pointer hover:text-zinc-200" onClick={() => handleSort("name")}>
                  <div className="flex items-center gap-1.5">
                    Nama Produk <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-4 px-6">Kategori</th>
                <th className="py-4 px-6 text-right">Harga Beli (HPP)</th>
                <th className="py-4 px-6 text-right cursor-pointer hover:text-zinc-200" onClick={() => handleSort("price")}>
                  <div className="flex items-center gap-1.5 justify-end">
                    Harga Jual <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-4 px-6 text-center cursor-pointer hover:text-zinc-200" onClick={() => handleSort("stock")}>
                  <div className="flex items-center gap-1.5 justify-center">
                    Stok <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-4 px-6 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-xs text-zinc-300">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500 font-medium">
                    <Package className="w-10 h-10 mx-auto mb-3 text-zinc-700" />
                    Tidak ada produk ditemukan.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const cat = categories.find((c) => c.id === p.categoryId);
                  const isLow = p.stock <= p.minStock;
                  return (
                    <tr key={p.id} className="hover:bg-zinc-800/25 transition-colors">
                      <td className="py-3.5 px-6 font-mono font-bold text-zinc-300">{p.barcode}</td>
                      <td className="py-3.5 px-6 font-semibold text-zinc-100">{p.name}</td>
                      <td className="py-3.5 px-6">
                        <span className="bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded-md border border-zinc-700 text-[10px] font-medium">
                          {cat?.name || "Lain-lain"}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-right text-zinc-300">Rp {p.buyPrice.toLocaleString("id-ID")}</td>
                      <td className="py-3.5 px-6 text-right">
                        {p.discountPercent && p.discountPercent > 0 ? (
                          <div className="flex flex-col items-end">
                            <span className="font-bold text-emerald-400">
                              Rp {Math.round(p.sellPrice * (1 - p.discountPercent / 100)).toLocaleString("id-ID")}
                            </span>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-[10px] text-zinc-400 line-through">
                                Rp {p.sellPrice.toLocaleString("id-ID")}
                              </span>
                              <span className="text-[9px] font-extrabold bg-red-500/10 border border-red-500/20 text-red-400 px-1 rounded">
                                -{p.discountPercent}%
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="font-bold text-primary">
                            Rp {p.sellPrice.toLocaleString("id-ID")}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-6 text-center">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border inline-block min-w-16 ${
                          isLow 
                            ? "bg-red-500/10 border-red-500/20 text-red-400 animate-pulse" 
                            : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                        }`}>
                          {p.stock} {p.unit}
                        </span>
                      </td>
                      <td className="py-3.5 px-6">
                        <div className="flex gap-2.5 justify-center">
                          <button
                            onClick={() => openEditProduct(p)}
                            className="p-1.5 bg-zinc-800 border border-zinc-700 hover:border-zinc-500 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer"
                            title="Edit Produk"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="p-1.5 bg-zinc-800 border border-zinc-700 hover:border-red-900 hover:bg-red-950/20 rounded-lg text-zinc-500 hover:text-red-400 transition-all cursor-pointer"
                            title="Hapus Produk"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Add/Edit Dialog Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm">
          <div className="w-[480px] glass-card rounded-2xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-zinc-100 mb-2">
              {editingProduct ? "Edit Informasi Produk" : "Tambah Produk Baru"}
            </h3>
            <p className="text-xs text-zinc-400 mb-5">Lengkapi data produk minimarket.</p>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-zinc-400 font-semibold block mb-1">Barcode / SKU</label>
                  <input
                    type="text"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className="w-full bg-[#121214] border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-200 focus:outline-none focus:border-primary font-mono font-bold"
                    placeholder="Contoh: 8998866..."
                    disabled={!!editingProduct}
                  />
                </div>

                <div>
                  <label className="text-[10px] text-zinc-400 font-semibold block mb-1">Kategori</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-[#121214] border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-300 focus:outline-none focus:border-primary"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 font-semibold block mb-1">Nama Produk</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#121214] border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-200 focus:outline-none focus:border-primary font-semibold"
                  placeholder="Nama barang..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-zinc-400 font-semibold block mb-1">Harga Beli HPP (Rp)</label>
                  <input
                    type="number"
                    value={buyPrice}
                    onChange={(e) => setBuyPrice(e.target.value)}
                    className="w-full bg-[#121214] border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-200 focus:outline-none focus:border-primary font-semibold"
                    placeholder="Harga beli modal..."
                  />
                </div>

                <div>
                  <label className="text-[10px] text-zinc-400 font-semibold block mb-1">Harga Jual (Rp)</label>
                  <input
                    type="number"
                    value={sellPrice}
                    onChange={(e) => setSellPrice(e.target.value)}
                    className="w-full bg-[#121214] border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-200 focus:outline-none focus:border-primary font-semibold text-primary"
                    placeholder="Harga jual kasir..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-zinc-400 font-semibold block mb-1">Diskon Khusus Produk (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(e.target.value)}
                      className="w-full bg-[#121214] border border-zinc-800 rounded-xl py-2 pl-3 pr-8 text-xs text-zinc-200 focus:outline-none focus:border-primary font-semibold font-mono"
                      placeholder="0"
                      min="0"
                      max="100"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-500">%</span>
                  </div>
                </div>
                
                <div className="flex flex-col justify-end">
                  {parseInt(discountPercent) > 0 && parseFloat(sellPrice || "0") > 0 && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-2 text-[10px] font-semibold leading-normal">
                      Harga Promo: <span className="font-bold text-zinc-100 font-mono">Rp {Math.round(parseFloat(sellPrice) * (1 - (parseInt(discountPercent) || 0) / 100)).toLocaleString("id-ID")}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] text-zinc-400 font-semibold block mb-1">Stok Saat Ini</label>
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full bg-[#121214] border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-200 focus:outline-none focus:border-primary font-semibold"
                    placeholder="Stok fisik"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-zinc-400 font-semibold block mb-1">Stok Minimum</label>
                  <input
                    type="number"
                    value={minStock}
                    onChange={(e) => setMinStock(e.target.value)}
                    className="w-full bg-[#121214] border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-200 focus:outline-none focus:border-primary font-semibold"
                    placeholder="Limit minimum"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-zinc-400 font-semibold block mb-1">Unit Satuan</label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full bg-[#121214] border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-200 focus:outline-none focus:border-primary font-semibold"
                    placeholder="Pcs/Botol/Box"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-primary text-white hover:bg-primary/95 text-xs font-bold transition-colors cursor-pointer shadow-lg shadow-primary/20"
                >
                  Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Manager Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm">
          <div className="w-[420px] glass-card rounded-2xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-zinc-100">Manajemen Kategori</h3>
              <button 
                onClick={() => setShowCategoryModal(false)} 
                className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List Categories */}
            <div className="space-y-2 mb-6 max-h-48 overflow-y-auto pr-1">
              {categories.map((c) => (
                <div key={c.id} className="bg-[#121214]/80 border border-zinc-800 p-2.5 rounded-xl flex justify-between items-center">
                  <div>
                    <p className="text-xs font-bold text-zinc-200">{c.name}</p>
                    {c.description && <p className="text-[9px] text-zinc-500">{c.description}</p>}
                  </div>
                  <span className="text-[9px] text-zinc-500">ID: {c.id}</span>
                </div>
              ))}
            </div>

            {/* Add Category Form */}
            <form onSubmit={handleAddCategory} className="border-t border-zinc-800 pt-4 space-y-3">
              <p className="text-xs font-semibold text-zinc-300">Tambah Kategori Baru</p>
              <div>
                <label className="text-[9px] text-zinc-400 font-semibold block mb-1">Nama Kategori</label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full bg-[#121214] border border-zinc-850 rounded-xl py-2 px-3 text-xs text-zinc-200 focus:outline-none focus:border-primary font-semibold"
                  placeholder="Kategori baru..."
                />
              </div>
              <div>
                <label className="text-[9px] text-zinc-400 font-semibold block mb-1">Deskripsi (Opsional)</label>
                <input
                  type="text"
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  className="w-full bg-[#121214] border border-zinc-850 rounded-xl py-2 px-3 text-xs text-zinc-200 focus:outline-none focus:border-primary"
                  placeholder="Penjelasan singkat..."
                />
              </div>
              <button
                type="submit"
                className="w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Tambah Kategori
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Dialogue Alert/Confirm Modal */}
      {modalConfig && modalConfig.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm">
          <div className="w-[380px] glass-card rounded-2xl p-6 shadow-2xl relative border-zinc-700 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-sm font-bold text-zinc-100 mb-2">{modalConfig.title}</h3>
            <p className="text-xs text-zinc-300 mb-5 whitespace-pre-line leading-relaxed">{modalConfig.message}</p>
            
            <div className="flex gap-3 justify-end">
              {modalConfig.type === 'confirm' && (
                <button
                  onClick={() => setModalConfig(null)}
                  className="px-4 py-2 rounded-xl border border-zinc-650 text-zinc-300 hover:text-zinc-100 text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
              )}
              <button
                onClick={() => {
                  const callback = modalConfig.onConfirm;
                  setModalConfig(null);
                  callback?.();
                }}
                className="px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary/95 text-xs font-bold cursor-pointer"
              >
                {modalConfig.type === 'confirm' ? 'Yakin' : 'Oke'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
