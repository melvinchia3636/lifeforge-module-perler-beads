import { type Color, converter, differenceCiede2000 } from 'culori'
import sharp from 'sharp'

import { MARD_COLORS } from '../../constants/mardColors'

const toLab = converter('lab')
const difference = differenceCiede2000()

const palette = MARD_COLORS.map(({ code, hex }) => ({
  code,
  lab: toLab(hex)!
}))

const paletteByCode = new Map(palette.map(entry => [entry.code, entry.lab]))

const ALPHA_THRESHOLD = 128

const UNIQUE_MAPPING_LIMIT = 64
const UNIQUE_MAPPING_TOLERANCE = 10

const findNearestPaletteColor = (lab: Color, excluded?: Set<string>) => {
  let nearest = palette[0]!
  let nearestDistance = Infinity

  for (const candidate of palette) {
    if (excluded?.has(candidate.code)) {
      continue
    }

    const distance = difference(lab, candidate.lab)

    if (distance < nearestDistance) {
      nearestDistance = distance
      nearest = candidate
    }
  }

  return { code: nearest.code, distance: nearestDistance }
}

/**
 * Reduces the bead palette to at most `maxColors` by keeping the most-used
 * bead colours and remapping every other cell to the closest kept colour.
 *
 * Unlike clustering/averaging, this never invents an intermediate blend, so
 * distinct dominant colours remain distinct instead of collapsing into a
 * single mixed shade.
 */
function limitColors(grid: string[][], maxColors: number): string[][] {
  if (maxColors <= 0) {
    return grid
  }

  const counts = new Map<string, number>()

  for (const code of grid.flat()) {
    if (!code) {
      continue
    }

    counts.set(code, (counts.get(code) ?? 0) + 1)
  }

  const ranked = [...counts.entries()].sort(
    (first, second) => second[1] - first[1]
  )

  if (ranked.length <= maxColors) {
    return grid
  }

  const kept = ranked.slice(0, maxColors).map(([code]) => code)
  const keptLabs = kept.map(code => paletteByCode.get(code)!)
  const remap = new Map<string, string>()

  for (const [code] of ranked.slice(maxColors)) {
    const lab = paletteByCode.get(code)!
    let nearest = kept[0]!
    let nearestDistance = Infinity

    keptLabs.forEach((candidate, index) => {
      const distance = difference(lab, candidate)

      if (distance < nearestDistance) {
        nearestDistance = distance
        nearest = kept[index]!
      }
    })

    remap.set(code, nearest)
  }

  return grid.map(row => row.map(code => remap.get(code) ?? code))
}
// sRGB <-> linear-light lookup/helpers. Averaging in linear light avoids the
// muddy, over-darkened edge colours produced by averaging gamma-encoded bytes.
const SRGB_TO_LINEAR = new Float32Array(256)

for (let value = 0; value < 256; value++) {
  const channel = value / 255
  SRGB_TO_LINEAR[value] =
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
}

const linearToSrgb = (value: number) => {
  const channel =
    value <= 0.0031308 ? value * 12.92 : 1.055 * value ** (1 / 2.4) - 0.055

  return Math.max(0, Math.min(255, Math.round(channel * 255)))
}

/**
 * Splits an image into a `width × height` grid by choosing the dominant
 * (alpha-weighted) colour bucket in each cell rather than the mean, which keeps
 * edges and small high-contrast details crisp. Each cell is sampled from the
 * source region it covers (respecting the fractional X/Y grid offsets), then
 * snapped to the perceptually nearest MARD bead colour with CIEDE2000.
 *
 * Cells whose averaged alpha falls below the opacity threshold are returned as
 * an empty string (no bead).
 */
