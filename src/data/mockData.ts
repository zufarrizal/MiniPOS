export interface Category {
  id: number;
  name: string;
  description: string;
}

export interface Product {
  id: number;
  barcode: string;
  name: string;
  categoryId: number;
  buyPrice: number;
  sellPrice: number;
  stock: number;
  minStock: number;
  unit: string;
  isActive: boolean;
  discountPercent?: number;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  points: number;
}

export interface TransactionItem {
  productId: number;
  productName: string;
  quantity: number;
  buyPrice: number;
  sellPrice: number;
  subtotal: number;
  discountPercent?: number;
}

export interface Transaction {
  id: number;
  invoiceNumber: string;
  cashierName: string;
  customerName?: string;
  items: TransactionItem[];
  totalRaw: number;
  discount: number;
  totalPaid: number;
  paymentMethod: 'CASH' | 'QRIS' | 'CARD';
  amountReceived: number;
  changeAmount: number;
  tax?: number;
  taxRate?: number;
  pointsRedeemed?: number;
  pointsEarned?: number;
  createdAt: string;
}

export interface Shift {
  id: number;
  cashierName: string;
  startTime: string;
  endTime?: string;
  startingCash: number;
  expectedEndingCash: number;
  actualEndingCash?: number;
  discrepancy?: number;
  status: 'OPEN' | 'CLOSED';
}

// Data Kategoris
export const MOCK_CATEGORIES: Category[] = [
  { id: 1, name: 'Makanan Ringan', description: 'Camilan, biskuit, keripik, dll' },
  { id: 2, name: 'Minuman', description: 'Air mineral, bersoda, teh, kopi kemasan' },
  { id: 3, name: 'Kebutuhan Harian', description: 'Sabun, pasta gigi, detergen, shampoo' },
  { id: 4, name: 'Mi Instan & Sembako', description: 'Mie instan, minyak goreng, gula, garam' },
  { id: 5, name: 'Obat-obatan', description: 'Obat bebas, vitamin, plester' }
];

// Data Produk Awal
export const MOCK_PRODUCTS: Product[] = [
  {
    id: 1,
    barcode: '8998866200225',
    name: 'Indomie Goreng Spesial Pcs',
    categoryId: 4,
    buyPrice: 2700,
    sellPrice: 3200,
    stock: 120,
    minStock: 20,
    unit: 'Pcs',
    isActive: true
  },
  {
    id: 2,
    barcode: '8886008101037',
    name: 'Aqua Air Mineral Botol 600ml',
    categoryId: 2,
    buyPrice: 2200,
    sellPrice: 3500,
    stock: 85,
    minStock: 15,
    unit: 'Botol',
    isActive: true
  },
  {
    id: 3,
    barcode: '8992761011116',
    name: 'Coca Cola 390ml Botol',
    categoryId: 2,
    buyPrice: 4200,
    sellPrice: 5500,
    stock: 45,
    minStock: 10,
    unit: 'Botol',
    isActive: true
  },
  {
    id: 4,
    barcode: '8992696404410',
    name: 'Chitato Sapi Panggang 68g',
    categoryId: 1,
    buyPrice: 9500,
    sellPrice: 11500,
    stock: 8, // Stok rendah untuk simulasi warning
    minStock: 10,
    unit: 'Pcs',
    isActive: true
  },
  {
    id: 5,
    barcode: '8996001300067',
    name: 'Teh Botol Sosro Kotak 250ml',
    categoryId: 2,
    buyPrice: 2500,
    sellPrice: 3300,
    stock: 60,
    minStock: 15,
    unit: 'Kotak',
    isActive: true
  },
  {
    id: 6,
    barcode: '8999999052026',
    name: 'Pepsodent Pasta Gigi Action 120 190g',
    categoryId: 3,
    buyPrice: 14500,
    sellPrice: 17800,
    stock: 35,
    minStock: 8,
    unit: 'Pcs',
    isActive: true
  },
  {
    id: 7,
    barcode: '8999999056277',
    name: 'Lifebuoy Sabun Cair Total 10 400ml Refill',
    categoryId: 3,
    buyPrice: 22000,
    sellPrice: 26500,
    stock: 4, // Stok rendah untuk simulasi warning
    minStock: 5,
    unit: 'Pouch',
    isActive: true
  },
  {
    id: 8,
    barcode: '8991001101831',
    name: 'Silverqueen Chocolate Almond 62g',
    categoryId: 1,
    buyPrice: 12500,
    sellPrice: 15500,
    stock: 22,
    minStock: 5,
    unit: 'Pcs',
    isActive: true
  },
  {
    id: 9,
    barcode: '8996001303129',
    name: 'Permen Kopiko Sak 150g',
    categoryId: 1,
    buyPrice: 6200,
    sellPrice: 8000,
    stock: 40,
    minStock: 10,
    unit: 'Pcs',
    isActive: true
  },
  {
    id: 10,
    barcode: '8992760136018',
    name: 'Oreo Vanilla 119.6g',
    categoryId: 1,
    buyPrice: 7500,
    sellPrice: 9500,
    stock: 18,
    minStock: 8,
    unit: 'Pcs',
    isActive: true
  }
];

