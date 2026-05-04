/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PieceType = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king' | 'checker' | 'checkerKing';
export type PieceColor = 'white' | 'black';

export interface Piece {
  id: string;
  type: PieceType;
  color: PieceColor;
}

export type BoardState = (Piece | null)[][];

export const UNICODE_PIECES: Record<PieceColor, Record<PieceType, string>> = {
  white: {
    king: '♚',
    queen: '♛',
    rook: '♜',
    bishop: '♝',
    knight: '♞',
    pawn: '♟',
    checker: '●',
    checkerKing: '◎',
  },
  black: {
    king: '♚',
    queen: '♛',
    rook: '♜',
    bishop: '♝',
    knight: '♞',
    pawn: '♟',
    checker: '●',
    checkerKing: '◎',
  },
};
