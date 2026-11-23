import { Shape } from 'react-konva'

import { usePersonalization } from '@lifeforge/ui'

import { CELL_SIZE } from '../constants'

interface GridNumbersProps {
  color: string
  width: number
  height: number
}

export function GridNumbers({ color, width, height }: GridNumbersProps) {
  const { fontFamily } = usePersonalization()

  return (
    <Shape
      listening={false}
      sceneFunc={context => {
        const fontSize = CELL_SIZE * 0.5

        context.font = `500 ${fontSize}px ${fontFamily}, sans-serif`
        context.fillStyle = color

        context.textAlign = 'center'
        context.textBaseline = 'bottom'

        for (let column = 0; column < width; column++) {
          context.fillText(
            String(column + 1),
            (column + 0.5) * CELL_SIZE,
            -4
          )
        }

        context.textAlign = 'right'
        context.textBaseline = 'middle'

        for (let row = 0; row < height; row++) {
          context.fillText(String(row + 1), -4, (row + 0.5) * CELL_SIZE)
        }
      }}
    />
  )
}
