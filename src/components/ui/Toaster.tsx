import { Toaster as SonnerToaster, toast } from "sonner";

// Re-export toast for direct usage throughout the app
export { toast };

export function Toaster() {
  return (
    <SonnerToaster
      theme="dark"
      position="bottom-center"
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "flex items-center gap-3 px-4 py-3 rounded-xl bg-bg-panel border border-border shadow-xl shadow-black/20 text-sm font-medium w-full",
          title: "text-fg",
          description: "text-fg-muted text-xs",
          success: "text-green-400 [&_[data-icon]]:text-green-400",
          error: "text-red-400 [&_[data-icon]]:text-red-400",
          info: "text-blue-400 [&_[data-icon]]:text-blue-400",
          warning: "text-yellow-400 [&_[data-icon]]:text-yellow-400",
        },
      }}
    />
  );
}
