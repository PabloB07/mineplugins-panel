"use client";

import ProductGrid from "@/components/store/ProductGrid";
import { Session } from "./types";

interface StoreContentProps {
  session: Session | null;
}

export default function StoreContent({ session }: StoreContentProps) {
  return (
    <ProductGrid session={session} />
  );
}
