"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  Phone, 
  Award, 
  Calendar
} from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { getCustomers, saveCustomerAction, deleteCustomerAction } from "@/assets/js/actions";

interface Member {
  id: number;
  name: string;
  phone: string | null;
  points: number;
  createdAt: string;
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Form State
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [points, setPoints] = useState(0);

  // Modal Dialogue State
  const [modalConfig, setModalConfig] = useState<{
    show: boolean;
    title: string;
    message: string;
    type: 'alert' | 'confirm' | 'success';
    onConfirm?: () => void;
  } | null>(null);

  const loadMembers = async () => {
    setLoading(true);
    const data = await getCustomers();
    const mapped: Member[] = data.map(m => ({
      id: m.id,
      name: m.name,
      phone: m.phone,
      points: m.points,
      createdAt: m.createdAt
    }));
    setMembers(mapped);
    setLoading(false);
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const handleOpenAdd = () => {
    setEditingMember(null);
    setName("");
    setPhone("");
    setPoints(0);
    setShowModal(true);
  };

  const handleOpenEdit = (member: Member) => {
    setEditingMember(member);
    setName(member.name);
    setPhone(member.phone || "");
    setPoints(member.points);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setModalConfig({
        show: true,
        title: "Kolom Kosong",
        message: "Nama lengkap member wajib diisi!",
        type: "alert"
      });
      return;
    }

    const payload = {
      id: editingMember?.id,
      name: name.trim(),
      phone: phone.trim() || undefined,
      points: points
    };

    const res = await saveCustomerAction(payload);

    if (res.success) {
      setShowModal(false);
      await loadMembers();
      
      setModalConfig({
        show: true,
        title: "Penyimpanan Berhasil",
        message: `Data member ${name} berhasil disimpan!`,
        type: "success"
      });
    } else {
      setModalConfig({
        show: true,
        title: "Gagal Menyimpan",
        message: res.error || "Gagal menyimpan data member ke database.",
        type: "alert"
      });
    }
  };

  const handleDelete = (member: Member) => {
    setModalConfig({
      show: true,
      title: "Konfirmasi Hapus Member",
      message: `Apakah Anda yakin ingin menghapus member "${member.name}" dari sistem? Poin yang sudah terkumpul akan hilang.`,
      type: "confirm",
      onConfirm: async () => {
        const res = await deleteCustomerAction(member.id);
        if (res.success) {
          await loadMembers();
          setModalConfig({
            show: true,
            title: "Berhasil Dihapus",
            message: "Data member telah dihapus permanen dari sistem.",
            type: "success"
          });
        } else {
          setModalConfig({
            show: true,
            title: "Gagal Menghapus",
            message: res.error || "Gagal menghapus data member dari database.",
            type: "alert"
          });
        }
      }
    });
  };

  // Filter members by name or phone number
  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (m.phone && m.phone.includes(searchQuery))
  );

  return (
    <div className="space-y-6 h-full flex flex-col overflow-hidden">
      {/* Title & Action Bar */}
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 font-sans">Kelola Member Pelanggan</h1>
          <p className="text-sm text-zinc-400">Daftar pelanggan setia minimarket yang mengumpulkan poin belanja.</p>
        </div>
        
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-primary hover:bg-primary/95 text-white py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-lg shadow-primary/20 cursor-pointer animate-in fade-in duration-200"
        >
          <Plus className="w-4 h-4" />
          Tambah Member Baru
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-4 shrink-0">
        <div className="relative flex-1 max-w-md">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-550">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#121214] border border-[#1f1f23] rounded-xl py-2.5 pl-10 pr-4 text-xs text-zinc-250 focus:outline-none focus:border-primary font-medium transition-colors"
            placeholder="Cari member berdasarkan nama atau nomor telepon..."
          />
        </div>
      </div>

      {/* Main Members Grid/Table Container */}
      <div className="flex-1 min-h-0 bg-[#121214] border border-[#1f1f23] rounded-2xl overflow-hidden flex flex-col">
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-zinc-400 text-xs font-medium">
            Memuat data member...
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 p-8">
            <Users className="w-10 h-10 text-zinc-650 mb-3" />
            <p className="text-xs font-medium">Tidak ada data member ditemukan.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-[#1f1f23] bg-[#121214] text-zinc-450 uppercase text-[10px] tracking-wider font-bold sticky top-0 z-10">
                  <th className="py-4 px-6 font-semibold">Nama Lengkap</th>
                  <th className="py-4 px-6 font-semibold">Nomor Telepon</th>
                  <th className="py-4 px-6 font-semibold text-center">Poin Terkumpul</th>
                  <th className="py-4 px-6 font-semibold">Tanggal Daftar</th>
                  <th className="py-4 px-6 font-semibold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f1f23] text-zinc-200">
                {filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-[#141416]/20 transition-colors">
                    <td className="py-4 px-6 text-xs font-bold text-zinc-150">
                      {member.name}
                    </td>
                    <td className="py-4 px-6 text-xs font-mono text-zinc-300">
                      {member.phone ? (
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-zinc-450" />
                          {member.phone}
                        </span>
                      ) : (
                        <span className="text-zinc-600 italic">Tidak ada</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-xs font-bold text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono">
                        <Award className="w-3 h-3" />
                        {member.points.toLocaleString("id-ID")}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs text-zinc-450">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(member.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric"
                        })}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(member)}
                          className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-450 hover:text-zinc-250 transition-colors cursor-pointer border border-transparent hover:border-zinc-700"
                          title="Edit Member"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(member)}
                          className="p-2 hover:bg-red-950/40 rounded-lg text-zinc-450 hover:text-red-400 transition-colors cursor-pointer border border-transparent hover:border-red-900/30"
                          title="Hapus Member"
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
                {editingMember ? "Edit Profil Member" : "Tambah Member Baru"}
              </h3>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                {editingMember ? "Sesuaikan detail akun keanggotaan pelanggan." : "Buat akun keanggotaan baru."}
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
                  placeholder="Misal: Budi Santoso"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-300 font-bold block mb-1">Nomor Telepon</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} // Only numbers allowed
                  className="w-full bg-[#18181b] border border-zinc-650 rounded-xl py-2 px-3 text-xs text-zinc-100 focus:outline-none focus:border-primary font-mono"
                  placeholder="Misal: 08123456789"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-300 font-bold block mb-1">Poin Keanggotaan</label>
                <input
                  type="number"
                  value={points}
                  onChange={(e) => setPoints(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-[#18181b] border border-zinc-650 rounded-xl py-2 px-3 text-xs text-zinc-100 focus:outline-none focus:border-primary font-semibold font-mono"
                  placeholder="0"
                  min="0"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-650 text-zinc-300 hover:text-zinc-100 text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-primary text-white hover:bg-primary/95 text-xs font-bold shadow-lg shadow-primary/20 cursor-pointer"
                >
                  Simpan
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Dialogue Alert/Confirm/Success Modal */}
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
