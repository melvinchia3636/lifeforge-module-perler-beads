import { useEffect, useRef, useState } from 'react'

export function useElementSize() {
  const ref = useRef<HTMLElement>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const element = ref.current

    if (!element) {
      return
    }

    const update = () => {
      setSize({ width: element.clientWidth, height: element.clientHeight })
    }

    update()

    const observer = new ResizeObserver(update)

    observer.observe(element)

    return () => observer.disconnect()
  }, [])

  return { ref, ...size }
}
