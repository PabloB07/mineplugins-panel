"use client";

import { useI18n } from "@/i18n/I18nProvider";

interface FormattedPriceProps {
  value: number;
  className?: string;
}

export function FormattedPrice({ value, className }: FormattedPriceProps) {
  const { currency } = useI18n();

  if (currency === 'CLP') {
    const clpValue = Math.round(value * 920);
    return (
      <span className={className}>
        ${clpValue.toLocaleString('es-CL')} CLP
      </span>
    );
  }

  return (
    <span className={className}>
      ${value.toLocaleString('en-US')} USD
    </span>
  );
}