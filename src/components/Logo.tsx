import { cn } from "@/lib/utils"
import logo from "@/assets/logo.png"

interface LogoProps {
  className?: string
  size?: "sm" | "md" | "lg"
  showText?: boolean
}

export function Logo({ className, size = "md", showText = true }: LogoProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12", 
    lg: "h-16 w-16"
  }

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl"
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <img 
        src={logo} 
        alt="Ordeminds Logo" 
        className={cn("object-contain", sizeClasses[size])}
      />
      {showText && (
        <span className={cn(
          "font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent",
          textSizeClasses[size]
        )}>
          Ordeminds
        </span>
      )}
    </div>
  )
}