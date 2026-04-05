import { StoreCartProvider } from "@/contexts/StoreCartContext";

export default async function PublicStoreLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <StoreCartProvider storeSlug={slug}>{children}</StoreCartProvider>;
}
