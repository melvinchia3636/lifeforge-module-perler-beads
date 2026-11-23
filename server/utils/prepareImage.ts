import sharp from 'sharp'

/** Images at or below this size are treated as low-resolution pixel art. */
const LOW_RES_MAX_DIMENSION = 256

/** Low-resolution images are upscaled with nearest-neighbour to this size. */
const LOW_RES_TARGET_SIZE = 512

/** Hard cap for the nearest-neighbour upscale to keep memory bounded. */
const LOW_RES_MAX_SCALE = 8

/** Minimum neighbour colour contrast before an edge is considered for cleanup. */
const MIN_EDGE_DISTANCE_SQ = 40 * 40

/** How close a pixel must be to the blend line between its neighbours. */
const BLEND_TOLERANCE_SQ = 18 * 18

const ALPHA_THRESHOLD = 128

interface Rgb {
  r: number
  g: number
  b: number
}

const distanceSq = (a: Rgb, b: Rgb) =>
  (a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2

/**
 * Removes anti-aliasing from low-resolution images.
 *
 * For every opaque pixel, the two most contrasting neighbouring colours are
 * found. If the pixel lies on the blend line between them, it is snapped to
 * the closer neighbour, turning soft edges into solid blocks while leaving
 * non-blended details (single-pixel highlights, outlines) untouched.
 *
 * Alpha is also binarized so transparent edges stay crisp.
 */
function deAntialiasPass(data: Buffer, width: number, height: number): number {
  const source = Buffer.from(data)

  let changed = 0

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 4
      const alpha = source[offset + 3] ?? 255

      if (alpha < ALPHA_THRESHOLD) {
        data[offset + 3] = 0

        continue
      }

      data[offset + 3] = 255

      const pixel: Rgb = {
        r: source[offset] ?? 0,
        g: source[offset + 1] ?? 0,
        b: source[offset + 2] ?? 0
      }

      const neighbours = new Map<number, Rgb>()

      for (let deltaY = -1; deltaY <= 1; deltaY++) {
        for (let deltaX = -1; deltaX <= 1; deltaX++) {
          if (deltaX === 0 && deltaY === 0) {
            continue
          }

          const neighbourX = x + deltaX
          const neighbourY = y + deltaY

          if (
            neighbourX < 0 ||
            neighbourX >= width ||
            neighbourY < 0 ||
            neighbourY >= height
          ) {
            continue
          }

          const neighbourOffset = (neighbourY * width + neighbourX) * 4

          if ((source[neighbourOffset + 3] ?? 255) < ALPHA_THRESHOLD) {
            continue
          }

          const red = source[neighbourOffset] ?? 0
          const green = source[neighbourOffset + 1] ?? 0
          const blue = source[neighbourOffset + 2] ?? 0
          const key = (red << 16) | (green << 8) | blue

          if (!neighbours.has(key)) {
            neighbours.set(key, { r: red, g: green, b: blue })
          }
        }
      }

      const colours = [...neighbours.values()]

      if (colours.length < 2) {
        continue
      }

      let start = colours[0]!
      let end = colours[1]!
      let widest = 0

      for (let first = 0; first < colours.length; first++) {
        for (let second = first + 1; second < colours.length; second++) {
          const distance = distanceSq(colours[first]!, colours[second]!)

          if (distance > widest) {
            widest = distance
            start = colours[first]!
            end = colours[second]!
          }
        }
      }

      if (widest < MIN_EDGE_DISTANCE_SQ) {
        continue
      }

      const directionLengthSq = distanceSq(start, end)
      const projection =
        ((pixel.r - start.r) * (end.r - start.r) +
          (pixel.g - start.g) * (end.g - start.g) +
          (pixel.b - start.b) * (end.b - start.b)) /
        directionLengthSq

      if (projection <= 0.05 || projection >= 0.95) {
        continue
      }

      const blended: Rgb = {
        r: start.r + projection * (end.r - start.r),
        g: start.g + projection * (end.g - start.g),
        b: start.b + projection * (end.b - start.b)
      }

      if (distanceSq(pixel, blended) > BLEND_TOLERANCE_SQ) {
        continue
      }

      const target =
        distanceSq(pixel, start) <= distanceSq(pixel, end) ? start : end

      data[offset] = target.r
      data[offset + 1] = target.g
      data[offset + 2] = target.b
      changed++
    }
  }

  return changed
}

