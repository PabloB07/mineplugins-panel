"use client";

import { useState } from "react";
import { CreditCard, Wallet, Check } from "lucide-react";

interface PaymentMethod {
  id: "FLOW_CL" | "PAYKU";
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface PaymentMethodSelectorProps {
  selectedMethod: "FLOW_CL" | "PAYKU";
  onMethodChange: (method: "FLOW_CL" | "PAYKU") => void;
  disabled?: boolean;
}

const paymentMethods: PaymentMethod[] = [
  {
    id: "FLOW_CL",
    name: "Flow.cl",
    description: "Pay with credit card, debit card, or bank transfer",
    icon: Wallet,
    color: "#22c55e",
  },
  {
    id: "PAYKU",
    name: "Payku",
    description: "Alternative payment processor with multiple payment options",
    icon: CreditCard,
    color: "#3b82f6",
  },
];

export function PaymentMethodSelector({
  selectedMethod,
  onMethodChange,
  disabled = false,
}: PaymentMethodSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="text-lg font-medium text-white">Select Payment Method</label>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {paymentMethods.map((method) => {
          const Icon = method.icon;
          const isSelected = selectedMethod === method.id;

          return (
            <button
              key={method.id}
              onClick={() => !disabled && onMethodChange(method.id)}
              disabled={disabled}
              className={`
                relative p-4 rounded-lg border-2 transition-all text-left
                ${isSelected 
                  ? 'border-[#22c55e] bg-[#22c55e]/10' 
                  : 'border-[#333333] bg-[#1a1a1a] hover:border-[#404040]'
                }
                ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
              `}
            >
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <div className="w-6 h-6 bg-[#22c55e] rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0`} 
                     style={{ backgroundColor: method.color === "from-green-600 to-green-700" ? "#22c55e" : "#3b82f6" }}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                
                <div className="flex-1">
                  <h3 className="font-semibold text-white">{method.name}</h3>
                  <p className="text-sm text-[#737373] mt-1">{method.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}