import type { InferOutput } from '@lifeforge/api'
import { createViewMode } from '@lifeforge/ui'

import { forgeAPI } from '@/manifest'

import GridView from './GridView'
import ListView from './ListView'

export type BlueprintEntry = InferOutput<
  typeof forgeAPI.blueprints.list
>['items'][number]

const VIEWS = {
  grid: {
    icon: 'uil:apps',
    component: GridView
  },
  list: {
    icon: 'tabler:list',
    component: ListView
  }
} as const

export const BlueprintView = createViewMode({
  modes: (Object.keys(VIEWS) as (keyof typeof VIEWS)[]).map(mode => ({
    value: mode,
    icon: VIEWS[mode].icon
  })),
  selectorProps: {
    display: 'flex'
  }
})

function Views({ entries }: { entries: BlueprintEntry[] }) {
  return Object.entries(VIEWS).map(([mode, { component: Component }]) => (
    <BlueprintView.When key={mode} mode={mode as keyof typeof VIEWS}>
      <Component entries={entries} />
    </BlueprintView.When>
  ))
}

export default Views
