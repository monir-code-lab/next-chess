import { Chess, Color, PieceSymbol } from 'chess.js';

export type PieceCode = `${Color}${PieceSymbol}`;
export type PieceType = PieceCode | null;
export type BoardState = PieceType[][];
export type Move = {
    fromRow: number;
    fromCol: number;
    toRow: number;
    toCol: number;
    piece: string;
};

export const pieceImages: Record<string, string> = {
    'wk': 'https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg',
    'wq': 'https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg',
    'wr': 'https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg',
    'wb': 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg',
    'wn': 'https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg',
    'wp': 'https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg',
    'bk': 'https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg',
    'bq': 'https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg',
    'br': 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg',
    'bb': 'https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg',
    'bn': 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg',
    'bp': 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg',
};

export const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
export const initialFen = new Chess().fen();

export function getBoardStateFromFen(fen: string): BoardState {
    const chess = new Chess(fen);
    return chess.board().map(row => 
        row.map(piece => piece ? `${piece.color}${piece.type}` as PieceCode : null)
    );
}

export const initialBoard: BoardState = getBoardStateFromFen(initialFen);

export function sqToRc(sq: string) {
    const col = files.indexOf(sq[0]);
    const row = 8 - parseInt(sq[1]);
    return { row, col };
}

export function rcToSq(row: number, col: number): string {
    return `${files[col]}${8 - row}`;
}

export function createChessFromFen(fen: string): Chess {
    return new Chess(fen);
}

export function chessToUciHistory(chess: Chess): string[] {
    return chess.history({ verbose: true }).map(move => `${move.from}${move.to}${move.promotion ?? ''}`);
}

export function generateAllMoves(fen: string): Move[] {
    const chess = new Chess(fen);
    return chess.moves({ verbose: true }).map(m => {
        const from = sqToRc(m.from);
        const to = sqToRc(m.to);
        return {
            fromRow: from.row,
            fromCol: from.col,
            toRow: to.row,
            toCol: to.col,
            piece: `${m.color}${m.piece}`
        };
    });
}

export function isMoveLegal(fen: string, startRow: number, startCol: number, endRow: number, endCol: number, promotion: string = 'q'): boolean {
    const chess = new Chess(fen);
    try {
        const move = chess.move({
            from: rcToSq(startRow, startCol),
            to: rcToSq(endRow, endCol),
            promotion
        });
        return move !== null;
    } catch {
        return false;
    }
}

export function isCheckmate(fen: string): boolean {
    return new Chess(fen).isCheckmate();
}

export function isStalemate(fen: string): boolean {
    const chess = new Chess(fen);
    return chess.isStalemate() || chess.isDraw() || chess.isInsufficientMaterial() || chess.isThreefoldRepetition();
}

export function convertToUCI(startRow: number, startCol: number, endRow: number, endCol: number, pieceType: string): string {
    const startCoord = rcToSq(startRow, startCol);
    const endCoord = rcToSq(endRow, endCol);
    const promotion = (pieceType[1] === 'p' && (endRow === 0 || endRow === 7)) ? 'q' : '';
    return `${startCoord}${endCoord}${promotion}`;
}

export function moveToUci(from: string, to: string, promotion?: string): string {
    return `${from}${to}${promotion ?? ''}`;
}

export function coordToSquareLoc(coord: string) {
    return sqToRc(coord);
}

export interface OpeningInfo {
    nameEn: string;
    nameBn: string;
    eco: string;
    moves: string[];
}

