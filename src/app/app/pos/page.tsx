"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Printer, Save, Trash2, Plus, ScanLine, Receipt, Clock3, ImageIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getStoreByOwnerId } from "@/lib/services/stores";
import { getProductsByStoreId } from "@/lib/services/products";
import { createOfflineOrder, getOrdersByStoreId } from "@/lib/services/orders";
import { resolveVariantPricing } from "@/lib/variantPricing";
import { Loader } from "@/components/ui/Loader";
import type { Product } from "@/types/product";
import type { SelectedVariant, Order } from "@/types/order";

const fallbackImage = "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80";

type CartItem = {
  key: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  selectedVariants: SelectedVariant[];
};

type SavedBill = {
  id: string;
  receiptNumber: string;
  customerName: string;
  phone?: string;
  notes?: string;
  subtotal: number;
  discountAmount: number;
  total: number;
  createdAt: string;
  items: CartItem[];
  cashReceived: number;
  changeAmount: number;
  synced?: boolean;
};

function makeKey(productId: string, selectedVariants: SelectedVariant[]) {
  return `${productId}__${selectedVariants.map((item) => `${item.name}:${item.value}`).join("|")}`;
}

function currency(value: number) {
  return `Rs ${value.toLocaleString()}`;
}

function todayString(value: string) {
  return new Intl.DateTimeFormat("en-PK", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function normalizeCartItem(item: Partial<CartItem> & { productId?: string; name?: string; price?: number; quantity?: number }) {
  const selectedVariants = Array.isArray(item.selectedVariants)
    ? item.selectedVariants
        .map((variant) => ({
          name: String(variant?.name || "").trim(),
          value: String(variant?.value || "").trim(),
        }))
        .filter((variant) => variant.name && variant.value)
    : [];

  const productId = String(item.productId || "");
  return {
    key: item.key || makeKey(productId || `local-${Date.now()}`, selectedVariants),
    productId,
    name: String(item.name || "Item"),
    price: Number(item.price || 0),
    quantity: Math.max(1, Number(item.quantity || 1)),
    imageUrl: String(item.imageUrl || ""),
    selectedVariants,
  };
}

function normalizeSavedBill(raw: Partial<SavedBill> & { items?: CartItem[] }) {
  const items = Array.isArray(raw.items) ? raw.items.map(normalizeCartItem) : [];
  return {
    id: String(raw.id || `local-${Date.now()}`),
    receiptNumber: String(raw.receiptNumber || `LOCAL-${Date.now()}`),
    customerName: String(raw.customerName || "Walk-in Customer"),
    phone: String(raw.phone || ""),
    notes: String(raw.notes || ""),
    subtotal: Number(raw.subtotal || items.reduce((sum, item) => sum + item.price * item.quantity, 0)),
    discountAmount: Number(raw.discountAmount || 0),
    total: Number(raw.total || items.reduce((sum, item) => sum + item.price * item.quantity, 0)),
    createdAt: String(raw.createdAt || new Date().toISOString()),
    items,
    cashReceived: Number(raw.cashReceived || 0),
    changeAmount: Number(raw.changeAmount || 0),
    synced: Boolean(raw.synced),
  };
}

function mapOrderToSavedBill(order: Order): SavedBill {
  const items = order.items.map((item) =>
    normalizeCartItem({
      key: makeKey(item.productId, item.selectedVariants || []),
      productId: item.productId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      imageUrl: item.imageUrl || "",
      selectedVariants: item.selectedVariants || [],
    }),
  );

  return {
    id: order.id,
    receiptNumber: order.receiptNumber,
    customerName: order.customerName || "Walk-in Customer",
    phone: order.phone || "",
    notes: order.notes || "",
    subtotal: order.subtotal,
    discountAmount: order.discountAmount,
    total: order.total,
    createdAt: order.createdAt,
    items,
    cashReceived: order.cashReceived || 0,
    changeAmount: order.changeAmount || 0,
    synced: true,
  };
}

function mergeBills(localBills: SavedBill[], syncedBills: SavedBill[]) {
  const merged = new Map<string, SavedBill>();

  [...syncedBills, ...localBills].forEach((bill) => {
    const normalized = normalizeSavedBill(bill);
    const key = normalized.receiptNumber || normalized.id;
    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, normalized);
      return;
    }

    merged.set(key, {
      ...existing,
      ...normalized,
      synced: existing.synced || normalized.synced,
      items: normalized.items.length ? normalized.items : existing.items,
    });
  });

  return Array.from(merged.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function openPrintWindow(
  storeName: string,
  order: {
    receiptNumber: string;
    items: CartItem[];
    customerName: string;
    total: number;
    subtotal: number;
    discountAmount: number;
    cashReceived: number;
    changeAmount: number;
    createdAt: string;
    notes?: string;
  },
) {
  const rows = order.items
    .map(
      (item) => `
    <tr>
      <td>${item.name}${
        item.selectedVariants.length
          ? `<div style="font-size:11px;color:#555">${item.selectedVariants.map((v) => `${v.name}: ${v.value}`).join(" • ")}</div>`
          : ""
      }</td>
      <td style="text-align:center">${item.quantity}</td>
      <td style="text-align:right">${currency(item.price)}</td>
      <td style="text-align:right">${currency(item.price * item.quantity)}</td>
    </tr>
  `,
    )
    .join("");

  const win = window.open("", "_blank", "width=420,height=760");
  if (!win) return;
  win.document.write(`<!doctype html><html><head><title>${order.receiptNumber}</title>
    <style>
      body{font-family:Arial,sans-serif;padding:18px;color:#111;font-size:13px}
      h1,h2,p{margin:0}
      .center{text-align:center}
      .muted{color:#555;font-size:12px}
      .line{border-top:1px dashed #999;margin:12px 0}
      table{width:100%;border-collapse:collapse}
      td,th{padding:6px 0;vertical-align:top}
      th{font-size:11px;text-transform:uppercase;color:#666}
      .total{font-size:18px;font-weight:700}
      @media print{body{padding:8px}}
    </style></head><body>
      <div class="center">
        <h2>${storeName}</h2>
        <p class="muted">Thermal POS Receipt</p>
        <p class="muted">Receipt #: ${order.receiptNumber}</p>
        <p class="muted">${todayString(order.createdAt)}</p>
      </div>
      <div class="line"></div>
      <p><strong>Customer:</strong> ${order.customerName || "Walk-in Customer"}</p>
      <div class="line"></div>
      <table>
        <thead><tr><th style="text-align:left">Item</th><th>Qty</th><th style="text-align:right">Price</th><th style="text-align:right">Total</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="line"></div>
      <table>
        <tr><td>Subtotal</td><td style="text-align:right">${currency(order.subtotal)}</td></tr>
        <tr><td>Discount</td><td style="text-align:right">- ${currency(order.discountAmount)}</td></tr>
        <tr><td>Total</td><td style="text-align:right" class="total">${currency(order.total)}</td></tr>
        <tr><td>Cash Received</td><td style="text-align:right">${currency(order.cashReceived)}</td></tr>
        <tr><td>Change</td><td style="text-align:right">${currency(order.changeAmount)}</td></tr>
      </table>
      ${order.notes ? `<div class="line"></div><p class="muted">Notes: ${order.notes}</p>` : ""}
      <div class="line"></div>
      <p class="center muted">Powered by DukanPer</p>
    </body></html>`);
  win.document.close();
  win.focus();
  win.print();
}

export default function PosPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState<{ id: string; slug: string; name: string; city?: string | null } | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [historySearch, setHistorySearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedByProduct, setSelectedByProduct] = useState<Record<string, SelectedVariant[]>>({});
  const [customerName, setCustomerName] = useState("Walk-in Customer");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [discount, setDiscount] = useState("0");
  const [cashReceived, setCashReceived] = useState("0");
  const [localBills, setLocalBills] = useState<SavedBill[]>([]);
  const [syncedBills, setSyncedBills] = useState<SavedBill[]>([]);
  const [selectedBillId, setSelectedBillId] = useState("");
  const [message, setMessage] = useState("");

  const billsKey = store ? `dukanper-pos-bills-${store.id}` : "dukanper-pos-bills-temp";

  useEffect(() => {
    async function load() {
      if (!user) return;
      setLoading(true);
      const foundStore = await getStoreByOwnerId(user.uid);
      setStore(foundStore ? { id: foundStore.id, slug: foundStore.slug, name: foundStore.name, city: foundStore.city } : null);

      if (foundStore) {
        const [storeProducts, storeOrders] = await Promise.all([
          getProductsByStoreId(foundStore.id),
          getOrdersByStoreId(foundStore.id),
        ]);

        setProducts(storeProducts.filter((product) => product.status === "published"));
        setSyncedBills(storeOrders.filter((order) => order.source === "offline").map(mapOrderToSavedBill));
      } else {
        setProducts([]);
        setSyncedBills([]);
      }

      setLoading(false);
    }
    load();
  }, [user]);

  useEffect(() => {
    if (!store || typeof window === "undefined") return;

    try {
      const raw = window.localStorage.getItem(billsKey);
      if (!raw) {
        setLocalBills([]);
        return;
      }

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        setLocalBills([]);
        return;
      }

      setLocalBills(parsed.map(normalizeSavedBill));
    } catch {
      setLocalBills([]);
    }
  }, [billsKey, store]);

  function persistLocalBills(next: SavedBill[]) {
    const normalized = next.map(normalizeSavedBill).slice(0, 40);
    setLocalBills(normalized);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(billsKey, JSON.stringify(normalized));
    }
  }

  const billHistory = useMemo(() => mergeBills(localBills, syncedBills), [localBills, syncedBills]);

  useEffect(() => {
    if (!billHistory.length) {
      setSelectedBillId("");
      return;
    }
    if (!selectedBillId || !billHistory.some((bill) => bill.id === selectedBillId || bill.receiptNumber === selectedBillId)) {
      setSelectedBillId(billHistory[0].id);
    }
  }, [billHistory, selectedBillId]);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return products;
    return products.filter((product) =>
      [product.name, product.category, product.description || ""].some((value) => value.toLowerCase().includes(term)),
    );
  }, [products, search]);

  const filteredHistory = useMemo(() => {
    const term = historySearch.trim().toLowerCase();
    if (!term) return billHistory;
    return billHistory.filter((bill) =>
      [bill.receiptNumber, bill.customerName, bill.phone || "", ...bill.items.map((item) => item.name)]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [billHistory, historySearch]);

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
  const discountAmount = Math.max(0, Number(discount) || 0);
  const total = Math.max(0, subtotal - discountAmount);
  const received = Math.max(0, Number(cashReceived) || 0);
  const changeAmount = Math.max(0, received - total);
  const selectedBill = useMemo(
    () => billHistory.find((bill) => bill.id === selectedBillId || bill.receiptNumber === selectedBillId) || null,
    [billHistory, selectedBillId],
  );

  function getSelections(product: Product) {
    const current = selectedByProduct[product.id];
    if (current?.length) return current;
    return (product.variants || [])
      .filter((group) => group.values.length > 0)
      .map((group) => ({ name: group.name, value: group.values[0] }));
  }

  function updateSelection(productId: string, groupName: string, value: string) {
    setSelectedByProduct((prev) => {
      const current = prev[productId] || [];
      const exists = current.some((item) => item.name === groupName);
      return {
        ...prev,
        [productId]: exists
          ? current.map((item) => (item.name === groupName ? { ...item, value } : item))
          : [...current, { name: groupName, value }],
      };
    });
  }

  function addProduct(product: Product) {
    const selections = getSelections(product);
    const pricing = resolveVariantPricing(product, selections);
    const key = makeKey(product.id, selections);

    setCart((prev) => {
      const existing = prev.find((item) => item.key === key);
      if (existing) {
        return prev.map((item) =>
          item.key === key ? { ...item, quantity: item.quantity + 1, price: pricing.price } : item,
        );
      }

      return [
        ...prev,
        {
          key,
          productId: product.id,
          name: product.name,
          price: pricing.price,
          quantity: 1,
          imageUrl: product.imageUrl || "",
          selectedVariants: selections,
        },
      ];
    });

    setMessage(`${product.name} added to bill.`);
  }

  function changeQty(key: string, delta: number) {
    setCart((prev) =>
      prev
        .map((item) => (item.key === key ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item))
        .filter(Boolean),
    );
  }

  function removeItem(key: string) {
    setCart((prev) => prev.filter((item) => item.key !== key));
  }

  function clearBillForm() {
    setCart([]);
    setDiscount("0");
    setCashReceived("0");
    setNotes("");
    setPhone("");
    setCustomerName("Walk-in Customer");
  }

  function refillFromBill(bill: SavedBill) {
    setCart(bill.items.map(normalizeCartItem));
    setCustomerName(bill.customerName || "Walk-in Customer");
    setPhone(bill.phone || "");
    setNotes(bill.notes || "");
    setDiscount(String(bill.discountAmount || 0));
    setCashReceived(String(bill.cashReceived || bill.total));
    setMessage(`Loaded ${bill.receiptNumber} into the current bill.`);
  }

  async function handleSave(printAfter = false) {
    if (!store || cart.length === 0) return;

    setMessage("");

    const payload = {
      storeId: store.id,
      storeSlug: store.slug,
      customerName: customerName.trim() || "Walk-in Customer",
      customerEmail: "",
      customerId: "",
      phone: phone.trim(),
      city: store.city || "",
      address: "Offline POS Sale",
      notes: notes.trim(),
      items: cart.map((item) => ({
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        imageUrl: item.imageUrl || "",
        selectedVariants: item.selectedVariants,
      })),
      subtotal,
      deliveryFee: 0,
      discountAmount,
      couponCode: "",
      total,
      cashReceived: received,
      changeAmount,
    };

    let savedOrder: Order | null = null;
    try {
      savedOrder = await createOfflineOrder(payload);
      setMessage(`Offline sale saved with receipt ${savedOrder.receiptNumber}.`);
    } catch {
      setMessage("Could not sync to Firebase. Saved locally on this device.");
    }

    const localBill = normalizeSavedBill({
      id: savedOrder?.id || `local-${Date.now()}`,
      receiptNumber: savedOrder?.receiptNumber || `LOCAL-${Date.now()}`,
      customerName: payload.customerName,
      phone: payload.phone,
      notes: payload.notes,
      subtotal,
      discountAmount,
      total,
      createdAt: new Date().toISOString(),
      items: cart,
      cashReceived: received,
      changeAmount,
      synced: Boolean(savedOrder),
    });

    persistLocalBills([localBill, ...localBills]);

    if (savedOrder) {
      setSyncedBills((prev) => mergeBills([mapOrderToSavedBill(savedOrder)], prev));
    }

    setSelectedBillId(localBill.id);

    if (printAfter) {
      openPrintWindow(store.name, {
        receiptNumber: localBill.receiptNumber,
        items: localBill.items,
        customerName: localBill.customerName,
        subtotal: localBill.subtotal,
        discountAmount: localBill.discountAmount,
        total: localBill.total,
        cashReceived: localBill.cashReceived,
        changeAmount: localBill.changeAmount,
        createdAt: localBill.createdAt,
        notes: localBill.notes,
      });
    }

    clearBillForm();
  }

  if (loading) return <Loader label="Loading offline POS..." />;
  if (!store) return <div className="card p-8">Create your store first to use Offline POS.</div>;

  return (
    <div className="space-y-6">
      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["POS Items", String(cart.reduce((sum, item) => sum + item.quantity, 0))],
          ["Bill Total", currency(total)],
          ["Cash Received", currency(received)],
          ["Offline Bills", String(billHistory.length)],
        ].map(([label, value]) => (
          <div key={label} className="card p-5">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_420px]">
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <ScanLine className="h-5 w-5 text-pink-600" />
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Offline POS</h2>
              <p className="text-sm text-slate-500">Browse products with images, add items faster, and create counter bills.</p>
            </div>
          </div>

          <div className="relative mt-6">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="input pl-12"
            />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {filteredProducts.map((product) => {
              const selections = getSelections(product);
              const pricing = resolveVariantPricing(product, selections);
              const imageSrc = product.imageUrl || fallbackImage;
              return (
                <article
                  key={product.id}
                  className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="flex min-h-[220px] flex-col">
                    <div className="relative h-40 overflow-hidden bg-slate-100">
                      <img src={imageSrc} alt={product.name} className="h-full w-full object-cover" />
                      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-950/40 to-transparent" />
                      <div className="absolute left-3 top-3">
                        <span className="badge border border-white/70 bg-white/90 text-pink-700">{product.category}</span>
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="text-lg font-semibold text-slate-900">{product.name}</h3>
                          {product.description ? (
                            <p className="mt-1 text-sm leading-6 text-slate-500" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                              {product.description}
                            </p>
                          ) : (
                            <p className="mt-1 text-sm text-slate-500">Ready for quick counter billing.</p>
                          )}
                        </div>
                        <div className="rounded-2xl bg-slate-50 px-3 py-2 text-right">
                          <p className="text-lg font-bold text-slate-900">{currency(pricing.price)}</p>
                        </div>
                      </div>

                      <div className={`mt-4 ${product.variants?.length ? "space-y-3" : "min-h-[74px]"}`}>
                        {product.variants?.length ? (
                          product.variants.map((group) => {
                            const currentValue = selections.find((item) => item.name === group.name)?.value || group.values[0];
                            return (
                              <div key={group.name}>
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{group.name}</p>
                                <div className="flex flex-wrap gap-2">
                                  {group.values.map((value) => (
                                    <button
                                      key={value}
                                      type="button"
                                      onClick={() => updateSelection(product.id, group.name, value)}
                                      className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                                        currentValue === value
                                          ? "border-pink-500 bg-pink-50 text-pink-700"
                                          : "border-slate-200 bg-white text-slate-600"
                                      }`}
                                    >
                                      {value}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-500">
                            Standard item • no variants
                          </div>
                        )}
                      </div>

                      <button type="button" onClick={() => addProduct(product)} className="btn-primary mt-4 w-full gap-2">
                        <Plus className="h-4 w-4" />
                        Add to Bill
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}

            {filteredProducts.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500 md:col-span-2">
                No matching products found.
              </div>
            ) : null}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-xl font-bold text-slate-900">Current Bill</h3>
              <button type="button" onClick={clearBillForm} className="text-sm font-medium text-slate-500 hover:text-slate-900">
                Clear bill
              </button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input className="input pl-4" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer name" />
              <input className="input pl-4" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" />
              <input className="input pl-4" value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="Discount" type="number" min="0" />
              <input className="input pl-4" value={cashReceived} onChange={(e) => setCashReceived(e.target.value)} placeholder="Cash received" type="number" min="0" />
              <textarea className="input min-h-24 pl-4 sm:col-span-2" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)" />
            </div>

            <div className="mt-5 space-y-3">
              {cart.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
                  No items added yet.
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.key} className="rounded-2xl bg-slate-50 p-3">
                    <div className="flex items-start gap-3">
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-white">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-300">
                            <ImageIcon className="h-6 w-6" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-slate-900">{item.name}</p>
                            {item.selectedVariants.length ? (
                              <p className="mt-1 text-xs text-slate-500">
                                {item.selectedVariants.map((variant) => `${variant.name}: ${variant.value}`).join(" • ")}
                              </p>
                            ) : null}
                            <p className="mt-1 text-sm text-slate-500">{currency(item.price)} each</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(item.key)}
                            className="rounded-full p-2 text-rose-600 transition hover:bg-rose-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2">
                            <button type="button" onClick={() => changeQty(item.key, -1)}>
                              -
                            </button>
                            <span className="min-w-6 text-center font-semibold">{item.quantity}</span>
                            <button type="button" onClick={() => changeQty(item.key, 1)}>
                              +
                            </button>
                          </div>
                          <p className="font-semibold text-slate-900">{currency(item.quantity * item.price)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span>{currency(subtotal)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span>Discount</span>
                <span>- {currency(discountAmount)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span>Total</span>
                <span className="font-semibold text-slate-900">{currency(total)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span>Change</span>
                <span>{currency(changeAmount)}</span>
              </div>
            </div>

            {message ? (
              <div className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-3">
              <button type="button" className="btn-primary gap-2" onClick={() => handleSave(false)} disabled={!cart.length}>
                <Save className="h-4 w-4" />
                Save Offline Order
              </button>
              <button type="button" className="btn-secondary gap-2" onClick={() => handleSave(true)} disabled={!cart.length}>
                <Printer className="h-4 w-4" />
                Print Bill
              </button>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-3">
              <Receipt className="h-5 w-5 text-slate-900" />
              <div>
                <h3 className="text-xl font-bold text-slate-900">Quick bill history</h3>
                <p className="text-sm text-slate-500">Latest offline orders from this device and synced Firebase orders.</p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {billHistory.slice(0, 4).map((bill) => (
                <button
                  key={bill.receiptNumber}
                  type="button"
                  onClick={() => setSelectedBillId(bill.id)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    selectedBill?.receiptNumber === bill.receiptNumber
                      ? "border-pink-300 bg-pink-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{bill.receiptNumber}</p>
                      <p className="mt-1 text-sm text-slate-500">{bill.customerName} • {todayString(bill.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">{currency(bill.total)}</p>
                      <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${bill.synced ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                        {bill.synced ? "Synced" : "Local"}
                      </span>
                    </div>
                  </div>
                </button>
              ))}

              {!billHistory.length ? <p className="text-sm text-slate-500">No offline bills saved yet.</p> : null}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <Clock3 className="h-5 w-5 text-sky-600" />
            <div>
              <h3 className="text-xl font-bold text-slate-900">Past offline orders</h3>
              <p className="text-sm text-slate-500">Search and review previously saved receipts.</p>
            </div>
          </div>

          <div className="relative mt-4">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              placeholder="Search by receipt, customer, or item..."
              className="input pl-12"
            />
          </div>

          <div className="mt-4 space-y-3">
            {filteredHistory.length ? (
              filteredHistory.map((bill) => (
                <button
                  key={`${bill.receiptNumber}-${bill.id}`}
                  type="button"
                  onClick={() => setSelectedBillId(bill.id)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    selectedBill?.receiptNumber === bill.receiptNumber
                      ? "border-pink-300 bg-pink-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{bill.receiptNumber}</p>
                      <p className="mt-1 text-sm text-slate-500">{bill.customerName}</p>
                      <p className="mt-1 text-xs text-slate-400">{todayString(bill.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">{currency(bill.total)}</p>
                      <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${bill.synced ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                        {bill.synced ? "Synced" : "Local"}
                      </span>
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
                No matching offline orders found.
              </div>
            )}
          </div>
        </div>

        <div className="card p-6">
          {selectedBill ? (
            <div>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <span className="badge">Receipt detail</span>
                  <h3 className="mt-3 text-2xl font-bold text-slate-900">{selectedBill.receiptNumber}</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    {selectedBill.customerName} • {todayString(selectedBill.createdAt)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="btn-secondary gap-2"
                    onClick={() =>
                      openPrintWindow(store.name, {
                        receiptNumber: selectedBill.receiptNumber,
                        items: selectedBill.items,
                        customerName: selectedBill.customerName,
                        subtotal: selectedBill.subtotal,
                        discountAmount: selectedBill.discountAmount,
                        total: selectedBill.total,
                        cashReceived: selectedBill.cashReceived,
                        changeAmount: selectedBill.changeAmount,
                        createdAt: selectedBill.createdAt,
                        notes: selectedBill.notes,
                      })
                    }
                  >
                    <Printer className="h-4 w-4" />
                    Print Again
                  </button>
                  <button type="button" className="btn-primary gap-2" onClick={() => refillFromBill(selectedBill)}>
                    <Plus className="h-4 w-4" />
                    Load to bill
                  </button>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Total</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{currency(selectedBill.total)}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Cash Received</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{currency(selectedBill.cashReceived)}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Change</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{currency(selectedBill.changeAmount)}</p>
                </div>
              </div>

              {selectedBill.notes ? (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                  <span className="font-semibold text-slate-900">Notes:</span> {selectedBill.notes}
                </div>
              ) : null}

              <div className="mt-6 space-y-3">
                {selectedBill.items.map((item, index) => (
                  <div key={`${selectedBill.receiptNumber}-${item.key}-${index}`} className="flex items-center gap-4 rounded-2xl border border-slate-200 p-4">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-300">
                          <ImageIcon className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900">{item.name}</p>
                      {item.selectedVariants.length ? (
                        <p className="mt-1 text-xs text-slate-500">
                          {item.selectedVariants.map((variant) => `${variant.name}: ${variant.value}`).join(" • ")}
                        </p>
                      ) : null}
                      <p className="mt-1 text-sm text-slate-500">
                        {item.quantity} × {currency(item.price)}
                      </p>
                    </div>
                    <div className="text-right font-semibold text-slate-900">{currency(item.price * item.quantity)}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex min-h-[280px] items-center justify-center rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 text-slate-500">
              Select a past offline order to see its details.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
