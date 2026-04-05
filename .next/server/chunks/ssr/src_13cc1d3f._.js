module.exports = {

"[project]/src/lib/variantPricing.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
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
}}),
"[project]/src/contexts/StoreCartContext.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "StoreCartProvider": (()=>StoreCartProvider),
    "getDefaultVariantSelections": (()=>getDefaultVariantSelections),
    "useStoreCart": (()=>useStoreCart)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$variantPricing$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/variantPricing.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
const StoreCartContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])(undefined);
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
    const storageKey = `dukanper-cart-${storeSlug}`;
    const [items, setItems] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [appliedCoupon, setAppliedCouponState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [ready, setReady] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
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
    }, [
        storageKey
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!ready) return;
        window.localStorage.setItem(storageKey, JSON.stringify({
            items,
            appliedCoupon
        }));
    }, [
        items,
        appliedCoupon,
        ready,
        storageKey
    ]);
    const value = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>({
            items,
            addItem (product, selectedVariants = getDefaultVariantSelections(product.variants), quantity = 1) {
                const key = makeKey(product.id, selectedVariants);
                const pricing = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$variantPricing$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["resolveVariantPricing"])(product, selectedVariants);
                setItems((prev)=>{
                    const existing = prev.find((item)=>item.key === key);
                    if (existing) {
                        return prev.map((item)=>item.key === key ? {
                                ...item,
                                quantity: Math.min(item.quantity + quantity, Math.max(product.stock, 1)),
                                stock: product.stock,
                                price: pricing.price
                            } : item);
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
                });
            },
            increaseQty (key) {
                setItems((prev)=>prev.map((item)=>item.key === key ? {
                            ...item,
                            quantity: Math.min(item.quantity + 1, Math.max(item.stock, 1))
                        } : item));
            },
            decreaseQty (key) {
                setItems((prev)=>prev.map((item)=>item.key === key ? {
                            ...item,
                            quantity: item.quantity - 1
                        } : item).filter((item)=>item.quantity > 0));
            },
            removeItem (key) {
                setItems((prev)=>prev.filter((item)=>item.key !== key));
            },
            clearCart () {
                setItems([]);
                setAppliedCouponState(null);
            },
            subtotal: items.reduce((sum, item)=>sum + item.price * item.quantity, 0),
            totalItems: items.reduce((sum, item)=>sum + item.quantity, 0),
            appliedCoupon,
            setAppliedCoupon (coupon) {
                setAppliedCouponState(coupon);
            }
        }), [
        items,
        appliedCoupon
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(StoreCartContext.Provider, {
        value: value,
        children: children
    }, void 0, false, {
        fileName: "[project]/src/contexts/StoreCartContext.tsx",
        lineNumber: 140,
        columnNumber: 10
    }, this);
}
function useStoreCart() {
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(StoreCartContext);
    if (!context) {
        throw new Error("useStoreCart must be used within StoreCartProvider");
    }
    return context;
}
}}),

};

//# sourceMappingURL=src_13cc1d3f._.js.map