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
    <Card
      isInteractive
      align="stretch"
      as="li"
      direction="row"
      gap="md"
      p="md"
      width="100%"
      onClick={openBlueprint}
    >
      <Box
        bg={{ base: 'bg-100', dark: 'bg-800' }}
        flexShrink="0"
        overflow="hidden"
        position="relative"
        r="md"
        style={{ alignSelf: 'stretch' }}
        width="4.5em"
      >
        <Flex
          align="center"
          inset="0"
          justify="center"
          p="xs"
          position="absolute"
        >
          <BlueprintPreview
            grid={entry.grid}
            height={entry.height}
            width={entry.width}
          />
        </Flex>
      </Box>
      <Box flex="1" minWidth="0">
        <Text as="h3" size="lg" truncate weight="semibold">
          {entry.name}
        </Text>
        <BlueprintMetadata entry={entry} />
      </Box>
    </Card>
  )
}

export default EntryItem
