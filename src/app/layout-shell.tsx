"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  BarChart3, 
  Clock, 
  User, 
  Users,
  Settings,
  Power,
  Store,
  DollarSign,
  Lock
} from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { authenticateUserAction, getSettingsAction } from "@/assets/js/actions";

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { activeShift, startShift, endShift, syncShift, currentUser, loginUser, logoutUser } = useCartStore();
  const [time, setTime] = useState("");
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [startingCash, setStartingCash] = useState("200000");
  const [storeName, setStoreName] = useState("MiniPOS Minimarket");

  // Login Local States
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Modal Dialogue State
  const [modalConfig, setModalConfig] = useState<{
    show: boolean;
    title: string;
    message: string;
    type: 'alert' | 'confirm' | 'prompt' | 'success';
    placeholder?: string;
    onConfirm?: (value?: string) => void;
  } | null>(null);

  useEffect(() => {
    syncShift();
  }, [syncShift]);

  // Load dynamic settings on user session or component load
  useEffect(() => {
    getSettingsAction().then(data => {
      const nameSetting = data.find(s => s.key === "store_name");
      if (nameSetting) {
        setStoreName(nameSetting.value);
      }
      const cashSetting = data.find(s => s.key === "starting_cash_default");
      if (cashSetting) {
        setStartingCash(cashSetting.value);
      }
    });
  }, [currentUser]);

  useEffect(() => {
    setTime(new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Redirect restricted cashier to cashier page POS automatically
  useEffect(() => {
    if (currentUser && currentUser.role === 'CASHIER' && pathname !== '/cashier' && pathname !== '/reports' && pathname !== '/members') {
      router.replace("/cashier");
    }
  }, [currentUser, pathname, router]);

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Kasir POS", href: "/cashier", icon: ShoppingCart },
    { name: "Inventaris", href: "/inventory", icon: Package },
    { name: "Kelola Member", href: "/members", icon: Users },
    { name: "Laporan", href: "/reports", icon: BarChart3 },
    { name: "Kelola Staf", href: "/users", icon: User },
    { name: "Pengaturan", href: "/settings", icon: Settings },
  ];

  const handleOpenShift = async () => {
    const cash = parseFloat(startingCash);
    if (!isNaN(cash)) {
      const res = await startShift(cash);
      if (res.success) {
        setShowShiftModal(false);
      } else {
        setModalConfig({
          show: true,
          title: "Gagal Membuka Shift",
          message: res.error || "Gagal membuka shift kasir.",
          type: "alert"
        });
      }
    }
  };

  const handleCloseShift = async () => {
    setModalConfig({
      show: true,
      title: "Konfirmasi Tutup Shift",
      message: "Apakah Anda yakin ingin menutup shift kasir saat ini?",
      type: "confirm",
      onConfirm: () => {
        setModalConfig({
          show: true,
          title: "Tutup Shift - Laci Kasir",
          message: "Masukkan total uang tunai fisik di laci kas (Rupiah):",
          type: "prompt",
          placeholder: "0",
          onConfirm: async (actualCashStr) => {
            const actualCash = parseFloat(actualCashStr || "0");
            if (!isNaN(actualCash)) {
              const res = await endShift(actualCash);
              if (res.success && res.shift) {
                setModalConfig({
                  show: true,
                  title: "Shift Berhasil Ditutup",
                  message: `Uang Modal Awal : Rp ${res.shift.startingCash.toLocaleString("id-ID")}\n` +
                           `Target Kas Laci : Rp ${res.shift.expectedEndingCash.toLocaleString("id-ID")}\n` +
                           `Uang Fisik Kasir: Rp ${res.shift.actualEndingCash?.toLocaleString("id-ID")}\n` +
                           `Selisih Keuangan: ${res.shift.discrepancy >= 0 ? "+" : ""}Rp ${res.shift.discrepancy?.toLocaleString("id-ID")}`,
                  type: "success"
                });
              } else {
                setModalConfig({
                  show: true,
                  title: "Gagal",
                  message: res.error || "Gagal menutup shift kasir.",
                  type: "alert"
                });
              }
            } else {
              setModalConfig({
                show: true,
                title: "Input Tidak Valid",
                message: "Nominal uang yang dimasukkan tidak valid.",
                type: "alert"
              });
            }
          }
        });
      }
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (!username.trim() || !password) {
      setLoginError("Harap isi username dan password!");
      return;
    }

    const res = await authenticateUserAction(username, password);

    if (res.success && res.user) {
      loginUser({
        id: res.user.id,
        username: res.user.username,
        name: res.user.name,
        role: res.user.role as 'ADMIN' | 'CASHIER'
      });
      setUsername("");
      setPassword("");
      
      // Auto-redirect based on role on successful login
      if (res.user.role === 'CASHIER') {
        router.push("/cashier");
      } else {
        router.push("/dashboard");
      }
    } else {
      setLoginError(res.error || "Gagal masuk. Periksa username & password.");
    }
  };

  // Filter sidebar menu items based on role
  const filteredNavItems = navItems.filter((item) => {
    if (currentUser && currentUser.role === 'CASHIER') {
      return item.href === '/cashier' || item.href === '/reports' || item.href === '/members';
    }
    return true; // Admin has access to all pages
  });

  // Verify access authorization for active route
  const isRestricted = currentUser && currentUser.role === 'CASHIER' && pathname !== '/cashier' && pathname !== '/reports' && pathname !== '/members';

  return (
    <div key="main-layout-root" className="flex h-screen w-screen bg-[#09090b] text-foreground font-sans antialiased overflow-hidden relative">
      {/* IF USER IS NOT LOGGED IN: Render Username/Password Login Form Overlay */}
      {!currentUser && (
        <div key="login-form-overlay" className="absolute inset-0 z-50 flex bg-[#09090b] items-center justify-center font-sans antialiased overflow-hidden">
          {/* Ambient background glows */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

          <div className="w-[400px] glass-card rounded-2xl p-8 shadow-2xl relative border-zinc-700 z-10 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 mb-3">
                <Store className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-zinc-100">{storeName}</h2>
              <p className="text-xs text-zinc-400 mt-1.5 max-w-xs">Silakan masukkan username & password untuk masuk ke sistem</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-[10px] text-zinc-350 font-bold block mb-1">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/\s+/g, ""))}
                  className="w-full bg-[#18181b] border border-zinc-600 rounded-xl py-2.5 px-4 text-xs text-zinc-150 focus:outline-none focus:border-primary font-bold placeholder-zinc-700 transition-all"
                  placeholder="Masukkan username staf..."
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-350 font-bold block mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#18181b] border border-zinc-600 rounded-xl py-2.5 px-4 text-xs text-zinc-150 focus:outline-none focus:border-primary font-bold placeholder-zinc-700 transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>

              {loginError && (
                <p className="text-xs text-red-400 font-bold bg-red-500/10 border border-red-500/20 p-2.5 rounded-lg animate-in fade-in slide-in-from-bottom-1 duration-150">
                  {loginError}
                </p>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-primary text-white hover:bg-primary/95 text-xs font-bold transition-all cursor-pointer shadow-lg shadow-primary/20"
              >
                Masuk Sistem
              </button>              
            </form>
          </div>
        </div>
      )}
      {/* Sidebar */}
      <aside className="w-64 bg-[#121214] border-r border-[#1f1f23] flex flex-col justify-between shrink-0">
        <div>
          {/* Logo / Brand */}
          <div className="h-16 flex items-center px-6 gap-3 border-b border-[#1f1f23] bg-[#141416]/50">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent block truncate max-w-[150px]" title={storeName}>
                {storeName}
              </span>
              <span className="text-[9px] text-zinc-450 block font-medium uppercase tracking-wider">
                MiniPOS System
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-1">
            {filteredNavItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative ${
                    isActive
                      ? "bg-primary text-white font-medium shadow-md shadow-primary/10"
                      : "text-zinc-400 hover:text-zinc-100 hover:bg-[#1a1a1e]"
                  }`}
                >
                  <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-105 ${
                    isActive ? "text-white" : "text-zinc-400 group-hover:text-zinc-100"
                  }`} />
                  <span>{item.name}</span>
                  {isActive && (
                    <span className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Info & Logout at Bottom */}
        <div className="p-4 border-t border-[#1f1f23] bg-[#141416]/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-zinc-300" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-zinc-200 truncate">{currentUser?.name || "Memuat..."}</p>
                <p className="text-[9px] text-zinc-450 uppercase font-bold tracking-wider">{currentUser?.role === 'ADMIN' ? 'Supervisor' : 'Kasir'}</p>
              </div>
            </div>

            <button
              onClick={() => {
                logoutUser();
                router.push("/dashboard");
              }}
              className="text-[9px] text-zinc-300 hover:text-red-400 border border-zinc-650 bg-zinc-800 hover:bg-zinc-750 px-2 py-1 rounded-md font-bold transition-all shrink-0 cursor-pointer"
              title="Keluar dari Akun"
            >
              Keluar
            </button>
          </div>

          {activeShift ? (
            <button
              onClick={handleCloseShift}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-red-950/40 border border-red-900/50 hover:bg-red-900/40 text-red-400 text-xs font-semibold transition-all duration-200 cursor-pointer"
            >
              <Power className="w-3.5 h-3.5" />
              Tutup Shift Kasir
            </button>
          ) : (
            <button
              onClick={() => setShowShiftModal(true)}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-emerald-950/40 border border-emerald-900/50 hover:bg-emerald-900/40 text-emerald-400 text-xs font-semibold transition-all duration-200 cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5" />
              Mulai Shift Kasir
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-[#1f1f23] flex items-center justify-between px-8 bg-[#121214] shrink-0">
          {/* Shift Status Indicator */}
          <div className="flex items-center gap-4">
            {activeShift ? (
              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-medium">Shift Aktif (Sejak {new Date(activeShift.startTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })})</span>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-xs font-medium">Shift Kasir Belum Dibuka</span>
              </div>
            )}

            {activeShift && (
              <div className="hidden md:flex items-center gap-1.5 text-xs text-zinc-400">
                <DollarSign className="w-3.5 h-3.5 text-zinc-400" />
                <span>Modal Awal: </span>
                <span className="font-semibold text-zinc-200">Rp {activeShift.startingCash.toLocaleString("id-ID")}</span>
              </div>
            )}
          </div>

          {/* Time Display */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-zinc-400 tabular-nums bg-zinc-900 px-3.5 py-1.5 rounded-lg border border-zinc-800">
              {time || "00:00:00"}
            </span>
          </div>
        </header>

        {/* Dynamic Views / Access Denied Shield */}
        <main className="flex-1 overflow-y-auto p-6 relative">
          {isRestricted ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-[#09090b]">
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mb-4">
                <Lock className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-zinc-100">Akses Ditolak</h3>
              <p className="text-sm text-zinc-400 max-w-sm mt-2 mb-6">
                Akun Anda (Kasir) tidak memiliki wewenang untuk membuka portal manajemen ini. Harap gunakan menu Kasir POS.
              </p>
              <Link href="/cashier" className="py-2.5 px-6 rounded-xl bg-primary text-white hover:bg-primary/90 text-xs font-bold transition-all shadow-md shadow-primary/20">
                Buka Halaman Kasir POS
              </Link>
            </div>
          ) : (
            children
          )}
        </main>
      </div>

      {/* Modal Mulai Shift */}
      {showShiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm">
          <div className="w-[360px] glass-card rounded-2xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-zinc-100 mb-2">Buka Shift Kasir Baru</h3>
            <p className="text-xs text-zinc-400 mb-5">Masukkan jumlah uang kasir mula-mula yang ada di laci kasir (untuk uang kembalian).</p>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs text-zinc-400 font-medium block mb-1.5">Uang Modal Awal (Rupiah)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 font-semibold text-sm">Rp</span>
                  <input
                    type="number"
                    value={startingCash}
                    onChange={(e) => setStartingCash(e.target.value)}
                    className="w-full bg-[#121214] border border-zinc-700 rounded-xl py-2.5 pl-10 pr-4 text-zinc-100 focus:outline-none focus:border-primary font-semibold text-sm transition-colors"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowShiftModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={handleOpenShift}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-white hover:bg-primary/95 text-xs font-semibold transition-colors cursor-pointer shadow-lg shadow-primary/20"
                >
                  Buka Shift
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Dialogue Alert/Confirm/Prompt Modal */}
      {modalConfig && modalConfig.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm">
          <div className="w-[380px] glass-card rounded-2xl p-6 shadow-2xl relative border-zinc-700 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-sm font-bold text-zinc-100 mb-2">{modalConfig.title}</h3>
            <p className="text-xs text-zinc-300 mb-5 whitespace-pre-line leading-relaxed">{modalConfig.message}</p>
            
            {modalConfig.type === 'prompt' && (
              <div className="mb-5">
                <input
                  id="modal-prompt-input"
                  type="number"
                  placeholder={modalConfig.placeholder || ""}
                  className="w-full bg-[#18181b] border border-zinc-600 rounded-xl py-2.5 px-4 text-xs text-zinc-100 focus:outline-none focus:border-primary font-bold transition-all"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = (e.target as HTMLInputElement).value;
                      modalConfig.onConfirm?.(val);
                      setModalConfig(null);
                    }
                  }}
                />
              </div>
            )}

            <div className="flex gap-3 justify-end">
              {['confirm', 'prompt'].includes(modalConfig.type) && (
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
                  const type = modalConfig.type;
                  
                  if (type === 'prompt') {
                    const inputEl = document.getElementById('modal-prompt-input') as HTMLInputElement;
                    const val = inputEl?.value || "";
                    setModalConfig(null);
                    callback?.(val);
                  } else {
                    setModalConfig(null);
                    callback?.();
                  }
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
