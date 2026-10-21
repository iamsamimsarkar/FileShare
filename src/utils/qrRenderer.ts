/**
 * Deterministic 25x25 QR Matrix Generator for visual simulation & payload encoding.
 * Includes standard 7x7 finder patterns at top-left, top-right, bottom-left,
 * timing patterns, alignment pattern, and payload-derived data cells.
 */
export function generateQrMatrix(payloadString: string): boolean[][] {
  const size = 25;
  const matrix: boolean[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => false)
  );
  const reserved: boolean[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => false)
  );

  const placeFinder = (rowOffset: number, colOffset: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const rr = rowOffset + r;
        const cc = colOffset + c;
        if (rr >= 0 && rr < size && cc >= 0 && cc < size) {
          reserved[rr][cc] = true;
          if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
            const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
            const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
            matrix[rr][cc] = isBorder || isInner;
          } else {
            matrix[rr][cc] = false;
          }
        }
      }
    }
  };

  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    reserved[6][i] = true;
    matrix[6][i] = i % 2 === 0;
    reserved[i][6] = true;
    matrix[i][6] = i % 2 === 0;
  }

  // Alignment pattern at (16, 16)
  for (let r = -2; r <= 2; r++) {
    for (let c = -2; c <= 2; c++) {
      const rr = 18 + r;
      const cc = 18 + c;
      reserved[rr][cc] = true;
      const isEdge = Math.abs(r) === 2 || Math.abs(c) === 2;
      const isCenter = r === 0 && c === 0;
      matrix[rr][cc] = isEdge || isCenter;
    }
  }

  // Hash payload string into deterministic bit stream
  let hash = 2166136261;
  for (let i = 0; i < payloadString.length; i++) {
    hash ^= payloadString.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  let bitIndex = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!reserved[r][c]) {
        const charCode = payloadString.charCodeAt(bitIndex % payloadString.length) || 85;
        const mixed = ((hash >>> (bitIndex % 24)) ^ (charCode * (r + 1) * (c + 3))) & 1;
        matrix[r][c] = mixed === 1;
        bitIndex++;
      }
    }
  }

  return matrix;
}
