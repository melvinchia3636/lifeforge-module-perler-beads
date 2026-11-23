import { Shape } from 'react-konva'

import { CELL_SIZE } from '../constants'

interface PatchHighlightProps {
  cells: [number, number][]
  color: string
}

export function PatchHighlight({ cells, color }: PatchHighlightProps) {
  if (cells.length === 0) {
    return null
  }

  return (
    <Shape
      listening={false}
      sceneFunc={context => {
        context.save()
        context.globalAlpha = 0.35
        context.fillStyle = color

        for (const [row, column] of cells) {
          context.fillRect(
            column * CELL_SIZE,
            row * CELL_SIZE,
            CELL_SIZE,
            CELL_SIZE
          )
        }

        context.restore()
      }}
    />
  )
}
