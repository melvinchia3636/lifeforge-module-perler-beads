import { Shape } from 'react-konva'

import { CELL_SIZE } from '../constants'

interface InfiniteGridProps {
  color: string
  borderColor: string
  chunkColor: string
  scale: number
  width: number
  height: number
  showLines: boolean
}

const BORDER_WIDTH = 4
const CHUNK_DIVISION = 5
const CHUNK_LINE_WIDTH = 2

export function InfiniteGrid({
  color,
  borderColor,
  chunkColor,
  scale,
  width,
  height,
  showLines
}: InfiniteGridProps) {
  const contentWidth = width * CELL_SIZE
  const contentHeight = height * CELL_SIZE

  return (
    <Shape
      listening={false}
      sceneFunc={context => {
        if (showLines) {
          const lineWidth = 1 / scale
          const lineOffset = lineWidth / 2

          context.beginPath()

          for (let column = 0; column <= width; column++) {
            const x = column * CELL_SIZE + lineOffset

            context.moveTo(x, 0)
            context.lineTo(x, contentHeight)
          }

          for (let row = 0; row <= height; row++) {
            const y = row * CELL_SIZE + lineOffset

            context.moveTo(0, y)
            context.lineTo(contentWidth, y)
          }

          context.strokeStyle = color
          context.lineWidth = lineWidth
          context.stroke()

          // Slightly thicker separators every 5 cells (pegboard chunks).
          const chunkLineWidth = CHUNK_LINE_WIDTH / scale

          context.beginPath()

          for (
            let column = CHUNK_DIVISION;
            column < width;
            column += CHUNK_DIVISION
          ) {
            const x = column * CELL_SIZE

            context.moveTo(x, 0)
            context.lineTo(x, contentHeight)
          }

          for (
            let row = CHUNK_DIVISION;
            row < height;
            row += CHUNK_DIVISION
          ) {
            const y = row * CELL_SIZE

            context.moveTo(0, y)
            context.lineTo(contentWidth, y)
          }

          context.strokeStyle = chunkColor
          context.lineWidth = chunkLineWidth
          context.stroke()
        }

        const borderWidth = BORDER_WIDTH / scale
        const inset = borderWidth / 2

        context.strokeStyle = borderColor
        context.lineWidth = borderWidth
        context.strokeRect(
          inset,
          inset,
          contentWidth - borderWidth,
          contentHeight - borderWidth
        )
      }}
    />
  )
}