// Data Pelanggan Awal
export const MOCK_CUSTOMERS: Customer[] = [
  { id: 1, name: 'Budi Santoso', phone: '081234567890', points: 150 },
  { id: 2, name: 'Siti Rahma', phone: '085777888999', points: 420 },
  { id: 3, name: 'Joko Widodo', phone: '081122334455', points: 80 },
  { id: 4, name: 'Dewi Lestari', phone: '089988776655', points: 950 }
];

// Data Riwayat Transaksi Hari Ini (Mock)
export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 1,
    invoiceNumber: 'INV-20260712-0001',
    cashierName: 'Ahmad Basuki',
    customerName: 'Budi Santoso',
    items: [
      { productId: 1, productName: 'Indomie Goreng Spesial Pcs', quantity: 5, buyPrice: 2700, sellPrice: 3200, subtotal: 16000 },
      { productId: 2, productName: 'Aqua Air Mineral Botol 600ml', quantity: 2, buyPrice: 2200, sellPrice: 3500, subtotal: 7000 }
    ],
    totalRaw: 23000,
    discount: 1000,
    totalPaid: 22000,
    paymentMethod: 'CASH',
    amountReceived: 50000,
    changeAmount: 28000,
    createdAt: '2026-07-12T08:15:30+07:00'
  },
  {
    id: 2,
    invoiceNumber: 'INV-20260712-0002',
    cashierName: 'Ahmad Basuki',
    items: [
      { productId: 6, productName: 'Pepsodent Pasta Gigi Action 120 190g', quantity: 1, buyPrice: 14500, sellPrice: 17800, subtotal: 17800 },
      { productId: 8, productName: 'Silverqueen Chocolate Almond 62g', quantity: 2, buyPrice: 12500, sellPrice: 15500, subtotal: 31000 }
    ],
    totalRaw: 48800,
    discount: 0,
    totalPaid: 48800,
    paymentMethod: 'QRIS',
    amountReceived: 48800,
    changeAmount: 0,
    createdAt: '2026-07-12T09:42:15+07:00'
  },
  {
    id: 3,
    invoiceNumber: 'INV-20260712-0003',
    cashierName: 'Siti Aminah',
    customerName: 'Siti Rahma',
    items: [
      { productId: 10, productName: 'Oreo Vanilla 119.6g', quantity: 3, buyPrice: 7500, sellPrice: 9500, subtotal: 28500 },
      { productId: 5, productName: 'Teh Botol Sosro Kotak 250ml', quantity: 4, buyPrice: 2500, sellPrice: 3300, subtotal: 13200 },
      { productId: 3, productName: 'Coca Cola 390ml Botol', quantity: 1, buyPrice: 4200, sellPrice: 5500, subtotal: 5500 }
    ],
    totalRaw: 47200,
    discount: 2200,
    totalPaid: 45000,
    paymentMethod: 'CARD',
    amountReceived: 45000,
    changeAmount: 0,
    createdAt: '2026-07-12T11:05:00+07:00'
  }
];

// Data Riwayat Shift Kasir
export const MOCK_SHIFTS: Shift[] = [
  {
    id: 1,
    cashierName: 'Ahmad Basuki',
    startTime: '2026-07-12T07:00:00+07:00',
    endTime: '2026-07-12T14:00:00+07:00',
    startingCash: 200000,
    expectedEndingCash: 271800, // Uang Tunai + Modal
    actualEndingCash: 271800,
    discrepancy: 0,
    status: 'CLOSED'
  },
  {
    id: 2,
    cashierName: 'Siti Aminah',
    startTime: '2026-07-12T14:00:00+07:00',
    startingCash: 200000,
    expectedEndingCash: 245000, // Menunggu transaksi
    status: 'OPEN'
  }
];

// Data Grafik Penjualan (7 Hari Terakhir)
export const MOCK_WEEKLY_SALES = [
  { day: 'Senin', sales: 1250000, profit: 310000 },
  { day: 'Selasa', sales: 1420000, profit: 360000 },
  { day: 'Rabu', sales: 1180000, profit: 290000 },
  { day: 'Kamis', sales: 1650000, profit: 410000 },
  { day: 'Jumat', sales: 1980000, profit: 520000 },
  { day: 'Sabtu', sales: 2450000, profit: 640000 },
  { day: 'Minggu', sales: 2100000, profit: 540000 }
];
