import { count, desc, eq, ilike } from 'drizzle-orm'
import { createSelectSchema } from 'drizzle-orm/zod'
import z from 'zod'

import forge from '../forge'
import { blueprints } from '../schema.drizzle'

const PER_PAGE = 20

const blueprintDto = createSelectSchema(blueprints).extend({
  grid: z.array(z.array(z.string()))
})

export const list = forge
  .query({
    description: 'Get saved perler bead blueprints, newest first',
    input: {
      query: z.object({
        page: z.string().optional().default('1'),
        q: z.string().optional()
      })
    },
    output: {
      OK: z.object({
        items: z.array(blueprintDto),
        page: z.number(),
        perPage: z.number(),
        totalItems: z.number(),
        totalPages: z.number()
      })
    }
  })
  .callback(async ({ db, query: { page, q }, response }) => {
    const search = q?.trim()
    const parsedPage = Math.max(1, parseInt(page, 10) || 1)
    const where = search ? ilike(blueprints.name, `%${search}%`) : undefined

    const items = await db
      .select()
      .from(blueprints)
      .where(where)
      .orderBy(desc(blueprints.created))
      .limit(PER_PAGE)
      .offset((parsedPage - 1) * PER_PAGE)

    const [totalRow] = await db
      .select({ value: count() })
      .from(blueprints)
      .where(where)

    const totalItems = totalRow?.value ?? 0

    return response.ok({
      items,
      page: parsedPage,
      perPage: PER_PAGE,
      totalItems,
      totalPages: Math.ceil(totalItems / PER_PAGE)
    })
  })

export const create = forge
  .mutation({
    description: 'Save a generated perler bead blueprint',
    input: {
      body: z.object({
        name: z.string().trim().min(1),
        width: z.number().int().min(1).max(512),
        height: z.number().int().min(1).max(512),
        grid: z.array(z.array(z.string()))
      })
    },
    output: {
      CREATED: blueprintDto
    }
  })
  .callback(async ({ db, body, response }) => {
    const [entry] = await db
      .insert(blueprints)
      .values({
        name: body.name,
        width: body.width,
        height: body.height,
        grid: body.grid
      })
      .returning()

    if (!entry) {
      return response.badRequest('Failed to save the blueprint')
    }

    return response.created(entry)
  })

export const update = forge
  .mutation({
    description: 'Update a saved perler bead blueprint',
    input: {
      query: z.object({
        id: forge.existsIn(z.string(), blueprints, { select: true })
      }),
      body: z.object({
        name: z.string().trim().min(1).optional(),
        width: z.number().int().min(1).max(512).optional(),
        height: z.number().int().min(1).max(512).optional(),
        grid: z.array(z.array(z.string())).optional()
      })
    },
    output: {
      OK: blueprintDto
    }
  })
  .callback(async ({ db, existing, query: { id }, body, response }) => {
    existing.one(blueprints, id)

    const [updated] = await db
      .update(blueprints)
      .set({
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.width !== undefined ? { width: body.width } : {}),
        ...(body.height !== undefined ? { height: body.height } : {}),
        ...(body.grid !== undefined ? { grid: body.grid } : {})
      })
      .where(eq(blueprints.id, id))
      .returning()

    if (!updated) {
      return response.badRequest('Failed to update the blueprint')
    }

    return response.ok(updated)
  })
