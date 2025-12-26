import { QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { logError } from "@/utils/errorLogger";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 1000 * 60, // 1 minute
      refetchOnWindowFocus: false,
      meta: {
        onError: (error: Error) => {
          logError({
            type: "api_error",
            message: error.message,
          });
        },
      },
    },
    mutations: {
      retry: 1,
      onError: (error: Error) => {
        toast.error("Action failed: " + error.message);
        logError({
          type: "api_error",
          message: error.message,
        });
      },
    },
  },
});

// Network status monitoring
let isOnline = navigator.onLine;
let reconnectToastId: string | number | undefined;

export function setupNetworkMonitoring(): void {
  window.addEventListener("online", () => {
    if (!isOnline) {
      isOnline = true;
      if (reconnectToastId) {
        toast.dismiss(reconnectToastId);
      }
      toast.success("Connection restored");
      queryClient.invalidateQueries();
    }
  });

  window.addEventListener("offline", () => {
    isOnline = false;
    reconnectToastId = toast.warning("You are offline. Checking connection...", {
      duration: Infinity,
    });
  });
}
