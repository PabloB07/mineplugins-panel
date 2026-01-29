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
    color: "from-green-600 to-green-700",
  },
  {
    id: "PAYKU",
    name: "Payku",
    description: "Alternative payment processor with multiple payment options",
    icon: CreditCard,
    color: "from-blue-600 to-blue-700",
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
                  ? 'border-emerald-500 bg-emerald-500/10' 
                  : 'border-gray-600 bg-gray-800 hover:border-gray-500'
                }
                ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
              `}
            >
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${method.color} flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                
                <div className="flex-1">
                  <h3 className="font-semibold text-white">{method.name}</h3>
                  <p className="text-sm text-gray-400 mt-1">{method.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}