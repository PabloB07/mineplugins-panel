"use client";

import { Trash2 } from "lucide-react";
import { useTransition } from "react";

interface DeleteProductButtonProps {
  productId: string;
  deleteAction: (productId: string) => Promise<void>;
}

export function DeleteProductButton({ productId, deleteAction }: DeleteProductButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    if (confirm("Are you sure you want to delete this product?")) {
      startTransition(async () => {
        await deleteAction(productId);
      });
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="text-red-400 hover:text-red-300 p-1 hover:bg-gray-600/50 rounded transition-colors disabled:opacity-50"
      title="Delete"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
