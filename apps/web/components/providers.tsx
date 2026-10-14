"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { AccountGate } from "./account";

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [client] = useState(() => new QueryClient({ defaultOptions: {
    queries: { staleTime: 5_000, retry: 1, refetchOnWindowFocus: true },
    mutations: { retry: false }
  } }));
  return <QueryClientProvider client={client}>{pathname === "/" ? children : <AccountGate>{children}</AccountGate>}</QueryClientProvider>;
}
