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

  const placePiece = (row: number, col: number, toggle = false) => {
    if (!selectedBrush) return;
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

  const handleSquareMouseDown = (row: number, col: number) => {
    if (interactionMode === 'place' && selectedBrush) {
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
    if (e.button === 2 || interactionMode === 'arrow') {
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
        setArrows(prev => [...prev, { start: drawingArrow.start, end: square }]);
      }
    }
    setDrawingArrow(null);
  };

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
        drag={false}
        dragSnapToOrigin={false}
        onDragEnd={(e, info) => {}}
        className={`w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing select-none ${
          piece.color === 'white' ? 'text-white' : 'text-black'
        } drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]`}
      >
        {piece.type === 'checker' ? (
          <div className={`w-3/4 h-3/4 rounded-full border-2 ${
            piece.color === 'white' ? 'bg-white border-gray-200' : 'bg-black border-gray-800'
          }`} />
        ) : (
          <span className="text-4xl sm:text-5xl leading-none flex items-center justify-center w-full h-full">
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

    const x1 = sc * sz + sz/2;
    const y1 = sr * sz + sz/2;
    const x2 = ec * sz + sz/2;
    const y2 = er * sz + sz/2;

    return (
      <line
        key={`${arrow.start.r}-${arrow.start.c}-${arrow.end.r}-${arrow.end.c}-${isTemp}`}
        x1={`${x1}%`} y1={`${y1}%`} x2={`${x2}%`} y2={`${y2}%`}
        stroke={isTemp ? "rgba(34, 197, 94, 0.5)" : "rgba(34, 197, 94, 0.8)"}
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
      <div className="flex-[2] w-full bg-high-card border border-high-border p-8 flex items-center justify-center relative min-h-[400px] sm:min-h-[640px]">
        {/* Chessboard */}
        <div 
          className="relative aspect-square w-full max-w-[512px] border-4 border-high-border high-density-shadow bg-high-deep overflow-hidden select-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <div 
            ref={boardRef}
            className="grid grid-cols-8 grid-rows-8 w-full h-full"
            style={{ 
                transform: isFlipped ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)' 
            }}
          >
            {board.map((rowArr, rowIndex) => 
               rowArr.map((piece, colIndex) => {
                 const isDark = (rowIndex + colIndex) % 2 === 1;
                 return (
                   <div
                     key={`${rowIndex}-${colIndex}`}
                     id={`square-${rowIndex}-${colIndex}`}
                     onMouseDown={() => handleSquareMouseDown(rowIndex, colIndex)}
                     onMouseEnter={() => handleSquareMouseEnter(rowIndex, colIndex)}
                     className={`w-full h-full relative flex items-center justify-center pointer-events-auto transition-colors duration-200 ${
                       isDark ? 'bg-[#4b5563]' : 'bg-[#d1d5db]'
                     } ${interactionMode === 'place' ? 'hover:bg-high-accent/20 cursor-pointer' : ''}`}
                   >
                     <div 
                        className="w-full h-full absolute inset-0 flex items-center justify-center pointer-events-none"
                        style={{ transform: isFlipped ? 'rotate(180deg)' : 'none' }}
                     >
                       <AnimatePresence>
                         {renderPiece(piece, rowIndex, colIndex)}
                       </AnimatePresence>
                     </div>
                   </div>
                 );
               })
            )}
          </div>

          {/* Arrow Overlay */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
            <defs>
              <marker id="arrowhead" markerWidth="3" markerHeight="3" refX="1.5" refY="1.5" orient="auto">
                <polygon points="0 0, 3 1.5, 0 3" fill="rgba(34, 197, 94, 0.8)" />
              </marker>
            </defs>
            {arrows.map(a => renderArrow(a))}
            {drawingArrow && renderArrow({ start: drawingArrow.start, end: drawingArrow.current }, true)}
          </svg>
        </div>
      </div>

      {/* Right Column: Piece Selection & Actions */}
      <div className="flex-1 w-full flex flex-col gap-4">
        {/* Simple Mode Selector */}
        <div className="grid grid-cols-2 gap-1 bg-high-card border border-high-border p-1">
          {[
            { id: 'place', icon: Sparkles, label: 'PLACE' },
            { id: 'arrow', icon: MousePointer2, label: 'DRAW' }
          ].map(m => (
            <button
              key={m.id}
              onClick={() => { setInteractionMode(m.id as any); setArrows([]); }}
              className={`flex flex-col items-center justify-center py-2 mono-micro gap-1 transition-all ${
                interactionMode === m.id ? 'bg-high-accent text-black font-black' : 'text-high-muted hover:bg-high-deep'
              }`}
            >
              <m.icon size={14} />
              <span className="text-[8px]">{m.label}</span>
            </button>
          ))}
        </div>

        {/* Piece Palette */}
        <div className="bg-high-card border border-high-border p-3">
          <div className="space-y-4">
            <div>
              <div className="grid grid-cols-7 gap-1">
                {pieces.map(type => (
                  <button
                    key={`white-${type}`}
                    onClick={() => { setSelectedBrush({ type, color: 'white' }); setInteractionMode('place'); }}
                    className={`h-11 border border-high-border flex items-center justify-center transition-all ${
                      selectedBrush?.type === type && selectedBrush?.color === 'white' && interactionMode === 'place'
                        ? 'bg-high-accent text-black shadow-[0_0_10px_rgba(34,197,94,0.3)]' : 'bg-high-deep text-white hover:bg-high-border'
                    }`}
                  >
                    {type === 'checker' ? (
                      <div className="w-5 h-5 rounded-full bg-white border border-gray-200" />
                    ) : (
                      <span className="text-2xl pt-1 leading-none">{UNICODE_PIECES.white[type]}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="grid grid-cols-7 gap-1">
                {pieces.map(type => (
                  <button
                    key={`black-${type}`}
                    onClick={() => { setSelectedBrush({ type, color: 'black' }); setInteractionMode('place'); }}
                    className={`h-11 border border-high-border flex items-center justify-center transition-all ${
                      selectedBrush?.type === type && selectedBrush?.color === 'black' && interactionMode === 'place'
                        ? 'bg-high-accent text-black shadow-[0_0_10px_rgba(34,197,94,0.3)]' : 'bg-[#4b5563] text-black hover:brightness-110'
                    }`}
                  >
                    {type === 'checker' ? (
                      <div className="w-5 h-5 rounded-full bg-black border border-gray-800" />
                    ) : (
                      <span className="text-2xl pt-1 leading-none">{UNICODE_PIECES.black[type]}</span>
                    )}
                  </button>
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
          <button 
            onClick={clearBoard}
            className="w-full py-4 bg-high-accent text-black font-black uppercase text-xs tracking-widest hover:brightness-110 active:scale-[0.98] transition-all shadow-lg"
          >
            Reset Board
          </button>

          <button 
            onClick={() => setIsFlipped(!isFlipped)}
            className="w-full py-3 border border-high-border text-high-muted hover:text-white mono-micro transition-colors flex items-center justify-center gap-2"
          >
            <RotateCw size={14} />
            Flip Perspective
          </button>
        </div>
      </div>
    </div>
  );
}
