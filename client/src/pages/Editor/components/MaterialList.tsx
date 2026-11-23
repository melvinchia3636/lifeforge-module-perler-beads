import { useMemo } from 'react'

import { Box, Card, Flex, Grid, Scrollbar, Text } from '@lifeforge/ui'

import { MARD_COLORS } from '@/constants/mardColors'

const MARD_BY_CODE = new Map(
  MARD_COLORS.map(({ code, hex }) => [code, hex])
)

interface MaterialListProps {
  grid: string[][]
}

export function MaterialList({ grid }: MaterialListProps) {
  const materials = useMemo(() => {
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

  return (
    <Box mt="md" width="100%">
      <Scrollbar autoHeight autoHeightMax="12em">
        <Grid
          gap="sm"
          templateCols="repeat(auto-fill, minmax(8em, 1fr))"
          width="100%"
        >
          {materials.map(material => (
            <Card
              key={material.code}
              align="center"
              direction="row"
              gap="sm"
              justify="between"
              p="sm"
              r="md"
            >
              <Flex align="center" gap="sm">
                <Box
                  bg="transparent"
                  height="1.25em"
                  r="sm"
                  style={{ backgroundColor: material.color }}
                  width="1.25em"
                />
                <Text weight="medium">{material.code}</Text>
              </Flex>
              <Text color="muted" size="sm">
                ×{material.count}
              </Text>
            </Card>
          ))}
        </Grid>
      </Scrollbar>
    </Box>
  )
}
