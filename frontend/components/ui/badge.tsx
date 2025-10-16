import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[#0064FF] text-white",
        secondary: "border-transparent bg-[#F3F4F6] text-[#111827]",
        success: "border-transparent bg-[#22C55E] text-white",
        warning: "border-transparent bg-[#F59E0B] text-white",
        danger: "border-transparent bg-[#EF4444] text-white",
        info: "border-transparent bg-[#3B82F6] text-white",
        outline: "border-[#D1D5DB] text-[#374151]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
