import { create } from 'zustand';
import { Product, Customer, TransactionItem, Shift } from '../data/mockData';
import { 
  getCurrentUserAction,
  getOpenShift, 
  openShiftAction, 
  closeShiftAction 
} from '../assets/js/actions';

export interface UserInfo {
  id: number;
  username: string;
  name: string;
  role: 'ADMIN' | 'CASHIER';
}

interface HeldCart {
  id: string;
  items: TransactionItem[];
  customer?: Customer;
  discount: number;
  heldAt: string;
}

interface CartState {
  // User Authentication
  currentUser: UserInfo | null;
  loginUser: (user: UserInfo) => void;
  logoutUser: () => void;

  // Cashier Shift
  activeShift: Shift | null;
  isLoadingShift: boolean;
  
  // Active Cart State
  items: TransactionItem[];
  activeCustomer: Customer | null;
  discount: number;
  paymentMethod: 'CASH' | 'QRIS' | 'CARD';
  amountReceived: number;
  
  // Held Carts (Hold & Resume)
  heldCarts: HeldCart[];

  // Cashier Name
  cashierName: string;

  // Actions
  syncShift: () => Promise<void>;
  startShift: (startingCash: number) => Promise<{ success: boolean; error?: string }>;
  endShift: (actualEndingCash: number) => Promise<{ success: boolean; shift?: any; error?: string }>;
  addItem: (product: any, quantity?: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  setDiscount: (discount: number) => void;
  selectCustomer: (customer: Customer | null) => void;
  setPaymentMethod: (method: 'CASH' | 'QRIS' | 'CARD') => void;
  setAmountReceived: (amount: number) => void;
  holdCart: () => void;
  resumeCart: (heldCartId: string) => void;
  deleteHeldCart: (heldCartId: string) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  currentUser: null,
  loginUser: (user) => {
    set({ currentUser: user, cashierName: user.name });
  },
  logoutUser: () => {
    set({ currentUser: null });
  },

  activeShift: null,
  isLoadingShift: true,
  items: [],
  activeCustomer: null,
  discount: 0,
  paymentMethod: 'CASH',
  amountReceived: 0,
  heldCarts: [],
  cashierName: 'Siti Aminah',

  syncShift: async () => {
    set({ isLoadingShift: true });
    try {
      const sessionUser = await getCurrentUserAction();
      if (sessionUser) set({ currentUser: sessionUser, cashierName: sessionUser.name });
      const openShift = sessionUser ? await getOpenShift() : null;
      if (openShift) {
        // Map database status to frontend Shift status
        const mappedShift: Shift = {
          id: openShift.id,
          cashierName: openShift.cashierName,
          startTime: openShift.startTime,
          startingCash: openShift.startingCash,
          expectedEndingCash: openShift.expectedEndingCash,
          status: 'OPEN'
        };
        set({ activeShift: mappedShift });
      } else {
        set({ activeShift: null });
      }
    } catch (error) {
      console.error("Error syncing shift:", error);
    } finally {
      set({ isLoadingShift: false });
    }
  },

  startShift: async (startingCash) => {
    const cashierName = get().cashierName;
    const res = await openShiftAction(startingCash, cashierName);
    
    if (res.success && res.shift) {
      const mappedShift: Shift = {
        id: res.shift.id,
        cashierName: res.shift.cashierName,
        startTime: res.shift.startTime,
        startingCash: res.shift.startingCash,
        expectedEndingCash: res.shift.expectedEndingCash,
        status: 'OPEN'
      };
      set({ activeShift: mappedShift });
      return { success: true };
    } else {
      return { success: false, error: res.error };
    }
  },

  endShift: async (actualEndingCash) => {
    const shift = get().activeShift;
    if (!shift) return { success: false, error: "Tidak ada shift kasir yang aktif." };
    
    const res = await closeShiftAction(shift.id, actualEndingCash);
    
    if (res.success && res.shift) {
      set({ activeShift: null });
      return { success: true, shift: res.shift };
    } else if (res.error === "Shift tidak ditemukan.") {
      // If the shift was deleted from the database, force-clear the local active shift to unblock the cashier
      set({ activeShift: null });
      return { 
        success: true, 
        shift: { 
          id: shift.id, 
          cashierName: shift.cashierName,
          startTime: shift.startTime,
          startingCash: shift.startingCash, 
          expectedEndingCash: shift.expectedEndingCash, 
          actualEndingCash, 
          discrepancy: 0,
          status: 'CLOSED'
        } 
      };
    } else {
      return { success: false, error: res.error };
    }
  },

  addItem: (product, quantity = 1) => {
    const currentItems = get().items;
    const existingIndex = currentItems.findIndex(item => item.productId === product.id);
    const discPercent = product.discountPercent ?? 0;
    const discountedPrice = Math.round(product.sellPrice * (1 - discPercent / 100));

    if (existingIndex > -1) {
      const updatedItems = [...currentItems];
      const newQty = updatedItems[existingIndex].quantity + quantity;
      
      // Validasi Stok
      if (newQty > product.stock) {
        alert(`Peringatan: Stok tidak mencukupi. Stok saat ini: ${product.stock}`);
        return;
      }
      
      updatedItems[existingIndex].quantity = newQty;
      updatedItems[existingIndex].subtotal = newQty * discountedPrice;
      
      set({ items: updatedItems });
    } else {
      // Validasi Stok Awal
      if (quantity > product.stock) {
        alert(`Peringatan: Stok tidak mencukupi. Stok saat ini: ${product.stock}`);
        return;
      }
      
      const newItem: TransactionItem = {
        productId: product.id,
        productName: product.name,
        quantity,
        buyPrice: product.buyPrice,
        sellPrice: product.sellPrice,
        discountPercent: discPercent,
        subtotal: quantity * discountedPrice
      };
      
      set({ items: [...currentItems, newItem] });
    }
    
    get().setAmountReceived(0); // reset amount received
  },

  removeItem: (productId) => {
    set({ items: get().items.filter(item => item.productId !== productId) });
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    
    const updatedItems = get().items.map(item => {
      if (item.productId === productId) {
        const itemDisc = item.discountPercent ?? 0;
        const discPrice = Math.round(item.sellPrice * (1 - itemDisc / 100));
        return {
          ...item,
          quantity,
          subtotal: quantity * discPrice
        };
      }
      return item;
    });
    
    set({ items: updatedItems });
  },

  setDiscount: (discount) => set({ discount }),

  selectCustomer: (customer) => set({ activeCustomer: customer }),

  setPaymentMethod: (paymentMethod) => set({ 
    paymentMethod,
    amountReceived: paymentMethod !== 'CASH' ? 0 : get().amountReceived 
  }),

  setAmountReceived: (amountReceived) => set({ amountReceived }),

  holdCart: () => {
    const { items, activeCustomer, discount, heldCarts } = get();
    if (items.length === 0) return;

    const newHeldCart: HeldCart = {
      id: Math.random().toString(36).substring(2, 9),
      items,
      customer: activeCustomer || undefined,
      discount,
      heldAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    };

    set({
      heldCarts: [...heldCarts, newHeldCart],
      items: [],
      activeCustomer: null,
      discount: 0,
      amountReceived: 0
    });
  },

  resumeCart: (heldCartId) => {
    const { heldCarts } = get();
    const targetCart = heldCarts.find(c => c.id === heldCartId);
    if (!targetCart) return;

    // Save current active cart if not empty
    const currentItems = get().items;
    if (currentItems.length > 0) {
      get().holdCart();
    }

    set({
      items: targetCart.items,
      activeCustomer: targetCart.customer || null,
      discount: targetCart.discount,
      heldCarts: heldCarts.filter(c => c.id !== heldCartId),
      amountReceived: 0
    });
  },

  deleteHeldCart: (heldCartId) => {
    set({
      heldCarts: get().heldCarts.filter(c => c.id !== heldCartId)
    });
  },

  clearCart: () => set({
    items: [],
    activeCustomer: null,
    discount: 0,
    amountReceived: 0,
    paymentMethod: 'CASH'
  })
}));
