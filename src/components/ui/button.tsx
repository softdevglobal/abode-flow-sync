import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-foreground text-background shadow-md hover:bg-foreground/90 hover:shadow-lg",
        destructive:
          "bg-destructive text-destructive-foreground shadow-md hover:bg-destructive/90",
        outline:
          "border-2 border-border bg-transparent text-foreground hover:bg-muted hover:border-foreground/30",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: 
          "text-foreground hover:bg-muted hover:text-foreground",
        link: 
          "text-accent underline-offset-4 hover:underline",
        accent:
          "gradient-orange text-accent-foreground shadow-lg hover:shadow-glow font-bold",
        hero:
          "bg-foreground text-background shadow-lg hover:shadow-xl text-base font-bold tracking-wide",
        heroOutline:
          "border-2 border-foreground/30 bg-transparent text-foreground backdrop-blur-sm hover:bg-foreground/10 hover:border-foreground/50",
        gold:
          "gradient-orange text-accent-foreground shadow-lg hover:shadow-glow font-bold",
        success:
          "bg-success text-success-foreground shadow-md hover:bg-success/90",
        glow:
          "gradient-orange text-accent-foreground shadow-glow animate-pulse-glow font-bold",
      },
      size: {
        default: "h-11 px-6 py-2.5",
        sm: "h-9 rounded-full px-4 text-xs",
        lg: "h-12 rounded-full px-8 text-base",
        xl: "h-14 rounded-full px-10 text-lg",
        icon: "h-10 w-10 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };