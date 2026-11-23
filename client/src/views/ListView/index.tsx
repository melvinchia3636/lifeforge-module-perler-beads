import { Stack } from '@lifeforge/ui'

import type { BlueprintEntry } from '@/views'

import EntryItem from './components/EntryItem'

function ListView({ entries }: { entries: BlueprintEntry[] }) {
  return (
    <Stack mb="lg">
      {entries.map(entry => (
        <EntryItem key={entry.id} entry={entry} />
      ))}
    </Stack>
  )
}

export default ListView
