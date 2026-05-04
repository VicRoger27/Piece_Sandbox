/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, RotateCw, Sparkles, Hand, Eraser, MousePointer2, Crown, Settings as SettingsIcon, X } from 'lucide-react';
import { Piece, PieceType, PieceColor, BoardState, UNICODE_PIECES } from '../types';

const INITIAL_BOARD: BoardState = Array(8).fill(null).map(() => Array(8).fill(null));

type AnnotationType = 'arrow' | 'redArrow' | 'countingArrow' | 'cross' | 'tick';

interface Annotation {
  id: string;
  type: AnnotationType;
  start: { r: number; c: number };
  end: { r: number; c: number };
}

const AnnotationComponent = React.memo(({ annotation, isFlipped, isTemp }: { annotation: Annotation; isFlipped: boolean; isTemp?: boolean }) => {
  let sr = annotation.start.r;
  let sc = annotation.start.c;
  let er = annotation.end.r;
  let ec = annotation.end.c;

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

  const getStrokeColor = () => {
    switch (annotation.type) {
      case 'redArrow': return isTemp ? "rgba(239, 68, 68, 0.4)" : "rgba(239, 68, 68, 0.8)";
      case 'countingArrow': return isTemp ? "rgba(249, 115, 22, 0.4)" : "rgba(249, 115, 22, 0.8)";
      default: return isTemp ? "rgba(34, 197, 94, 0.4)" : "rgba(34, 197, 94, 0.8)";
    }
  };

  const isPoint = annotation.type === 'cross' || annotation.type === 'tick';

  if (isPoint) {
    const colorClass = annotation.type === 'cross' ? 'text-red-500' : 'text-green-500';
    return (
      <foreignObject x={`${x1 - 6}%`} y={`${y1 - 6}%`} width="12%" height="12%">
        <motion.div 
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`flex items-center justify-center w-full h-full ${colorClass}`}
        >
          {annotation.type === 'cross' ? (
            <span className="text-3xl font-bold select-none drop-shadow-md">✕</span>
          ) : (
            <span className="text-3xl font-bold select-none drop-shadow-md">✓</span>
          )}
        </motion.div>
      </foreignObject>
    );
  }

  // Counting logic for orange arrows
  const steps = Math.max(Math.abs(er - sr), Math.abs(ec - sc));
  const countIndicators = [];
  if (annotation.type === 'countingArrow' && steps > 0) {
    for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const curR = sr + (er - sr) * t;
        const curC = sc + (ec - sc) * t;
        const countX = (curC + 0.5) * (100 / 8);
        const countY = (curR + 0.5) * (100 / 8);
        countIndicators.push(
            <foreignObject key={i} x={`${countX - 3.5}%`} y={`${countY - 3.5}%`} width="7%" height="7%">
                <div className="flex items-center justify-center w-full h-full">
                    <span className="bg-orange-500 text-white text-[10px] sm:text-xs font-black rounded-full w-full h-full flex items-center justify-center shadow-lg border border-white/40 select-none">
                        {i}
                    </span>
                </div>
            </foreignObject>
        );
    }
  }

  const markerId = annotation.type === 'redArrow' ? 'arrowhead-red' : 
                   annotation.type === 'countingArrow' ? 'arrowhead-orange' : 
                   'arrowhead';

  return (
    <>
      <motion.line
        initial={{ opacity: 0, pathLength: 0 }}
        animate={{ opacity: 1, pathLength: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.4 } }}
        x1={`${x1}%`} y1={`${y1}%`} x2={`${x2}%`} y2={`${y2}%`}
        stroke={getStrokeColor()}
        strokeWidth="10"
        markerEnd={`url(#${markerId})`}
        strokeLinecap="round"
      />
      {countIndicators}
    </>
  );
});

