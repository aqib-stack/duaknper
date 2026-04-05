(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push(["static/chunks/src_d834d0b8._.js", {

"[project]/src/lib/variantPricing.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "resolveVariantPricing": (()=>resolveVariantPricing)
});
const SIZE_SCALE = {
    xs: 0.8,
    s: 1,
    m: 1.15,
    l: 1.3,
    xl: 1.5,
    xxl: 1.7
};
function normalizeValue(value) {
    return value.trim().toLowerCase();
}
function parseMeasurable(value) {
    const normalized = normalizeValue(value);
    const match = normalized.match(/(\d+(?:\.\d+)?)\s*(kg|g|l|ml)/i);
    if (!match) return null;
    const amount = Number(match[1]);
    const unit = match[2].toLowerCase();
    if (!Number.isFinite(amount) || amount <= 0) return null;
    switch(unit){
        case "kg":
            return {
                family: "weight",
                base: amount * 1000
            };
        case "g":
            return {
                family: "weight",
                base: amount
            };
        case "l":
            return {
                family: "volume",
                base: amount * 1000
            };
        case "ml":
            return {
                family: "volume",
                base: amount
            };
        default:
            return null;
    }
}
function findReferenceValue(product, selectedVariants) {
    for (const selected of selectedVariants){
        const measurable = parseMeasurable(selected.value);
        if (measurable) {
            const fromName = parseMeasurable(product.name);
            if (fromName && fromName.family === measurable.family) {
                return measurable.base / fromName.base;
            }
        }
        const normalized = normalizeValue(selected.value);
        if (SIZE_SCALE[normalized]) {
            const productNameNormalized = normalizeValue(product.name);
            const matchedSize = Object.keys(SIZE_SCALE).find((size)=>new RegExp(`(^|[^a-z])${size}([^a-z]|$)`, "i").test(productNameNormalized));
            const reference = matchedSize ? SIZE_SCALE[matchedSize] : 1;
            return SIZE_SCALE[normalized] / reference;
        }
    }
    return 1;
}
function resolveVariantPricing(product, selectedVariants = []) {
    const multiplier = findReferenceValue(product, selectedVariants);
    const price = Math.max(0, Math.round(product.price * multiplier));
    const compareAtPrice = product.compareAtPrice ? Math.max(price, Math.round(product.compareAtPrice * multiplier)) : null;
    return {
        price,
        compareAtPrice,
        multiplier
    };
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/contexts/StoreCartContext.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "StoreCartProvider": (()=>StoreCartProvider),
    "getDefaultVariantSelections": (()=>getDefaultVariantSelections),
    "useStoreCart": (()=>useStoreCart)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$variantPricing$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/variantPricing.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
"use client";
;
;
const StoreCartContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(undefined);
function makeKey(productId, selectedVariants) {
    const signature = (selectedVariants || []).map((v)=>`${v.name}:${v.value}`).join("|");
    return `${productId}__${signature}`;
}
function getDefaultVariantSelections(variants) {
    return (variants || []).filter((group)=>group.values.length > 0).map((group)=>({
            name: group.name,
            value: group.values[0]
        }));
}
function StoreCartProvider({ children, storeSlug }) {
    _s();
    const storageKey = `dukanper-cart-${storeSlug}`;
    const [items, setItems] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [appliedCoupon, setAppliedCouponState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [ready, setReady] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "StoreCartProvider.useEffect": ()=>{
            const raw = window.localStorage.getItem(storageKey);
            if (raw) {
                try {
                    const parsed = JSON.parse(raw);
                    if (Array.isArray(parsed)) {
                        setItems(parsed);
                    } else {
                        setItems(parsed.items || []);
                        setAppliedCouponState(parsed.appliedCoupon || null);
                    }
                } catch  {
                    window.localStorage.removeItem(storageKey);
                }
            }
            setReady(true);
        }
    }["StoreCartProvider.useEffect"], [
        storageKey
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "StoreCartProvider.useEffect": ()=>{
            if (!ready) return;
            window.localStorage.setItem(storageKey, JSON.stringify({
                items,
                appliedCoupon
            }));
        }
    }["StoreCartProvider.useEffect"], [
        items,
        appliedCoupon,
        ready,
        storageKey
    ]);
    const value = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "StoreCartProvider.useMemo[value]": ()=>({
                items,
                addItem (product, selectedVariants = getDefaultVariantSelections(product.variants), quantity = 1) {
                    const key = makeKey(product.id, selectedVariants);
                    const pricing = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$variantPricing$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["resolveVariantPricing"])(product, selectedVariants);
                    setItems({
                        "StoreCartProvider.useMemo[value]": (prev)=>{
                            const existing = prev.find({
                                "StoreCartProvider.useMemo[value].existing": (item)=>item.key === key
                            }["StoreCartProvider.useMemo[value].existing"]);
                            if (existing) {
                                return prev.map({
                                    "StoreCartProvider.useMemo[value]": (item)=>item.key === key ? {
                                            ...item,
                                            quantity: Math.min(item.quantity + quantity, Math.max(product.stock, 1)),
                                            stock: product.stock,
                                            price: pricing.price
                                        } : item
                                }["StoreCartProvider.useMemo[value]"]);
                            }
                            return [
                                ...prev,
                                {
                                    key,
                                    productId: product.id,
                                    name: product.name,
                                    price: pricing.price,
                                    imageUrl: product.imageUrl,
                                    quantity: Math.min(Math.max(quantity, 1), Math.max(product.stock, 1)),
                                    stock: product.stock,
                                    selectedVariants
                                }
                            ];
                        }
                    }["StoreCartProvider.useMemo[value]"]);
                },
                increaseQty (key) {
                    setItems({
                        "StoreCartProvider.useMemo[value]": (prev)=>prev.map({
                                "StoreCartProvider.useMemo[value]": (item)=>item.key === key ? {
                                        ...item,
                                        quantity: Math.min(item.quantity + 1, Math.max(item.stock, 1))
                                    } : item
                            }["StoreCartProvider.useMemo[value]"])
                    }["StoreCartProvider.useMemo[value]"]);
                },
                decreaseQty (key) {
                    setItems({
                        "StoreCartProvider.useMemo[value]": (prev)=>prev.map({
                                "StoreCartProvider.useMemo[value]": (item)=>item.key === key ? {
                                        ...item,
                                        quantity: item.quantity - 1
                                    } : item
                            }["StoreCartProvider.useMemo[value]"]).filter({
                                "StoreCartProvider.useMemo[value]": (item)=>item.quantity > 0
                            }["StoreCartProvider.useMemo[value]"])
                    }["StoreCartProvider.useMemo[value]"]);
                },
                removeItem (key) {
                    setItems({
                        "StoreCartProvider.useMemo[value]": (prev)=>prev.filter({
                                "StoreCartProvider.useMemo[value]": (item)=>item.key !== key
                            }["StoreCartProvider.useMemo[value]"])
                    }["StoreCartProvider.useMemo[value]"]);
                },
                clearCart () {
                    setItems([]);
                    setAppliedCouponState(null);
                },
                subtotal: items.reduce({
                    "StoreCartProvider.useMemo[value]": (sum, item)=>sum + item.price * item.quantity
                }["StoreCartProvider.useMemo[value]"], 0),
                totalItems: items.reduce({
                    "StoreCartProvider.useMemo[value]": (sum, item)=>sum + item.quantity
                }["StoreCartProvider.useMemo[value]"], 0),
                appliedCoupon,
                setAppliedCoupon (coupon) {
                    setAppliedCouponState(coupon);
                }
            })
    }["StoreCartProvider.useMemo[value]"], [
        items,
        appliedCoupon
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StoreCartContext.Provider, {
        value: value,
        children: children
    }, void 0, false, {
        fileName: "[project]/src/contexts/StoreCartContext.tsx",
        lineNumber: 140,
        columnNumber: 10
    }, this);
}
_s(StoreCartProvider, "rXKHGZugwdmor0dHpM/D/CJP2Uo=");
_c = StoreCartProvider;
function useStoreCart() {
    _s1();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(StoreCartContext);
    if (!context) {
        throw new Error("useStoreCart must be used within StoreCartProvider");
    }
    return context;
}
_s1(useStoreCart, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
var _c;
__turbopack_context__.k.register(_c, "StoreCartProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
}]);

//# sourceMappingURL=src_d834d0b8._.js.map