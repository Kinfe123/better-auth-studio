import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef, type ReactNode } from "react";
import { cn, getImageSrc } from "../lib/utils";

interface EntityAvatarProps extends Omit<
  ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>,
  "children"
> {
  src?: string | null;
  alt: string;
  fallback: ReactNode;
  imageClassName?: string;
  fallbackClassName?: string;
}

export const EntityAvatar = forwardRef<ElementRef<typeof AvatarPrimitive.Root>, EntityAvatarProps>(
  ({ src, alt, fallback, className, imageClassName, fallbackClassName, ...props }, ref) => {
    const imageSrc = getImageSrc(src);

    return (
      <AvatarPrimitive.Root
        ref={ref}
        className={cn("relative flex shrink-0 overflow-hidden", className)}
        {...props}
      >
        {imageSrc && (
          <AvatarPrimitive.Image
            src={imageSrc}
            alt={alt}
            className={cn("h-full w-full object-cover", imageClassName)}
          />
        )}
        <AvatarPrimitive.Fallback
          className={cn("flex h-full w-full items-center justify-center", fallbackClassName)}
        >
          {fallback}
        </AvatarPrimitive.Fallback>
      </AvatarPrimitive.Root>
    );
  },
);

EntityAvatar.displayName = "EntityAvatar";
