"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";
import { I18nProvider } from "@/i18n/I18nProvider";

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <I18nProvider>
        {children}
      </I18nProvider>
    </SessionProvider>
  );
}
