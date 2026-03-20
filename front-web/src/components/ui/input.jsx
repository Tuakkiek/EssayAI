import * as React from "react";
import { cn } from "../../lib/utils";

const Input = React.forwardRef(({ className, type = "text", ...props }, ref) => (
  <input
    type={type}
    className={cn(
      "flex h-12 w-full rounded-2xl border border-[#e5e5ea] bg-white px-4 text-[15px] text-[#1d1d1f] placeholder:text-[#aeaeb2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#58cc02]/30",
      className,
    )}
    ref={ref}
    {...props}
  />
));

Input.displayName = "Input";

export { Input };
