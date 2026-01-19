'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface DatabaseVisualizationProps {
  className?: string;
}

export function DatabaseVisualization({ className }: DatabaseVisualizationProps) {
  const [events, setEvents] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  useEffect(() => {
    // Generate random event positions
    const newEvents = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 2,
    }));
    setEvents(newEvents);
  }, []);

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Database nodes */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="grid grid-cols-2 gap-8 w-full max-w-md">
          {/* PostgreSQL */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative"
          >
            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 flex items-center justify-center">
              <div className="w-8 h-8 rounded bg-blue-500/40" />
            </div>
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-white/60 font-mono">
              PostgreSQL
            </div>
          </motion.div>

          {/* SQLite */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative"
          >
            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 flex items-center justify-center">
              <div className="w-8 h-8 rounded bg-green-500/40" />
            </div>
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-white/60 font-mono">
              SQLite
            </div>
          </motion.div>

          {/* Prisma */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="relative"
          >
            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 flex items-center justify-center">
              <div className="w-8 h-8 rounded bg-purple-500/40" />
            </div>
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-white/60 font-mono">
              Prisma
            </div>
          </motion.div>

          {/* ClickHouse */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="relative"
          >
            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30 flex items-center justify-center">
              <div className="w-8 h-8 rounded bg-yellow-500/40" />
            </div>
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-white/60 font-mono">
              ClickHouse
            </div>
          </motion.div>
        </div>
      </div>

      {/* Animated event particles */}
      {events.map((event) => (
        <motion.div
          key={event.id}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            scale: [0, 1, 1, 0],
            x: [`${event.x}%`, `${event.x + 10}%`, `${event.x}%`],
            y: [`${event.y}%`, `${event.y + 10}%`, `${event.y}%`],
          }}
          transition={{
            duration: 3,
            delay: event.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute w-2 h-2 rounded-full bg-white/40"
          style={{
            left: `${event.x}%`,
            top: `${event.y}%`,
          }}
        />
      ))}

      {/* Connection lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
        <motion.line
          x1="25%"
          y1="40%"
          x2="75%"
          y2="40%"
          stroke="white"
          strokeWidth="1"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
        />
        <motion.line
          x1="25%"
          y1="60%"
          x2="75%"
          y2="60%"
          stroke="white"
          strokeWidth="1"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, delay: 0.5, repeat: Infinity, repeatType: 'reverse' }}
        />
      </svg>

      {/* Center text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-center"
        >
          <h2 className="text-2xl font-bold text-white/80 mb-2 font-mono uppercase tracking-wider">
            Event Ingestion
          </h2>
          <p className="text-sm text-white/50 font-mono">
            Real-time authentication events
          </p>
        </motion.div>
      </div>
    </div>
  );
}

