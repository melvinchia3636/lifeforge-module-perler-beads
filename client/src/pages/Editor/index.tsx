import { useState } from 'react'
import { Layer, Stage } from 'react-konva'
import { useLocation, useNavigate } from 'react-router'

import { useModuleTranslation } from '@lifeforge/localization'
import {
  Card,
  ContentWrapperWithSidebar,
  EmptyStateScreen,
  GoBackButton,
  LayoutWithSidebar
} from '@lifeforge/ui'

import { BeadLayer } from './components/BeadLayer'
import { EditorSidebar } from './components/EditorSidebar'
import { GridNumbers } from './components/GridNumbers'
import { InfiniteGrid } from './components/InfiniteGrid'
import { MaterialList } from './components/MaterialList'
import { useEditorViewport } from './hooks/useEditorViewport'
import type { EditorState } from './types'

function Editor() {
  const { t } = useModuleTranslation()
  const { state } = useLocation()
  const navigate = useNavigate()
  const [showColorCodes, setShowColorCodes] = useState(false)
  const [showGridLines, setShowGridLines] = useState(true)

  const editorState = state as EditorState | null
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
    numberColor,
    handleWheel,
    handleDrag
  } = useEditorViewport(editorState)

  if (!editorState?.grid.length) {
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
      <LayoutWithSidebar>
        <EditorSidebar
          grid={editorState.grid}
          height={editorState.height}
          showColorCodes={showColorCodes}
          showGridLines={showGridLines}
          width={editorState.width}
          onShowColorCodesChange={setShowColorCodes}
          onShowGridLinesChange={setShowGridLines}
        />
        <ContentWrapperWithSidebar>
          <Card
            ref={containerRef}
            flex="1"
            minHeight="0"
            overflow="hidden"
            p="none"
            width="100%"
          >
            <Stage
              ref={stageRef}
              draggable
              height={height}
              scaleX={view.scale}
              scaleY={view.scale}
              width={width}
              x={view.x}
              y={view.y}
              onDragMove={handleDrag}
              onWheel={handleWheel}
            >
              <Layer listening={false}>
                <BeadLayer
                  grid={editorState.grid}
                  height={editorState.height}
                  scale={view.scale}
                  showColorCodes={showColorCodes}
                  viewport={viewport}
                  width={editorState.width}
                />
              </Layer>
              <Layer listening={false}>
                <GridNumbers
                  color={numberColor}
                  height={editorState.height}
                  width={editorState.width}
                />
              </Layer>
              <Layer listening={false}>
                <InfiniteGrid
                  borderColor={borderColor}
                  chunkColor={chunkColor}
                  color={gridColor}
                  height={editorState.height}
                  scale={view.scale}
                  showLines={showGridLines}
                  width={editorState.width}
                />
              </Layer>
            </Stage>
          </Card>
          <MaterialList grid={editorState.grid} />
        </ContentWrapperWithSidebar>
      </LayoutWithSidebar>
    </>
  )
}

export default Editor
