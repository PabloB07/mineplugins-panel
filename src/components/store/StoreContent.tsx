"use client";

import { useTranslation } from "@/i18n/useTranslation";
import ProductGrid from "@/components/store/ProductGrid";
import { Product, Session } from "./types";

interface StoreContentProps {
  products: Product[];
  session: Session | null;
}

export default function StoreContent({ products, session }: StoreContentProps) {
  const { t } = useTranslation();

  return (
    <ProductGrid products={products} session={session} />
  );
}
