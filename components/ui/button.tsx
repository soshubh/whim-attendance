import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center whitespace-nowrap border select-none transition-colors outline-none disabled:pointer-events-none disabled:opacity-50 rounded-[var(--foundation-radius-full)] text-[length:var(--foundation-type-16)] font-medium leading-none min-h-[var(--foundation-space-40)] px-[var(--foundation-space-16)] shadow-none",
  {
    variants: {
      variant: {
        primary:
          "border-transparent bg-[var(--foundation-color-background-inverse)] text-white visited:text-white hover:bg-[var(--foundation-primary-700)]",
        inverse:
          "border-[rgb(255_255_255_/_0.88)] bg-white text-[color:var(--foundation-primary-700)] visited:text-[color:var(--foundation-primary-700)] hover:bg-[rgb(255_255_255_/_0.88)] hover:text-[color:var(--foundation-primary-800)]",
        secondary:
          "border-[color:var(--foundation-stroke-neutral)] bg-white text-[color:var(--foundation-color-text)] visited:text-[color:var(--foundation-color-text)] hover:bg-[color:var(--foundation-color-background)]",
        pill: "border-[color:var(--foundation-stroke-neutral)] bg-white text-[color:var(--foundation-neutral-700)] visited:text-[color:var(--foundation-neutral-700)] hover:bg-[color:var(--foundation-color-background)]",
        ghost:
          "border-transparent bg-transparent text-[color:var(--foundation-neutral-700)] visited:text-[color:var(--foundation-neutral-700)] hover:bg-[var(--foundation-primary-50)] hover:text-[color:var(--foundation-color-text-inverse)]",
      },
      size: {
        default: "",
        compact:
          "min-h-[var(--foundation-space-32)] px-[var(--foundation-space-12)]",
      },
      width: {
        auto: "w-auto",
        full: "w-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
      width: "auto",
    },
  },
);

function Button({
  className,
  variant,
  size,
  width,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, width, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
