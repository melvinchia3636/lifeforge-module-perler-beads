import { type RelationsBuilder } from 'drizzle-orm'
import { integer, jsonb, text, timestamp, uuid } from 'drizzle-orm/pg-core'

import { createModuleTable } from '@lifeforge/drizzle'

const pgTable = createModuleTable()

export const blueprints = pgTable('blueprints', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().default(''),
  width: integer('width').notNull().default(0),
  height: integer('height').notNull().default(0),
  grid: jsonb('grid').$type<string[][]>().notNull().default([]),
  created: timestamp('created', { mode: 'date' }).defaultNow().notNull()
})

export const tables = {
  blueprints
}

export const relations = (_r: RelationsBuilder<typeof tables>) => ({})
