"use client";

import { useEffect, useMemo, useState } from "react";
import type { Product, ProductInput, ProductVariant } from "@/types/product";
import { deleteStorageFile, uploadProductImage } from "@/lib/services/storage";

type ProductFormProps = {
  initialData?: Product | null;
  onSubmit: (values: ProductInput) => Promise<void>;
  onCancelEdit?: () => void;
  storeId: string;
  ownerId: string;
};

type FormState = {
  name: string;
  description: string;
  category: string;
  price: string;
  compareAtPrice: string;
  imageUrl: string;
  stock: string;
  featured: boolean;
  status: "draft" | "published";
  variantsEnabled: boolean;
  variantsText: string;
};

const emptyForm: FormState = {
  name: "",
  description: "",
  category: "",
  price: "",
  compareAtPrice: "",
  imageUrl: "",
  stock: "",
  featured: false,
  status: "published",
  variantsEnabled: false,
  variantsText: "",
};

const acceptedImageTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
const maxFileSize = 2 * 1024 * 1024;

const variantPresets = [
  { label: "Weight options", value: "Weight: 250g, 500g, 1kg, 2kg, 3kg" },
  { label: "Volume options", value: "Volume: 250ml, 500ml, 1L, 2L, 3L" },
  { label: "Clothing sizes", value: "Size: S, M, L, XL, XXL" },
];

function variantsToText(variants?: ProductVariant[]) {
  return (variants || []).map((variant) => `${variant.name}: ${variant.values.join(", ")}`).join("\n");
}

function parseVariants(text: string): ProductVariant[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separatorIndex = line.indexOf(":");
      const namePart = separatorIndex >= 0 ? line.slice(0, separatorIndex) : line;
      const valuesPart = separatorIndex >= 0 ? line.slice(separatorIndex + 1) : "";
      return {
        name: namePart.trim(),
        values: valuesPart
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
      };
    })
    .filter((group) => group.name && group.values.length > 0);
}

