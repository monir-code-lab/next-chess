type BuildUciPositionCommandArgs = {
  fen: string;
};

export function buildUciPositionCommand({ fen }: BuildUciPositionCommandArgs): string {
  return `position fen ${fen}`;
}

export function buildUciGoCommand(depth: number, moveTime?: number): string {
  if (typeof moveTime === 'number') {
    return `go depth ${depth} movetime ${moveTime}`;
  }

  return `go depth ${depth}`;
}
