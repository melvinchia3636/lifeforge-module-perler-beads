import { useState } from 'react'

import { useModuleTranslation } from '@lifeforge/localization'
import { SidebarWrapper, Tabs } from '@lifeforge/ui'

import type { BeadShape, BucketMode, EditorTool } from '../../types'
import { EditTab } from './tabs/EditTab'
import { ViewTab } from './tabs/ViewTab'

const SIDEBAR_TABS = [
  { id: 'view', name: 'tabs.view', icon: 'tabler:eye' },
  { id: 'edit', name: 'tabs.edit', icon: 'tabler:pencil' }
] as const

interface EditorSidebarProps {
  beadShape: BeadShape
  bucketMode: BucketMode
  grid: string[][]
  width: number
  height: number
  tool: EditorTool
  selectedColor: string | null
  showColorCodes: boolean
  onShowColorCodesChange: (value: boolean) => void
  showGridLines: boolean
  onShowGridLinesChange: (value: boolean) => void
  onBeadShapeChange: (shape: BeadShape) => void
  onBucketModeChange: (mode: BucketMode) => void
  onToolChange: (tool: EditorTool) => void
  onResize: (width: number, height: number) => void
  onTrim: () => void
  onAddOutline: () => void
  onPreview: () => void
}

export function EditorSidebar({
  beadShape,
  bucketMode,
  grid,
  width,
  height,
  tool,
  selectedColor,
  showColorCodes,
  onShowColorCodesChange,
  showGridLines,
  onShowGridLinesChange,
  onBeadShapeChange,
  onBucketModeChange,
  onToolChange,
  onResize,
  onTrim,
  onAddOutline,
  onPreview
}: EditorSidebarProps) {
  const { t } = useModuleTranslation()
  const [mode, setMode] = useState<'view' | 'edit'>('view')

  return (
    <SidebarWrapper>
      <Tabs
        currentTab={mode}
        enabled={['view', 'edit']}
        items={SIDEBAR_TABS.map(item => ({ ...item, name: t(item.name) }))}
        mb="md"
        px="md"
        onTabChange={setMode}
      />
      {mode === 'view' && (
        <ViewTab
          beadShape={beadShape}
          grid={grid}
          height={height}
          showColorCodes={showColorCodes}
          showGridLines={showGridLines}
          width={width}
          onBeadShapeChange={onBeadShapeChange}
          onShowColorCodesChange={onShowColorCodesChange}
          onShowGridLinesChange={onShowGridLinesChange}
          onPreview={onPreview}
        />
      )}
      {mode === 'edit' && (
        <EditTab
          bucketMode={bucketMode}
          grid={grid}
          height={height}
          selectedColor={selectedColor}
          tool={tool}
          width={width}
          onBucketModeChange={onBucketModeChange}
          onResize={onResize}
          onToolChange={onToolChange}
          onTrim={onTrim}
          onAddOutline={onAddOutline}
        />
      )}
    </SidebarWrapper>
  )
}
