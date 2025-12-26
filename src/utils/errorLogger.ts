import { supabase } from "@/integrations/supabase/client";

interface LogEntry {
  type: "js_error" | "api_error" | "network_error" | "auth_error";
  message: string;
  metadata?: Record<string, unknown>;
}

export async function logError(entry: LogEntry): Promise<void> {
  try {
    // Get current user and organization if available
    const { data: { user } } = await supabase.auth.getUser();
    
    let organizationId: string | null = null;
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();
      organizationId = profile?.organization_id || null;
    }

    // Insert log entry - using type assertion since types haven't regenerated yet
    await (supabase.from("app_logs") as any).insert({
      organization_id: organizationId,
      user_id: user?.id || null,
      log_type: entry.type,
      message: entry.message,
      metadata: entry.metadata || null,
    });
  } catch (err) {
    // Silently fail - we don't want logging errors to crash the app
    console.error("Failed to log error:", err);
  }
}

// Global error handler for unhandled promise rejections
export function setupGlobalErrorHandlers(): void {
  window.addEventListener("unhandledrejection", (event) => {
    logError({
      type: "js_error",
      message: `Unhandled Promise Rejection: ${event.reason?.message || event.reason}`,
      metadata: {
        stack: event.reason?.stack,
      },
    });
  });

  window.addEventListener("error", (event) => {
    logError({
      type: "js_error",
      message: event.message,
      metadata: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });
}
