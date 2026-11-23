import { useEffect, useMemo, useState } from 'react'

import { useModuleTranslation } from '@lifeforge/localization'
import {
  Box,
  Button,
  Flex,
  NumberInput,
  SidebarDivider,
  SidebarTitle,
  Stack,
  Text
} from '@lifeforge/ui'

import { MARD_COLORS } from '@/constants/mardColors'

import type { BucketMode, EditorTool } from '../../../types'

const MAX_BOARD_SIZE = 512

interface EditTabProps {
  bucketMode: BucketMode
  selectedColor: string | null
  grid: string[][]
  width: number
  height: number
  tool: EditorTool
  onResize: (width: number, height: number) => void
  onTrim: () => void
  onToolChange: (tool: EditorTool) => void
  onBucketModeChange: (mode: BucketMode) => void
  onAddOutline: () => void
}

export function EditTab({
  bucketMode,
  selectedColor,
  grid,
  width,
  height,
  tool,
  onResize,
  onTrim,
  onToolChange,
  onBucketModeChange,
  onAddOutline
}: EditTabProps) {
  const { t } = useModuleTranslation()
  const [draftWidth, setDraftWidth] = useState(width)
  const [draftHeight, setDraftHeight] = useState(height)

  const minDimensions = useMemo(() => {
    let minWidth = 1
    let minHeight = 1

    grid.forEach((row, rowIndex) => {
      row.forEach((code, columnIndex) => {
        if (!code) {
          return
        }

        minWidth = Math.max(minWidth, columnIndex + 1)
        minHeight = Math.max(minHeight, rowIndex + 1)
      })
    })

    return { width: minWidth, height: minHeight }
  }, [grid])

  useEffect(() => {
    setDraftWidth(width)
  }, [width])

  useEffect(() => {
    setDraftHeight(height)
  }, [height])

  const getError = (value: number, min: number) =>
    value < min || value > MAX_BOARD_SIZE || !Number.isInteger(value)
      ? t('inputs.invalidNumber', { min, max: MAX_BOARD_SIZE })
      : undefined

  const handleWidthChange = (value: number) => {
    setDraftWidth(value)

    if (value >= minDimensions.width && value <= MAX_BOARD_SIZE) {
      onResize(value, height)
    }
  }

  const handleHeightChange = (value: number) => {
    setDraftHeight(value)

    if (value >= minDimensions.height && value <= MAX_BOARD_SIZE) {
      onResize(width, value)
    }
  }

  const selectedColorHex =
    MARD_COLORS.find(({ code }) => code === selectedColor)?.hex ?? '#000000'

  return (
    <>
      <SidebarTitle label={t('sidebar.dimensions')} namespace={false} pl="md" />
      <Stack gap="md" px="md" py="sm">
        <NumberInput
          errorMsg={getError(draftWidth, minDimensions.width)}
          icon="tabler:arrows-horizontal"
          label="Width"
          max={MAX_BOARD_SIZE}
          min={minDimensions.width}
          value={draftWidth}
          onChange={handleWidthChange}
        />
        <NumberInput
          errorMsg={getError(draftHeight, minDimensions.height)}
          icon="tabler:arrows-vertical"
          label="Height"
          max={MAX_BOARD_SIZE}
          min={minDimensions.height}
          value={draftHeight}
          onChange={handleHeightChange}
        />
        <Button
          icon="tabler:crop"
          variant="secondary"
          width="100%"
          onClick={onTrim}
        >
          autoTrim
        </Button>
      </Stack>
      <SidebarDivider />
      <SidebarTitle label={t('sidebar.colors')} namespace={false} pl="md" />
      <Flex
        align="center"
        justify="between"
        px="md"
        py="sm"
        width="100%"
      >
        <Text color="muted">{t('sidebar.selectedColor')}</Text>
        <Flex align="center" gap="sm">
          <Box
            bg="transparent"
            height="2em"
            r="sm"
            style={{ backgroundColor: selectedColorHex }}
            width="2em"
          />
          <Text weight="medium">{selectedColor ?? '—'}</Text>
        </Flex>
      </Flex>
      <SidebarDivider />
      <SidebarTitle label={t('sidebar.tools')} namespace={false} pl="md" />
      <Stack gap="md" px="md" py="sm">
        <Stack gap="sm" width="100%">
          <Button
            icon="tabler:hand-stop"
            variant={tool === 'hand' ? 'primary' : 'secondary'}
            width="100%"
            onClick={() => onToolChange('hand')}
          >
            hand
          </Button>
          <Button
            disabled={!selectedColor}
            icon="tabler:brush"
            variant={tool === 'brush' ? 'primary' : 'secondary'}
            width="100%"
            onClick={() => onToolChange('brush')}
          >
            brush
          </Button>
          <Button
            icon="tabler:eraser"
            variant={tool === 'eraser' ? 'primary' : 'secondary'}
            width="100%"
            onClick={() => onToolChange('eraser')}
          >
            eraser
          </Button>
          <Button
            icon="tabler:color-picker"
            variant={tool === 'eyedropper' ? 'primary' : 'secondary'}
            width="100%"
            onClick={() => onToolChange('eyedropper')}
          >
            eyedropper
          </Button>
          <Button
            icon="tabler:bucket"
            variant={tool === 'bucket' ? 'primary' : 'secondary'}
            width="100%"
            onClick={() => onToolChange('bucket')}
          >
            bucket
          </Button>
        </Stack>
        {tool === 'bucket' && (
          <Flex gap="sm" width="100%">
            <Button
              disabled={!selectedColor}
              flex="1"
              icon="tabler:paint"
              variant={bucketMode === 'fill' ? 'primary' : 'secondary'}
              onClick={() => onBucketModeChange('fill')}
            >
              fill
            </Button>
            <Button
              flex="1"
              icon="tabler:eraser"
              variant={bucketMode === 'clear' ? 'primary' : 'secondary'}
              onClick={() => onBucketModeChange('clear')}
            >
              clear
            </Button>
          </Flex>
        )}
        <Button
          icon="tabler:border-outer"
          variant="secondary"
          width="100%"
          onClick={onAddOutline}
        >
          addOutline
        </Button>
      </Stack>
    </>
  )
}
