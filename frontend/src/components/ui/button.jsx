import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0091FF]/30 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.96] active:brightness-95 select-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-[#3195C9] to-[#0091FF] text-white shadow-sm hover:shadow-[0_4px_14px_rgba(0,145,255,0.35)] hover:brightness-105",
        destructive:
          "bg-rose-600 text-white shadow-sm hover:bg-rose-700 hover:shadow-[0_4px_14px_rgba(225,29,72,0.35)]",
        outline:
          "border border-[#E2E8F0] bg-white text-[#010B1C] shadow-xs hover:bg-[#F8FAFC] hover:border-[#98CAE4] hover:shadow-sm",
        secondary:
          "bg-[#EBF5FA] text-[#0091FF] border border-[#98CAE4]/40 hover:bg-[#E2EEF7] hover:border-[#98CAE4]",
        ghost: "text-slate-700 hover:bg-[#EBF5FA] hover:text-[#0091FF]",
        link: "text-[#0091FF] underline-offset-4 hover:underline active:scale-100",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-lg px-8 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props} />
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }
