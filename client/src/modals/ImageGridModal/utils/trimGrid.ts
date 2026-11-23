export interface TrimmedGrid {
  grid: string[][]
  width: number
  height: number
}

/**
 * Removes completely empty rows and columns from the edges of a generated
 * grid (e.g. the letterboxed areas left by object-contain fitting).
 */
export function trimGrid(grid: string[][]): TrimmedGrid | null {
  const rowCount = grid.length
  const columnCount = grid[0]?.length ?? 0

  if (rowCount === 0 || columnCount === 0) {
    return null
  }

  const isRowEmpty = (row: number) => grid[row]!.every(code => !code)
  const isColumnEmpty = (column: number) =>
    grid.every(row => !row[column])

  let top = 0
  let bottom = rowCount - 1
  let left = 0
  let right = columnCount - 1

  while (top <= bottom && isRowEmpty(top)) {
    top++
  }

  while (bottom >= top && isRowEmpty(bottom)) {
    bottom--
  }

  if (top > bottom) {
    return null
  }

  while (left <= right && isColumnEmpty(left)) {
    left++
  }

  while (right >= left && isColumnEmpty(right)) {
    right--
  }

  if (left > right) {
    return null
  }

  return {
    grid: grid
      .slice(top, bottom + 1)
      .map(row => row.slice(left, right + 1)),
    width: right - left + 1,
    height: bottom - top + 1
  }
}
