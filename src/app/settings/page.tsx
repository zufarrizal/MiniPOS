"use client";

import React, { useState, useEffect } from "react";
import { 
  Settings, 
  Store, 
  Receipt, 
  Coins, 
  Save, 
  AlertCircle,
  Percent,
  PackageCheck
} from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { getSettingsAction, saveSettingsAction } from "@/assets/js/actions";

interface SettingItem {
  key: string;
  value: string;
  description: string | null;
}

export default function SettingsPage() {
  const { currentUser } = useCartStore();
  const [settings, setSettings] = useState<SettingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'finance' | 'loyalty' | 'inventory'>('profile');

  // Form State Map
  const [formValues, setFormValues] = useState<Record<string, string>>({
    store_name: "",
    store_address: "",
    store_phone: "",
    receipt_footer: "",
    starting_cash_default: "",
    points_per_multiplier: "",
    enable_tax: "false",
    tax_rate: "11",
    point_redeem_value: "100",
    min_stock_default: "5",
    enable_member_discount: "true",
    member_discount_rate: "2",
    enable_grosir_discount: "true",
    grosir_min_qty: "5",
    grosir_discount_rate: "5"
  });

  // Modal Dialogue State
  const [modalConfig, setModalConfig] = useState<{
    show: boolean;
    title: string;
    message: string;
    type: 'alert' | 'success';
  } | null>(null);

  const loadSettings = async () => {
    setLoading(true);
    const data = await getSettingsAction();
    setSettings(data);
    
    // Map array to key-value record
    const values: Record<string, string> = {};
    data.forEach(item => {
      values[item.key] = item.value;
    });
    // Fallback defaults for safety
    const safeValues = {
      store_name: values.store_name || "MiniPOS Minimarket",
      store_address: values.store_address || "Jl. Raya Minimarket No. 123, Jakarta",
      store_phone: values.store_phone || "081234567890",
      receipt_footer: values.receipt_footer || "Terima Kasih Telah Berbelanja!",
      starting_cash_default: values.starting_cash_default || "200000",
      points_per_multiplier: values.points_per_multiplier || "10000",
      enable_tax: values.enable_tax || "false",
      tax_rate: values.tax_rate || "11",
      point_redeem_value: values.point_redeem_value || "100",
      min_stock_default: values.min_stock_default || "5",
      enable_member_discount: values.enable_member_discount || "true",
      member_discount_rate: values.member_discount_rate || "2",
      enable_grosir_discount: values.enable_grosir_discount || "true",
      grosir_min_qty: values.grosir_min_qty || "5",
      grosir_discount_rate: values.grosir_discount_rate || "5"
    };
    setFormValues(safeValues);
    setLoading(false);
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleChange = (key: string, value: string) => {
    setFormValues(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    // Prepare payload
    const payload = Object.entries(formValues).map(([key, value]) => ({
      key,
      value
    }));

    const res = await saveSettingsAction(payload);
    setSaving(false);

    if (res.success) {
      await loadSettings();
      setModalConfig({
        show: true,
        title: "Pengaturan Disimpan",
        message: "Konfigurasi sistem berhasil diperbarui dan diterapkan ke seluruh aplikasi!",
        type: "success"
      });
    } else {
      setModalConfig({
        show: true,
        title: "Gagal Menyimpan",
        message: res.error || "Gagal menyimpan konfigurasi ke database.",
        type: "alert"
      });
    }
  };

  if (currentUser?.role !== 'ADMIN') {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-6">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-zinc-100">Akses Ditolak</h3>
        <p className="text-sm text-zinc-400 max-w-sm mt-2 mb-6">
          Hanya administrator/supervisor yang berwenang untuk mengakses halaman konfigurasi sistem.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full flex flex-col overflow-hidden max-w-5xl">
      {/* Title Bar */}
      <div className="flex justify-between items-center shrink-0 border-b border-zinc-800/60 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 font-sans flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary" />
            Konfigurasi Pengaturan
          </h1>
          <p className="text-xs text-zinc-400 mt-1">Atur parameter dasar, profile, kebijakan PPN, loyalitas poin member, dan default sistem.</p>
        </div>
        <button
          type="submit"
          form="settings-form"
          disabled={saving}
          className="flex items-center gap-2 bg-primary hover:bg-primary/95 text-white py-2.5 px-6 rounded-xl text-xs font-bold transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30 cursor-pointer disabled:opacity-50 select-none"
        >
          <Save className="w-4 h-4" />
          {saving ? "Menyimpan..." : "Simpan Semua"}
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-zinc-400 text-xs font-medium bg-[#121214] border border-[#1f1f23] rounded-2xl">
          Memuat konfigurasi pengaturan...
        </div>
      ) : (
        <div className="flex-1 flex gap-6 overflow-hidden">
          {/* Left Navigation Sidebar */}
          <div className="w-64 flex flex-col gap-2 shrink-0">
            {[
              { id: 'profile', label: 'Profil & Struk', desc: 'Identitas toko & footer struk', icon: Store, color: 'text-blue-400 bg-blue-500/10' },
              { id: 'finance', label: 'Keuangan & PPN', desc: 'Kebijakan pajak & modal awal', icon: Percent, color: 'text-red-400 bg-red-500/10' },
              { id: 'loyalty', label: 'Poin & Loyalitas', desc: 'Perolehan & tukar poin member', icon: Coins, color: 'text-emerald-400 bg-emerald-500/10' },
              { id: 'inventory', label: 'Sistem Inventaris', desc: 'Batas stok minimum default', icon: PackageCheck, color: 'text-orange-400 bg-orange-500/10' },
            ].map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer group ${
                    isActive
                      ? 'bg-primary/10 border-primary text-zinc-100 shadow-md shadow-primary/5'
                      : 'bg-[#121214]/60 border-zinc-800/40 text-zinc-450 hover:bg-[#121214] hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  <div className={`p-2 rounded-lg shrink-0 transition-transform duration-200 group-hover:scale-105 ${isActive ? 'bg-primary/20 text-primary' : tab.color}`}>
                    <TabIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${isActive ? 'text-zinc-100' : 'text-zinc-350'}`}>{tab.label}</p>
                    <p className="text-[9px] text-zinc-400 mt-0.5 leading-normal">{tab.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Pane (Form Container) */}
          <form id="settings-form" onSubmit={handleSave} className="flex-1 bg-[#121214] border border-[#1f1f23] rounded-2xl p-6 flex flex-col justify-between overflow-hidden relative">
            <div className="flex-1 overflow-y-auto space-y-6 pr-2">
              {activeTab === 'profile' && (
                <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <div className="border-b border-[#1f1f23] pb-3">
                    <h3 className="text-sm font-extrabold text-zinc-100">Profil & Identitas Toko</h3>
                    <p className="text-[10px] text-zinc-400 mt-1">Konfigurasi data resmi minimarket yang akan dicantumkan di kop struk belanja kasir.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-zinc-350 font-bold uppercase tracking-wider block">Nama Toko / Minimarket</label>
                      <input
                        type="text"
                        value={formValues.store_name}
                        onChange={(e) => handleChange("store_name", e.target.value)}
                        className="w-full bg-[#18181b] border border-zinc-650 rounded-xl py-2.5 px-4 text-xs text-zinc-100 focus:outline-none focus:border-primary font-semibold transition-colors"
                        placeholder="Misal: MiniPOS Minimarket"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-zinc-350 font-bold uppercase tracking-wider block">Nomor Telepon Toko</label>
                      <input
                        type="text"
                        value={formValues.store_phone}
                        onChange={(e) => handleChange("store_phone", e.target.value)}
                        className="w-full bg-[#18181b] border border-zinc-650 rounded-xl py-2.5 px-4 text-xs text-zinc-100 focus:outline-none focus:border-primary font-mono font-semibold transition-colors"
                        placeholder="Misal: 081234567890"
                        required
                      />
                    </div>

                    <div className="md:col-span-2 space-y-1.5">
                      <label className="text-[10px] text-zinc-350 font-bold uppercase tracking-wider block">Alamat Toko Lengkap</label>
                      <textarea
                        value={formValues.store_address}
                        onChange={(e) => handleChange("store_address", e.target.value)}
                        rows={3}
                        className="w-full bg-[#18181b] border border-zinc-650 rounded-xl py-2.5 px-4 text-xs text-zinc-100 focus:outline-none focus:border-primary font-semibold resize-none transition-colors"
                        placeholder="Masukkan alamat fisik toko secara lengkap..."
                        required
                      />
                    </div>

                    <div className="md:col-span-2 space-y-1.5 pt-2 border-t border-[#1f1f23] mt-2">
                      <label className="text-[10px] text-zinc-350 font-bold uppercase tracking-wider block">Footer Struk Belanja (Pesan Kaki)</label>
                      <input
                        type="text"
                        value={formValues.receipt_footer}
                        onChange={(e) => handleChange("receipt_footer", e.target.value)}
                        className="w-full bg-[#18181b] border border-zinc-650 rounded-xl py-2.5 px-4 text-xs text-zinc-100 focus:outline-none focus:border-primary font-semibold transition-colors"
                        placeholder="Misal: Terima Kasih Telah Berbelanja!"
                        required
                      />
                      <p className="text-[9px] text-zinc-400 italic">Pesan ini akan otomatis tercetak di baris paling bawah dari setiap struk kasir.</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'finance' && (
                <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <div className="border-b border-[#1f1f23] pb-3">
                    <h3 className="text-sm font-extrabold text-zinc-100">Keuangan & Pajak PPN</h3>
                    <p className="text-[10px] text-zinc-400 mt-1">Konfigurasi pengenaan pajak PPN penjualan serta default modal operasional shift kasir.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-zinc-350 font-bold uppercase tracking-wider block">Aktifkan Pajak PPN</label>
                      <select
                        value={formValues.enable_tax}
                        onChange={(e) => handleChange("enable_tax", e.target.value)}
                        className="w-full bg-[#18181b] border border-zinc-650 rounded-xl py-2.5 px-4 text-xs text-zinc-100 focus:outline-none focus:border-primary font-semibold transition-colors cursor-pointer"
                      >
                        <option value="true">Ya, Kenakan PPN pada Transaksi</option>
                        <option value="false">Tidak (Non-Aktifkan PPN)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-zinc-350 font-bold uppercase tracking-wider block">Persentase Tarif PPN (%)</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={formValues.tax_rate}
                          onChange={(e) => handleChange("tax_rate", e.target.value)}
                          className="w-full bg-[#18181b] border border-zinc-650 rounded-xl py-2.5 pl-4 pr-10 text-xs text-zinc-100 focus:outline-none focus:border-primary font-semibold font-mono transition-colors"
                          placeholder="11"
                          min="0"
                          max="100"
                          required
                        />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-xs">%</span>
                      </div>
                    </div>

                    <div className="md:col-span-2 space-y-1.5 pt-2 border-t border-[#1f1f23] mt-2">
                      <label className="text-[10px] text-zinc-350 font-bold uppercase tracking-wider block">Default Saldo Modal Awal Shift</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-xs">Rp</span>
                        <input
                          type="number"
                          value={formValues.starting_cash_default}
                          onChange={(e) => handleChange("starting_cash_default", e.target.value)}
                          className="w-full bg-[#18181b] border border-zinc-650 rounded-xl py-2.5 pl-10 pr-4 text-xs text-zinc-100 focus:outline-none focus:border-primary font-semibold font-mono transition-colors"
                          placeholder="200000"
                          min="0"
                          required
                        />
                      </div>
                      <p className="text-[9px] text-zinc-400 italic">Jumlah modal default yang diisikan secara otomatis di laci kas saat kasir membuka shift baru.</p>
                    </div>

                    {/* Diskon Section */}
                    <div className="md:col-span-2 space-y-4 pt-4 border-t border-[#1f1f23] mt-2">
                      <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Konfigurasi Diskon Otomatis</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Member Discount */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-zinc-350 font-bold uppercase tracking-wider block">Aktifkan Diskon Member</label>
                          <select
                            value={formValues.enable_member_discount}
                            onChange={(e) => handleChange("enable_member_discount", e.target.value)}
                            className="w-full bg-[#18181b] border border-zinc-650 rounded-xl py-2.5 px-4 text-xs text-zinc-100 focus:outline-none focus:border-primary font-semibold transition-colors cursor-pointer"
                          >
                            <option value="true">Ya, Aktifkan Diskon Member</option>
                            <option value="false">Tidak (Non-Aktifkan)</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] text-zinc-350 font-bold uppercase tracking-wider block">Besaran Diskon Member (%)</label>
                          <div className="relative">
                            <input
                              type="number"
                              value={formValues.member_discount_rate}
                              onChange={(e) => handleChange("member_discount_rate", e.target.value)}
                              className="w-full bg-[#18181b] border border-zinc-650 rounded-xl py-2.5 pl-4 pr-10 text-xs text-zinc-100 focus:outline-none focus:border-primary font-semibold font-mono transition-colors"
                              placeholder="2"
                              min="0"
                              max="100"
                              required
                            />
                            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-xs">%</span>
                          </div>
                        </div>

                        {/* Grosir Discount */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-zinc-350 font-bold uppercase tracking-wider block">Aktifkan Diskon Grosir</label>
                          <select
                            value={formValues.enable_grosir_discount}
                            onChange={(e) => handleChange("enable_grosir_discount", e.target.value)}
                            className="w-full bg-[#18181b] border border-zinc-650 rounded-xl py-2.5 px-4 text-xs text-zinc-100 focus:outline-none focus:border-primary font-semibold transition-colors cursor-pointer"
                          >
                            <option value="true">Ya, Aktifkan Diskon Grosir</option>
                            <option value="false">Tidak (Non-Aktifkan)</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] text-zinc-350 font-bold uppercase tracking-wider block">Minimal Qty Grosir (Pcs)</label>
                          <input
                            type="number"
                            value={formValues.grosir_min_qty}
                            onChange={(e) => handleChange("grosir_min_qty", e.target.value)}
                            className="w-full bg-[#18181b] border border-zinc-650 rounded-xl py-2.5 px-4 text-xs text-zinc-100 focus:outline-none focus:border-primary font-semibold font-mono transition-colors"
                            placeholder="5"
                            min="1"
                            required
                          />
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                          <label className="text-[10px] text-zinc-350 font-bold uppercase tracking-wider block">Besaran Diskon Grosir (%)</label>
                          <div className="relative">
                            <input
                              type="number"
                              value={formValues.grosir_discount_rate}
                              onChange={(e) => handleChange("grosir_discount_rate", e.target.value)}
                              className="w-full bg-[#18181b] border border-zinc-650 rounded-xl py-2.5 pl-4 pr-10 text-xs text-zinc-100 focus:outline-none focus:border-primary font-semibold font-mono transition-colors"
                              placeholder="5"
                              min="0"
                              max="100"
                              required
                            />
                            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-xs">%</span>
                          </div>
                          <p className="text-[9px] text-zinc-400 italic">Diskon grosir memotong harga satuan barang secara otomatis saat kuantitas per produk mencapai minimal pcs yang ditentukan.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'loyalty' && (
                <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <div className="border-b border-[#1f1f23] pb-3">
                    <h3 className="text-sm font-extrabold text-zinc-100">Sistem Loyalitas Poin Member</h3>
                    <p className="text-[10px] text-zinc-400 mt-1">Konfigurasi rumus akumulasi perolehan poin belanja serta nominal diskon penukaran poin.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-zinc-350 font-bold uppercase tracking-wider block">Belanja per 1 Poin (Kelipatan)</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-xs">Rp</span>
                        <input
                          type="number"
                          value={formValues.points_per_multiplier}
                          onChange={(e) => handleChange("points_per_multiplier", e.target.value)}
                          className="w-full bg-[#18181b] border border-zinc-650 rounded-xl py-2.5 pl-10 pr-4 text-xs text-zinc-100 focus:outline-none focus:border-primary font-semibold font-mono transition-colors"
                          placeholder="10000"
                          min="1"
                          required
                        />
                      </div>
                      <p className="text-[9px] text-zinc-400 leading-normal">Nominal kelipatan belanja untuk mendapatkan 1 poin member (Contoh: Rp 10.000 = 1 Poin).</p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-zinc-350 font-bold uppercase tracking-wider block">Nilai Diskon per 1 Poin (Konversi)</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-xs">Rp</span>
                        <input
                          type="number"
                          value={formValues.point_redeem_value}
                          onChange={(e) => handleChange("point_redeem_value", e.target.value)}
                          className="w-full bg-[#18181b] border border-zinc-650 rounded-xl py-2.5 pl-10 pr-4 text-xs text-zinc-100 focus:outline-none focus:border-primary font-semibold font-mono transition-colors"
                          placeholder="100"
                          min="0"
                          required
                        />
                      </div>
                      <p className="text-[9px] text-zinc-400 leading-normal">Jumlah potongan rupiah ketika pelanggan menukarkan 1 poin member (Contoh: 1 Poin = Rp 100).</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'inventory' && (
                <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <div className="border-b border-[#1f1f23] pb-3">
                    <h3 className="text-sm font-extrabold text-zinc-100">Sistem Inventaris & Barang</h3>
                    <p className="text-[10px] text-zinc-400 mt-1">Konfigurasi batas stok pengingat (alert threshold) default di gudang penyimpanan.</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-350 font-bold uppercase tracking-wider block">Batas Stok Minimum Default (Pcs / Unit)</label>
                    <input
                      type="number"
                      value={formValues.min_stock_default}
                      onChange={(e) => handleChange("min_stock_default", e.target.value)}
                      className="w-full bg-[#18181b] border border-zinc-650 rounded-xl py-2.5 px-4 text-xs text-zinc-100 focus:outline-none focus:border-primary font-semibold font-mono transition-colors"
                      placeholder="5"
                      min="0"
                      required
                    />
                    <p className="text-[9px] text-zinc-400 leading-normal">Batas default di mana produk akan ditandai berstok kritis / menipis di halaman Dashboard dan Katalog.</p>
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Dialogue Alert/Success Modal */}
      {modalConfig && modalConfig.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm">
          <div className="w-[380px] glass-card rounded-2xl p-6 shadow-2xl relative border-zinc-700 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-sm font-bold text-zinc-100 mb-2">{modalConfig.title}</h3>
            <p className="text-xs text-zinc-300 mb-5 whitespace-pre-line leading-relaxed">{modalConfig.message}</p>
            
            <div className="flex justify-end">
              <button
                type="button"
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
