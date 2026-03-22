"use client";

import { Trash2 } from "lucide-react";
import { useTransition } from "react";

interface DeleteProductButtonProps {
  productId: string;
  deleteAction?: (productId: string) => Promise<void>;
  onDelete?: () => void | Promise<void>;
}

export function DeleteProductButton({ productId, deleteAction, onDelete }: DeleteProductButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    if (confirm("Are you sure you want to delete this product?")) {
      startTransition(async () => {
        if (deleteAction) {
          await deleteAction(productId);
        } else if (onDelete) {
          await onDelete();
        }
      });
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="text-red-400 hover:text-red-300 p-2 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20 disabled:opacity-50"
      title="Delete"
    >
      <Trash2 className={`w-4 h-4 ${isPending ? "animate-spin" : ""}`} />
    </button>
  );
}
