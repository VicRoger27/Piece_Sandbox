/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import ChessBoard from './components/ChessBoard';

export default function App() {
  return (
    <div className="min-h-screen bg-high-bg text-high-text font-sans flex flex-col p-4 md:p-6">
      {/* Header Section */}
      <header className="flex justify-between items-center border-b border-high-border pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-high-accent flex items-center justify-center rounded-sm shrink-0 shadow-lg">
            <span className="text-black font-bold text-lg font-mono">P</span>
          </div>
          <h1 className="text-sm font-bold uppercase tracking-[0.3em] text-white">Piece Sandbox</h1>
        </div>
        <div className="flex items-center gap-2 mono-micro text-high-muted">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
          ACTIVE
        </div>
      </header>

      <main className="flex-1 flex flex-col overflow-hidden">
        <ChessBoard />
      </main>
    </div>
  );
}
