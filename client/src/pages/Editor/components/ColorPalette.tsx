import { useMemo } from 'react'

import { useModuleTranslation } from '@lifeforge/localization'
import {
  Card,
  Flex,
  Grid,
  Icon,
  Scrollbar,
  Text,
  colorWithOpacity,
  createViewMode,
  surface
} from '@lifeforge/ui'

import { MARD_COLORS } from '@/constants/mardColors'

const MARD_BY_CODE = new Map(MARD_COLORS.map(({ code, hex }) => [code, hex]))

const ALL_COLORS = MARD_COLORS.map(({ code, hex }) => ({
  code,
  color: hex
}))

const PaletteView = createViewMode({
  modes: [
    {
      value: 'used',
      icon: 'tabler:palette',
      text: 'colorPalette.usedColors'
    },
    {
      value: 'all',
      icon: 'tabler:color-swatch',
      text: 'colorPalette.allColors'
    }
  ],
  persistInLocalStorage: false,
  useNuqs: false
})

interface ColorPaletteProps {
  grid: string[][]
  selectedColor: string | null
  onSelectColor: (code: string) => void
}

export function ColorPalette({
  grid,
  selectedColor,
  onSelectColor
}: ColorPaletteProps) {
  const { t } = useModuleTranslation()
  const { currentMode } = PaletteView.useContext()

  const usedColors = useMemo(() => {
    const counts = new Map<string, number>()

    for (const code of grid.flat()) {
      if (!code) {
        continue
      }

      counts.set(code, (counts.get(code) ?? 0) + 1)
    }

    return [...counts.entries()]
      .sort((first, second) => second[1] - first[1])
      .map(([code, count]) => ({
        code,
        count,
        color: MARD_BY_CODE.get(code) ?? '#000000'
      }))
  }, [grid])

  const colors: { code: string; color: string; count?: number }[] =
    currentMode === 'used' ? usedColors : ALL_COLORS

  return (
    <PaletteView.Root>
      <Card mt="md" width="100%">
        <Flex
          align="start"
          gap="md"
          justify="between"
          mb="md"
          width="100%"
          wrap="wrap"
        >
          <Text as="h2" size="lg" weight="semibold">
            {t('colorPalette.title')}
          </Text>
          <PaletteView.Selector bg={surface.light} p="none" />
        </Flex>
        <Scrollbar autoHeight autoHeightMax="12em">
          <Grid
            gap="xs"
            templateCols="repeat(auto-fill, minmax(5em, 1fr))"
            width="100%"
          >
            {colors.map(color => (
              <Card
                key={color.code}
                isInteractive
                align="center"
                bg={
                  selectedColor === color.code
                    ? {
                        base: 'custom-200',
                        dark: colorWithOpacity('custom-500', '20%')
                      }
                    : surface.lightInteractive
                }
                direction="column"
                gap="xs"
                justify="between"
                p="xs"
                r="md"
                style={{ paddingTop: '0.75em' }}
                onClick={() => onSelectColor(color.code)}
              >
                <Flex
                  align="center"
                  bg={
                    color.code === 'T1'
                      ? { base: 'bg-100', dark: 'bg-800' }
                      : 'transparent'
                  }
                  height="3em"
                  justify="center"
                  r="sm"
                  style={
                    color.code === 'T1'
                      ? { border: '1px dashed var(--color-bg-400)' }
                      : { backgroundColor: color.color }
                  }
                  width="3em"
                >
                  {color.code === 'T1' && (
                    <Icon color="muted" icon="tabler:x" size="1.75em" />
                  )}
                </Flex>
                <Text weight="medium">{color.code}</Text>
                {color.count !== undefined && (
                  <Text color="muted" size="sm">
                    ×{color.count}
                  </Text>
                )}
              </Card>
            ))}
          </Grid>
        </Scrollbar>
      </Card>
    </PaletteView.Root>
  )
}