const PieceComponent = React.memo(({ piece, isFlinging }: { piece: Piece; isFlinging?: boolean }) => {
  const isChecker = piece.type === 'checker' || piece.type === 'checkerKing';
  
  // Random directions for flinging
  const flingX = useRef((Math.random() - 0.5) * 1000);
  const flingY = useRef((Math.random() - 0.5) * 1000);
  const flingRotate = useRef((Math.random() - 0.5) * 720);

  return (
    <motion.div
      layoutId={piece.id}
      initial={{ scale: 0.3, opacity: 0, y: -40, rotate: -15 }}
      animate={isFlinging ? { 
        x: flingX.current, 
        y: flingY.current, 
        rotate: flingRotate.current,
        scale: 0,
        opacity: 0 
      } : { 
        scale: 1, 
        opacity: 1, 
        y: 0, 
        rotate: 0,
        x: 0
      }}
      exit={{ scale: 0.5, opacity: 0, y: 20 }}
      transition={isFlinging ? {
        duration: 1.2,
        ease: "easeIn"
      } : {
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
      {isChecker ? (
        <div className={`w-3/4 h-3/4 rounded-full border-2 flex items-center justify-center relative ${
          piece.color === 'white' ? 'bg-white border-gray-200' : 'bg-slate-900 border-gray-800 shadow-lg'
        }`}>
          {piece.type === 'checkerKing' && (
            <Crown 
              size={14} 
              className={piece.color === 'white' ? 'text-slate-400' : 'text-white/20'} 
              strokeWidth={3}
            />
          )}
        </div>
      ) : (
        <span className="text-4xl sm:text-5xl leading-none flex items-center justify-center w-full h-full transform transition-transform">
          {UNICODE_PIECES[piece.color][piece.type]}
        </span>
      )}
    </motion.div>
  );
});

const SquareBG = React.memo(({ 
  row, 
  col, 
  isDark, 
  hasPiece, 
  isFlipped,
  interactionMode, 
  selectedBrush,
  isFlinging,
  onSquareMouseDown, 
  onSquareMouseEnter,
  onSquareMouseLeave 
}: { 
  row: number; 
  col: number; 
  isDark: boolean; 
  hasPiece: boolean; 
  isFlipped: boolean;
  interactionMode: string;
  selectedBrush: { type: PieceType; color: PieceColor } | null;
  isFlinging: boolean;
  onSquareMouseDown: (r: number, c: number, e: React.MouseEvent) => void;
  onSquareMouseEnter: (r: number, c: number) => void;
  onSquareMouseLeave: () => void;
}) => {
  return (
    <motion.div
      onMouseDown={(e) => onSquareMouseDown(row, col, e)}
      onMouseEnter={() => onSquareMouseEnter(row, col)}
      onMouseLeave={onSquareMouseLeave}
      whileHover={{ zIndex: 10 }}
      initial={{ scale: 1, opacity: 1, borderRadius: '0%' }}
      animate={isFlinging ? { 
        scale: 0.7, 
        opacity: 0.6,
        borderRadius: '50%',
      } : { 
        scale: 1, 
        opacity: 1,
        borderRadius: '0%',
      }}
      transition={{ duration: 1.2, ease: "easeInOut" }}
      className={`w-full h-full relative flex items-center justify-center pointer-events-auto transition-all duration-700 ${
        isDark ? 'bg-high-deep/40' : 'bg-high-text/90'
      } ${interactionMode === 'place' ? 'hover:bg-high-accent/10 cursor-crosshair' : ''}`}
    >
      {!hasPiece && interactionMode === 'place' && selectedBrush && (
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-40 flex items-center justify-center transition-opacity pointer-events-none"
          style={{ transform: isFlipped ? 'rotate(180deg)' : 'none' }}
        >
          <motion.div 
            initial={{ scale: 0.8, rotate: -10 }}
            whileHover={{ scale: 1.1, rotate: 0 }}
            className={`flex items-center justify-center ${selectedBrush.color === 'white' ? 'text-white/30' : 'text-slate-900/40'}`}
          >
            {selectedBrush.type === 'checkerKing' ? (
              <div className={`w-3/4 h-3/4 rounded-full border-2 flex items-center justify-center relative ${
                selectedBrush.color === 'white' ? 'bg-white/20 border-white/30' : 'bg-slate-900/20 border-slate-900/30'
              }`}>
                <Crown size={14} strokeWidth={3} className="opacity-40" />
              </div>
            ) : selectedBrush.type === 'checker' ? (
              <div className={`w-3/4 h-3/4 rounded-full border-2 ${
                selectedBrush.color === 'white' ? 'bg-white/20 border-white/30' : 'bg-slate-900/20 border-slate-900/30'
              }`} />
            ) : (
              <span className="text-4xl sm:text-5xl leading-none">
                {UNICODE_PIECES[selectedBrush.color][selectedBrush.type]}
              </span>
            )}
          </motion.div>
        </div>
      )}
    </motion.div>
  );
});

const PieceLayer = React.memo(({ piece, isFlinging, isFlipped, typeFilter }: { piece: Piece | null; isFlinging: boolean; isFlipped: boolean; typeFilter?: 'kings-only' | 'no-kings' }) => {
  const shouldShow = piece && (
    !typeFilter || 
    (typeFilter === 'kings-only' ? piece.type === 'checkerKing' : piece.type !== 'checkerKing')
  );

  return (
    <div 
      className="w-full h-full flex items-center justify-center pointer-events-none"
      style={{ transform: isFlipped ? 'rotate(180deg)' : 'none' }}
    >
      <AnimatePresence mode="popLayout">
        {shouldShow && <PieceComponent piece={piece} isFlinging={isFlinging} />}
      </AnimatePresence>
    </div>
  );
});

export default function ChessBoard({ 
  isSettingsOpen, 
  setIsSettingsOpen 
}: { 
  isSettingsOpen: boolean; 
  setIsSettingsOpen: (open: boolean) => void; 
}) {
  const [board, setBoard] = useState<BoardState>(INITIAL_BOARD);
  const [selectedBrush, setSelectedBrush] = useState<{ type: PieceType; color: PieceColor } | null>(null);
  const [interactionMode, setInteractionMode] = useState<'place' | 'arrow'>('place');
  const [isFlipped, setIsFlipped] = useState(false);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [drawingAnnotation, setDrawingAnnotation] = useState<{ start: { r: number, c: number }, current: { r: number, c: number }, type: AnnotationType } | null>(null);
  const [annotationMode, setAnnotationMode] = useState<AnnotationType>('arrow');
  const boardRef = useRef<HTMLDivElement>(null);
  const [isPainting, setIsPainting] = useState(false);
  const [isFlinging, setIsFlinging] = useState(false);
  const [showTips, setShowTips] = useState(true);
  const [hoveredSquare, setHoveredSquare] = useState<{r: number, c: number} | null>(null);
  const [isRKeyPressed, setIsRKeyPressed] = useState(false);
  const [colorfulMode, setColorfulMode] = useState(false);

  // Piece placing logic
  const placePiece = useCallback((row: number, col: number, toggle = false) => {
    if (!selectedBrush || interactionMode !== 'place') return;
    setBoard(prev => {
      const newBoard = [...prev.map(r => [...r])];
      const existing = newBoard[row][col];

      if (toggle && existing?.type === selectedBrush.type && existing?.color === selectedBrush.color) {
        newBoard[row][col] = null;
      } else {
        newBoard[row][col] = {
          id: Math.random().toString(36).substr(2, 9),
          ...selectedBrush
        };
      }
      return newBoard;
    });
  }, [selectedBrush, interactionMode]);

  const clearBoard = useCallback(() => {
    setBoard(INITIAL_BOARD);
    setAnnotations([]);
  }, []);

  const handleFlip = useCallback(() => {
    const today = new Date();
    const isAprilFools = today.getMonth() === 3 && today.getDate() === 1;

    if (isAprilFools) {
      setIsFlinging(true);
      setTimeout(() => {
        setBoard(INITIAL_BOARD);
        setIsFlinging(false);
        setIsFlipped(prev => !prev);
      }, 1200);
    } else {
      setIsFlipped(prev => !prev);
    }
  }, []);

  const getSquareFromPoint = useCallback((x: number, y: number) => {
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
  }, [isFlipped]);

  const handleSquareMouseDown = useCallback((row: number, col: number, e: React.MouseEvent) => {
    if (interactionMode === 'place' && selectedBrush && e.button === 0) {
      setIsPainting(true);
      placePiece(row, col, true);
    }
  }, [interactionMode, selectedBrush, placePiece]);

  const handleSquareMouseEnter = useCallback((row: number, col: number) => {
    setHoveredSquare({ r: row, c: col });
    if (isPainting && interactionMode === 'place' && selectedBrush) {
      placePiece(row, col, false);
    }
  }, [isPainting, interactionMode, selectedBrush, placePiece]);

  const handleSquareMouseLeave = useCallback(() => {
    setHoveredSquare(null);
  }, []);

  // Arrow drawing logic
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target instanceof HTMLButtonElement || (e.target as HTMLElement).closest('button')) return;
    
    const isRightClick = e.button === 2;
    const isLeftClick = e.button === 0;
    const isMarkMode = interactionMode === 'arrow';

    // Shortcut logic
    if ((isMarkMode && isLeftClick) || isRightClick) {
      const square = getSquareFromPoint(e.clientX, e.clientY);
      if (square) {
        let type: AnnotationType = 'arrow';
        
        if (isRightClick) {
            if (e.shiftKey) {
                type = 'countingArrow';
            } else if (!isMarkMode && isRKeyPressed) {
                // "red arrow = ... otherwise r+r-click"
                type = 'redArrow';
            } else {
                // "green arrow = r-click"
                type = 'arrow';
            }
        } else if (isMarkMode && isLeftClick) {
            // "red arrow = l-click when on the mark section"
            type = 'redArrow';
        }

        setDrawingAnnotation({ 
            start: square, 
            current: square,
            type 
        });
      }
    }
  }, [interactionMode, isRKeyPressed, getSquareFromPoint]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!drawingAnnotation) return;
    const square = getSquareFromPoint(e.clientX, e.clientY);
    if (square) {
      setDrawingAnnotation(prev => prev ? { ...prev, current: square } : null);
    }
  }, [drawingAnnotation, getSquareFromPoint]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    setIsPainting(false);
    if (!drawingAnnotation) return;
    
    const square = getSquareFromPoint(e.clientX, e.clientY);
    if (square) {
      setAnnotations(prev => {
        // Points (cross/tick) toggle on mouse up at same square
        const isPoint = drawingAnnotation.type === 'cross' || drawingAnnotation.type === 'tick';
        
        const existingAnnotationIndex = prev.findIndex(a => 
          a.type === drawingAnnotation.type &&
          a.start.r === drawingAnnotation.start.r && a.start.c === drawingAnnotation.start.c &&
          a.end.r === square.r && a.end.c === square.c
        );

        if (existingAnnotationIndex >= 0) {
          return prev.filter((_, i) => i !== existingAnnotationIndex);
        } else {
          // If point, ensure start=end
          const start = drawingAnnotation.start;
          const end = isPoint ? drawingAnnotation.start : square;
          
          // Don't add zero-length arrows unless they are points
          if (!isPoint && start.r === end.r && start.c === end.c) return prev;

          return [...prev, { 
            id: `${drawingAnnotation.type}-${start.r}-${start.c}-${end.r}-${end.c}-${Date.now()}`,
            type: drawingAnnotation.type,
            start, 
            end
          }];
        }
      });
    }
    setDrawingAnnotation(null);
  }, [drawingAnnotation, getSquareFromPoint]);

  useEffect(() => {
    setIsPainting(false);
    setDrawingAnnotation(null);
  }, [interactionMode]);

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsPainting(false);
    
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'r') setIsRKeyPressed(true);
      
      if ((key === 'n' || key === 't') && hoveredSquare) {
          const type: AnnotationType = key === 'n' ? 'cross' : 'tick';
          setAnnotations(prev => {
              const existingIdx = prev.findIndex(a => a.type === type && a.start.r === hoveredSquare.r && a.start.c === hoveredSquare.c);
              if (existingIdx >= 0) {
                  return prev.filter((_, i) => i !== existingIdx);
              }
              return [...prev, {
                  id: `${type}-${hoveredSquare.r}-${hoveredSquare.c}-${Date.now()}`,
                  type,
                  start: hoveredSquare,
                  end: hoveredSquare
              }];
          });
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'r') setIsRKeyPressed(false);
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    window.addEventListener('contextmenu', handleContextMenu);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('contextmenu', handleContextMenu);
    }
  }, [hoveredSquare]);

  const pieces: PieceType[] = ['king', 'queen', 'rook', 'bishop', 'knight', 'pawn', 'checker', 'checkerKing'];

  return (
    <div className="flex flex-col xl:flex-row gap-6 w-full max-w-[1200px] mx-auto h-full items-start overflow-hidden">
      <motion.div 
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="flex-[2] w-full p-8 flex items-center justify-center relative min-h-[400px] sm:min-h-[640px]"
      >
        <motion.div 
          className={`relative aspect-square w-full max-w-[512px] border-high-deep shadow-2xl overflow-hidden select-none p-2 ${
            interactionMode === 'place' ? 'cursor-crosshair' : 'cursor-cell'
          }`}
          style={{ 
            backgroundColor: colorfulMode ? '#14212e' : 'var(--high-deep)',
            borderStyle: 'groove',
            borderWidth: '13px',
            borderRadius: '1px'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <div 
            ref={boardRef}
            className="w-full h-full relative"
            style={{ 
                transform: isFlipped ? 'rotate(180deg)' : 'none',
                transition: 'transform 1.2s cubic-bezier(0.65, 0, 0.35, 1)' 
            }}
          >
            {/* Layer 1: Squares Background Layer */}
            <div 
              className="grid grid-cols-8 grid-rows-8 w-full h-full transition-all duration-300"
              style={{ gap: isFlinging ? '12px' : '1px', transition: 'gap 1.2s cubic-bezier(0.65, 0, 0.35, 1)' }}
            >
              {board.map((rowArr, rowIndex) => 
                rowArr.map((piece, colIndex) => (
                  <SquareBG
                    key={`bg-${rowIndex}-${colIndex}`}
                    row={rowIndex}
                    col={colIndex}
                    isDark={(rowIndex + colIndex) % 2 === 1}
                    hasPiece={!!piece}
                    isFlipped={isFlipped}
                    interactionMode={interactionMode}
                    selectedBrush={selectedBrush}
                    isFlinging={isFlinging}
                    onSquareMouseDown={handleSquareMouseDown}
                    onSquareMouseEnter={handleSquareMouseEnter}
                    onSquareMouseLeave={handleSquareMouseLeave}
                  />
                ))
              )}
            </div>

            {/* Layer 1.5: Lower Pieces Layer (Standard pieces, beneath arrows) */}
            <div 
              className="grid grid-cols-8 grid-rows-8 w-full h-full absolute inset-0 pointer-events-none z-[5]"
              style={{ gap: isFlinging ? '12px' : '1px', transition: 'gap 1.2s cubic-bezier(0.65, 0, 0.35, 1)' }}
            >
              {board.map((rowArr, rowIndex) => 
                rowArr.map((piece, colIndex) => (
                  <PieceLayer
                    key={`lower-piece-${rowIndex}-${colIndex}`}
                    piece={piece}
                    isFlinging={isFlinging}
                    isFlipped={isFlipped}
                    typeFilter="no-kings"
                  />
                ))
              )}
            </div>

            {/* Layer 2: Annotations Overlay Layer */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-10">
              <defs>
                <marker id="arrowhead" markerWidth="3" markerHeight="3" refX="1" refY="1.5" orient="auto">
                  <polygon points="0 0, 3 1.5, 0 3" fill="rgba(34, 197, 94, 0.8)" />
                </marker>
                <marker id="arrowhead-red" markerWidth="3" markerHeight="3" refX="1" refY="1.5" orient="auto">
                  <polygon points="0 0, 3 1.5, 0 3" fill="rgba(239, 68, 68, 0.8)" />
                </marker>
                <marker id="arrowhead-orange" markerWidth="3" markerHeight="3" refX="1" refY="1.5" orient="auto">
                  <polygon points="0 0, 3 1.5, 0 3" fill="rgba(249, 115, 22, 0.8)" />
                </marker>
              </defs>
              <AnimatePresence>
                {annotations.map(a => <AnnotationComponent key={a.id} annotation={a} isFlipped={isFlipped} />)}
              </AnimatePresence>
              {drawingAnnotation && <AnnotationComponent annotation={{ id: 'drawing', type: drawingAnnotation.type, start: drawingAnnotation.start, end: drawingAnnotation.current }} isFlipped={isFlipped} isTemp />}
            </svg>

            {/* Layer 3: Pieces Foreground Layer (Checkers Kings only, above arrows) */}
            <div 
              className="grid grid-cols-8 grid-rows-8 w-full h-full absolute inset-0 pointer-events-none z-20"
              style={{ gap: isFlinging ? '12px' : '1px', transition: 'gap 1.2s cubic-bezier(0.65, 0, 0.35, 1)' }}
            >
              {board.map((rowArr, rowIndex) => 
                rowArr.map((piece, colIndex) => (
                  <PieceLayer
                    key={`piece-${rowIndex}-${colIndex}`}
                    piece={piece}
                    isFlinging={isFlinging}
                    isFlipped={isFlipped}
                    typeFilter="kings-only"
                  />
                ))
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>

      <motion.div 
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="flex-1 w-full flex flex-col gap-4"
      >
        <div 
          className="relative flex p-1 border border-high-border overflow-hidden h-12"
          style={{ backgroundColor: colorfulMode ? '#192c9e' : 'var(--high-card)' }}
        >
          <motion.div
            className="absolute top-1 bottom-1 bg-high-accent shadow-[0_2px_15px_rgba(34,197,94,0.4)] z-0 rounded-sm"
            animate={{ left: interactionMode === 'place' ? '4px' : 'calc(50% + 2px)' }}
            transition={{ type: "spring", stiffness: 180, damping: 20 }}
            style={{ width: 'calc(50% - 6px)' }}
          />
          {[
            { id: 'place', icon: Sparkles, label: 'PLACE' },
            { id: 'arrow', icon: MousePointer2, label: 'MARK' }
          ].map(m => (
            <button
              key={m.id}
              onClick={() => { setInteractionMode(m.id as any); if (m.id === 'place') setAnnotations([]); }}
              className="relative z-10 flex-1 flex flex-col items-center justify-center mono-micro gap-1"
            >
              <motion.div
                animate={{ 
                  color: interactionMode === m.id 
                    ? (colorfulMode ? '#000000' : '#ffffff') 
                    : '#64748b',
                  scale: interactionMode === m.id ? 1.05 : 1,
                }}
                className="flex flex-col items-center gap-1"
              >
                <m.icon size={14} strokeWidth={interactionMode === m.id ? 3 : 2} />
                <span className={`text-[8px] tracking-[0.2em] ${interactionMode === m.id ? 'font-black' : 'font-bold'}`}>{m.label}</span>
              </motion.div>
            </button>
          ))}
        </div>

        {isSettingsOpen && (
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-high-card border border-high-border p-4 shadow-xl z-50 absolute top-14 right-0 w-full"
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 mono-micro text-xs text-high-muted">
                        <SettingsIcon size={14} className="text-high-accent" />
                        INTERFACE SETTINGS
                    </div>
                    <button onClick={() => setIsSettingsOpen(false)} className="text-high-muted hover:text-white">
                        <X size={14} />
                    </button>
                </div>
                <div className="space-y-3">
                    <label className="flex items-center justify-between cursor-pointer group">
                        <span className="mono-micro text-[10px] text-high-muted group-hover:text-white transition-colors">Show Mouse Shortcuts Tip</span>
                        <input 
                            type="checkbox" 
                            checked={showTips} 
                            onChange={(e) => setShowTips(e.target.checked)}
                            className="accent-high-accent w-3 h-3 bg-high-deep border-none focus:ring-0"
                        />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer group">
                        <span className="mono-micro text-[10px] text-high-muted group-hover:text-white transition-colors">Colorful Mode</span>
                        <input 
                            type="checkbox" 
                            checked={colorfulMode} 
                            onChange={(e) => setColorfulMode(e.target.checked)}
                            className="accent-high-accent w-3 h-3 bg-high-deep border-none focus:ring-0"
                        />
                    </label>
                </div>
                <div className="mt-4 pt-4 border-t border-white/5">
                    <button 
                        onClick={() => { setAnnotations([]); setIsSettingsOpen(false); }}
                        className="w-full py-2 bg-white/5 hover:bg-white/10 text-high-muted hover:text-white mono-micro text-[10px] transition-colors"
                    >
                        Clear All Marks
                    </button>
                </div>
            </motion.div>
        )}

        <div 
            className={`transition-colors duration-300 ${interactionMode === 'arrow' ? 'border border-high-border' : ''}`}
            style={{ backgroundColor: interactionMode === 'arrow' ? (colorfulMode ? '#2d5b88' : 'var(--high-card)') : 'transparent' }}
        >
            {interactionMode === 'arrow' && (
                <motion.div 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-1 p-1"
                >
                    {[
                        { id: 'arrow', color: 'bg-green-500', label: 'Green' },
                        { id: 'redArrow', color: 'bg-red-500', label: 'Red' },
                        { id: 'countingArrow', color: 'bg-orange-500', label: 'COUNT' },
                        { id: 'cross', color: 'bg-red-400', label: 'X' },
                        { id: 'tick', color: 'bg-green-400', label: '✓' },
                    ].map(tool => (
                        <button
                            key={tool.id}
                            onClick={() => setAnnotationMode(tool.id as AnnotationType)}
                            className={`flex-1 h-8 flex flex-col items-center justify-center transition-all border ${
                                annotationMode === tool.id ? 'border-high-accent bg-high-accent/10' : 'border-transparent hover:bg-white/5'
                            }`}
                        >
                            <div className={`w-3 h-3 rounded-full ${tool.color} mb-0.5`} />
                            <span className="text-[8px] mono uppercase text-high-muted font-bold truncate px-1">{tool.label}</span>
                        </button>
                    ))}
                </motion.div>
            )}
        </div>

        <div 
          className="border border-high-border p-3"
          style={{ backgroundColor: colorfulMode ? '#7c2892' : 'var(--high-card)' }}
        >
          <div className="space-y-4">
            <div>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-1">
                {pieces.map(type => (
                  <motion.button
                    key={`white-${type}`}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { setSelectedBrush({ type, color: 'white' }); setInteractionMode('place'); }}
                    className={`h-12 border-2 flex items-center justify-center transition-all duration-300 rounded-md ${
                      selectedBrush?.type === type && selectedBrush?.color === 'white' && interactionMode === 'place'
                        ? 'border-high-accent bg-high-accent/20 text-white' 
                        : 'border-white/5 bg-high-deep/50 text-high-muted hover:border-white/20'
                    }`}
                  >
                    {(type === 'checker' || type === 'checkerKing') ? (
                      <div className={`w-5 h-5 rounded-full bg-white border border-gray-200 flex items-center justify-center ${type === 'checkerKing' ? 'relative' : ''}`}>
                        {type === 'checkerKing' && <Crown size={8} className="text-slate-400" strokeWidth={3} />}
                      </div>
                    ) : (
                      <span className="text-3xl leading-none text-white">{UNICODE_PIECES.white[type]}</span>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>
            <div>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-1">
                {pieces.map(type => (
                  <motion.button
                    key={`black-${type}`}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { setSelectedBrush({ type, color: 'black' }); setInteractionMode('place'); }}
                    className={`h-12 border-2 flex items-center justify-center transition-all duration-300 rounded-md ${
                      selectedBrush?.type === type && selectedBrush?.color === 'black' && interactionMode === 'place'
                        ? 'border-high-accent bg-high-accent/20 text-white' 
                        : 'border-white/5 bg-high-deep/50 text-high-muted hover:border-white/20'
                    }`}
                  >
                    {(type === 'checker' || type === 'checkerKing') ? (
                      <div className={`w-5 h-5 rounded-full bg-black border border-gray-800 flex items-center justify-center ${type === 'checkerKing' ? 'relative' : ''}`}>
                        {type === 'checkerKing' && <Crown size={8} className="text-white/20" strokeWidth={3} />}
                      </div>
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
                onClick={() => setSelectedBrush(null)} 
                className="py-2 border border-high-border mono-micro transition-all"
                style={{ 
                    backgroundColor: colorfulMode ? '#af1f1f' : 'transparent',
                    color: colorfulMode ? 'white' : 'var(--high-muted)',
                    fontFamily: 'Verdana, sans-serif'
                }}
            >
                Deselect
            </button>
            <button 
                onClick={() => setAnnotations([])} 
                className="py-2 border border-high-border mono-micro transition-all"
                style={{ 
                    backgroundColor: colorfulMode ? '#af831a' : 'transparent',
                    color: colorfulMode ? '#342424' : 'var(--high-muted)',
                    fontFamily: 'Arial, sans-serif',
                    fontSize: '10px',
                    fontWeight: 'bold'
                }}
            >
                Clear Marks
            </button>
          </div>
        </div>

        <div className="space-y-2 mt-auto">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={clearBoard}
            className="group relative w-full py-4 bg-high-accent text-black font-black uppercase text-xs tracking-[0.2em] transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)] overflow-hidden hover:brightness-110"
          >
            Reset Board
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleFlip}
            className="w-full py-3 border border-high-border mono-micro transition-colors flex items-center justify-center gap-2"
            style={{ 
                backgroundColor: colorfulMode ? '#23c58c' : 'transparent',
                color: colorfulMode ? 'black' : 'var(--high-muted)',
                fontWeight: colorfulMode ? 'bold' : 'normal'
            }}
          >
            <RotateCw size={14} />
            Flip Perspective
          </motion.button>

          {showTips && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3 border border-white/5 space-y-2"
              style={{ backgroundColor: colorfulMode ? '#181a56' : 'rgba(0,0,0,0.2)' }}
            >
              <div className="flex items-center gap-2 text-[10px] font-bold text-high-accent mono italic">
                TIP
              </div>
              <div className="grid grid-cols-1 gap-1.5 mono-micro text-[9px] text-high-muted">
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span>Green Arrow</span>
                  <span className="text-white">R-Click</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span>Red Arrow</span>
                  <span className="text-white">L-Click (Mark) or R+R-Click</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span>Counting Arrow</span>
                  <span className="text-white">Shift + R-Click</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span>Red Cross ✕</span>
                  <span className="text-white">N</span>
                </div>
                <div className="flex justify-between">
                  <span>Green Tick ✓</span>
                  <span className="text-white">T</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
