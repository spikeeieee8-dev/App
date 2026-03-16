import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { api } from "@/services/api";

export type ProductVariant = {
  id?: string;
  size: string;
  color: string;
  stock: number;
  reservedStock?: number;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  category: "men" | "women";
  subcategory: string;
  originalPrice: number;
  discountedPrice: number;
  costPrice: number;
  images: string[];
  variants: ProductVariant[];
  tags: string[];
  isNew?: boolean;
  isFeatured?: boolean;
  urgencyText?: string;
  viewingCount?: number;
};

export type CartItem = {
  product: Product;
  size: string;
  color: string;
  quantity: number;
  variantId?: string;
};

export type OrderStatus =
  | "pending"
  | "awaiting_verification"
  | "verified"
  | "dispatched"
  | "delivered"
  | "cancelled";

export type Order = {
  id: string;
  items: CartItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
  status: OrderStatus;
  paymentMethod: "easypaid" | "jazzcash" | "cod";
  paymentProofUri?: string;
  address: {
    name: string;
    phone: string;
    address: string;
    city: string;
    province: string;
  };
  courierTrackingId?: string;
  courierName?: string;
  createdAt: string;
  updatedAt: string;
};

type AppContextType = {
  cart: CartItem[];
  wishlist: string[];
  orders: Order[];
  products: Product[];
  productsLoading: boolean;
  isDarkMode: boolean;
  hasSeenWelcome: boolean;
  addToCart: (product: Product, size: string, color: string, qty?: number) => void;
  removeFromCart: (productId: string, size: string, color: string) => void;
  updateCartQty: (productId: string, size: string, color: string, qty: number) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  placeOrder: (order: Omit<Order, "id" | "createdAt" | "updatedAt">) => Promise<Order>;
  refreshOrders: () => Promise<void>;
  refreshProducts: () => Promise<void>;
  setDarkMode: (v: boolean) => void;
  setHasSeenWelcome: (v: boolean) => void;
  cartCount: number;
  cartTotal: number;
};

const AppContext = createContext<AppContextType | null>(null);

async function isAuthenticated(): Promise<boolean> {
  const token = await AsyncStorage.getItem("auth_token");
  return !!token;
}

async function tryReserve(variantId: string | undefined, quantity: number) {
  if (!variantId) return;
  if (!(await isAuthenticated())) return;
  try {
    await api.cart.reserve(variantId, quantity);
  } catch {}
}

async function tryRelease(variantId: string | undefined, quantity: number) {
  if (!variantId) return;
  if (!(await isAuthenticated())) return;
  try {
    await api.cart.release(variantId, quantity);
  } catch {}
}

