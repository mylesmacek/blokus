export const PIECE_DEFINITIONS: Record<string, [number, number][]> = {
  'one':      [[0,0]],
  'two':      [[0,0],[0,1]],
  'three-i':  [[0,0],[0,1],[0,2]],
  'three-l':  [[0,0],[1,0],[1,1]],
  'four-i':   [[0,0],[0,1],[0,2],[0,3]],
  'four-o':   [[0,0],[0,1],[1,0],[1,1]],
  'four-t':   [[0,0],[0,1],[0,2],[1,1]],
  'four-l':   [[0,0],[1,0],[2,0],[2,1]],
  'four-s':   [[0,0],[1,0],[1,1],[2,1]],
  'five-f':   [[0,1],[0,2],[1,0],[1,1],[2,1]],
  'five-i':   [[0,0],[0,1],[0,2],[0,3],[0,4]],
  'five-l':   [[0,0],[1,0],[2,0],[3,0],[3,1]],
  'five-n':   [[0,1],[1,0],[1,1],[2,0],[3,0]],
  'five-p':   [[0,0],[0,1],[1,0],[1,1],[2,0]],
  'five-t':   [[0,0],[0,1],[0,2],[1,1],[2,1]],
  'five-u':   [[0,0],[0,2],[1,0],[1,1],[1,2]],
  'five-v':   [[0,0],[1,0],[2,0],[2,1],[2,2]],
  'five-w':   [[0,0],[1,0],[1,1],[2,1],[2,2]],
  'five-x':   [[0,1],[1,0],[1,1],[1,2],[2,1]],
  'five-y':   [[0,1],[1,0],[1,1],[2,1],[3,1]],
  'five-z':   [[0,0],[0,1],[1,1],[2,1],[2,2]],
}

export const ALL_PIECE_IDS = Object.keys(PIECE_DEFINITIONS)

export function normalizeCells(cells: [number, number][]): [number, number][] {
  const minR = Math.min(...cells.map(([r]) => r))
  const minC = Math.min(...cells.map(([, c]) => c))
  return cells
    .map(([r, c]) => [r - minR, c - minC] as [number, number])
    .sort((a, b) => a[0] - b[0] || a[1] - b[1])
}

function rotateCW(cells: [number, number][]): [number, number][] {
  return normalizeCells(cells.map(([r, c]) => [c, -r]))
}

function flipH(cells: [number, number][]): [number, number][] {
  return normalizeCells(cells.map(([r, c]) => [r, -c]))
}

function cellsKey(cells: [number, number][]): string {
  return JSON.stringify(normalizeCells(cells))
}

export function getOrientations(pieceId: string): [number, number][][] {
  const base = PIECE_DEFINITIONS[pieceId]
  const seen = new Set<string>()
  const result: [number, number][][] = []
  let current = normalizeCells(base)
  for (let f = 0; f < 2; f++) {
    for (let r = 0; r < 4; r++) {
      const key = cellsKey(current)
      if (!seen.has(key)) {
        seen.add(key)
        result.push([...current])
      }
      current = rotateCW(current)
    }
    current = flipH(current)
  }
  return result
}

export const PIECE_ORIENTATIONS: Record<string, [number, number][][]> =
  Object.fromEntries(ALL_PIECE_IDS.map(id => [id, getOrientations(id)]))

export function matchesOrientation(
  pieceId: string,
  cells: [number, number][]
): boolean {
  const key = cellsKey(cells)
  return PIECE_ORIENTATIONS[pieceId].some(o => cellsKey(o) === key)
}
