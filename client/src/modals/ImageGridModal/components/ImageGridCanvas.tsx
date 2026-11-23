import { useCallback, useEffect, useRef } from 'react'

interface ImageGridCanvasProps {
  src: string
  columns: number
  rows: number
  offsetX: number
  offsetY: number
}

const MAX_CANVAS_SIZE = 1600

export function ImageGridCanvas({
  src,
  columns,
  rows,
  offsetX,
  offsetY
}: ImageGridCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const drawRef = useRef<() => void>(() => {})

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const image = imageRef.current

    if (!canvas || !image) {
      return
    }

    const targetAspect = columns / rows
    const width =
      targetAspect >= 1
        ? MAX_CANVAS_SIZE
        : Math.round(MAX_CANVAS_SIZE * targetAspect)
    const height =
      targetAspect >= 1
        ? Math.round(MAX_CANVAS_SIZE / targetAspect)
        : MAX_CANVAS_SIZE

    canvas.width = width
    canvas.height = height

    const context = canvas.getContext('2d')

    if (!context) {
      return
    }

    context.clearRect(0, 0, width, height)

    // Object-contain: show the whole image inside the grid area without
    // cropping. When the grid is smaller than the image, the extra dimension
    // is letterboxed.
    const imageScale = Math.min(
      width / image.naturalWidth,
      height / image.naturalHeight
    )
    const drawnWidth = image.naturalWidth * imageScale
    const drawnHeight = image.naturalHeight * imageScale
    const imageLeft = (width - drawnWidth) / 2
    const imageTop = (height - drawnHeight) / 2

    context.drawImage(
      image,
      imageLeft,
      imageTop,
      drawnWidth,
      drawnHeight
    )

    const gridLineColor =
      window
        .getComputedStyle(canvas)
        .getPropertyValue('--color-bg-500')
        .trim() || 'rgba(0, 0, 0, 0.55)'

    context.strokeStyle = gridLineColor
    context.lineWidth = Math.max(1, Math.round(Math.max(width, height) / 1000))

    const pitch = Math.min(width / columns, height / rows)
    const gridWidth = columns * pitch
    const gridHeight = rows * pitch
    const originX = (width - gridWidth) / 2
    const originY = (height - gridHeight) / 2
    const startX = originX + (offsetX / 100) * pitch
    const startY = originY + (offsetY / 100) * pitch

    for (let column = 0; column <= columns; column++) {
      const x = startX + column * pitch

      if (x < originX || x > originX + gridWidth) {
        continue
      }

      context.beginPath()
      context.moveTo(x, originY)
      context.lineTo(x, originY + gridHeight)
      context.stroke()
    }

    for (let row = 0; row <= rows; row++) {
      const y = startY + row * pitch

      if (y < originY || y > originY + gridHeight) {
        continue
      }

      context.beginPath()
      context.moveTo(originX, y)
      context.lineTo(originX + gridWidth, y)
      context.stroke()
    }
  }, [columns, rows, offsetX, offsetY])

  useEffect(() => {
    drawRef.current = draw
  }, [draw])

  useEffect(() => {
    if (!src) {
      return
    }

    const image = new window.Image()

    image.onload = () => {
      imageRef.current = image
      drawRef.current()
    }
    image.src = src

    return () => {
      imageRef.current = null
    }
  }, [src])

  useEffect(() => {
    draw()
  }, [draw])

  return (
    <canvas
      ref={canvasRef}
      aria-label="Image split into a grid"
      style={{
        display: 'block',
        height: 'auto',
        maxHeight: '100%',
        maxWidth: '100%',
        width: 'auto'
      }}
    />
  )
}
