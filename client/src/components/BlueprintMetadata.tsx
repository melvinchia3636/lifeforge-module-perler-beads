import { useMemo } from 'react'

import { useModuleTranslation } from '@lifeforge/localization'
import { Box, Flex, Icon, Text } from '@lifeforge/ui'

import type { BlueprintEntry } from '@/views'

export function BlueprintMetadata({ entry }: { entry: BlueprintEntry }) {
  const { t } = useModuleTranslation()

  const { totalBeads, colorsUsed } = useMemo(() => {
    const codes = entry.grid.flat().filter(Boolean)

    return {
      totalBeads: codes.length,
      colorsUsed: new Set(codes).size
    }
  }, [entry.grid])

  const items = [
    {
      icon: 'tabler:ruler-measure',
      key: 'dimensions',
      value: `${entry.width} × ${entry.height}`
    },
    {
      icon: 'tabler:circle',
      key: 'totalBeads',
      value: totalBeads.toLocaleString()
    },
    {
      icon: 'tabler:palette',
      key: 'colorsUsed',
      value: colorsUsed.toLocaleString()
    },
    {
      icon: 'tabler:calendar',
      key: 'created',
      value: new Intl.DateTimeFormat(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }).format(new Date(entry.created))
    }
  ]

  return (
    <Flex gap="md" mt="md" wrap="wrap">
      {items.map(item => (
        <Box key={item.key}>
          <Flex align="center" gap="xs" mb="xs">
            <Icon color="muted" icon={item.icon} />
            <Text color="muted" weight="medium">
              {t(`metadata.${item.key}`)}
            </Text>
          </Flex>
          <Text whiteSpace={item.key === 'dimensions' ? 'nowrap' : undefined}>
            {item.value}
          </Text>
        </Box>
      ))}
    </Flex>
  )
}
