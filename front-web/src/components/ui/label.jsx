import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "../../lib/utils";

const Label = React.forwardRef(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(
      "text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6e6e73]",
      className,
    )}
    {...props}
  />
));

Label.displayName = "Label";

export { Label };
