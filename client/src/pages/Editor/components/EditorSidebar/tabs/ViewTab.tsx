import { useMemo } from 'react'

import { useModuleTranslation } from '@lifeforge/localization'
import {
  Button,
  Flex,
  Grid,
  SidebarDivider,
  SidebarTitle,
  Switch,
  Text
} from '@lifeforge/ui'

import type { BeadShape } from '../../../types'
import { BEAD_PITCH_MM } from '../../../constants'

const BEAD_SHAPES: { id: BeadShape; icon: string }[] = [
  { id: 'square', icon: 'tabler:square' },
  { id: 'rounded', icon: 'tabler:square-rounded' },
  { id: 'circle', icon: 'tabler:circle' },
  { id: 'ring', icon: 'tabler:circle-dot' }
]

interface ViewTabProps {
  beadShape: BeadShape
  grid: string[][]
  width: number
  height: number
  showColorCodes: boolean
  onShowColorCodesChange: (value: boolean) => void
  showGridLines: boolean
  onShowGridLinesChange: (value: boolean) => void
  onBeadShapeChange: (shape: BeadShape) => void
  onPreview: () => void
}

export function ViewTab({
  beadShape,
  grid,
  width,
  height,
  showColorCodes,
  onShowColorCodesChange,
  showGridLines,
  onShowGridLinesChange,
  onBeadShapeChange,
  onPreview
}: ViewTabProps) {
  const { t } = useModuleTranslation()

  const { totalBeads, colorsUsed } = useMemo(() => {
    const codes = grid.flat().filter(Boolean)

    return {
      totalBeads: codes.length,
      colorsUsed: new Set(codes).size
    }
  }, [grid])

  const realLifeWidth = ((width * BEAD_PITCH_MM) / 10).toFixed(1)
  const realLifeHeight = ((height * BEAD_PITCH_MM) / 10).toFixed(1)

  return (
    <>
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
      <SidebarTitle label={t('sidebar.beadShape')} namespace={false} pl="md" />
      <Grid
        gap="sm"
        px="md"
        py="sm"
        templateCols="1fr 1fr"
        width="100%"
      >
        {BEAD_SHAPES.map(({ id, icon }) => (
          <Button
            key={id}
            icon={icon}
            variant={beadShape === id ? 'primary' : 'secondary'}
            width="100%"
            onClick={() => onBeadShapeChange(id)}
          >
            {id}
          </Button>
        ))}
      </Grid>
      <SidebarDivider />
      <SidebarTitle label={t('sidebar.statistics')} namespace={false} pl="md" />
      <Flex align="center" justify="between" px="md" py="xs" width="100%">
        <Text color="muted">{t('stats.size')}</Text>
        <Text weight="medium">
          {width} × {height}
        </Text>
      </Flex>
      <Flex align="center" justify="between" px="md" py="xs" width="100%">
        <Text color="muted">{t('stats.realLifeSize')}</Text>
        <Text weight="medium">
          {realLifeWidth} × {realLifeHeight} cm
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
      <SidebarDivider />
      <Flex px="md" py="sm" width="100%">
        <Button
          icon="tabler:cube"
          variant="secondary"
          width="100%"
          onClick={onPreview}
        >
          preview
        </Button>
      </Flex>
    </>
  )
}
