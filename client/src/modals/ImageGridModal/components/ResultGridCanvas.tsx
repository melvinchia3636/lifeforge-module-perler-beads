import { useEffect, useRef } from 'react'

import { MARD_COLORS } from '@/constants/mardColors'

const MARD_BY_CODE = new Map(
  MARD_COLORS.map(({ code, hex }) => [code, hex])
)

const PIXELS_PER_CELL = 16
const MAX_CANVAS_SIZE = 2048

interface ResultGridCanvasProps {
  grid: string[][]
  width: number
  height: number
}

export function ResultGridCanvas({
  grid,
  width,
  height
}: ResultGridCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pixelsPerCell = Math.max(
    1,
    Math.min(
      PIXELS_PER_CELL,
      Math.floor(MAX_CANVAS_SIZE / Math.max(width, height))
    )
  )

  useEffect(() => {
    const canvas = canvasRef.current

    if (!canvas) {
      return
    }

    canvas.width = width * pixelsPerCell
    canvas.height = height * pixelsPerCell

    const context = canvas.getContext('2d')

    if (!context) {
      return
    }

    context.clearRect(0, 0, canvas.width, canvas.height)

    for (let row = 0; row < height; row++) {
      for (let column = 0; column < width; column++) {
        const code = grid[row]?.[column] ?? ''
        const color = MARD_BY_CODE.get(code)

        if (!color) {
          continue
        }

        context.fillStyle = color
        context.fillRect(
          column * pixelsPerCell,
          row * pixelsPerCell,
          pixelsPerCell,
          pixelsPerCell
        )
      }
    }
  }, [grid, width, height, pixelsPerCell])

  return (
    <canvas
      ref={canvasRef}
      aria-label="Generated bead grid"
      height={height * pixelsPerCell}
      style={{
        display: 'block',
        height: '100%',
        imageRendering: 'pixelated',
        objectFit: 'contain',
        width: '100%'
      }}
      width={width * pixelsPerCell}
    />
  )
}