const MAX_DEANTIALIAS_PASSES = 4

/** Colours below this share of the image are treated as noise/AA shades. */
const NOISE_COLOR_SHARE = 0.01

/** How close a noise colour must be to a dominant colour to be absorbed. */
const NOISE_MERGE_DISTANCE_SQ = 10 * 10

const unpackColor = (key: number): Rgb => ({
  r: (key >> 16) & 255,
  g: (key >> 8) & 255,
  b: key & 255
})

function deAntialias(data: Buffer, width: number, height: number) {
  for (let pass = 0; pass < MAX_DEANTIALIAS_PASSES; pass++) {
    if (deAntialiasPass(data, width, height) === 0) {
      break
    }
  }
}

/**
 * Removes low-frequency noise/anti-aliasing colours by snapping only very
 * rare colours into a nearby dominant colour. Colours that cover a meaningful
 * area (≥1% of the image) are always preserved, so intentional shades and
 * pixel-art details survive while compression/AA speckle is cleaned up.
 */
function mergeNoiseColors(data: Buffer, width: number, height: number) {
  const counts = new Map<number, number>()

  for (let offset = 0; offset < data.length; offset += 4) {
    if ((data[offset + 3] ?? 255) < ALPHA_THRESHOLD) {
      continue
    }

    const key =
      ((data[offset] ?? 0) << 16) |
      ((data[offset + 1] ?? 0) << 8) |
      (data[offset + 2] ?? 0)

    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  const minimumCount = Math.max(2, Math.round(width * height * NOISE_COLOR_SHARE))
  const core = [...counts.entries()]
    .filter(([, count]) => count >= minimumCount)
    .map(([key]) => ({ key, rgb: unpackColor(key) }))

  if (core.length === 0) {
    return
  }

  const remap = new Map<number, number>()

  for (const [key, count] of counts) {
    if (count >= minimumCount) {
      remap.set(key, key)

      continue
    }

    const rgb = unpackColor(key)
    let nearestKey = key
    let nearestDistance = NOISE_MERGE_DISTANCE_SQ

    for (const candidate of core) {
      const distance = distanceSq(rgb, candidate.rgb)

      if (distance <= nearestDistance) {
        nearestDistance = distance
        nearestKey = candidate.key
      }
    }

    remap.set(key, nearestKey)
  }

  for (let offset = 0; offset < data.length; offset += 4) {
    if ((data[offset + 3] ?? 255) < ALPHA_THRESHOLD) {
      continue
    }

    const key =
      ((data[offset] ?? 0) << 16) |
      ((data[offset + 1] ?? 0) << 8) |
      (data[offset + 2] ?? 0)
    const mapped = remap.get(key)

    if (mapped === undefined || mapped === key) {
      continue
    }

    data[offset] = (mapped >> 16) & 255
    data[offset + 1] = (mapped >> 8) & 255
    data[offset + 2] = mapped & 255
  }
}

/**
 * Trims transparent/white margins and, for low-resolution images, removes
 * anti-aliasing then upscales with nearest-neighbour so edges stay sharp.
 */
export async function prepareImage(buffer: Buffer): Promise<sharp.Sharp> {
  const metadata = await sharp(buffer).rotate().metadata()
  const metadataWidth = metadata.width ?? 0
  const metadataHeight = metadata.height ?? 0
  const isLowResolution =
    metadataWidth > 0 &&
    metadataHeight > 0 &&
    Math.max(metadataWidth, metadataHeight) <= LOW_RES_MAX_DIMENSION

  if (!isLowResolution) {
    return sharp(buffer).rotate().ensureAlpha().trim({ threshold: 10 })
  }

  const { data, info } = await sharp(buffer)
    .rotate()
    .ensureAlpha()
    .trim({ threshold: 10 })
    .raw()
    .toBuffer({ resolveWithObject: true })

  deAntialias(data, info.width, info.height)
  mergeNoiseColors(data, info.width, info.height)

  const scale = Math.min(
    LOW_RES_MAX_SCALE,
    Math.max(
      1,
      Math.ceil(LOW_RES_TARGET_SIZE / Math.max(info.width, info.height))
    )
  )

  return sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4
    }
  }).resize(info.width * scale, info.height * scale, { kernel: 'nearest' })
}
