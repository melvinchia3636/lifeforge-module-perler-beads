import { useModuleTranslation } from '@lifeforge/localization'
import { Box, Button, Flex, Text, useModalStore } from '@lifeforge/ui'

import RenameBlueprintModal from '@/modals/RenameBlueprintModal'

import type { SavedBlueprint } from '../types'

interface EditorHeaderProps {
  blueprint: SavedBlueprint | null
  canRedo: boolean
  canUndo: boolean
  isDirty: boolean
  loading: boolean
  onRedo: () => void
  onUndo: () => void
  onSave: () => void
  onRename: (name: string) => void
}

export function EditorHeader({
  blueprint,
  canRedo,
  canUndo,
  isDirty,
  loading,
  onRedo,
  onUndo,
  onSave,
  onRename
}: EditorHeaderProps) {
  const { t } = useModuleTranslation()
  const { open } = useModalStore()

  return (
    <Box as="header" mb="md" width="100%">
      <Flex align="center" gap="md" justify="between" minWidth="0">
        <Flex align="center" gap="sm" minWidth="0">
          <Text
            truncate
            as="h1"
            size={{ base: 'xl', sm: '2xl' }}
            weight="semibold"
          >
            {blueprint?.name ?? t('items.unsavedBlueprint')}
          </Text>
          {blueprint && (
            <Button
              icon="tabler:pencil"
              variant="plain"
              onClick={() =>
                open(RenameBlueprintModal, {
                  blueprint,
                  onRenamed: onRename
                })
              }
            />
          )}
        </Flex>
        <Flex align="center" gap="sm">
          <Flex align="center" gap="xs">
            <Button
              disabled={!canUndo}
              icon="tabler:arrow-back-up"
              variant="plain"
              onClick={onUndo}
            />
            <Button
              disabled={!canRedo}
              icon="tabler:arrow-forward-up"
              variant="plain"
              onClick={onRedo}
            />
          </Flex>
          <Button
            disabled={!isDirty}
            icon="tabler:device-floppy"
            loading={loading}
            p="sm"
            onClick={onSave}
          />
        </Flex>
      </Flex>
    </Box>
  )
}
