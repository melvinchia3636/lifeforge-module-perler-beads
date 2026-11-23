import { useEffect, useState } from 'react'

export function useImageDimensions(src?: string) {
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    if (!src) {
      setSize({ width: 0, height: 0 })

      return
    }

    let cancelled = false
    const image = new window.Image()

    image.onload = () => {
      if (cancelled) {
        return
      }

      setSize({
        width: image.naturalWidth,
        height: image.naturalHeight
      })
    }
    image.onerror = () => {
      if (!cancelled) {
        setSize({ width: 0, height: 0 })
      }
    }
    image.src = src

    return () => {
      cancelled = true
    }
  }, [src])

  return size
}
