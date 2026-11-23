import { useEffect, useMemo, useRef, useState } from 'react'
import type Konva from 'konva'

import { usePersonalization } from '@lifeforge/ui'

import { CELL_SIZE, MAX_SCALE, MIN_SCALE } from '../constants'
import type { EditorState, ViewTransform } from '../types'
import { useElementSize } from './useElementSize'

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

export function useEditorViewport(editorState: EditorState | null) {
  const { derivedTheme, bgTempPalette } = usePersonalization()
  const stageRef = useRef<Konva.Stage | null>(null)
  const hasFitted = useRef(false)
  const { ref: containerRef, width, height } = useElementSize()
  const [view, setView] = useState<ViewTransform>({ x: 0, y: 0, scale: 1 })

  const gridColor =
    (derivedTheme === 'dark' ? bgTempPalette[800] : bgTempPalette[200]) ??
    '#8a8a8a'
  const chunkColor =
    (derivedTheme === 'dark' ? bgTempPalette[700] : bgTempPalette[300]) ??
    '#a1a1aa'
  const borderColor = chunkColor
  const numberColor = bgTempPalette[500] ?? '#71717a'

  useEffect(() => {
    if (!editorState || width === 0 || height === 0 || hasFitted.current) {
      return
    }

    const patternWidth = editorState.width * CELL_SIZE
    const patternHeight = editorState.height * CELL_SIZE
    const padding = CELL_SIZE * 4
    const scale = clamp(
      Math.min(
        (width - padding) / patternWidth,
        (height - padding) / patternHeight
      ),
      MIN_SCALE,
      MAX_SCALE
    )

    setView({
      scale,
      x: (width - patternWidth * scale) / 2,
      y: (height - patternHeight * scale) / 2
    })
    hasFitted.current = true
  }, [editorState, width, height])

  const viewport = useMemo(
    () => ({
      left: -view.x / view.scale,
      top: -view.y / view.scale,
      right: (width - view.x) / view.scale,
      bottom: (height - view.y) / view.scale
    }),
    [view, width, height]
  )

  const handleWheel = (event: Konva.KonvaEventObject<WheelEvent>) => {
    event.evt.preventDefault()

    const stage = stageRef.current
    const pointer = stage?.getPointerPosition()

    if (!stage || !pointer) {
      return
    }

    const nextScale = clamp(
      view.scale * (event.evt.deltaY > 0 ? 0.9 : 1.1),
      MIN_SCALE,
      MAX_SCALE
    )

    if (nextScale === view.scale) {
      return
    }

    const pointerInContent = {
      x: (pointer.x - view.x) / view.scale,
      y: (pointer.y - view.y) / view.scale
    }

    setView({
      scale: nextScale,
      x: pointer.x - pointerInContent.x * nextScale,
      y: pointer.y - pointerInContent.y * nextScale
    })
  }

  const handleDrag = (event: Konva.KonvaEventObject<DragEvent>) => {
    setView(current => ({
      ...current,
      x: event.target.x(),
      y: event.target.y()
    }))
  }

  return {
    containerRef,
    stageRef,
    width,
    height,
    view,
    viewport,
    gridColor,
    borderColor,
    chunkColor,
    numberColor,
    handleWheel,
    handleDrag
  }
}
