import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, startIcon, endIcon, ...props }, ref) => {
    return (
      <div className={cn(
        "relative flex w-full items-center rounded-xl bg-[#1E293B] border border-white/10 focus-within:border-[#22C55E] focus-within:ring-2 focus-within:ring-[#22C55E]/20 transition-all",
        className
      )}>
        {startIcon && (
          <div className="pl-4 flex items-center justify-center text-zinc-500">
            {startIcon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            "flex w-full flex-1 bg-transparent py-3 pl-3 pr-4 text-sm text-white placeholder:text-zinc-500 focus:outline-none file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:cursor-not-allowed disabled:opacity-50",
            !startIcon && "pl-4"
          )}
          ref={ref}
          {...props}
        />
        {endIcon && (
          <div className="pr-4 flex items-center justify-center text-zinc-500">
            {endIcon}
          </div>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
