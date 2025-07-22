import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  className?: string
  size?: "sm" | "md" | "lg"
}

export function LoadingSpinner({ className, size = "md" }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12"
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <Loader2 className={cn("animate-spin text-blue-500", sizeClasses[size], className)} />
      <p className="text-muted-foreground">Loading analysis...</p>
    </div>
  )
}