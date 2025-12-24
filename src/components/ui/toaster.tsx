"use client"

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { CheckCircle, AlertCircle, Loader } from "lucide-react"

const ToastIcon = ({ variant }: { variant?: 'default' | 'destructive' | 'success' | 'loading' }) => {
  if (variant === 'success') {
    return <CheckCircle className="h-6 w-6 text-green-500" />;
  }
  if (variant === 'destructive') {
    return <AlertCircle className="h-6 w-6 text-destructive" />;
  }
  if (variant === 'loading') {
    return <Loader className="h-6 w-6 text-blue-500 animate-spin" />;
  }
  return null;
}


export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 pt-0.5">
                <ToastIcon variant={variant} />
              </div>
              <div className="grid gap-1 flex-grow">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
              {action}
            </div>
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
