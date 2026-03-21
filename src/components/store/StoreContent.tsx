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
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-6">
          {t("store.title")}
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
          {t("store.subtitle")}
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <ProductGrid products={products} session={session} />
      </div>
    </>
  );
}
