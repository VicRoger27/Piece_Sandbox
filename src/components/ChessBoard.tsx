/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, RotateCw, Sparkles, Hand, Eraser, MousePointer2 } from 'lucide-react';
import { Piece, PieceType, PieceColor, BoardState, UNICODE_PIECES } from '../types';

const INITIAL_BOARD: BoardState = Array(8).fill(null).map(() => Array(8).fill(null));

interface Arrow {
  id: string;
  start: { r: number, c: number };
  end: { r: number, c: number };
}

export default function ChessBoard() {
  const [board, setBoard] = useState<BoardState>(INITIAL_BOARD);
  const [selectedBrush, setSelectedBrush] = useState<{ type: PieceType; color: PieceColor } | null>(null);
  const [interactionMode, setInteractionMode] = useState<'place' | 'arrow'>('place');
  const [isFlipped, setIsFlipped] = useState(false);
  const [arrows, setArrows] = useState<Arrow[]>([]);
  const [drawingArrow, setDrawingArrow] = useState<{ start: { r: number, c: number }, current: { r: number, c: number } } | null>(null);
  const [history, setHistory] = useState<{msg: string, type: 'sys' | 'user'}[]>([
    { msg: 'Sandbox initialized', type: 'sys' },
    { msg: 'No move restrictions', type: 'sys' }
  ]);
  const boardRef = useRef<HTMLDivElement>(null);

  const [isPainting, setIsPainting] = useState(false);

  const addLog = (msg: string) => {
    setHistory(prev => [{ msg, type: 'user' }, ...prev].slice(0, 10));
  };

  // Piece placing logic
  const placePiece = (row: number, col: number, toggle = false) => {
    if (!selectedBrush || interactionMode !== 'place') return;
    const newBoard = [...board.map(r => [...r])];
    const existing = newBoard[row][col];

    if (toggle && existing?.type === selectedBrush.type && existing?.color === selectedBrush.color) {
      newBoard[row][col] = null;
    } else {
      newBoard[row][col] = {
        id: Math.random().toString(36).substr(2, 9),
        ...selectedBrush
      };
    }
    setBoard(newBoard);
  };

  const clearBoard = () => {
    setBoard(INITIAL_BOARD);
    setArrows([]);
    addLog('Board cleared');
  };

  const getSquareFromPoint = (x: number, y: number) => {
    if (!boardRef.current) return null;
    const rect = boardRef.current.getBoundingClientRect();
    const squareSize = rect.width / 8;
    let col = Math.floor((x - rect.left) / squareSize);
    let row = Math.floor((y - rect.top) / squareSize);
    
    if (isFlipped) {
      row = 7 - row;
      col = 7 - col;
    }
    
    if (row >= 0 && row < 8 && col >= 0 && col < 8) {
      return { r: row, c: col };
    }
    return null;
  };

  const handleSquareMouseDown = (row: number, col: number, e: React.MouseEvent) => {
    if (interactionMode === 'place' && selectedBrush && e.button === 0) {
      setIsPainting(true);
      placePiece(row, col, true);
    }
  };

  const handleSquareMouseEnter = (row: number, col: number) => {
    if (isPainting && interactionMode === 'place' && selectedBrush) {
      placePiece(row, col, false);
    }
  };

  // Arrow drawing logic
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only allow drawing arrows if specifically in arrow mode OR if right-clicking
    if (e.button === 2 || (interactionMode === 'arrow' && e.button === 0)) {
      const square = getSquareFromPoint(e.clientX, e.clientY);
      if (square) {
        setDrawingArrow({ start: square, current: square });
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!drawingArrow) return;
    const square = getSquareFromPoint(e.clientX, e.clientY);
    if (square) {
      setDrawingArrow(prev => prev ? { ...prev, current: square } : null);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    setIsPainting(false);
    if (!drawingArrow) return;
    
    const square = getSquareFromPoint(e.clientX, e.clientY);
    if (square) {
      const existingArrowIndex = arrows.findIndex(a => 
        a.start.r === drawingArrow.start.r && a.start.c === drawingArrow.start.c &&
        a.end.r === square.r && a.end.c === square.c
      );

      if (existingArrowIndex >= 0) {
        setArrows(prev => prev.filter((_, i) => i !== existingArrowIndex));
      } else if (drawingArrow.start.r !== square.r || drawingArrow.start.c !== square.c) {
        setArrows(prev => [...prev, { 
          id: `${drawingArrow.start.r}-${drawingArrow.start.c}-${square.r}-${square.c}-${Date.now()}`,
          start: drawingArrow.start, 
          end: square 
        }]);
      }
    }
    setDrawingArrow(null);
  };

  useEffect(() => {
    setIsPainting(false);
    setDrawingArrow(null);
  }, [interactionMode]);

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsPainting(false);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    window.addEventListener('contextmenu', handleContextMenu);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('contextmenu', handleContextMenu);
    }
  }, []);

  const renderPiece = (piece: Piece | null, row: number, col: number) => {
    if (!piece) return null;

    return (
      <motion.div
        layoutId={piece.id}
        initial={{ scale: 0.3, opacity: 0, y: -40, rotate: -15 }}
        animate={{ scale: 1, opacity: 1, y: 0, rotate: 0 }}
        exit={{ scale: 0.5, opacity: 0, y: 20 }}
        transition={{ 
          type: "spring", 
          stiffness: 500, 
          damping: 15,
          mass: 0.8
        }}
        className={`w-full h-full flex items-center justify-center select-none ${
          piece.color === 'white' ? 'text-white' : 'text-slate-900'
        } drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]`}
        style={{
          WebkitTextStroke: piece.color === 'white' ? '0.5px rgba(0,0,0,0.1)' : '0.5px rgba(255,255,255,0.1)',
        }}
      >
        {piece.type === 'checker' ? (
          <div className={`w-3/4 h-3/4 rounded-full border-2 ${
            piece.color === 'white' ? 'bg-white border-gray-200' : 'bg-slate-900 border-gray-800 shadow-lg'
          }`} />
        ) : (
          <span className="text-4xl sm:text-5xl leading-none flex items-center justify-center w-full h-full transform transition-transform">
            {UNICODE_PIECES[piece.color][piece.type]}
          </span>
        )}
      </motion.div>
    );
  };

  const renderArrow = (arrow: Arrow, isTemp = false) => {
    const sz = 100 / 8; // Percentage
    
    // Convert to board coordinates (centered in square)
    // Board is 0-7. Left is 0. Top is 0.
    // If flipped, 0,0 is bottom right.
    // But getSquareFromPoint already accounts for flip in row/col.
    // So we just need to render the arrow relative to the VISUAL grid.
    
    let sr = arrow.start.r;
    let sc = arrow.start.c;
    let er = arrow.end.r;
    let ec = arrow.end.c;

    if (isFlipped) {
      sr = 7 - sr;
      sc = 7 - sc;
      er = 7 - er;
      ec = 7 - ec;
    }

    const x1 = (sc + 0.5) * (100 / 8);
    const y1 = (sr + 0.5) * (100 / 8);
    const x2 = (ec + 0.5) * (100 / 8);
    const y2 = (er + 0.5) * (100 / 8);

    return (
      <motion.line
        key={arrow.id + (isTemp ? '-temp' : '')}
        initial={{ opacity: 0, pathLength: 0 }}
        animate={{ opacity: 1, pathLength: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.4 } }}
        x1={`${x1}%`} y1={`${y1}%`} x2={`${x2}%`} y2={`${y2}%`}
        stroke={isTemp ? "rgba(34, 197, 94, 0.4)" : "rgba(34, 197, 94, 0.8)"}
        strokeWidth="10"
        markerEnd="url(#arrowhead)"
        strokeLinecap="round"
      />
    );
  };

  const pieces: PieceType[] = ['king', 'queen', 'rook', 'bishop', 'knight', 'pawn', 'checker'];

  return (
    <div className="flex flex-col xl:flex-row gap-6 w-full max-w-[1200px] mx-auto h-full items-start overflow-hidden">
      {/* Left Column: The Board Container */}
      <motion.div 
        initial={{ x: -30, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
        className="flex-[2] w-full bg-high-card border border-high-border p-8 flex items-center justify-center relative min-h-[400px] sm:min-h-[640px]"
      >
        {/* Chessboard Container with subtle inner shadow */}
        <motion.div 
          whileHover={{ scale: 1.002 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className={`relative aspect-square w-full max-w-[512px] border-[12px] border-high-deep shadow-2xl bg-high-deep overflow-hidden select-none ring-1 ring-white/10 p-2 ${
            interactionMode === 'place' ? 'cursor-crosshair' : 'cursor-cell'
          }`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <div 
            ref={boardRef}
            className="grid grid-cols-8 grid-rows-8 w-full h-full bg-high-border/20 gap-px relative"
            style={{ 
                transform: isFlipped ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.8s cubic-bezier(0.65, 0, 0.35, 1)' 
            }}
          >
            {board.map((rowArr, rowIndex) => 
               rowArr.map((piece, colIndex) => {
                 const isDark = (rowIndex + colIndex) % 2 === 1;
                 return (
                   <motion.div
                     key={`${rowIndex}-${colIndex}`}
                     id={`square-${rowIndex}-${colIndex}`}
                     onMouseDown={(e) => handleSquareMouseDown(rowIndex, colIndex, e)}
                     onMouseEnter={() => handleSquareMouseEnter(rowIndex, colIndex)}
                     whileHover={{ zIndex: 10 }}
                     className={`w-full h-full relative flex items-center justify-center pointer-events-auto transition-all duration-700 ${
                       isDark ? 'bg-high-deep/40' : 'bg-high-text/90'
                     } ${interactionMode === 'place' ? 'hover:bg-high-accent/10 cursor-crosshair' : ''}`}
                   >
                      {/* Ghost preview */}
                      {!piece && interactionMode === 'place' && selectedBrush && (
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-40 flex items-center justify-center transition-opacity pointer-events-none">
                          <motion.span 
                            initial={{ scale: 0.8, rotate: -10 }}
                            whileHover={{ scale: 1.1, rotate: 0 }}
                            className="text-4xl sm:text-5xl"
                            style={{ 
                              color: selectedBrush.color === 'white' ? 'rgba(255,255,255,0.3)' : 'rgba(15,23,42,0.4)',
                             }}
                          >
                            {selectedBrush.type === 'checker' ? '●' : UNICODE_PIECES[selectedBrush.color][selectedBrush.type]}
                          </motion.span>
                        </div>
                      )}
                     
                     <div 
                        className="w-full h-full absolute inset-0 flex items-center justify-center pointer-events-none"
                        style={{ transform: isFlipped ? 'rotate(180deg)' : 'none' }}
                     >
                       <AnimatePresence mode="popLayout">
                         {renderPiece(piece, rowIndex, colIndex)}
                       </AnimatePresence>
                     </div>
                   </motion.div>
                 );
               })
            )}

            {/* Arrow Overlay - Now inside the grid container */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-50">
              <defs>
                <marker id="arrowhead" markerWidth="3" markerHeight="3" refX="1" refY="1.5" orient="auto">
                  <polygon points="0 0, 3 1.5, 0 3" fill="rgba(34, 197, 94, 0.8)" />
                </marker>
              </defs>
              <AnimatePresence>
                {arrows.map(a => renderArrow(a))}
              </AnimatePresence>
              {drawingArrow && renderArrow({ id: 'drawing', start: drawingArrow.start, end: drawingArrow.current }, true)}
            </svg>
          </div>
        </motion.div>
      </motion.div>

      {/* Right Column: Piece Selection & Actions */}
      <motion.div 
        initial={{ x: 30, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.6, ease: "easeOut" }}
        className="flex-1 w-full flex flex-col gap-4"
      >
        {/* Simple Mode Selector */}
        <div className="relative flex p-1 bg-high-card border border-high-border overflow-hidden h-12">
          {/* Magnetic Sliding Indicator */}
          <motion.div
            className="absolute top-1 bottom-1 bg-high-accent shadow-[0_2px_15px_rgba(34,197,94,0.4)] z-0 rounded-sm"
            animate={{
              left: interactionMode === 'place' ? '4px' : 'calc(50% + 2px)',
            }}
            transition={{ 
              type: "spring", 
              stiffness: 180, 
              damping: 20,
              mass: 1.1
            }}
            style={{ 
              width: 'calc(50% - 6px)' 
            }}
          />
          {[
            { id: 'place', icon: Sparkles, label: 'PLACE' },
            { id: 'arrow', icon: MousePointer2, label: 'DRAW' }
          ].map(m => (
            <motion.button
              key={m.id}
              whileTap={{ scale: 0.96 }}
              onClick={() => { setInteractionMode(m.id as any); setArrows([]); }}
              className="relative z-10 flex-1 flex flex-col items-center justify-center mono-micro gap-1"
            >
              <motion.div
                animate={{ 
                  color: interactionMode === m.id ? '#000000' : '#64748b',
                  scale: interactionMode === m.id ? 1.05 : 1,
                  y: interactionMode === m.id ? 0 : 1
                }}
                transition={{ type: "spring", stiffness: 180, damping: 20, mass: 1.1 }}
                className="flex flex-col items-center gap-1"
              >
                <m.icon size={14} strokeWidth={interactionMode === m.id ? 3 : 2} />
                <span className={`text-[8px] tracking-[0.2em] ${interactionMode === m.id ? 'font-black' : 'font-bold'}`}>{m.label}</span>
              </motion.div>
            </motion.button>
          ))}
        </div>

        {/* Piece Palette */}
        <div className="bg-high-card border border-high-border p-3">
          <div className="space-y-4">
            <div>
              <div className="grid grid-cols-7 gap-1">
                {pieces.map(type => (
                  <motion.button
                    key={`white-${type}`}
                    whileHover={{ scale: 1.08, y: -4, rotate: 2 }}
                    whileTap={{ scale: 0.9, rotate: -2 }}
                    onClick={() => { setSelectedBrush({ type, color: 'white' }); setInteractionMode('place'); }}
                    className={`h-12 border-2 flex items-center justify-center transition-all duration-300 rounded-md ${
                      selectedBrush?.type === type && selectedBrush?.color === 'white' && interactionMode === 'place'
                        ? 'border-high-accent bg-high-accent/20 text-white shadow-[0_4px_20px_rgba(34,197,94,0.5)]' 
                        : 'border-white/5 bg-high-deep/50 text-high-muted hover:border-white/20 hover:text-white hover:bg-high-deep'
                    }`}
                  >
                    {type === 'checker' ? (
                      <div className="w-5 h-5 rounded-full bg-white border border-gray-200" />
                    ) : (
                      <span className="text-3xl leading-none text-white">{UNICODE_PIECES.white[type]}</span>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>
            <div>
              <div className="grid grid-cols-7 gap-1">
                {pieces.map(type => (
                  <motion.button
                    key={`black-${type}`}
                    whileHover={{ scale: 1.08, y: -4, rotate: -2 }}
                    whileTap={{ scale: 0.9, rotate: 2 }}
                    onClick={() => { setSelectedBrush({ type, color: 'black' }); setInteractionMode('place'); }}
                    className={`h-12 border-2 flex items-center justify-center transition-all duration-300 rounded-md ${
                      selectedBrush?.type === type && selectedBrush?.color === 'black' && interactionMode === 'place'
                        ? 'border-high-accent bg-high-accent/20 text-white shadow-[0_4px_20px_rgba(34,197,94,0.5)]' 
                        : 'border-white/5 bg-high-deep/50 text-high-muted hover:border-white/20 hover:text-white hover:bg-high-deep'
                    }`}
                  >
                    {type === 'checker' ? (
                      <div className="w-5 h-5 rounded-full bg-black border border-gray-800" />
                    ) : (
                      <span className="text-3xl leading-none text-slate-900 drop-shadow-[0_0_2px_rgba(255,255,255,0.5)]">
                        {UNICODE_PIECES.black[type]}
                      </span>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-1 mt-4">
            <button 
              onClick={() => { setSelectedBrush(null); }}
              className="py-2 border border-high-border mono-micro text-high-muted hover:text-white transition-colors"
            >
              Deselect
            </button>
            <button 
              onClick={() => setArrows([])}
              className="py-2 border border-high-border mono-micro text-high-muted hover:text-white transition-colors"
            >
              Clear Arrows
            </button>
          </div>
        </div>

        {/* Action History removed for cleanliness */}

        {/* Global Actions */}
        <div className="space-y-2 mt-auto">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={clearBoard}
            className="group relative w-full py-4 bg-high-accent text-black font-black uppercase text-xs tracking-[0.2em] transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)] overflow-hidden hover:brightness-110"
          >
            <motion.div 
              className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 skew-x-12"
            />
            <span className="relative z-10">Reset Board</span>
          </motion.button>

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsFlipped(!isFlipped)}
            className="w-full py-3 border border-high-border text-high-muted hover:text-white mono-micro transition-colors flex items-center justify-center gap-2"
          >
            <RotateCw size={14} />
            Flip Perspective
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
