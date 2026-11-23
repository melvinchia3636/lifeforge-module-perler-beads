import {
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState
} from 'react'

import { Box, COLORS, colorWithOpacity } from '@lifeforge/ui'

import { CELL_SIZE } from '../constants'
import type { ResizeEdge, ViewTransform } from '../types'

const HANDLE_LENGTH = 32
const HANDLE_THICKNESS = 8
const HANDLE_OFFSET = 8

interface ResizeHandlesProps {
  view: ViewTransform
  width: number
  height: number
  onResize: (edge: ResizeEdge, step: number) => void
  onResizeEnd: () => void
}

interface ResizePreview {
  edge: ResizeEdge
  startWidth: number
  startHeight: number
  outward: number
}

export function ResizeHandles({
  view,
  width,
  height,
  onResize,
  onResizeEnd
}: ResizeHandlesProps) {
  const [edge, setEdge] = useState<ResizeEdge | null>(null)
  const [preview, setPreview] = useState<ResizePreview | null>(null)
  const startRef = useRef<{
    x: number
    y: number
    step: number
    startWidth: number
    startHeight: number
  } | null>(null)

  const boardWidth = width * CELL_SIZE * view.scale
  const boardHeight = height * CELL_SIZE * view.scale
  const halfLength = HANDLE_LENGTH / 2
  const halfThickness = HANDLE_THICKNESS / 2

  const handleStyle: CSSProperties = {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    border: '1px solid rgba(0, 0, 0, 0.35)',
    borderRadius: '999px',
    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.25)',
    pointerEvents: 'auto',
    userSelect: 'none'
  }

  const handles: { edge: ResizeEdge; style: CSSProperties }[] = [
    {
      edge: 'top',
      style: {
        ...handleStyle,
        cursor: 'ns-resize',
        height: HANDLE_THICKNESS,
        left: view.x + boardWidth / 2 - halfLength,
        top: view.y - halfThickness - HANDLE_OFFSET,
        width: HANDLE_LENGTH
      }
    },
    {
      edge: 'right',
      style: {
        ...handleStyle,
        cursor: 'ew-resize',
        height: HANDLE_LENGTH,
        left: view.x + boardWidth - halfThickness + HANDLE_OFFSET,
        top: view.y + boardHeight / 2 - halfLength,
        width: HANDLE_THICKNESS
      }
    },
    {
      edge: 'bottom',
      style: {
        ...handleStyle,
        cursor: 'ns-resize',
        height: HANDLE_THICKNESS,
        left: view.x + boardWidth / 2 - halfLength,
        top: view.y + boardHeight - halfThickness + HANDLE_OFFSET,
        width: HANDLE_LENGTH
      }
    },
    {
      edge: 'left',
      style: {
        ...handleStyle,
        cursor: 'ew-resize',
        height: HANDLE_LENGTH,
        left: view.x - halfThickness - HANDLE_OFFSET,
        top: view.y + boardHeight / 2 - halfLength,
        width: HANDLE_THICKNESS
      }
    }
  ]

  const cellSize = CELL_SIZE * view.scale
  const previewBand = (() => {
    if (!preview) {
      return null
    }

    const diff =
      preview.edge === 'left' || preview.edge === 'right'
        ? width - preview.startWidth
        : height - preview.startHeight

    if (diff === 0) {
      return null
    }

    const isAdded = diff > 0
    const length = Math.abs(diff) * cellSize
    const token = isAdded ? 'custom-500' : 'red-500'
    let left = view.x
    let top = view.y
    let bandWidth = boardWidth
    let bandHeight = boardHeight

    if (preview.edge === 'left' || preview.edge === 'right') {
      bandWidth = length

      if (preview.edge === 'left') {
        left = isAdded ? view.x : view.x - length
      } else {
        left = isAdded
          ? view.x + preview.startWidth * cellSize
          : view.x + boardWidth
      }
    } else {
      bandHeight = length

      if (preview.edge === 'top') {
        top = isAdded ? view.y : view.y - length
      } else {
        top = isAdded
          ? view.y + preview.startHeight * cellSize
          : view.y + boardHeight
      }
    }

    return {
      label: `${isAdded ? '+' : '-'}${Math.abs(diff)}`,
      style: {
        alignItems: 'center',
        backgroundColor: colorWithOpacity(token, '30%').toString(),
        borderRadius: '4px',
        color: COLORS[token],
        display: 'flex',
        fontSize: '1.5rem',
        fontWeight: 600,
        height: bandHeight,
        justifyContent: 'center',
        left,
        pointerEvents: 'none',
        position: 'absolute',
        top,
        width: bandWidth,
        zIndex: 9
      } satisfies CSSProperties
    }
  })()

  const startResize = (
    nextEdge: ResizeEdge,
    event: ReactPointerEvent<HTMLElement>
  ) => {
    event.preventDefault()
    event.stopPropagation()

    startRef.current = {
      x: event.clientX,
      y: event.clientY,
      step: 0,
      startWidth: width,
      startHeight: height
    }
    setEdge(nextEdge)
  }

  useEffect(() => {
    if (!edge || !startRef.current) {
      return
    }

    const handlePointerMove = (event: PointerEvent) => {
      const start = startRef.current

      if (!start) {
        return
      }

      const cellSize = CELL_SIZE * view.scale
      const deltaX = Math.round((event.clientX - start.x) / cellSize)
      const deltaY = Math.round((event.clientY - start.y) / cellSize)
      const outward =
        edge === 'left'
          ? -deltaX
          : edge === 'right'
            ? deltaX
            : edge === 'top'
              ? -deltaY
              : deltaY
      const step = outward - start.step

      if (step === 0) {
        return
      }

      start.step = outward
      setPreview({
        edge,
        startWidth: start.startWidth,
        startHeight: start.startHeight,
        outward
      })
      onResize(edge, step)
    }

    const handlePointerUp = () => {
      startRef.current = null
      setEdge(null)
      setPreview(null)
      onResizeEnd()
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerUp)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)
    }
  }, [edge, view.scale, onResize, onResizeEnd])

  return (
    <Box
      inset="0"
      position="absolute"
      style={{ pointerEvents: 'none', zIndex: 10 }}
    >
      {previewBand && (
        <Box position="absolute" style={previewBand.style}>
          {previewBand.label}
        </Box>
      )}
      {handles.map(handle => (
        <Box
          key={handle.edge}
          position="absolute"
          style={handle.style}
          onPointerDown={event => startResize(handle.edge, event)}
        />
      ))}
    </Box>
  )
}
