export interface HintMove {
  rank: number;
  move: string;
  evaluation: number | null;
  mateIn: number | null;
}
