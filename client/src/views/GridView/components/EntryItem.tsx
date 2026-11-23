import { useNavigate } from 'react-router'

import { Box, Card, Flex, Text } from '@lifeforge/ui'

import { BlueprintMetadata } from '@/components/BlueprintMetadata'
import { BlueprintPreview } from '@/components/BlueprintPreview'
import type { BlueprintEntry } from '@/views'

function EntryItem({ entry }: { entry: BlueprintEntry }) {
  const navigate = useNavigate()

  const openBlueprint = () => {
    navigate('/melvinchia3636--perler-beads/editor', {
      state: {
        grid: entry.grid,
        width: entry.width,
        height: entry.height,
        blueprint: { id: entry.id, name: entry.name }
      }
    })
  }

  return (
    <Card isInteractive as="li" gap="sm" onClick={openBlueprint}>
      <Flex
        align="center"
        aspectRatio="1 / 1"
        bg={{ base: 'bg-100', dark: 'bg-800' }}
        justify="center"
        overflow="hidden"
        p="sm"
        r="md"
        width="100%"
      >
        <BlueprintPreview
          grid={entry.grid}
          height={entry.height}
          width={entry.width}
        />
      </Flex>
      <Box minWidth="0" width="100%">
        <Text as="h3" size="lg" truncate weight="semibold">
          {entry.name}
        </Text>
        <BlueprintMetadata entry={entry} />
      </Box>
    </Card>
  )
}

export default EntryItem
