import { Grid } from '@lifeforge/ui'

import type { BlueprintEntry } from '@/views'

import EntryItem from './components/EntryItem'

function GridView({ entries }: { entries: BlueprintEntry[] }) {
  return (
    <Grid
      gap="sm"
      mb="lg"
      templateCols={{
        base: 'repeat(auto-fill,minmax(12rem,1fr))',
        sm: 'repeat(auto-fill,minmax(16rem,1fr))'
      }}
    >
      {entries.map(entry => (
        <EntryItem key={entry.id} entry={entry} />
      ))}
    </Grid>
  )
}

export default GridView
