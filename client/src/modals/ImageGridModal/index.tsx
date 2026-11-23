import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch'

import { useModuleTranslation } from '@lifeforge/localization'
import {
  Box,
  Button,
  Checkbox,
  Flex,
  ModalHeader,
  SliderInput,
  Stack,
  Tabs,
  WithQuery,
  surface
} from '@lifeforge/ui'

import { forgeAPI } from '@/manifest'

import { ImageGridCanvas } from './components/ImageGridCanvas'
import { ResultGridCanvas } from './components/ResultGridCanvas'
import { useDebouncedValue } from './hooks/useDebouncedValue'
import { useImageDimensions } from './hooks/useImageDimensions'
import { trimGrid } from './utils/trimGrid'

const DEFAULT_SIZE = 29
const DEFAULT_ADJUSTMENT = 100
const DEBOUNCE_MS = 500

const TABS = [
  { id: 'original', name: 'tabs.original', icon: 'tabler:photo' },
  { id: 'result', name: 'tabs.result', icon: 'tabler:grid-dots' }
] as const

const SETTINGS_TABS = [
  { id: 'grid', name: 'tabs.grid', icon: 'tabler:grid-dots' },
  { id: 'colors', name: 'tabs.colors', icon: 'tabler:palette' },
  { id: 'adjustments', name: 'tabs.adjustments', icon: 'tabler:adjustments' }
] as const

type TabId = (typeof TABS)[number]['id']
type SettingsTabId = (typeof SETTINGS_TABS)[number]['id']