export function ProductForm({ initialData, onSubmit, onCancelEdit, storeId, ownerId }: ProductFormProps) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [removeExistingImage, setRemoveExistingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!initialData) {
      setForm(emptyForm);
      setSelectedFile(null);
      setPreviewUrl("");
      setRemoveExistingImage(false);
      return;
    }

    const nextVariantsText = variantsToText(initialData.variants);

    setForm({
      name: initialData.name || "",
      description: initialData.description || "",
      category: initialData.category || "",
      price: initialData.price ? String(initialData.price) : "",
      compareAtPrice: initialData.compareAtPrice ? String(initialData.compareAtPrice) : "",
      imageUrl: initialData.imageUrl || "",
      stock: initialData.stock > 0 ? String(initialData.stock) : "",
      featured: Boolean(initialData.featured),
      status: initialData.status || "published",
      variantsEnabled: nextVariantsText.length > 0,
      variantsText: nextVariantsText,
    });
    setSelectedFile(null);
    setPreviewUrl(initialData.imageUrl || "");
    setRemoveExistingImage(false);
  }, [initialData]);

  useEffect(() => {
    if (!selectedFile) return;
    const nextPreviewUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(nextPreviewUrl);
    return () => URL.revokeObjectURL(nextPreviewUrl);
  }, [selectedFile]);

  const title = useMemo(() => (initialData ? "Edit product" : "Add product"), [initialData]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleVariants(enabled: boolean) {
    setForm((prev) => ({
      ...prev,
      variantsEnabled: enabled,
      variantsText: enabled ? prev.variantsText : "",
    }));
  }

  function addVariantPreset(value: string) {
    setForm((prev) => {
      const existingLines = prev.variantsText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      if (existingLines.includes(value)) {
        return { ...prev, variantsEnabled: true };
      }

      return {
        ...prev,
        variantsEnabled: true,
        variantsText: existingLines.length > 0 ? `${existingLines.join("\n")}\n${value}` : value,
      };
    });
  }

  function handleFileChange(file: File | null) {
    setError("");

    if (!file) {
      setSelectedFile(null);
      if (removeExistingImage || !initialData?.imageUrl) {
        setPreviewUrl("");
      } else {
        setPreviewUrl(initialData.imageUrl);
      }
      return;
    }

    if (!acceptedImageTypes.includes(file.type)) {
      setError("Please upload a JPG, PNG, or WEBP image.");
      return;
    }

    if (file.size > maxFileSize) {
      setError("Please upload an image smaller than 2 MB.");
      return;
    }

    setSelectedFile(file);
    setRemoveExistingImage(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const parsedPrice = Number(form.price);
    const parsedCompareAt = form.compareAtPrice ? Number(form.compareAtPrice) : null;
    const parsedStock = form.stock.trim() === "" ? 100 : Number(form.stock);

    if (!form.name.trim() || !form.category.trim()) {
      setError("Product name and category are required.");
      setSubmitting(false);
      return;
    }

    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      setError("Please enter a valid price.");
      setSubmitting(false);
      return;
    }

    if (parsedCompareAt !== null && (Number.isNaN(parsedCompareAt) || parsedCompareAt < parsedPrice)) {
      setError("Compare price should be empty or greater than/equal to sale price.");
      setSubmitting(false);
      return;
    }

    if (Number.isNaN(parsedStock) || parsedStock < 0) {
      setError("Stock must be 0 or more.");
      setSubmitting(false);
      return;
    }

    let nextImageUrl = form.imageUrl.trim();
    let nextImagePath = initialData?.imagePath || "";
    let uploadedNewImagePath = "";

    try {
      if (selectedFile) {
        const uploadResult = await uploadProductImage({ ownerId, storeId, file: selectedFile });
        nextImageUrl = uploadResult.imageUrl;
        nextImagePath = uploadResult.imagePath;
        uploadedNewImagePath = uploadResult.imagePath;
      } else if (removeExistingImage) {
        nextImageUrl = "";
        nextImagePath = "";
      }

      await onSubmit({
        storeId,
        ownerId,
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category.trim(),
        price: parsedPrice,
        compareAtPrice: parsedCompareAt,
        imageUrl: nextImageUrl,
        imagePath: nextImagePath,
        stock: parsedStock,
        featured: form.featured,
        status: form.status,
        variants: form.variantsEnabled ? parseVariants(form.variantsText) : [],
      });

      if (selectedFile && initialData?.imagePath && initialData.imagePath !== nextImagePath) {
        await deleteStorageFile(initialData.imagePath);
      }

      if (removeExistingImage && initialData?.imagePath) {
        await deleteStorageFile(initialData.imagePath);
      }

      if (!initialData) {
        setForm(emptyForm);
        setSelectedFile(null);
        setPreviewUrl("");
      }
    } catch (err) {
      if (uploadedNewImagePath) {
        await deleteStorageFile(uploadedNewImagePath);
      }
      setError(err instanceof Error ? err.message : "Unable to save product.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="badge">Premium Catalog</span>
          <h2 className="mt-3 text-2xl font-bold text-slate-900">{title}</h2>
          <p className="mt-2 text-sm text-slate-500">Add products with pricing, optional stock, variant presets, featured tags, and image upload.</p>
        </div>
        {initialData ? <button type="button" onClick={onCancelEdit} className="btn-secondary">Cancel</button> : null}
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-700">Product name</label>
          <input className="input" value={form.name} onChange={(e) => updateField("name", e.target.value)} placeholder="Fresh Mango Box" required />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-700">Description</label>
          <textarea className="input min-h-28 resize-y" value={form.description} onChange={(e) => updateField("description", e.target.value)} placeholder="Sweet seasonal mangoes packed fresh for home delivery" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Category</label>
          <input className="input" value={form.category} onChange={(e) => updateField("category", e.target.value)} placeholder="Fruits" required />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Stock (optional)</label>
          <input type="number" min="0" className="input" value={form.stock} onChange={(e) => updateField("stock", e.target.value)} placeholder="Leave empty to use default stock" />
          <p className="mt-2 text-xs text-slate-500">You can leave this blank. Products without entered stock will use a default quantity for the demo store.</p>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Price (PKR)</label>
          <input type="number" min="0" className="input" value={form.price} onChange={(e) => updateField("price", e.target.value)} required />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Compare at price (optional)</label>
          <input type="number" min="0" className="input" value={form.compareAtPrice} onChange={(e) => updateField("compareAtPrice", e.target.value)} placeholder="1800" />
        </div>
        <div className="sm:col-span-2 rounded-2xl border border-slate-200 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Enable variants</label>
              <p className="mt-1 text-xs text-slate-500">Turn this on to add product sizes like 1kg, 2kg, 3kg, 1L, 2L, S, M, L, XL, or XXL.</p>
            </div>
            <label className="inline-flex cursor-pointer items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">
              <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-pink-600 focus:ring-pink-500" checked={form.variantsEnabled} onChange={(e) => toggleVariants(e.target.checked)} />
              Variants
            </label>
          </div>

          {form.variantsEnabled ? (
            <div className="mt-4 space-y-4">
              <div className="flex flex-wrap gap-2">
                {variantPresets.map((preset) => (
                  <button key={preset.label} type="button" className="rounded-full border border-pink-200 bg-pink-50 px-3 py-2 text-xs font-semibold text-pink-700 transition hover:bg-pink-100" onClick={() => addVariantPreset(preset.value)}>
                    {preset.label}
                  </button>
                ))}
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Product variants</label>
                <textarea className="input min-h-32 resize-y" value={form.variantsText} onChange={(e) => updateField("variantsText", e.target.value)} placeholder={"Weight: 1kg, 2kg, 3kg\nVolume: 1L, 2L, 3L\nSize: S, M, L, XL, XXL"} />
                <p className="mt-2 text-xs text-slate-500">Add one variant group per line. Example: Weight: 1kg, 2kg, 3kg</p>
              </div>
            </div>
          ) : null}
        </div>
        <div className="sm:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-700">Upload image (optional)</label>
          <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp" className="input file:mr-4 file:rounded-lg file:border-0 file:bg-pink-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-pink-700" onChange={(e) => handleFileChange(e.target.files?.[0] || null)} />
          <p className="mt-2 text-xs text-slate-500">Accepted: JPG, PNG, WEBP. Max size: 2 MB.</p>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-700">Image URL (optional)</label>
          <input className="input" value={form.imageUrl} onChange={(e) => updateField("imageUrl", e.target.value)} placeholder="https://example.com/product.jpg" />
        </div>

        {(previewUrl || initialData?.imageUrl) ? (
          <div className="sm:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-start gap-4">
              <img src={previewUrl || initialData?.imageUrl} alt="Preview" className="h-28 w-28 rounded-2xl object-cover" />
              <div>
                <p className="text-sm font-medium text-slate-700">Image preview</p>
                <button
                  type="button"
                  className="mt-3 rounded-xl border border-rose-200 px-4 py-2 text-sm font-medium text-rose-600"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl("");
                    setRemoveExistingImage(true);
                    updateField("imageUrl", "");
                  }}
                >
                  Remove image
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Status</label>
          <select className="input" value={form.status} onChange={(e) => updateField("status", e.target.value as FormState["status"])}>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>
        <label className="mt-8 inline-flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700">
          <input type="checkbox" checked={form.featured} onChange={(e) => updateField("featured", e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-pink-600 focus:ring-pink-500" />
          Featured product
        </label>
      </div>

      {error ? <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <button type="submit" disabled={submitting} className="btn-primary mt-6 disabled:opacity-60">
        {submitting ? "Saving..." : initialData ? "Update Product" : "Add Product"}
      </button>
    </form>
  );
}