export async function matchImageToMard(
  buffer: Buffer,
  width: number,
  height: number,
  offsetX = 0,
  offsetY = 0,
  maxColors = 0,
  brightness = 100,
  contrast = 100,
  saturation = 100
): Promise<string[][]> {
  // The match route receives the already prepared (trimmed, de-aliased)
  // image from storage. Decode it as-is so preview and result stay aligned —
  // re-trimming here could strip another content-coloured border.
  let pipeline = sharp(buffer).ensureAlpha()

  if (brightness !== 100 || saturation !== 100) {
    pipeline = pipeline.modulate({
      brightness: brightness / 100,
      saturation: saturation / 100
    })
  }

  if (contrast !== 100) {
    const factor = contrast / 100
    const intercept = 128 * (1 - factor)

    pipeline = pipeline.linear(
      [factor, factor, factor, 1],
      [intercept, intercept, intercept, 0]
    )
  }

  const { data, info } = await pipeline.raw().toBuffer({ resolveWithObject: true })

  const channels = info.channels

  // Fit the whole source inside the grid's aspect ratio (object-contain).
  // An n×n grid uses a square virtual canvas, so any image/grid aspect
  // mismatch is letterboxed with empty (no bead) cells instead of cropped.
  const targetAspect = width / height
  const sourceAspect = info.width / info.height
  let virtualWidth = info.width
  let virtualHeight = info.height
  let imageLeft = 0
  let imageTop = 0

  if (sourceAspect > targetAspect) {
    virtualHeight = info.width / targetAspect
    imageTop = (virtualHeight - info.height) / 2
  } else if (sourceAspect < targetAspect) {
    virtualWidth = info.height * targetAspect
    imageLeft = (virtualWidth - info.width) / 2
  }

  const cellWidth = virtualWidth / width
  const cellHeight = virtualHeight / height
  const offsetCellsX = offsetX / 100
  const offsetCellsY = offsetY / 100
  const colorCounts = new Map<
    number,
    { key: number; red: number; green: number; blue: number; count: number }
  >()
  const colorGrid: number[][] = []

  for (let row = 0; row < height; row++) {
    const cells: number[] = []
    const startY = (row + offsetCellsY) * cellHeight
    const endY = startY + cellHeight
    const sourceStartY = startY - imageTop
    const sourceEndY = endY - imageTop
    const overlapStartY = Math.max(sourceStartY, 0)
    const overlapEndY = Math.min(sourceEndY, info.height)
    const pixelStartY = Math.max(0, Math.ceil(overlapStartY - 0.5))
    const pixelEndY = Math.min(
      info.height - 1,
      Math.floor(overlapEndY - 0.5)
    )

    for (let column = 0; column < width; column++) {
      const startX = (column + offsetCellsX) * cellWidth
      const endX = startX + cellWidth
      const sourceStartX = startX - imageLeft
      const sourceEndX = endX - imageLeft
      const overlapStartX = Math.max(sourceStartX, 0)
      const overlapEndX = Math.min(sourceEndX, info.width)

      if (overlapEndX <= overlapStartX || overlapEndY <= overlapStartY) {
        cells.push(-1)

        continue
      }

      const pixelStartX = Math.max(0, Math.ceil(overlapStartX - 0.5))
      const pixelEndX = Math.min(
        info.width - 1,
        Math.floor(overlapEndX - 0.5)
      )

      let totalAlpha = 0
      let count = 0
      const buckets = new Map<
        number,
        {
          weight: number
          alpha: number
          red: number
          green: number
          blue: number
        }
      >()

      const sample = (x: number, y: number) => {
        const offset = (y * info.width + x) * channels
        const alpha =
          channels === 4 ? (data[offset + 3] ?? 255) / 255 : 1

        count++
        totalAlpha += alpha

        if (alpha === 0) {
          return
        }

        const red = data[offset] ?? 0
        const green = data[offset + 1] ?? 0
        const blue = data[offset + 2] ?? 0
        const key = ((red >> 2) << 12) | ((green >> 2) << 6) | (blue >> 2)
        let bucket = buckets.get(key)

        if (!bucket) {
          bucket = {
            weight: 0,
            alpha: 0,
            red: 0,
            green: 0,
            blue: 0
          }
          buckets.set(key, bucket)
        }

        bucket.weight += alpha
        bucket.alpha += alpha
        bucket.red += SRGB_TO_LINEAR[red]! * alpha
        bucket.green += SRGB_TO_LINEAR[green]! * alpha
        bucket.blue += SRGB_TO_LINEAR[blue]! * alpha
      }

      if (pixelStartX > pixelEndX || pixelStartY > pixelEndY) {
        // Grid is finer than the source image: fall back to the nearest pixel.
        const centreX = Math.min(
          info.width - 1,
          Math.max(0, Math.round((overlapStartX + overlapEndX) / 2 - 0.5))
        )
        const centreY = Math.min(
          info.height - 1,
          Math.max(0, Math.round((overlapStartY + overlapEndY) / 2 - 0.5))
        )

        sample(centreX, centreY)
      } else {
        for (let y = pixelStartY; y <= pixelEndY; y++) {
          for (let x = pixelStartX; x <= pixelEndX; x++) {
            sample(x, y)
          }
        }
      }

      if (count === 0 || totalAlpha / count < ALPHA_THRESHOLD / 255) {
        cells.push(-1)

        continue
      }

      // All covered pixels are transparent: nothing to match.
      if (totalAlpha === 0) {
        cells.push(-1)

        continue
      }

      // Use the dominant colour bucket instead of the mean so edges and
      // small high-contrast details survive downsampling.
      let dominant:
        | { weight: number; alpha: number; red: number; green: number; blue: number }
        | undefined

      for (const bucket of buckets.values()) {
        if (!dominant || bucket.weight > dominant.weight) {
          dominant = bucket
        }
      }

      if (!dominant || dominant.alpha === 0) {
        cells.push(-1)

        continue
      }

      const red = linearToSrgb(dominant.red / dominant.alpha)
      const green = linearToSrgb(dominant.green / dominant.alpha)
      const blue = linearToSrgb(dominant.blue / dominant.alpha)
      const key = (red << 16) | (green << 8) | blue
      const existing = colorCounts.get(key)

      if (existing) {
        existing.count++
      } else {
        colorCounts.set(key, { key, red, green, blue, count: 1 })
      }

      cells.push(key)
    }

    colorGrid.push(cells)
  }

  const ranked = [...colorCounts.values()].sort(
    (first, second) => second.count - first.count
  )

  const codeByColor = new Map<number, string>()
  const useUniqueMapping = ranked.length <= UNIQUE_MAPPING_LIMIT
  const usedCodes = new Set<string>()
  const assignedColors: { lab: Color; code: string }[] = []

  for (const color of ranked) {
    const lab = toLab({
      mode: 'rgb',
      r: color.red / 255,
      g: color.green / 255,
      b: color.blue / 255
    })!

    if (useUniqueMapping) {
      let closestAssigned: { code: string; distance: number } | null = null

      for (const assigned of assignedColors) {
        const distance = difference(lab, assigned.lab)

        if (!closestAssigned || distance < closestAssigned.distance) {
          closestAssigned = { code: assigned.code, distance }
        }
      }

      // Near-identical shades are noise, not distinct colours — keep them on
      // the same bead so unique mapping doesn't turn speckle into new codes.
      if (closestAssigned && closestAssigned.distance < 3) {
        codeByColor.set(color.key, closestAssigned.code)

        continue
      }
    }

    const nearest = findNearestPaletteColor(lab)
    let code = nearest.code

    // Small palettes (pixel art) keep distinct shades distinct by preferring
    // an unused nearby MARD bead instead of reusing the same nearest code.
    if (useUniqueMapping && usedCodes.has(code)) {
      const alternate = findNearestPaletteColor(lab, usedCodes)

      if (alternate.distance <= nearest.distance + UNIQUE_MAPPING_TOLERANCE) {
        code = alternate.code
      }
    }

    usedCodes.add(code)
    assignedColors.push({ lab, code })
    codeByColor.set(color.key, code)
  }

  const grid = colorGrid.map(row =>
    row.map(key => (key === -1 ? '' : codeByColor.get(key)!))
  )

  return limitColors(grid, maxColors)
}
