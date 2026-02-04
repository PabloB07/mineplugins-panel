"use client";

import { Trash2 } from "lucide-react";
import { useTransition } from "react";

interface DeleteVersionButtonProps {
  versionId: string;
  productId: string;
  deleteAction: (versionId: string, productId: string) => Promise<void>;
}

export function DeleteVersionButton({ versionId, productId, deleteAction }: DeleteVersionButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    if (confirm("Are you sure you want to delete this version?")) {
      startTransition(async () => {
        await deleteAction(versionId, productId);
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
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
