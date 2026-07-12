"use client";

import React, { useState, useEffect } from "react";
import { 
  User, 
  UserPlus, 
  Edit2, 
  Trash2, 
  Key, 
  ShieldAlert, 
  UserCheck,
  Plus
} from "lucide-react";
import { getUsers, saveUserAction, deleteUserAction } from "@/assets/js/actions";
import { useCartStore } from "@/store/cartStore";

interface StaffUser {
  id: number;
  username: string;
  passwordHash: string;
  name: string;
  role: string;
  createdAt: string;
}

export default function UsersManagement() {
  const { currentUser } = useCartStore();
  const [usersList, setUsersList] = useState<StaffUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal form states
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<StaffUser | null>(null);
  
  // Fields state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<'ADMIN' | 'CASHIER'>('CASHIER');

  // Alert/Confirm Modal state
  const [modalConfig, setModalConfig] = useState<{
    show: boolean;
    title: string;
    message: string;
    type: 'alert' | 'confirm';
    onConfirm?: () => void;
  } | null>(null);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await getUsers();
      setUsersList(data as StaffUser[]);
    } catch (error) {
      console.error("Gagal memuat daftar staf:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleOpenAdd = () => {
    setEditingUser(null);
    setUsername("");
    setPassword("");
    setName("");
    setRole("CASHIER");
    setShowModal(true);
  };

  const handleOpenEdit = (user: StaffUser) => {
    setEditingUser(user);
    setUsername(user.username);
    setPassword(""); // Keep blank to indicate no change unless typed
    setName(user.name);
    setRole(user.role as 'ADMIN' | 'CASHIER');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !name.trim() || (editingUser === null && !password)) {
      setModalConfig({
        show: true,
        title: "Input Tidak Lengkap",
        message: "Semua kolom data staf harus diisi dengan benar!",
        type: "alert"
      });
      return;
    }

    const payload = {
      id: editingUser ? editingUser.id : undefined,
      username: username.trim(),
      passwordHash: password ? password : (editingUser ? editingUser.passwordHash : ""),
      name: name.trim(),
      role: role
    };

    const res = await saveUserAction(payload);

    if (res.success) {
      setShowModal(false);
      await loadUsers();
      
      setModalConfig({
        show: true,
        title: "Penyimpanan Berhasil",
        message: `Data staf ${name} berhasil disimpan!`,
        type: "alert"
      });
    } else {
      setModalConfig({
        show: true,
        title: "Gagal Menyimpan",
        message: res.error || "Gagal menyimpan data staf ke database.",
        type: "alert"
      });
    }
  };

  const handleDelete = (user: StaffUser) => {
    if (currentUser && currentUser.id === user.id) {
      setModalConfig({
        show: true,
        title: "Tindakan Dilarang",
        message: "Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif digunakan saat ini!",
        type: "alert"
      });
      return;
    }

    setModalConfig({
      show: true,
      title: "Konfirmasi Hapus Staf",
      message: `Apakah Anda yakin ingin menghapus staf "${user.name}" dari sistem? Tindakan ini tidak dapat dibatalkan.`,
      type: "confirm",
      onConfirm: async () => {
        const res = await deleteUserAction(user.id);
        if (res.success) {
          await loadUsers();
          setModalConfig({
            show: true,
            title: "Berhasil Dihapus",
            message: "Data staf telah dihapus permanen dari sistem.",
            type: "alert"
          });
        } else {
          setModalConfig({
            show: true,
            title: "Gagal Menghapus",
            message: res.error || "Gagal menghapus data staf dari database.",
            type: "alert"
          });
        }
      }
    });
  };

  return (
    <div className="space-y-6 h-full flex flex-col overflow-hidden">
      {/* Title & Action Bar */}
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 font-sans">Kelola Staf & Pengguna</h1>
          <p className="text-sm text-zinc-400">Daftar staf kasir dan admin minimarket yang berwenang mengakses MiniPOS.</p>
        </div>
        
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-primary hover:bg-primary/95 text-white py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-lg shadow-primary/20 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          Tambah Staf Baru
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 glass-card rounded-2xl overflow-hidden flex flex-col min-h-0">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center text-sm text-zinc-400">
            Memuat data staf...
          </div>
        ) : usersList.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-sm text-zinc-500">
            Belum ada staf terdaftar di database.
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-900 border-b border-zinc-800 text-zinc-300 font-bold text-[10px] uppercase tracking-wider">
                  <th className="py-4 px-6">Nama Lengkap</th>
                  <th className="py-4 px-6">Username</th>
                  <th className="py-4 px-6">Hak Akses / Wewenang</th>
                  <th className="py-4 px-6">Tanggal Terdaftar</th>
                  <th className="py-4 px-6 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850">
                {usersList.map((user) => (
                  <tr key={user.id} className="hover:bg-zinc-900/30 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                          <User className="w-4 h-4 text-zinc-300" />
                        </div>
                        <span className="text-xs font-semibold text-zinc-200">{user.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-xs text-zinc-300 font-mono">
                      {user.username}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full border ${
                        user.role === 'ADMIN' 
                          ? "bg-purple-500/10 border-purple-500/25 text-purple-400" 
                          : "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                      }`}>
                        {user.role === 'ADMIN' ? 'SUPERVISOR' : 'KASIR'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs text-zinc-400">
                      {new Date(user.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric"
                      })}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(user)}
                          className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-450 hover:text-zinc-250 transition-colors cursor-pointer border border-transparent hover:border-zinc-700"
                          title="Edit Staf"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
                          className="p-2 hover:bg-red-950/40 rounded-lg text-zinc-450 hover:text-red-400 transition-colors cursor-pointer border border-transparent hover:border-red-900/30"
                          title="Hapus Staf"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm">
          <form onSubmit={handleSave} className="w-[380px] glass-card rounded-2xl p-6 shadow-2xl relative border-zinc-700 animate-in fade-in zoom-in-95 duration-200 space-y-4">
            <div>
              <h3 className="text-base font-bold text-zinc-100">
                {editingUser ? "Edit Profil Staf" : "Tambah Staf Baru"}
              </h3>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                {editingUser ? "Sesuaikan detail akun wewenang staf." : "Buat akun akses kasir/admin baru."}
              </p>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="text-[10px] text-zinc-300 font-bold block mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#18181b] border border-zinc-650 rounded-xl py-2 px-3 text-xs text-zinc-100 focus:outline-none focus:border-primary font-semibold"
                  placeholder="Misal: Ahmad Dani"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-300 font-bold block mb-1">Username Login</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/\s+/g, ""))}
                  className="w-full bg-[#18181b] border border-zinc-650 rounded-xl py-2 px-3 text-xs text-zinc-100 focus:outline-none focus:border-primary font-mono"
                  placeholder="Misal: ahmad12"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-300 font-bold block mb-1">
                  Password {editingUser && "(Kosongkan jika tidak diubah)"}
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#18181b] border border-zinc-650 rounded-xl py-2 px-3 text-xs text-zinc-100 focus:outline-none focus:border-primary font-bold placeholder-zinc-650"
                    placeholder="••••••••"
                    required={editingUser === null}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-zinc-300 font-bold block mb-1.5">Hak Akses (Role)</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("CASHIER")}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      role === "CASHIER"
                        ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                        : "bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-zinc-300"
                    }`}
                  >
                    KASIR
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("ADMIN")}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      role === "ADMIN"
                        ? "bg-purple-500/10 border-purple-500/40 text-purple-400"
                        : "bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-zinc-300"
                    }`}
                  >
                    SUPERVISOR
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2.5 rounded-xl border border-zinc-650 text-zinc-300 hover:text-zinc-100 text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-primary text-white hover:bg-primary/95 text-xs font-bold cursor-pointer"
              >
                Simpan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Alert/Confirm Dialogue Modal */}
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