function ImageGridModal({
  data: { src, key },
  onClose
}: {
  data: {
    src?: string
    key: string
  }
  onClose: () => void
}) {
  const { t } = useModuleTranslation()
  const navigate = useNavigate()
  const [tab, setTab] = useState<TabId>('original')
  const [settingsTab, setSettingsTab] = useState<SettingsTabId>('grid')
  const [width, setWidth] = useState(DEFAULT_SIZE)
  const [height, setHeight] = useState(DEFAULT_SIZE)
  const [offsetX, setOffsetX] = useState(0)
  const [offsetY, setOffsetY] = useState(0)
  const [maxColors, setMaxColors] = useState(0)
  const [brightness, setBrightness] = useState(DEFAULT_ADJUSTMENT)
  const [contrast, setContrast] = useState(DEFAULT_ADJUSTMENT)
  const [saturation, setSaturation] = useState(DEFAULT_ADJUSTMENT)
  const [lockHeight, setLockHeight] = useState(false)
  const imageSize = useImageDimensions(src)

  useEffect(() => {
    if (!lockHeight || !imageSize.width || !imageSize.height) {
      return
    }

    setHeight(
      Math.max(
        1,
        Math.min(512, Math.round(width * (imageSize.height / imageSize.width)))
      )
    )
  }, [lockHeight, width, imageSize.width, imageSize.height])

  const paramsKey = `${width}|${height}|${offsetX}|${offsetY}|${maxColors}|${brightness}|${contrast}|${saturation}`
  const debouncedKey = useDebouncedValue(paramsKey, DEBOUNCE_MS)

  const params = useMemo(() => {
    const [
      nextWidth,
      nextHeight,
      nextOffsetX,
      nextOffsetY,
      nextMaxColors,
      nextBrightness,
      nextContrast,
      nextSaturation
    ] = debouncedKey.split('|').map(Number)

    return {
      width: nextWidth!,
      height: nextHeight!,
      offsetX: nextOffsetX!,
      offsetY: nextOffsetY!,
      maxColors: nextMaxColors!,
      brightness: nextBrightness!,
      contrast: nextContrast!,
      saturation: nextSaturation!
    }
  }, [debouncedKey])

  const matchQuery = useQuery(
    forgeAPI.images.match
      .input({
        key,
        width: params.width.toString(),
        height: params.height.toString(),
        offsetX: params.offsetX.toString(),
        offsetY: params.offsetY.toString(),
        maxColors: params.maxColors.toString(),
        brightness: params.brightness.toString(),
        contrast: params.contrast.toString(),
        saturation: params.saturation.toString()
      })
      .queryOptions({ enabled: Boolean(key) })
  )

  const isStale = paramsKey !== debouncedKey
  const result = useMemo(
    () => (matchQuery.data ? trimGrid(matchQuery.data.grid) : null),
    [matchQuery.data]
  )

  const handleGenerate = () => {
    if (!result) {
      return
    }

    onClose()
    navigate('/melvinchia3636--perler-beads/editor', {
      state: {
        grid: result.grid,
        width: result.width,
        height: result.height
      }
    })
  }

  return (
    <Box minWidth={{ base: '90vw', md: '50vw' }}>
      <ModalHeader
        icon="tabler:grid-dots"
        title="gridPreview"
        onClose={onClose}
      />
      <Tabs
        currentTab={tab}
        enabled={['original', 'result']}
        items={TABS.map(item => ({ ...item, name: t(item.name) }))}
        mt="md"
        onTabChange={setTab}
      />
      <Flex
        bg={surface.light}
        height="45vh"
        mt="md"
        overflow="hidden"
        p="md"
        r="lg"
        width="100%"
      >
        <TransformWrapper
          centerOnInit
          limitToBounds={false}
          maxScale={8}
          minScale={0.5}
          wheel={{ step: 0.15 }}
        >
          <TransformComponent
            contentStyle={{
              alignItems: 'center',
              display: 'flex',
              height: '100%',
              justifyContent: 'center',
              width: '100%'
            }}
            wrapperStyle={{ width: '100%', height: '100%' }}
          >
            {tab === 'original' ? (
              <ImageGridCanvas
                brightness={brightness}
                columns={width}
                contrast={contrast}
                offsetX={offsetX}
                offsetY={offsetY}
                rows={height}
                saturation={saturation}
                src={src ?? ''}
              />
            ) : (
              <WithQuery query={matchQuery}>
                {() =>
                  result ? (
                    <ResultGridCanvas
                      grid={result.grid}
                      height={result.height}
                      width={result.width}
                    />
                  ) : null
                }
              </WithQuery>
            )}
          </TransformComponent>
        </TransformWrapper>
      </Flex>
      <Tabs
        currentTab={settingsTab}
        enabled={['grid', 'colors', 'adjustments']}
        items={SETTINGS_TABS.map(item => ({ ...item, name: t(item.name) }))}
        mt="lg"
        onTabChange={setSettingsTab}
      />
      <Box mt="md">
        {settingsTab === 'grid' && (
          <Stack gap="md">
            <SliderInput
              icon="tabler:arrows-horizontal"
              label="Width"
              max={512}
              min={1}
              value={width}
              onChange={setWidth}
            />
            <SliderInput
              disabled={lockHeight}
              icon="tabler:arrows-vertical"
              label="Height"
              max={512}
              min={1}
              value={height}
              onChange={setHeight}
            />
            <Checkbox
              checked={lockHeight}
              disabled={!imageSize.width || !imageSize.height}
              label={t('inputs.lockHeight')}
              onCheckedChange={setLockHeight}
            />
            <SliderInput
              center={0}
              icon="tabler:grid-dots"
              label="Offset X"
              max={50}
              min={-50}
              value={offsetX}
              onChange={setOffsetX}
            />
            <SliderInput
              center={0}
              icon="tabler:grid-dots"
              label="Offset Y"
              max={50}
              min={-50}
              value={offsetY}
              onChange={setOffsetY}
            />
          </Stack>
        )}
        {settingsTab === 'colors' && (
          <Stack gap="md">
            <SliderInput
              icon="tabler:palette"
              label="Max colors"
              max={64}
              min={0}
              renderValue={value => (value === 0 ? '∞' : value.toString())}
              value={maxColors}
              onChange={setMaxColors}
            />
          </Stack>
        )}
        {settingsTab === 'adjustments' && (
          <Stack gap="md">
            <SliderInput
              center={DEFAULT_ADJUSTMENT}
              icon="tabler:sun"
              label="Brightness"
              max={200}
              min={0}
              renderValue={value => `${value}%`}
              value={brightness}
              onChange={setBrightness}
            />
            <SliderInput
              center={DEFAULT_ADJUSTMENT}
              icon="tabler:contrast"
              label="Contrast"
              max={200}
              min={0}
              renderValue={value => `${value}%`}
              value={contrast}
              onChange={setContrast}
            />
            <SliderInput
              center={DEFAULT_ADJUSTMENT}
              icon="tabler:droplet"
              label="Saturation"
              max={200}
              min={0}
              renderValue={value => `${value}%`}
              value={saturation}
              onChange={setSaturation}
            />
          </Stack>
        )}
      </Box>
      <Button
        disabled={!result || isStale || matchQuery.isFetching}
        icon="tabler:palette"
        loading={matchQuery.isFetching}
        mt="lg"
        width="100%"
        onClick={handleGenerate}
      >
        proceed
      </Button>
    </Box>
  )
}

export default ImageGridModal
