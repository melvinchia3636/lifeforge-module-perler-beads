import { buffer as streamToBuffer } from 'node:stream/consumers'

import { fileReferenceSchema } from '@lifeforge/file-storage'
import z from 'zod'

import forge from '../forge'
import { matchImageToMard } from '../utils/matchImageToMard'
import { prepareImage } from '../utils/prepareImage'

export const process = forge
  .mutation({
    description:
      'Remove transparent or white margins from an uploaded image and return the trimmed file',
    media: {
      image: {
        optional: false
      }
    },
    output: {
      CREATED: fileReferenceSchema
    }
  })
  .callback(async ({ media: { image }, core: { storage }, response }) => {
    if (typeof image === 'string') {
      return response.badRequest('A new image is required')
    }

    let processed: Buffer

    try {
      const prepared = await prepareImage(await image.read())

      processed = await prepared.png().toBuffer()
    } catch {
      return response.badRequest('Unable to process the image')
    }

    const ref = await storage.save({
      file: {
        buffer: processed,
        originalName: 'trimmed.png',
        mimeType: 'image/png'
      }
    })

    if (!ref) {
      return response.badRequest('Unable to store the processed image')
    }

    return response.created(ref)
  })

export const match = forge
  .query({
    description:
      'Split a stored image into a grid and match every cell to the nearest MARD bead colour',
    input: {
      query: z.object({
        key: z.string().min(1),
        width: z.string(),
        height: z.string(),
        offsetX: z.string().optional(),
        offsetY: z.string().optional(),
        maxColors: z.string().optional()
      })
    },
    output: {
      OK: z.object({
        grid: z.array(z.array(z.string()))
      })
    }
  })
  .callback(
    async ({ query, core: { storage }, response }) => {
      const width = parseInt(query.width, 10)
      const height = parseInt(query.height, 10)
      const offsetX = parseInt(query.offsetX ?? '0', 10)
      const offsetY = parseInt(query.offsetY ?? '0', 10)
      const maxColors = parseInt(query.maxColors ?? '0', 10)

      if (
        !Number.isFinite(width) ||
        !Number.isFinite(height) ||
        width < 1 ||
        width > 512 ||
        height < 1 ||
        height > 512 ||
        !Number.isFinite(offsetX) ||
        offsetX < -50 ||
        offsetX > 50 ||
        !Number.isFinite(offsetY) ||
        offsetY < -50 ||
        offsetY > 50 ||
        !Number.isFinite(maxColors) ||
        maxColors < 0 ||
        maxColors > 256
      ) {
        return response.badRequest('Invalid grid parameters')
      }

      const file = await storage.get(query.key)

      if (!file) {
        return response.notFound()
      }

      try {
        const image = await streamToBuffer(file.stream)
        const grid = await matchImageToMard(
          image,
          width,
          height,
          offsetX,
          offsetY,
          maxColors
        )

        return response.ok({ grid })
      } catch {
        return response.badRequest('Unable to process the image')
      }
    }
  )
