import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Layer, Stage } from 'react-konva'
import {
  useBeforeUnload,
  useBlocker,
  useLocation,
  useNavigate
} from 'react-router'

import { useForgeMutation } from '@lifeforge/api'
import { useModuleTranslation } from '@lifeforge/localization'
import {
  Box,
  Card,
  ConfirmationModal,
  ContentWrapperWithSidebar,
  EmptyStateScreen,
  Flex,
  GoBackButton,
  Icon,
  LayoutWithSidebar,
  Text,
  Tooltip,
  toast,
  useModalStore
} from '@lifeforge/ui'

import { MARD_COLORS } from '@/constants/mardColors'
import { forgeAPI } from '@/manifest'
import AddOutlineModal from '@/modals/AddOutlineModal'
import PreviewModal from '@/modals/PreviewModal'
import SaveBlueprintModal from '@/modals/SaveBlueprintModal'
import { trimGrid } from '@/modals/ImageGridModal/utils/trimGrid'

import { BeadLayer } from './components/BeadLayer'
import { ColorPalette } from './components/ColorPalette'
import { EditorHeader } from './components/EditorHeader'
import { EditorSidebar } from './components/EditorSidebar'
import { InfiniteGrid } from './components/InfiniteGrid'
import { PatchHighlight } from './components/PatchHighlight'
import { ResizeHandles } from './components/ResizeHandles'
import { CELL_SIZE } from './constants'
import { useBoardHistory } from './hooks/useBoardHistory'
import { useEditorViewport } from './hooks/useEditorViewport'
import type {
  BeadShape,
  BucketMode,
  EditorState,
  EditorTool,
  ResizeEdge,
  SavedBlueprint
} from './types'

function getContentSignature(editorState: EditorState | null) {
  if (!editorState) {
    return ''
  }

  return JSON.stringify({
    grid: editorState.grid,
    width: editorState.width,
    height: editorState.height
  })
}

function getConnectedCells(
  grid: string[][],
  width: number,
  height: number,
  startRow: number,
  startColumn: number,
  allowEmpty = false
) {
  const target = grid[startRow]?.[startColumn] ?? ''

  if (!target && !allowEmpty) {
    return []
  }

  const visited = new Set<string>()
  const stack: [number, number][] = [[startRow, startColumn]]
  const cells: [number, number][] = []

  while (stack.length > 0) {
    const [row, column] = stack.pop()!

    if (
      row < 0 ||
      column < 0 ||
      row >= height ||
      column >= width ||
      (grid[row]?.[column] ?? '') !== target
    ) {
      continue
    }

    const key = `${row}:${column}`

    if (visited.has(key)) {
      continue
    }

    visited.add(key)
    cells.push([row, column])
    stack.push(
      [row - 1, column],
      [row + 1, column],
      [row, column - 1],
      [row, column + 1]
    )
  }

  return cells
}

function getContentBounds(
  grid: string[][],
  width: number,
  height: number
) {
  let minRow = height
  let maxRow = -1
  let minColumn = width
  let maxColumn = -1

  for (let row = 0; row < height; row++) {
    for (let column = 0; column < width; column++) {
      if (!grid[row]?.[column]) {
        continue
      }

      minRow = Math.min(minRow, row)
      maxRow = Math.max(maxRow, row)
      minColumn = Math.min(minColumn, column)
      maxColumn = Math.max(maxColumn, column)
    }
  }

  return { minRow, maxRow, minColumn, maxColumn }
}