export const openingMap: Record<string, OpeningInfo> = {
  none: { nameEn: 'Starting Position', nameBn: 'প্রারম্ভিক অবস্থান', eco: 'A00', moves: [] },
  italian: { nameEn: 'Italian Game', nameBn: 'ইতালীয় গেম', eco: 'C50', moves: ['e2e4','e7e5','g1f3','b8c6','f1c4'] },
  ruyLopez: { nameEn: 'Ruy Lopez', nameBn: 'রুই লোপেজ', eco: 'C60', moves: ['e2e4','e7e5','g1f3','b8c6','f1b5'] },
  scotchGame: { nameEn: 'Scotch Game', nameBn: 'স্কচ গেম', eco: 'C44', moves: ['e2e4','e7e5','g1f3','b8c6','d2d4'] },
  viennaGame: { nameEn: 'Vienna Game', nameBn: 'ভিয়েনা গেম', eco: 'C25', moves: ['e2e4','e7e5','b1c3'] },
  kingsGambit: { nameEn: "King's Gambit", nameBn: 'কিংস গ্যাম্বিট', eco: 'C30', moves: ['e2e4','e7e5','f2f4'] },
  evansGambit: { nameEn: "Evans Gambit", nameBn: 'ইভান্স গ্যাম্বিট', eco: 'C51', moves: ['e2e4', 'e7e5','g1f3','b8c6','f1c4','f8c5','b2b4'] },
  danishGambit: { nameEn: "Danish Gambit", nameBn: 'ড্যানিশ গ্যাম্বিট', eco: 'C21', moves: ['e2e4','e7e5','d2d4','e5d4','c2c3'] },
  philidorDefense: { nameEn: "Philidor Defense", nameBn: 'ফিলিডোর ডিফেন্স', eco: 'C41', moves: ['e2e4','e7e5','g1f3','d7d6'] },
  sicilian: { nameEn: "Sicilian Defense", nameBn: 'সিসিলিয়ান ডিফেন্স', eco: 'B20', moves: ['e2e4','c7c5'] },
  caroKann: { nameEn: "Caro-Kann Defense", nameBn: 'কারো-কান ডিফেন্স', eco: 'B10', moves: ['e2e4','c7c6'] },
  frenchDefense: { nameEn: "French Defense", nameBn: 'ফ্রেঞ্চ ডিফেন্স', eco: 'C00', moves: ['e2e4','e7e6'] },
  alekhineDefense: { nameEn: "Alekhine's Defense", nameBn: 'আলেখিন ডিফেন্স', eco: 'B02', moves: ['e2e4','g8f6'] },
  scandinavianDefense: { nameEn: "Scandinavian Defense", nameBn: 'স্ক্যান্ডিনেভিয়ান ডিফেন্স', eco: 'B01', moves: ['e2e4','d7d5'] },
  pircDefense: { nameEn: "Pirc Defense", nameBn: 'পিয়ার্স ডিফেন্স', eco: 'B07', moves: ['e2e4', 'd7d6', 'd2d4', 'g8f6'] },
  modernDefense: { nameEn: "Modern Defense", nameBn: 'মডার্ন ডিফেন্স', eco: 'B06', moves: ['e2e4', 'g7g6'] },
  queensGambit: { nameEn: "Queen's Gambit", nameBn: 'কুইন্স গ্যাম্বিট', eco: 'D06', moves: ['d2d4', 'd7d5', 'c2c4'] },
  londonSystem: { nameEn: "London System", nameBn: 'লন্ডন সিস্টেম', eco: 'D02', moves: ['d2d4', 'd7d5', 'g1f3', 'g8f6', 'c1f4'] },
  slavDefense: { nameEn: "Slav Defense", nameBn: 'স্লাভ ডিফেন্স', eco: 'D10', moves: ['d2d4', 'd7d5', 'c2c4', 'c7c6'] },
  kingsIndian: { nameEn: "King's Indian Defense", nameBn: 'কিংস ইন্ডিয়ান ডিফেন্স', eco: 'E60', moves: ['d2d4', 'g8f6', 'c2c4', 'g7g6'] },
  nimzoIndian: { nameEn: "Nimzo-Indian Defense", nameBn: 'নিমসো-ইন্ডিয়ান ডিফেন্স', eco: 'E20', moves: ['d2d4', 'g8f6', 'c2c4', 'e7e6', 'b1c3', 'f8b4'] },
  bogoIndian: { nameEn: "Bogo-Indian Defense", nameBn: 'বোগো-ইন্ডিয়ান ডিফেন্স', eco: 'E11', moves: ['d2d4', 'g8f6', 'c2c4', 'e7e6', 'g1f3', 'f8b4'] },
  grunfeldDefense: { nameEn: "Grünfeld Defense", nameBn: 'গ্রুনফেল্ড ডিফেন্স', eco: 'D80', moves: ['d2d4', 'g8f6', 'c2c4', 'g7g6', 'b1c3', 'd7d5'] },
  dutchDefense: { nameEn: "Dutch Defense", nameBn: 'ডাচ ডিফেন্স', eco: 'A80', moves: ['d2d4', 'f7f5'] },
  benoniDefense: { nameEn: "Benoni Defense", nameBn: 'বেনোনি ডিফেন্স', eco: 'A43', moves: ['d2d4', 'g8f6', 'c2c4', 'c7c5'] },
  benkoGambit: { nameEn: "Benko Gambit", nameBn: 'বেঙ্কো গ্যাম্বিট', eco: 'A57', moves: ['d2d4', 'g8f6', 'c2c4', 'c7c5', 'd4d5', 'b7b5'] },
  trompowskyAttack: { nameEn: "Trompowsky Attack", nameBn: 'ট্রম্পোস্কি অ্যাটাক', eco: 'A45', moves: ['d2d4', 'g8f6', 'c1g5'] },
  budapestGambit: { nameEn: "Budapest Gambit", nameBn: 'বুদাপেস্ট গ্যাম্বিট', eco: 'A52', moves: ['d2d4', 'g8f6', 'c2c4', 'e7e5'] },
  catalanOpening: { nameEn: "Catalan Opening", nameBn: 'কাতালান ওপেনিং', eco: 'E00', moves: ['d2d4', 'g8f6', 'c2c4', 'e7e6', 'g2g3'] },
  englishOpening: { nameEn: "English Opening", nameBn: 'ইংলিশ ওপেনিং', eco: 'A10', moves: ['c2c4'] },
  retiOpening: { nameEn: "Réti Opening", nameBn: 'রেটি ওপেনিং', eco: 'A04', moves: ['g1f3'] },
  kingsIndianAttack: { nameEn: "King's Indian Attack", nameBn: 'কিংস ইন্ডিয়ান অ্যাটাক', eco: 'A07', moves: ['g1f3','d7d5','g2g3'] },
  birdsOpening: { nameEn: "Bird's Opening", nameBn: 'বার্ডস ওপেনিং', eco: 'A02', moves: ['f2f4'] },
};

