"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { toast } from "@/lib/hooks/use-toast";
import { apiErrorMessage } from "@/lib/hooks/use-auth";
import type { AxiosError } from "axios";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60 * 1000 },
          mutations: {
            onError: (error) => {
              toast({
                title: "Action failed",
                description: apiErrorMessage(
                  error as AxiosError<{ message: string | string[] }>,
                  "Something went wrong. Please try again."
                ),
                variant: "destructive",
              });
            },
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