function resizeBoard(
  current: EditorState,
  edge: ResizeEdge,
  step: number
) {
  if (step === 0) {
    return null
  }

  const bounds = getContentBounds(current.grid, current.width, current.height)
  const hasContent = bounds.maxRow >= 0
  let grid = current.grid.map(row => [...row])
  let { width, height } = current
  let shiftX = 0
  let shiftY = 0

  if (edge === 'left' || edge === 'right') {
    if (edge === 'left') {
      if (step > 0) {
        const add = Math.min(step, 512 - width)

        if (add <= 0) {
          return null
        }

        grid = grid.map(row => [
          ...Array.from({ length: add }, () => ''),
          ...row
        ])
        width += add
        shiftX = -add
      } else {
        const maxRemove = Math.max(
          0,
          Math.min(width - 1, hasContent ? bounds.minColumn : width - 1)
        )
        const remove = Math.min(-step, maxRemove)

        if (remove <= 0) {
          return null
        }

        grid = grid.map(row => row.slice(remove))
        width -= remove
        shiftX = remove
      }
    } else if (step > 0) {
      const add = Math.min(step, 512 - width)

      if (add <= 0) {
        return null
      }

      grid = grid.map(row => [
        ...row,
        ...Array.from({ length: add }, () => '')
      ])
      width += add
    } else {
      const minWidth = hasContent ? bounds.maxColumn + 1 : 1
      const remove = Math.min(-step, width - minWidth)

      if (remove <= 0) {
        return null
      }

      grid = grid.map(row => row.slice(0, width - remove))
      width -= remove
    }
  } else if (edge === 'top') {
    if (step > 0) {
      const add = Math.min(step, 512 - height)

      if (add <= 0) {
        return null
      }

      grid = [
        ...Array.from({ length: add }, () =>
          Array.from({ length: width }, () => '')
        ),
        ...grid
      ]
      height += add
      shiftY = -add
    } else {
      const maxRemove = Math.max(
        0,
        Math.min(height - 1, hasContent ? bounds.minRow : height - 1)
      )
      const remove = Math.min(-step, maxRemove)

      if (remove <= 0) {
        return null
      }

      grid = grid.slice(remove)
      height -= remove
      shiftY = remove
    }
  } else if (step > 0) {
    const add = Math.min(step, 512 - height)

    if (add <= 0) {
      return null
    }

    grid = [
      ...grid,
      ...Array.from({ length: add }, () =>
        Array.from({ length: width }, () => '')
      )
    ]
    height += add
  } else {
    const minHeight = hasContent ? bounds.maxRow + 1 : 1
    const remove = Math.min(-step, height - minHeight)

    if (remove <= 0) {
      return null
    }

    grid = grid.slice(0, height - remove)
    height -= remove
  }

  return {
    board: { ...current, grid, width, height },
    shiftX,
    shiftY
  }
}

function addOutline(
  current: EditorState,
  thickness: number,
  color: string,
  skipCorners = false
) {
  const bounds = getContentBounds(current.grid, current.width, current.height)

  if (bounds.maxRow < 0) {
    return null
  }

  const contentWidth = bounds.maxColumn - bounds.minColumn + 1
  const contentHeight = bounds.maxRow - bounds.minRow + 1
  const padding = Math.min(
    thickness,
    Math.floor((512 - contentWidth) / 2),
    Math.floor((512 - contentHeight) / 2)
  )

  if (padding < 1) {
    return null
  }

  const width = contentWidth + padding * 2
  const height = contentHeight + padding * 2
  const grid = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => '')
  )

  for (let row = 0; row < contentHeight; row++) {
    for (let column = 0; column < contentWidth; column++) {
      grid[row + padding]![column + padding] =
        current.grid[bounds.minRow + row]?.[bounds.minColumn + column] ?? ''
    }
  }

  const outside = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => false)
  )
  const outsideQueue: [number, number][] = []

  const markOutside = (row: number, column: number) => {
    if (
      row < 0 ||
      column < 0 ||
      row >= height ||
      column >= width ||
      outside[row]?.[column] ||
      grid[row]?.[column]
    ) {
      return
    }

    outside[row]![column] = true
    outsideQueue.push([row, column])
  }

  for (let column = 0; column < width; column++) {
    markOutside(0, column)
    markOutside(height - 1, column)
  }

  for (let row = 0; row < height; row++) {
    markOutside(row, 0)
    markOutside(row, width - 1)
  }

  const outsideDirections = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1]
  ] as const

  while (outsideQueue.length > 0) {
    const [row, column] = outsideQueue.pop()!

    for (const [rowOffset, columnOffset] of outsideDirections) {
      markOutside(row + rowOffset, column + columnOffset)
    }
  }

  const outlineQueue: [number, number, number][] = []

  for (let row = 0; row < height; row++) {
    for (let column = 0; column < width; column++) {
      if (grid[row]?.[column]) {
        outlineQueue.push([row, column, 0])
      }
    }
  }

  const outlineDirections = skipCorners
    ? ([
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1]
      ] as const)
    : ([
        [-1, -1],
        [-1, 0],
        [-1, 1],
        [0, -1],
        [0, 1],
        [1, -1],
        [1, 0],
        [1, 1]
      ] as const)

  while (outlineQueue.length > 0) {
    const [row, column, distance] = outlineQueue.pop()!

    if (distance >= padding) {
      continue
    }

    for (const [rowOffset, columnOffset] of outlineDirections) {
      const nextRow = row + rowOffset
      const nextColumn = column + columnOffset

      if (
        nextRow < 0 ||
        nextColumn < 0 ||
        nextRow >= height ||
        nextColumn >= width ||
        !outside[nextRow]?.[nextColumn] ||
        grid[nextRow]?.[nextColumn]
      ) {
        continue
      }

      grid[nextRow]![nextColumn] = color
      outlineQueue.push([nextRow, nextColumn, distance + 1])
    }
  }

  return { ...current, grid, width, height }
}

