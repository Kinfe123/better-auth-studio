// @ts-nocheck
'use client'
import React from 'react'
import { type MotionProps, motion } from "framer-motion"
import { cn } from "@/lib/utils"


type LineShadowMotionProps = Omit<MotionProps, "children">

interface LineShadowTextProps
   extends Omit<React.HTMLAttributes<HTMLElement>, keyof MotionProps>,
      LineShadowMotionProps {
   shadowColor?: string
   as?: React.ElementType
   children: string
   className?: string
}

export function LineShadowText({
   children,
   shadowColor = "black",
   className,
   as: Component = "span",
   ...props
}: LineShadowTextProps) {
   const MotionComponent = motion.create(Component)
   const content = children

   return (
      <MotionComponent
         style={{ "--shadow-color": shadowColor } as React.CSSProperties}
         className={cn(
            "relative z-0 tracking-tighter inline-flex",
            "after:absolute after:left-[0.04em] after:top-[0.04em] after:content-[attr(data-text)]",
            "after:bg-[linear-gradient(45deg,transparent_45%,var(--shadow-color)_45%,var(--shadow-color)_55%,transparent_0)]",
            "after:-z-10 after:bg-[length:0.06em_0.06em] after:bg-clip-text after:text-transparent",
            "after:animate-line-shadow",
            className,
         )}
         data-text={content}
         {...props}
      >
         {content}
      </MotionComponent>
   )
}