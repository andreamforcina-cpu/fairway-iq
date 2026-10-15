export type HoleCount = 9 | 18;
export type HoleField = 'par' | 'strokes' | 'putts';

export interface HoleDraft {
  number: number;
  par: string;
  strokes: string;
  putts: string;
}
export interface RoundDraft {
  courseName: string;
  holeCount: HoleCount;
  holes: HoleDraft[];
}
export interface HoleScore {
  number: number;
  par: number;
  strokes: number;
  putts: number;
}
export interface Round {
  courseName: string;
  /** Planned length; holes contains only the played prefix for rounds ended early. */
  holeCount: HoleCount;
  holes: HoleScore[];
}
export interface ScoreTotals {
  strokes: number;
  par: number;
  putts: number;
  scoredHoles: number;
  completedHoles: number;
  relativeToPar: number | null;
}
