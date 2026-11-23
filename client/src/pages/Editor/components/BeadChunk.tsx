import { Shape } from 'react-konva'

import { usePersonalization } from '@lifeforge/ui'

import { MARD_COLORS } from '@/constants/mardColors'

import { CELL_SIZE } from '../constants'
import type { BeadShape } from '../types'

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
  scale: number
  shape: BeadShape
  showColorCodes: boolean
}

export function BeadChunk({
  grid,
  row,
  column,
  rows,
  columns,
  scale,
  shape,
  showColorCodes
}: BeadChunkProps) {
  const { fontFamily, bgTempPalette } = usePersonalization()
  const transparentMarkColor = bgTempPalette[500] ?? '#71717a'

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

            if (code === 'T1') {
              const inset = CELL_SIZE * 0.25

              context.strokeStyle = transparentMarkColor
              context.lineWidth = CELL_SIZE * 0.1
              context.beginPath()
              context.moveTo(cellX + inset, cellY + inset)
              context.lineTo(
                cellX + CELL_SIZE - inset,
                cellY + CELL_SIZE - inset
              )
              context.moveTo(cellX + CELL_SIZE - inset, cellY + inset)
              context.lineTo(cellX + inset, cellY + CELL_SIZE - inset)
              context.stroke()

              continue
            }

            const inset = Math.min(CELL_SIZE * 0.1, 0.5 / scale)
            const shapeX = cellX + inset
            const shapeY = cellY + inset
            const shapeSize = CELL_SIZE - inset * 2

            if (shape === 'square') {
              context.fillStyle = color
              context.fillRect(shapeX, shapeY, shapeSize, shapeSize)
            } else if (shape === 'circle') {
              context.fillStyle = color
              context.beginPath()
              context.arc(
                shapeX + shapeSize / 2,
                shapeY + shapeSize / 2,
                shapeSize / 2,
                0,
                Math.PI * 2
              )
              context.fill()
            } else if (shape === 'ring') {
              const lineWidth = shapeSize * 0.26

              context.strokeStyle = color
              context.lineWidth = lineWidth
              context.beginPath()
              context.arc(
                shapeX + shapeSize / 2,
                shapeY + shapeSize / 2,
                shapeSize / 2 - lineWidth / 2,
                0,
                Math.PI * 2
              )
              context.stroke()
            } else {
              const radius = shapeSize * 0.35
              const right = shapeX + shapeSize
              const bottom = shapeY + shapeSize

              context.fillStyle = color
              context.beginPath()
              context.moveTo(shapeX + radius, shapeY)
              context.lineTo(right - radius, shapeY)
              context.quadraticCurveTo(right, shapeY, right, shapeY + radius)
              context.lineTo(right, bottom - radius)
              context.quadraticCurveTo(right, bottom, right - radius, bottom)
              context.lineTo(shapeX + radius, bottom)
              context.quadraticCurveTo(shapeX, bottom, shapeX, bottom - radius)
              context.lineTo(shapeX, shapeY + radius)
              context.quadraticCurveTo(shapeX, shapeY, shapeX + radius, shapeY)
              context.closePath()
              context.fill()
            }

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
