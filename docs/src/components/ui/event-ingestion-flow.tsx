"use client";

import React from "react";
import { motion } from "motion/react";
import { Database, SparklesIcon, Server } from "lucide-react";
import { cn } from "@/lib/utils";

interface EventIngestionFlowProps {
  className?: string;
  circleText?: string;
  badgeTexts?: {
    first: string;
    second: string;
    third: string;
    fourth: string;
  };
  buttonTexts?: {
    first: string;
    second: string;
  };
  title?: string;
  lightColor?: string;
}

const EventIngestionFlow = ({
  className,
  circleText,
  badgeTexts,
  buttonTexts,
  title,
  lightColor,
}: EventIngestionFlowProps) => {
  return (
    <div className={cn("relative w-full flex h-[350px] mx-auto flex-col items-center", className)}>
      <svg
        className="h-full sm:w-full text-white/20 text-xs"
        width="100%"
        height="100%"
        viewBox="0 0 200 100"
      >
        <g
          stroke="currentColor"
          fill="none"
          strokeWidth="0.4"
          strokeDasharray="100 100"
          pathLength="100"
        >
          <path d="M 25 15 v 15 q 0 5 5 5 h 59 q 5 0 5 5 v 10" />
          <path d="M 75 15 v 10 q 0 5 5 5 h 13 q 5 0 5 5 v 10" />
          <path d="M 126 15 v 10 q 0 5 -5 5 h -14 q -5 0 -5 5 v 10" />
          <path d="M 179 15 v 15 q 0 5 -5 5 h -60 q -5 0 -5 5 v 10" />
          {/* Bottom flow paths: Event Ingestion → Events → Better Auth → Events → Bottom border (vertical column) */}
          <path d="M 100 45 v 12" />
          <path d="M 100 56 v 12" />
          <path d="M 100 66 v 12" />
          <path d="M 100 76 v 16" />
          {/* Animation For Path Starting */}
          <animate
            attributeName="stroke-dashoffset"
            from="100"
            to="0"
            dur="1s"
            fill="freeze"
            calcMode="spline"
            keySplines="0.25,0.1,0.5,1"
            keyTimes="0; 1"
          />
        </g>
        {/* Blue Lights */}
        <g mask="url(#db-mask-1)">
          <circle className="database db-light-1" cx="0" cy="0" r="12" fill="url(#db-blue-grad)" />
        </g>
        <g mask="url(#db-mask-2)" className="">
          <circle className="database db-light-2" cx="0" cy="0" r="12" fill="url(#db-blue-grad)" />
        </g>
        <g mask="url(#db-mask-3)">
          <circle className="database db-light-3" cx="0" cy="0" r="12" fill="url(#db-blue-grad)" />
        </g>
        <g mask="url(#db-mask-4)">
          <circle className="database db-light-4" cx="0" cy="0" r="12" fill="url(#db-blue-grad)" />
        </g>
        {/* Bottom flow lights */}
        {/* <g mask="url(#db-mask-5)">
                    <circle
                        className="database db-light-5"
                        cx="0"
                        cy="0"
                        r="12"
                        fill="url(#db-blue-grad)"
                    />
                </g>
                <g mask="url(#db-mask-6)">
                    <circle
                        className="database db-light-6"
                        cx="0"
                        cy="0"
                        r="12"
                        fill="url(#db-blue-grad)"
                    />
                </g>
                <g mask="url(#db-mask-7)">
                    <circle
                        className="database db-light-7"
                        cx="0"
                        cy="0"
                        r="12"
                        fill="url(#db-blue-grad)"
                    />
                </g> */}
        {/* Bottom border light */}
        {/* <g mask="url(#db-mask-8)">
                    <circle
                        className="database db-light-8"
                        cx="0"
                        cy="0"
                        r="12"
                        fill="url(#db-blue-grad)"
                    />
                </g> */}
        <g stroke="currentColor" fill="none" strokeWidth="0.4">
          <g>
            <rect fill="#0a0a0a/10" x="6" y="5" width="38" height="10" rx="0"></rect>
            <DatabaseIcon x="10" y="7.5"></DatabaseIcon>
            <text
              x="16"
              y="11"
              fill="white"
              stroke="none"
              fontSize="3.5"
              fontWeight="500"
              className="font-mono"
            >
              {badgeTexts?.first || "user.joined"}
            </text>
          </g>
          {/* Second Button - session.created */}
          <g>
            <rect fill="#0a0a0a/10" x="53" y="5" width="42" height="10" rx="0"></rect>
            <DatabaseIcon x="55" y="7.5"></DatabaseIcon>
            <text
              x="61"
              y="11"
              fill="white"
              stroke="none"
              fontSize="3.5"
              fontWeight="500"
              className="font-mono"
            >
              {badgeTexts?.second || "session.created"}
            </text>
          </g>
          {/* Third Button - organization.created */}
          <g>
            <rect fill="#0a0a0a/20" x="100" y="5" width="54" height="10" rx="0"></rect>
            <DatabaseIcon x="104" y="7.5"></DatabaseIcon>
            <text
              x="110"
              y="11"
              fill="white"
              stroke="none"
              fontSize="3.5"
              fontWeight="500"
              className="font-mono"
            >
              {badgeTexts?.third || "organization.created"}
            </text>
          </g>
          {/* Fourth Button - member.added */}
          <g>
            <rect fill="#0a0a0a/10" x="160" y="5" width="38" height="10" rx="0"></rect>
            <DatabaseIcon x="164" y="7.5"></DatabaseIcon>
            <text
              x="170"
              y="11"
              fill="white"
              stroke="none"
              fontSize="3.5"
              fontWeight="500"
              className="font-mono"
            >
              {badgeTexts?.fourth || "member.added"}
            </text>
          </g>
        </g>
        <defs>
          {/* 1 -  user.joined */}
          <mask id="db-mask-1" className="">
            <path d="M 25 15 v 15 q 0 5 5 5 h 59 q 5 0 5 5 v 10" strokeWidth="0.5" stroke="white" />
          </mask>
          {/* 2 - session.created */}
          <mask id="db-mask-2">
            <path d="M 75 15 v 10 q 0 5 5 5 h 13 q 5 0 5 5 v 10" strokeWidth="0.5" stroke="white" />
          </mask>
          {/* 3 - organization.created */}
          <mask id="db-mask-3">
            <path
              d="M 126 15 v 10 q 0 5 -5 5 h -14 q -5 0 -5 5 v 10"
              strokeWidth="0.5"
              stroke="white"
            />
          </mask>
          {/* 4 - member.added */}
          <mask id="db-mask-4">
            <path
              d="M 179 15 v 15 q 0 5 -5 5 h -60 q -5 0 -5 5 v 10"
              strokeWidth="0.5"
              stroke="white"
            />
          </mask>
          {/* 5 - Event Ingestion → Events */}
          {/* <mask id="db-mask-5">
                        <path
                            d="M 100 90 v 12"
                            strokeWidth="0.5"
                            stroke="white"
                        />
                    </mask> */}
          {/* 6 - Events → Better Auth */}
          {/* <mask id="db-mask-6">
                        <path
                            d="M 100 97 v 12"
                            strokeWidth="0.5"
                            stroke="white"
                        />
                    </mask> */}
          {/* 7 - Better Auth → Events */}
          {/* <mask id="db-mask-7">
                        <path
                            d="M 100 109 v 12"
                            strokeWidth="0.5"
                            stroke="white"
                        />
                    </mask> */}
          {/* 8 - Events → Bottom border */}
          {/* <mask id="db-mask-8">
                        <path
                            d="M 100 121 v 5"
                            strokeWidth="0.5"
                            stroke="white"
                        />
                    </mask> */}
          {/* Blue Grad */}
          <radialGradient id="db-blue-grad" fx="1">
            <stop offset="0%" stopColor={lightColor || "#00A6F5"} />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
      </svg>
      {/* Main Box */}
      <div className="absolute bottom-7 flex w-full px-0 mx-0 flex-col items-center">
        {/* <div className="absolute -top-0 left-0 w-full h-full bg-[#0a0a0a]/40" /> */}
        <div className="absolute -top-3 z-20 flex items-center justify-center rounded-none backdrop-blur-sm border border-white/20 bg-[#0a0a0a]/40 py-1.5 px-2 sm:-top-4 sm:py-2">
          <SparklesIcon className="size-3" />
          <span className="ml-2 text-[10px] font-mono uppercase">
            {title ? title : "Event Ingestion Flow"}
          </span>
        </div>

        <div className="relative z-10 flex h-[160px] w-full items-center justify-center overflow-hidden border px-0 mx-0 border-white/20 border-x-0 rounded-none shadow-md">
          <div className="absolute backdrop-blur-sm top-10 left-1/2 -translate-x-1/2 z-10 h-6 rounded-none bg-[#0a0a0a]/10 px-2.5 text-[10px] border border-white/20 flex items-center gap-1.5 font-mono whitespace-nowrap">
            <Database className="size-3" />
            <span>{buttonTexts?.second || "Events"}</span>
          </div>
          <div className="absolute backdrop-blur-sm top-20 left-1/2 -translate-x-1/2 z-10 h-6 rounded-none bg-[#0a0a0a]/10 px-2.5 text-[10px] border border-white/20 flex items-center gap-1.5 font-mono whitespace-nowrap">
            <Server className="size-3" />
            <span>{buttonTexts?.first || "Better Auth"}</span>
          </div>
          <div className="absolute backdrop-blur-sm top-30 left-1/2 -translate-x-1/2 z-10 h-6 rounded-none bg-[#0a0a0a]/10 px-2.5 text-[10px] border border-white/20 flex items-center gap-1.5 font-mono whitespace-nowrap">
            <Database className="size-3" />
            <span>{buttonTexts?.second || "Events"}</span>
          </div>

          {/* Circles */}
          {/* <motion.div
                        className="absolute -bottom-14 h-[100px] w-[100px] rounded-full border-t border-white/10 bg-white/5"
                        animate={{
                            scale: [0.98, 1.02, 0.98, 1, 1, 1, 1, 1, 1],
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                    <motion.div
                        className="absolute -bottom-20 h-[145px] w-[145px] rounded-full border-t border-white/10 bg-white/5"
                        animate={{
                            scale: [1, 1, 1, 0.98, 1.02, 0.98, 1, 1, 1],
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                    <motion.div
                        className="absolute -bottom-[100px] h-[190px] w-[190px] rounded-full border-t border-white/10 bg-white/5"
                        animate={{
                            scale: [1, 1, 1, 1, 1, 0.98, 1.02, 0.98, 1, 1],
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                    <motion.div
                        className="absolute -bottom-[120px] h-[235px] w-[235px] rounded-full border-t border-white/10 bg-white/5"
                        animate={{
                            scale: [1, 1, 1, 1, 1, 1, 0.98, 1.02, 0.98, 1],
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                    /> */}
        </div>
      </div>
    </div>
  );
};

export default EventIngestionFlow;

const DatabaseIcon = ({ x = "0", y = "0" }: { x: string; y: string }) => {
  return (
    <svg
      x={x}
      y={y}
      xmlns="http://www.w3.org/2000/svg"
      width="4"
      height="4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5V19A9 3 0 0 0 21 19V5" />
      <path d="M3 12A9 3 0 0 0 21 12" />
    </svg>
  );
};
