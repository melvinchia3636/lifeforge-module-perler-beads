import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router'

import { useModuleTranslation } from '@lifeforge/localization'
import {
  Box,
  Button,
  ContextMenu,
  ContextMenuItem,
  EmptyStateScreen,
  Flex,
  ModuleHeader,
  Pagination,
  SearchInput,
  Stack,
  WithQuery,
  useModalStore
} from '@lifeforge/ui'

import { forgeAPI } from '@/manifest'
import UploadImageModal from '@/modals/UploadImageModal'
import Views, { BlueprintView } from '@/views'

const DEFAULT_BLUEPRINT_SIZE = 29

function PerlerBeads() {
  const { t } = useModuleTranslation()
  const { open } = useModalStore()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)

  const handleStartFromScratch = () => {
    navigate('/melvinchia3636--perler-beads/editor', {
      state: {
        grid: Array.from({ length: DEFAULT_BLUEPRINT_SIZE }, () =>
          Array.from({ length: DEFAULT_BLUEPRINT_SIZE }, () => '')
        ),
        width: DEFAULT_BLUEPRINT_SIZE,
        height: DEFAULT_BLUEPRINT_SIZE
      }
    })
  }

  const blueprintsQuery = useQuery(
    forgeAPI.blueprints.list
      .input({
        page: page.toString(),
        q: searchQuery.trim() || undefined
      })
      .queryOptions()
  )

  return (
    <BlueprintView.Root>
      <ModuleHeader
        trailing={
          <ContextMenu
            buttonComponent={
              <Button icon="tabler:plus">newBlueprint</Button>
            }
          >
            <ContextMenuItem
              icon="tabler:file-plus"
              label="fromScratch"
              onClick={handleStartFromScratch}
            />
            <ContextMenuItem
              icon="tabler:photo-up"
              label="importFromImage"
              onClick={() => open(UploadImageModal, {})}
            />
          </ContextMenu>
        }
      />
      <Stack flex="1" gap="md" minHeight="0">
        <Flex align="center" gap="md" width="100%">
          <Box flex="1" minWidth="0">
            <SearchInput
              debounceMs={300}
              searchTarget="blueprint"
              value={searchQuery}
              onChange={value => {
                setSearchQuery(value)
                setPage(1)
              }}
            />
          </Box>
          <BlueprintView.Selector />
        </Flex>
        <WithQuery query={blueprintsQuery}>
          {data =>
            data.items.length === 0 ? (
              <EmptyStateScreen
                icon={searchQuery ? 'tabler:search' : 'uix-sharp:concrete-pipe'}
                message={{
                  title: t(
                    searchQuery ? 'empty.search.title' : 'empty.blueprints.title'
                  ),
                  description: t(
                    searchQuery
                      ? 'empty.search.description'
                      : 'empty.blueprints.description'
                  )
                }}
              />
            ) : (
              <Stack gap="md">
                <Views entries={data.items} />
                {data.totalPages > 1 && (
                  <Pagination
                    mb="lg"
                    page={data.page}
                    totalPages={data.totalPages}
                    onPageChange={setPage}
                  />
                )}
              </Stack>
            )
          }
        </WithQuery>
      </Stack>
    </BlueprintView.Root>
  )
}

export default PerlerBeads
