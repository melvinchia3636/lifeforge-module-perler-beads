import { Shape } from 'react-konva'

import { usePersonalization } from '@lifeforge/ui'

import { MARD_COLORS } from '@/constants/mardColors'

import { CELL_SIZE } from '../constants'

const MARD_BY_CODE = new Map(
  MARD_COLORS.map(({ code, hex }) => [code, hex])
)

const readableTextColor = (hex: string) => {
  const value = parseInt(hex.slice(1), 16)
  const red = (value >> 16) & 255
  const green = (value >> 8) & 255
  const blue = value & 255
  const luminance = 0.299 * red + 0.587 * green + 0.114 * blue

  return luminance > 140 ? '#000000' : '#ffffff'
}

interface BeadChunkProps {
  grid: string[][]
  row: number
  column: number
  rows: number
  columns: number
  showColorCodes: boolean
}

export function BeadChunk({
  grid,
  row,
  column,
  rows,
  columns,
  showColorCodes
}: BeadChunkProps) {
  const { fontFamily } = usePersonalization()

  return (
    <Shape
      listening={false}
      x={column * CELL_SIZE}
      y={row * CELL_SIZE}
      sceneFunc={context => {
        for (let rowOffset = 0; rowOffset < rows; rowOffset++) {
          for (let columnOffset = 0; columnOffset < columns; columnOffset++) {
            const code = grid[row + rowOffset]?.[column + columnOffset] ?? ''
            const color = MARD_BY_CODE.get(code)

            if (!color) {
              continue
            }

            const cellX = columnOffset * CELL_SIZE
            const cellY = rowOffset * CELL_SIZE

            context.fillStyle = color
            context.fillRect(cellX, cellY, CELL_SIZE, CELL_SIZE)

            if (!showColorCodes) {
              continue
            }

            const fontSize = CELL_SIZE * 0.4

            context.font = `600 ${fontSize}px ${fontFamily}, sans-serif`
            context.textAlign = 'left'
            context.textBaseline = 'alphabetic'

            const metrics = context.measureText(code)
            const ascent = metrics.actualBoundingBoxAscent ?? fontSize * 0.8
            const descent = metrics.actualBoundingBoxDescent ?? fontSize * 0.2

            context.fillStyle = readableTextColor(color)
            context.fillText(
              code,
              cellX + (CELL_SIZE - metrics.width) / 2,
              cellY + CELL_SIZE / 2 + (ascent - descent) / 2
            )
          }
        }
      }}
    />
  )
}