export type MatchType = 'exact' | 'partial' | 'none';

export interface OpeningMatch {
    opening: OpeningInfo | null;
    matchType: MatchType;
}

/**
 * Highly optimized function to identify the current opening.
 * It compares the current game's UCI history against the openingMap.
 * 
 * Optimization Note for Next.js:
 * To prevent re-renders on every piece drag, use `useMemo` in your React component:
 * const currentOpening = useMemo(() => identifyOpening(uciHistory), [uciHistory]);
 * 
 * @param currentHistory - Array of UCI move strings (e.g., ['e2e4', 'e7e5']).
 * @returns The best matching opening info and whether it is an exact or partial match.
 */
export function identifyOpening(currentHistory: string[]): OpeningMatch {
    if (!currentHistory || currentHistory.length === 0) {
        return { opening: openingMap.none, matchType: 'exact' };
    }

    let bestMatch: OpeningInfo | null = null;
    let maxMatchLength = 0;
    let isExact = false;

    for (const key in openingMap) {
        if (key === 'none') continue;
        const opening = openingMap[key];
        const moves = opening.moves;
        
        let matchLength = 0;
        const minLength = Math.min(currentHistory.length, moves.length);
        
        for (let i = 0; i < minLength; i++) {
            if (currentHistory[i] === moves[i]) {
                matchLength++;
            } else {
                break;
            }
        }

        // If this opening has a longer match than the previous best
        if (matchLength > maxMatchLength && matchLength > 0) {
            maxMatchLength = matchLength;
            bestMatch = opening;
            isExact = matchLength === moves.length;
        } else if (matchLength === maxMatchLength && matchLength > 0) {
            // Tie-breaker: If we have multiple partial matches of the same length, 
            // prefer the opening that is shorter (closer to completion)
            if (bestMatch && moves.length < bestMatch.moves.length) {
                 bestMatch = opening;
                 isExact = matchLength === moves.length;
            }
        }
    }

    if (maxMatchLength === 0) {
        return { opening: null, matchType: 'none' };
    }

    return {
        opening: bestMatch,
        matchType: isExact ? 'exact' : 'partial'
    };
}

/**
 * Applies a sequence of UCI moves to a chess board and returns the resulting states.
 * This function is pure and does not mutate any external state.
 * 
 * Performance & Memory Leak Note:
 * Creating `new Chess()` multiple times inside loops or on every rapid UI update 
 * (like piece dragging) can cause memory bloat and performance degradation in V8.
 * For heavy computations, reuse a single `Chess` instance and use `.reset()` or `.undo()`,
 * rather than constantly allocating new objects.
 */
export function applyUciMoves(moves: string[]) {
    const chess = new Chess();
    const moveHistory: { color: Color; notation: string }[] = [];
    const historySnapshots = [];
    
    historySnapshots.push({
        fen: chess.fen(),
        lastMoveSquares: [] as { row: number; col: number }[]
    });

    let lastMoveSquares: { row: number; col: number }[] = [];

    for (const uci of moves) {
        const fromCoord = uci.substring(0, 2);
        const toCoord = uci.substring(2, 4);
        const promotion = uci.length > 4 ? uci[4] : undefined;
        
        const fromRc = sqToRc(fromCoord);
        const toRc = sqToRc(toCoord);

        try {
            const moveResult = chess.move({
                from: fromCoord,
                to: toCoord,
                promotion
            });
            
            lastMoveSquares = [fromRc, toRc];
            
            historySnapshots.push({
                fen: chess.fen(),
                lastMoveSquares: [...lastMoveSquares]
            });

            moveHistory.push({ color: moveResult.color, notation: moveResult.san });
        } catch {
            // Stop processing if an illegal move is encountered, keeping the state pure and intact up to the valid point.
            // Removed console.error to avoid side-effects.
            break;
        }
    }

    return {
        fen: chess.fen(),
        boardState: getBoardStateFromFen(chess.fen()),
        moveHistory,
        currentTurn: chess.turn(),
        lastMoveSquares,
        historySnapshots
    };
}

export function boardToFen(board: BoardState): string {
    let fen = '';
    for (let r = 0; r < 8; r++) {
        let emptyCount = 0;
        for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            if (piece === null) {
                emptyCount++;
            } else {
                if (emptyCount > 0) {
                    fen += emptyCount;
                    emptyCount = 0;
                }
                const isWhite = piece[0] === 'w';
                const pType = piece[1];
                fen += isWhite ? pType.toUpperCase() : pType.toLowerCase();
            }
        }
        if (emptyCount > 0) fen += emptyCount;
        if (r < 7) fen += '/';
    }
    return fen;
}