const SAMPLE_PRODUCTS: Product[] = [
  {
    id: "p001",
    name: "Premium Merino Polo",
    description:
      "Crafted from finest Merino wool, this polo embodies understated luxury. Perfect for formal and casual occasions.",
    category: "men",
    subcategory: "Polos",
    originalPrice: 8500,
    discountedPrice: 5999,
    costPrice: 3200,
    images: [],
    variants: [
      { size: "S", color: "Midnight Black", stock: 8 },
      { size: "M", color: "Midnight Black", stock: 12 },
      { size: "L", color: "Midnight Black", stock: 3 },
      { size: "XL", color: "Midnight Black", stock: 5 },
      { size: "S", color: "Ivory White", stock: 6 },
      { size: "M", color: "Ivory White", stock: 10 },
    ],
    tags: ["polo", "formal", "merino"],
    isNew: true,
    isFeatured: true,
    urgencyText: "Only 3 left in black",
    viewingCount: 12,
  },
  {
    id: "p002",
    name: "Signature Oversized Tee",
    description:
      "The ultimate relaxed silhouette. 100% Egyptian cotton, garment-washed for a lived-in feel.",
    category: "men",
    subcategory: "Tees",
    originalPrice: 4500,
    discountedPrice: 2999,
    costPrice: 1400,
    images: [],
    variants: [
      { size: "S", color: "Sand", stock: 15 },
      { size: "M", color: "Sand", stock: 20 },
      { size: "L", color: "Sand", stock: 8 },
      { size: "XL", color: "Charcoal", stock: 10 },
      { size: "XXL", color: "Charcoal", stock: 4 },
    ],
    tags: ["tee", "casual", "oversized"],
    isFeatured: true,
    viewingCount: 28,
  },
  {
    id: "p003",
    name: "Luxe Hoodie",
    description:
      "French terry cotton blend with brushed interior. Heavyweight comfort meets refined streetwear.",
    category: "men",
    subcategory: "Hoodies/Sweatshirts",
    originalPrice: 12000,
    discountedPrice: 8500,
    costPrice: 4800,
    images: [],
    variants: [
      { size: "S", color: "Slate Gray", stock: 5 },
      { size: "M", color: "Slate Gray", stock: 9 },
      { size: "L", color: "Slate Gray", stock: 7 },
      { size: "M", color: "Jet Black", stock: 11 },
      { size: "L", color: "Jet Black", stock: 6 },
      { size: "XL", color: "Jet Black", stock: 3 },
    ],
    tags: ["hoodie", "casual", "luxury"],
    isNew: true,
    urgencyText: "15 people viewing now",
    viewingCount: 15,
  },
  {
    id: "p004",
    name: "Satin Wrap Midi Dress",
    description:
      "Fluid satin wrap design that gracefully follows the body. Effortlessly elegant for any occasion.",
    category: "women",
    subcategory: "Clothing",
    originalPrice: 14500,
    discountedPrice: 9999,
    costPrice: 5200,
    images: [],
    variants: [
      { size: "S", color: "Blush Rose", stock: 4 },
      { size: "M", color: "Blush Rose", stock: 7 },
      { size: "L", color: "Blush Rose", stock: 3 },
      { size: "S", color: "Deep Burgundy", stock: 5 },
      { size: "M", color: "Deep Burgundy", stock: 6 },
    ],
    tags: ["dress", "formal", "satin"],
    isFeatured: true,
    urgencyText: "Only 4 left in Blush Rose",
    viewingCount: 22,
  },
  {
    id: "p005",
    name: "Heritage Leather Belt",
    description:
      "Full-grain leather belt with brushed gold buckle. A timeless accessory that elevates every outfit.",
    category: "men",
    subcategory: "Accessories",
    originalPrice: 5500,
    discountedPrice: 3800,
    costPrice: 1900,
    images: [],
    variants: [
      { size: "S", color: "Cognac Brown", stock: 10 },
      { size: "M", color: "Cognac Brown", stock: 15 },
      { size: "L", color: "Cognac Brown", stock: 8 },
      { size: "M", color: "Jet Black", stock: 12 },
    ],
    tags: ["belt", "accessories", "leather"],
  },
  {
    id: "p006",
    name: "Cashmere Blend Scarf",
    description:
      "Ultra-soft cashmere blend in versatile neutral tones. The ultimate winter luxury accessory.",
    category: "women",
    subcategory: "Accessories",
    originalPrice: 8000,
    discountedPrice: 5500,
    costPrice: 2800,
    images: [],
    variants: [
      { size: "One Size", color: "Camel", stock: 8 },
      { size: "One Size", color: "Ivory", stock: 6 },
      { size: "One Size", color: "Charcoal", stock: 9 },
    ],
    tags: ["scarf", "accessories", "cashmere"],
    isNew: true,
  },
  {
    id: "p007",
    name: "Slim Fit Formal Shirt",
    description:
      "Poplin cotton with precise tailoring. The boardroom staple reinvented for modern elegance.",
    category: "men",
    subcategory: "Clothing",
    originalPrice: 6500,
    discountedPrice: 4499,
    costPrice: 2200,
    images: [],
    variants: [
      { size: "S", color: "Crisp White", stock: 20 },
      { size: "M", color: "Crisp White", stock: 18 },
      { size: "L", color: "Crisp White", stock: 12 },
      { size: "XL", color: "Crisp White", stock: 8 },
      { size: "M", color: "Powder Blue", stock: 10 },
      { size: "L", color: "Powder Blue", stock: 7 },
    ],
    tags: ["shirt", "formal", "cotton"],
    isFeatured: true,
  },
  {
    id: "p008",
    name: "Silk Blouse",
    description:
      "Pure mulberry silk with a delicate drape. A wardrobe essential that transitions from desk to dinner.",
    category: "women",
    subcategory: "Clothing",
    originalPrice: 11000,
    discountedPrice: 7500,
    costPrice: 3800,
    images: [],
    variants: [
      { size: "XS", color: "Pearl White", stock: 5 },
      { size: "S", color: "Pearl White", stock: 8 },
      { size: "M", color: "Pearl White", stock: 10 },
      { size: "S", color: "Champagne Gold", stock: 4 },
      { size: "M", color: "Champagne Gold", stock: 6 },
    ],
    tags: ["blouse", "silk", "formal"],
    isNew: true,
    isFeatured: true,
    urgencyText: "7 people viewing now",
    viewingCount: 7,
  },
];

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>(SAMPLE_PRODUCTS);
  const [productsLoading, setProductsLoading] = useState(false);
  const [isDarkMode, setIsDarkModeState] = useState(false);
  const [hasSeenWelcome, setHasSeenWelcomeState] = useState(false);
  const fetchedRef = useRef(false);

  function apiOrderToLocal(apiOrder: any): Order {
    const items: CartItem[] = (apiOrder.items ?? []).map((item: any) => ({
      product: {
        id: item.productId ?? "",
        name: item.productName ?? "Unknown",
        description: "",
        category: "men" as const,
        subcategory: "",
        originalPrice: item.price ?? 0,
        discountedPrice: item.price ?? 0,
        costPrice: 0,
        images: [],
        variants: [],
        tags: [],
      },
      size: item.size ?? "",
      color: item.color ?? "",
      quantity: item.quantity ?? 1,
      variantId: item.variantId ?? undefined,
    }));
    return {
      id: apiOrder.id,
      items,
      subtotal: apiOrder.subtotal ?? 0,
      shippingCost: apiOrder.shippingCost ?? 0,
      total: apiOrder.total ?? 0,
      status: apiOrder.status as OrderStatus,
      paymentMethod: apiOrder.paymentMethod as Order["paymentMethod"],
      paymentProofUri: apiOrder.paymentProofUri,
      address: apiOrder.address ?? { name: "", phone: "", address: "", city: "", province: "" },
      courierTrackingId: apiOrder.courierTrackingId,
      courierName: apiOrder.courierName,
      createdAt: apiOrder.createdAt ?? new Date().toISOString(),
      updatedAt: apiOrder.updatedAt ?? new Date().toISOString(),
    };
  }

  const refreshOrders = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("auth_token");
      if (!token) return;
      const { orders: apiOrders } = await api.orders.list();
      const localOrders = (apiOrders ?? []).map(apiOrderToLocal);
      setOrders(localOrders);
    } catch {}
  }, []);

  const refreshProducts = useCallback(async () => {
    try {
      const { products: apiProducts } = await api.products.list({ active: true });
      if (apiProducts) setProducts(apiProducts as Product[]);
    } catch {}
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const [c, w, d, welcome] = await Promise.all([
          AsyncStorage.getItem("cart"),
          AsyncStorage.getItem("wishlist"),
          AsyncStorage.getItem("darkMode"),
          AsyncStorage.getItem("welcomeTs"),
        ]);
        if (c) setCart(JSON.parse(c));
        if (w) setWishlist(JSON.parse(w));
        if (d) setIsDarkModeState(JSON.parse(d));
        if (welcome) {
          const ts = parseInt(welcome);
          if (Date.now() - ts < 2 * 60 * 60 * 1000) {
            setHasSeenWelcomeState(true);
          }
        }
      } catch {}

      if (!fetchedRef.current) {
        fetchedRef.current = true;
        setProductsLoading(true);
        try {
          const { products: apiProducts } = await api.products.list({ active: true });
          if (apiProducts && apiProducts.length > 0) {
            setProducts(apiProducts as Product[]);
          }
        } catch {
        } finally {
          setProductsLoading(false);
        }
        await refreshOrders();
      }
    };
    load();
  }, [refreshOrders]);

  const addToCart = useCallback(
    (product: Product, size: string, color: string, qty = 1) => {
      const matchedVariant = product.variants.find(
        (v) => v.size === size && v.color === color
      );
      const variantId = matchedVariant?.id;

      setCart((prev) => {
        const existing = prev.find(
          (i) => i.product.id === product.id && i.size === size && i.color === color
        );
        let updated: CartItem[];
        if (existing) {
          updated = prev.map((i) =>
            i.product.id === product.id && i.size === size && i.color === color
              ? { ...i, quantity: i.quantity + qty }
              : i
          );
        } else {
          updated = [...prev, { product, size, color, quantity: qty, variantId }];
        }
        AsyncStorage.setItem("cart", JSON.stringify(updated));
        return updated;
      });

      tryReserve(variantId, qty);
    },
    []
  );

  const removeFromCart = useCallback((productId: string, size: string, color: string) => {
    setCart((prev) => {
      const item = prev.find(
        (i) => i.product.id === productId && i.size === size && i.color === color
      );
      const updated = prev.filter(
        (i) => !(i.product.id === productId && i.size === size && i.color === color)
      );
      AsyncStorage.setItem("cart", JSON.stringify(updated));
      if (item) tryRelease(item.variantId, item.quantity);
      return updated;
    });
  }, []);

  const updateCartQty = useCallback(
    (productId: string, size: string, color: string, qty: number) => {
      setCart((prev) => {
        const existing = prev.find(
          (i) => i.product.id === productId && i.size === size && i.color === color
        );

        let updated: CartItem[];
        if (qty <= 0) {
          updated = prev.filter(
            (i) => !(i.product.id === productId && i.size === size && i.color === color)
          );
          if (existing) tryRelease(existing.variantId, existing.quantity);
        } else {
          updated = prev.map((i) =>
            i.product.id === productId && i.size === size && i.color === color
              ? { ...i, quantity: qty }
              : i
          );
          if (existing) {
            const delta = qty - existing.quantity;
            if (delta > 0) tryReserve(existing.variantId, delta);
            else if (delta < 0) tryRelease(existing.variantId, Math.abs(delta));
          }
        }
        AsyncStorage.setItem("cart", JSON.stringify(updated));
        return updated;
      });
    },
    []
  );

  const clearCart = useCallback(() => {
    setCart((prev) => {
      const variantIds = prev
        .filter((i) => i.variantId)
        .map((i) => i.variantId as string);
      if (variantIds.length > 0) {
        isAuthenticated().then((authed) => {
          if (authed) api.cart.releaseAll(variantIds).catch(() => {});
        });
      }
      return [];
    });
    AsyncStorage.removeItem("cart");
  }, []);

  const toggleWishlist = useCallback((productId: string) => {
    setWishlist((prev) => {
      const updated = prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId];
      AsyncStorage.setItem("wishlist", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const placeOrder = useCallback(
    async (orderData: Omit<Order, "id" | "createdAt" | "updatedAt">): Promise<Order> => {
      const backendItems = orderData.items.map((item) => ({
        productId: item.product.id,
        variantId: item.variantId,
        productName: item.product.name,
        productPrice: item.product.discountedPrice,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
      }));

      const response = await api.orders.create({
        items: backendItems,
        subtotal: orderData.subtotal,
        shippingCost: orderData.shippingCost,
        total: orderData.total,
        paymentMethod: orderData.paymentMethod,
        paymentProofUri: orderData.paymentProofUri,
        address: orderData.address,
      });

      const order: Order = {
        ...orderData,
        id: response.order.id,
        createdAt: response.order.createdAt,
        updatedAt: response.order.updatedAt,
      };
      setOrders((prev) => [order, ...prev]);
      refreshOrders().catch(() => {});
      return order;
    },
    [refreshOrders]
  );

  const setDarkMode = useCallback((v: boolean) => {
    setIsDarkModeState(v);
    AsyncStorage.setItem("darkMode", JSON.stringify(v));
  }, []);

  const setHasSeenWelcome = useCallback((v: boolean) => {
    setHasSeenWelcomeState(v);
    if (v) AsyncStorage.setItem("welcomeTs", Date.now().toString());
  }, []);

  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const cartTotal = cart.reduce((sum, i) => sum + i.product.discountedPrice * i.quantity, 0);

  return (
    <AppContext.Provider
      value={{
        cart,
        wishlist,
        orders,
        products,
        productsLoading,
        isDarkMode,
        hasSeenWelcome,
        addToCart,
        removeFromCart,
        updateCartQty,
        clearCart,
        toggleWishlist,
        placeOrder,
        refreshOrders,
        refreshProducts,
        setDarkMode,
        setHasSeenWelcome,
        cartCount,
        cartTotal,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
