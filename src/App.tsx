/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import ChessBoard from './components/ChessBoard';
import { motion } from 'motion/react';

export default function App() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="min-h-screen bg-high-bg text-high-text font-sans flex flex-col p-4 md:p-6"
    >
      {/* Header Section */}
      <motion.header 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="flex justify-between items-center border-b border-high-border pb-4 mb-6"
      >
        <div className="flex items-center gap-3">
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="w-8 h-8 bg-high-accent flex items-center justify-center rounded-sm shrink-0 shadow-[0_0_15px_rgba(34,197,94,0.4)]"
          >
            <span className="text-black font-bold text-lg font-mono">P</span>
          </motion.div>
          <h1 className="text-sm font-black uppercase tracking-[0.4em] bg-clip-text text-transparent bg-gradient-to-r from-white to-white/50">
            Piece Sandbox
          </h1>
        </div>
      </motion.header>

      <main className="flex-1 flex flex-col overflow-hidden">
        <ChessBoard />
      </main>
    </motion.div>
  );
}