function Editor() {
  const { t } = useModuleTranslation()
  const { state } = useLocation()
  const navigate = useNavigate()
  const { open } = useModalStore()

  const editorState = state as EditorState | null
  const {
    board,
    setBoard,
    undo,
    redo,
    canUndo,
    canRedo
  } = useBoardHistory(editorState)
  const boardRef = useRef(board)
  boardRef.current = board

  const [showColorCodes, setShowColorCodes] = useState(false)
  const [showGridLines, setShowGridLines] = useState(true)
  const [beadShape, setBeadShape] = useState<BeadShape>('square')
  const [selectedColor, setSelectedColor] = useState<string | null>(
    MARD_COLORS[0]?.code ?? null
  )
  const [tool, setTool] = useState<EditorTool>('hand')
  const [bucketMode, setBucketMode] = useState<BucketMode>('fill')
  const isBucketActive = tool === 'bucket'
  const isPaintTool = tool !== 'hand'
  const [hoveredPatch, setHoveredPatch] = useState<[number, number][]>([])
  const [hoveredCell, setHoveredCell] = useState<{
    row: number
    column: number
    code: string
    color: string
  } | null>(null)
  const isPaintingRef = useRef(false)
  const lastPaintedCellRef = useRef<string | null>(null)
  const hoveredCellRef = useRef<string | null>(null)
  const tooltipCellRef = useRef<string | null>(null)

  const selectedColorHex = useMemo(
    () =>
      MARD_COLORS.find(({ code }) => code === selectedColor)?.hex ?? '#ffffff',
    [selectedColor]
  )

  const [blueprint, setBlueprint] = useState<SavedBlueprint | null>(
    editorState?.blueprint ?? null
  )

  const saveMutation = useForgeMutation(
    forgeAPI.blueprints.update.input({ id: blueprint?.id ?? '' }),
    {
      action: 'update',
      queryKey: forgeAPI.blueprints.key
    }
  )

  const currentSignature = useMemo(
    () => getContentSignature(board),
    [board]
  )
  const [savedSignature, setSavedSignature] = useState<string | null>(() =>
    editorState?.blueprint ? getContentSignature(editorState) : null
  )

  const isDirty = Boolean(board) && savedSignature !== currentSignature

  const blocker = useBlocker(
    useCallback(
      ({ currentLocation, nextLocation }) =>
        isDirty && currentLocation.pathname !== nextLocation.pathname,
      [isDirty]
    )
  )

  const leaveModalOpened = useRef(false)

  useEffect(() => {
    if (blocker.state !== 'blocked') {
      leaveModalOpened.current = false

      return
    }

    if (leaveModalOpened.current) {
      return
    }

    leaveModalOpened.current = true

    open(ConfirmationModal, {
      title: t('modals.leaveUnsaved.title'),
      description: t('modals.leaveUnsaved.description'),
      confirmationButton: {
        children: 'leave',
        icon: 'tabler:logout'
      },
      onConfirm: () => {
        leaveModalOpened.current = false
        blocker.proceed()
      },
      onReject: () => {
        leaveModalOpened.current = false
        blocker.reset()
      }
    })
  }, [blocker, open, t])

  useBeforeUnload(
    useCallback(
      event => {
        if (!isDirty) {
          return
        }

        event.preventDefault()
        event.returnValue = ''
      },
      [isDirty]
    )
  )

  const handleSaved = (saved: SavedBlueprint) => {
    setBlueprint(saved)
    setSavedSignature(currentSignature)
  }

  const handleResize = (width: number, height: number) => {
    setBoard(current => {
      if (!current || (current.width === width && current.height === height)) {
        return current
      }

      return {
        ...current,
        grid: Array.from({ length: height }, (_, row) =>
          Array.from(
            { length: width },
            (_, column) => current.grid[row]?.[column] ?? ''
          )
        ),
        width,
        height
      }
    })
  }

  const handleTrim = () => {
    setBoard(current => {
      if (!current) {
        return current
      }

      const trimmed = trimGrid(current.grid)

      if (!trimmed) {
        return current
      }

      return {
        ...current,
        grid: trimmed.grid,
        width: trimmed.width,
        height: trimmed.height
      }
    })
  }

  const getCellFromPointer = () => {
    const position = stageRef.current?.getRelativePointerPosition()

    if (!position) {
      return null
    }

    return {
      row: Math.floor(position.y / CELL_SIZE),
      column: Math.floor(position.x / CELL_SIZE)
    }
  }

  const paintCell = (row: number, column: number) => {
    const needsColor =
      tool === 'brush' || (tool === 'bucket' && bucketMode === 'fill')

    if (
      tool === 'hand' ||
      tool === 'eyedropper' ||
      (needsColor && !selectedColor)
    ) {
      return
    }

    const cellKey = `${row}:${column}`

    if (lastPaintedCellRef.current === cellKey) {
      return
    }

    lastPaintedCellRef.current = cellKey

    setBoard(current => {
      if (!current) {
        return current
      }

      let cells: [number, number][]

      if (tool === 'bucket') {
        cells = getConnectedCells(
          current.grid,
          current.width,
          current.height,
          row,
          column,
          bucketMode === 'fill'
        )
      } else {
        if (
          row < 0 ||
          column < 0 ||
          row >= current.height ||
          column >= current.width
        ) {
          return current
        }

        cells = [[row, column]]
      }

      if (cells.length === 0) {
        return current
      }

      const nextCode =
        tool === 'eraser' ||
        (tool === 'bucket' && bucketMode === 'clear')
          ? ''
          : selectedColor!

      if (
        cells.every(
          ([cellRow, cellColumn]) =>
            current.grid[cellRow]?.[cellColumn] === nextCode
        )
      ) {
        return current
      }

      const grid = current.grid.map(gridRow => [...gridRow])

      for (const [cellRow, cellColumn] of cells) {
        grid[cellRow]![cellColumn] = nextCode
      }

      return { ...current, grid }
    })

    if (isBucketActive) {
      hoveredCellRef.current = null
      setHoveredPatch([])
    }
  }

  const handlePaintStart = () => {
    if (tool === 'hand') {
      return
    }

    if (tool === 'eyedropper') {
      const cell = getCellFromPointer()

      if (cell && board) {
        const code = board.grid[cell.row]?.[cell.column]

        if (code) {
          setSelectedColor(code)
        }
      }

      return
    }

    isPaintingRef.current = true

    const cell = getCellFromPointer()

    if (cell) {
      paintCell(cell.row, cell.column)
    }
  }

  const handlePaintMove = () => {
    if (tool === 'hand' || tool === 'eyedropper' || !isPaintingRef.current) {
      return
    }

    const cell = getCellFromPointer()

    if (cell) {
      paintCell(cell.row, cell.column)
    }
  }

  const handlePaintEnd = () => {
    isPaintingRef.current = false
    lastPaintedCellRef.current = null
  }

  useEffect(() => {
    if (
      !isBucketActive ||
      (bucketMode === 'fill' && !selectedColor)
    ) {
      hoveredCellRef.current = null
      setHoveredPatch([])
    }
  }, [isBucketActive, bucketMode, selectedColor])

  const clearHoveredPatch = () => {
    hoveredCellRef.current = null
    setHoveredPatch([])
  }

  const clearHoveredCell = () => {
    tooltipCellRef.current = null
    setHoveredCell(null)
  }

  const updateHoveredCell = () => {
    if (!board) {
      clearHoveredCell()

      return
    }

    const cell = getCellFromPointer()

    if (
      !cell ||
      cell.row < 0 ||
      cell.column < 0 ||
      cell.row >= board.height ||
      cell.column >= board.width
    ) {
      clearHoveredCell()

      return
    }

    const code = board.grid[cell.row]?.[cell.column] ?? ''
    const cellKey = `${cell.row}:${cell.column}:${code}`

    if (!code) {
      clearHoveredCell()

      return
    }

    if (tooltipCellRef.current === cellKey) {
      return
    }

    tooltipCellRef.current = cellKey
    setHoveredCell({
      ...cell,
      code,
      color:
        MARD_COLORS.find(({ code: colorCode }) => colorCode === code)?.hex ??
        '#ffffff'
    })
  }

  const updateHoveredPatch = () => {
    if (
      !isBucketActive ||
      (bucketMode === 'fill' && !selectedColor) ||
      !board ||
      isPaintingRef.current
    ) {
      if (!isBucketActive || (bucketMode === 'fill' && !selectedColor)) {
        clearHoveredPatch()
      }

      return
    }

    const cell = getCellFromPointer()

    if (!cell) {
      clearHoveredPatch()

      return
    }

    const cellKey = `${cell.row}:${cell.column}`

    if (hoveredCellRef.current === cellKey) {
      return
    }

    hoveredCellRef.current = cellKey
    setHoveredPatch(
      getConnectedCells(
        board.grid,
        board.width,
        board.height,
        cell.row,
        cell.column,
        bucketMode === 'fill'
      )
    )
  }

  const handleStageMouseMove = () => {
    handlePaintMove()
    updateHoveredPatch()
    updateHoveredCell()
  }

  const handleStageMouseLeave = () => {
    handlePaintEnd()
    clearHoveredPatch()
    clearHoveredCell()
  }

  const handleUndo = () => {
    isPaintingRef.current = false
    lastPaintedCellRef.current = null
    hoveredCellRef.current = null
    setHoveredPatch([])
    undo()
  }

  const handleRedo = () => {
    isPaintingRef.current = false
    lastPaintedCellRef.current = null
    hoveredCellRef.current = null
    setHoveredPatch([])
    redo()
  }

  const handleResizeEdge = (edge: ResizeEdge, step: number) => {
    if (!board) {
      return
    }

    const resized = resizeBoard(board, edge, step)

    if (!resized) {
      return
    }

    setBoard(() => resized.board)

    if (resized.shiftX !== 0 || resized.shiftY !== 0) {
      panBy(
        resized.shiftX * CELL_SIZE * view.scale,
        resized.shiftY * CELL_SIZE * view.scale
      )
    }
  }

  const handleResizeEnd = () => {
    requestAnimationFrame(() => {
      const latestBoard = boardRef.current

      if (latestBoard) {
        centerView(latestBoard.width, latestBoard.height)
      }
    })
  }

  const handleAddOutline = (values: {
    width: number
    color: string
    skipCorners: boolean
  }) => {
    const current = boardRef.current

    if (!current) {
      return
    }

    const outlined = addOutline(
      current,
      values.width,
      values.color,
      values.skipCorners
    )

    if (outlined) {
      setBoard(() => outlined)
    }
  }

  const handleOpenAddOutline = () => {
    open(AddOutlineModal, {
      defaultColor: 'T1',
      onSubmit: handleAddOutline
    })
  }

  const handleOpenPreview = () => {
    if (!board) {
      return
    }

    open(PreviewModal, {
      grid: board.grid,
      width: board.width,
      height: board.height
    })
  }

  const handleSave = async () => {
    if (!board) {
      return
    }

    if (!blueprint) {
      open(SaveBlueprintModal, {
        grid: board.grid,
        width: board.width,
        height: board.height,
        onSaved: handleSaved
      })

      return
    }

    await saveMutation.mutateAsync({
      grid: board.grid,
      width: board.width,
      height: board.height
    })
    handleSaved(blueprint)
    toast.success(t('messages.blueprintSaved'))
  }

  const {
    containerRef,
    stageRef,
    width,
    height,
    view,
    viewport,
    gridColor,
    borderColor,
    chunkColor,
    handleWheel,
    handleDrag,
    panBy,
    centerView
  } = useEditorViewport(board)

  if (!board?.grid.length) {
    return (
      <>
        <GoBackButton
          onClick={() => navigate('/melvinchia3636--perler-beads')}
        />
        <EmptyStateScreen
          icon="tabler:grid-off"
          message={{
            title: t('empty.result.title'),
            description: t('empty.result.description')
          }}
        />
      </>
    )
  }

  return (
    <>
      <GoBackButton onClick={() => navigate('/melvinchia3636--perler-beads')} />
      <EditorHeader
        blueprint={blueprint}
        canRedo={canRedo}
        canUndo={canUndo}
        isDirty={isDirty}
        loading={saveMutation.isPending}
        onRedo={handleRedo}
        onRename={name =>
          setBlueprint(current => (current ? { ...current, name } : current))
        }
        onSave={handleSave}
        onUndo={handleUndo}
      />
      <LayoutWithSidebar>
        <EditorSidebar
          beadShape={beadShape}
          bucketMode={bucketMode}
          grid={board.grid}
          height={board.height}
          selectedColor={selectedColor}
          showColorCodes={showColorCodes}
          showGridLines={showGridLines}
          tool={tool}
          width={board.width}
          onAddOutline={handleOpenAddOutline}
          onBeadShapeChange={setBeadShape}
          onBucketModeChange={setBucketMode}
          onResize={handleResize}
          onShowColorCodesChange={setShowColorCodes}
          onShowGridLinesChange={setShowGridLines}
          onToolChange={setTool}
          onTrim={handleTrim}
          onPreview={handleOpenPreview}
        />
        <ContentWrapperWithSidebar>
          <Card
            ref={containerRef}
            flex="1"
            minHeight="0"
            overflow="hidden"
            p="none"
            data-tooltip-id="bead-cell-tooltip"
            style={{ cursor: isPaintTool ? 'crosshair' : 'grab' }}
            width="100%"
          >
            <Stage
              ref={stageRef}
              draggable={!isPaintTool}
              height={height}
              scaleX={view.scale}
              scaleY={view.scale}
              width={width}
              x={view.x}
              y={view.y}
              onDragMove={handleDrag}
              onMouseDown={handlePaintStart}
              onMouseLeave={handleStageMouseLeave}
              onMouseMove={handleStageMouseMove}
              onMouseUp={handlePaintEnd}
              onTouchEnd={handlePaintEnd}
              onTouchMove={handlePaintMove}
              onTouchStart={handlePaintStart}
              onWheel={handleWheel}
            >
              <Layer listening={false}>
                <InfiniteGrid
                  borderColor={borderColor}
                  chunkColor={chunkColor}
                  color={gridColor}
                  height={board.height}
                  scale={view.scale}
                  showLines={showGridLines}
                  width={board.width}
                />
              </Layer>
              <Layer listening={false}>
                <BeadLayer
                  grid={board.grid}
                  height={board.height}
                  scale={view.scale}
                  shape={beadShape}
                  showColorCodes={showColorCodes}
                  viewport={viewport}
                  width={board.width}
                />
              </Layer>
              <Layer listening={false}>
                <PatchHighlight
                  cells={hoveredPatch}
                  color={bucketMode === 'clear' ? '#ef4444' : selectedColorHex}
                />
              </Layer>
            </Stage>
            <ResizeHandles
              height={board.height}
              view={view}
              width={board.width}
              onResize={handleResizeEdge}
              onResizeEnd={handleResizeEnd}
            />
            <Tooltip
              float
              id="bead-cell-tooltip"
              isOpen={Boolean(hoveredCell)}
              offset={12}
            >
              {hoveredCell ? (
                <Flex align="center" gap="sm">
                  <Box
                    bg="transparent"
                    height="1.2em"
                    r="sm"
                    style={{ backgroundColor: hoveredCell.color }}
                    width="1.2em"
                  />
                  <Text weight="medium">{hoveredCell.code}</Text>
                  <Icon
                    color="muted"
                    icon="tabler:circle-filled"
                    size="0.4em"
                  />
                  <Text>
                    ({hoveredCell.column + 1}, {hoveredCell.row + 1})
                  </Text>
                </Flex>
              ) : null}
            </Tooltip>
          </Card>
          <ColorPalette
            grid={board.grid}
            selectedColor={selectedColor}
            onSelectColor={setSelectedColor}
          />
        </ContentWrapperWithSidebar>
      </LayoutWithSidebar>
    </>
  )
}

export default Editor
