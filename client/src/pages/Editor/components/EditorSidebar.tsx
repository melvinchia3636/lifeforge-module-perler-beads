import { useMemo } from 'react'

import { useModuleTranslation } from '@lifeforge/localization'
import {
  Flex,
  SidebarDivider,
  SidebarTitle,
  SidebarWrapper,
  Switch,
  Text
} from '@lifeforge/ui'

interface EditorSidebarProps {
  grid: string[][]
  width: number
  height: number
  showColorCodes: boolean
  onShowColorCodesChange: (value: boolean) => void
  showGridLines: boolean
  onShowGridLinesChange: (value: boolean) => void
}

export function EditorSidebar({
  grid,
  width,
  height,
  showColorCodes,
  onShowColorCodesChange,
  showGridLines,
  onShowGridLinesChange
}: EditorSidebarProps) {
  const { t } = useModuleTranslation()

  const { totalBeads, colorsUsed } = useMemo(() => {
    const codes = grid.flat().filter(Boolean)

    return {
      totalBeads: codes.length,
      colorsUsed: new Set(codes).size
    }
  }, [grid])

  return (
    <SidebarWrapper>
      <SidebarTitle
        label={t('sidebar.displaySettings')}
        namespace={false}
        pl="md"
      />
      <Flex align="center" justify="between" px="md" py="sm" width="100%">
        <Text weight="medium">{t('sidebar.showColorCode')}</Text>
        <Switch value={showColorCodes} onChange={onShowColorCodesChange} />
      </Flex>
      <Flex align="center" justify="between" px="md" py="sm" width="100%">
        <Text weight="medium">{t('sidebar.showGridLines')}</Text>
        <Switch value={showGridLines} onChange={onShowGridLinesChange} />
      </Flex>
      <SidebarDivider />
      <SidebarTitle label={t('sidebar.statistics')} namespace={false} pl="md" />
      <Flex align="center" justify="between" px="md" py="xs" width="100%">
        <Text color="muted">{t('stats.size')}</Text>
        <Text weight="medium">
          {width} × {height}
        </Text>
      </Flex>
      <Flex align="center" justify="between" px="md" py="xs" width="100%">
        <Text color="muted">{t('stats.totalBeads')}</Text>
        <Text weight="medium">{totalBeads.toLocaleString()}</Text>
      </Flex>
      <Flex align="center" justify="between" px="md" py="xs" width="100%">
        <Text color="muted">{t('stats.colorsUsed')}</Text>
        <Text weight="medium">{colorsUsed.toLocaleString()}</Text>
      </Flex>
    </SidebarWrapper>
  )
}
