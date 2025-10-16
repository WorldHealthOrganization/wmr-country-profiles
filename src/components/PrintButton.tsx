import React from "react";
import { Printer } from "lucide-react";

type Props = { onPrepare: () => Promise<void> };

export function PrintButton({ onPrepare }: Props) {
  const handlePrint = async () => {
    await onPrepare();
    window.print();
  };
  return (
    <button
      onClick={handlePrint}
      className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm shadow-sm hover:bg-neutral-50 screen:inline-flex print:hidden"
      aria-label="Print"
    >
      <Printer size={16} />
      Print
    </button>
  );
}