import { type ReactNode, useMemo } from 'react'

import { CELL_SIZE, CHUNK_SIZE } from '../constants'
import { BeadChunk } from './BeadChunk'

interface BeadLayerProps {
  grid: string[][]
  width: number
  height: number
  scale: number
  showColorCodes: boolean
  viewport: {
    left: number
    top: number
    right: number
    bottom: number
  }
}

export function BeadLayer({
  grid,
  width,
  height,
  scale,
  showColorCodes,
  viewport
}: BeadLayerProps) {
  const showCodes = showColorCodes && CELL_SIZE * scale >= 16

  const chunks = useMemo(() => {
    const elements: ReactNode[] = []

    for (let row = 0; row < height; row += CHUNK_SIZE) {
      for (let column = 0; column < width; column += CHUNK_SIZE) {
        const columns = Math.min(CHUNK_SIZE, width - column)
        const rows = Math.min(CHUNK_SIZE, height - row)
        const left = column * CELL_SIZE
        const top = row * CELL_SIZE
        const right = left + columns * CELL_SIZE
        const bottom = top + rows * CELL_SIZE

        const isVisible =
          right >= viewport.left &&
          left <= viewport.right &&
          bottom >= viewport.top &&
          top <= viewport.bottom

        if (!isVisible) {
          continue
        }

        elements.push(
          <BeadChunk
            key={`${row}-${column}`}
            column={column}
            columns={columns}
            grid={grid}
            row={row}
            rows={rows}
            showColorCodes={showCodes}
          />
        )
      }
    }

    return elements
  }, [grid, width, height, viewport, showCodes])

  return <>{chunks}</>
}
