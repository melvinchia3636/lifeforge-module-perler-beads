import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

import { Box, ModalHeader, Stack, surface } from '@lifeforge/ui'

import { MARD_COLORS } from '@/constants/mardColors'

const MARD_BY_CODE = new Map(MARD_COLORS.map(({ code, hex }) => [code, hex]))

const BEAD_DIAMETER_MM = 2.6
const BEAD_HEIGHT_MM = 2.6
const BEAD_RADIUS_MM = BEAD_DIAMETER_MM / 2
const BEAD_WALL_THICKNESS_MM = 0.6
const BEAD_HOLE_RADIUS_MM = BEAD_RADIUS_MM - BEAD_WALL_THICKNESS_MM
const PLATE_MARGIN_MM = 8

function createBeadGeometry() {
  const shape = new THREE.Shape()
  const hole = new THREE.Path()

  shape.absarc(0, 0, BEAD_RADIUS_MM, 0, Math.PI * 2, false)
  hole.absarc(0, 0, BEAD_HOLE_RADIUS_MM, 0, Math.PI * 2, true)
  shape.holes.push(hole)

  const geometry = new THREE.ExtrudeGeometry(shape, {
    bevelEnabled: false,
    curveSegments: 20,
    depth: BEAD_HEIGHT_MM
  })

  geometry.rotateX(-Math.PI / 2)
  geometry.translate(0, -BEAD_HEIGHT_MM / 2, 0)

  return geometry
}

function createMeasurementTexture(
  plateWidth: number,
  plateDepth: number,
  boardWidth: number,
  boardHeight: number,
  margin: number
) {
  const pixelsPerMm = Math.min(
    8,
    4096 / Math.max(plateWidth, plateDepth)
  )
  const canvas = document.createElement('canvas')

  canvas.width = Math.max(1, Math.round(plateWidth * pixelsPerMm))
  canvas.height = Math.max(1, Math.round(plateDepth * pixelsPerMm))

  const context = canvas.getContext('2d')

  if (!context) {
    return null
  }

  const mm = (value: number) => value * pixelsPerMm
  const left = mm(margin)
  const top = mm(margin)
  const right = canvas.width - mm(margin)
  const bottom = canvas.height - mm(margin)
  const formatCm = (value: number) =>
    value === 0 ? '0' : `${value / 10} cm`

  context.fillStyle = '#e4e4e7'
  context.fillRect(0, 0, canvas.width, canvas.height)

  context.fillStyle = '#f4f4f5'
  context.fillRect(left, top, right - left, bottom - top)

  const gridStep = mm(10)
  const majorGridStep = mm(50)

  context.strokeStyle = '#c4c4c8'
  context.lineWidth = Math.max(1, pixelsPerMm * 0.15)

  for (let x = left; x <= right; x += gridStep) {
    context.beginPath()
    context.moveTo(x, top)
    context.lineTo(x, bottom)
    context.stroke()
  }

  for (let y = bottom; y >= top; y -= gridStep) {
    context.beginPath()
    context.moveTo(left, y)
    context.lineTo(right, y)
    context.stroke()
  }

  context.strokeStyle = '#a1a1aa'

  for (let x = left; x <= right; x += majorGridStep) {
    context.beginPath()
    context.moveTo(x, top)
    context.lineTo(x, bottom)
    context.stroke()
  }

  for (let y = bottom; y >= top; y -= majorGridStep) {
    context.beginPath()
    context.moveTo(left, y)
    context.lineTo(right, y)
    context.stroke()
  }

  context.strokeStyle = '#71717a'
  context.lineWidth = Math.max(1, pixelsPerMm * 0.2)
  context.strokeRect(left, top, right - left, bottom - top)

  const maxMeasurement = Math.ceil(Math.max(boardWidth, boardHeight))
  const bottomRulerY = bottom + mm(0.5)
  const leftRulerX = left - mm(0.5)

  context.strokeStyle = '#52525b'

  for (let value = 0; value <= maxMeasurement; value++) {
    const length = value % 10 === 0 ? 3 : value % 5 === 0 ? 2 : 1

    context.lineWidth = Math.max(
      1,
      pixelsPerMm * (value % 10 === 0 ? 0.22 : 0.14)
    )

    if (value <= boardWidth) {
      const x = left + mm(value)

      context.beginPath()
      context.moveTo(x, bottomRulerY)
      context.lineTo(x, bottomRulerY + mm(length))
      context.stroke()
    }

    if (value <= boardHeight) {
      const y = bottom - mm(value)

      context.beginPath()
      context.moveTo(leftRulerX, y)
      context.lineTo(leftRulerX - mm(length), y)
      context.stroke()
    }
  }

  const labelStep = Math.max(
    10,
    Math.ceil(Math.max(boardWidth, boardHeight) / 12 / 10) * 10
  )
  const fontSize = Math.max(
    9,
    Math.min(mm(2.4), mm(margin) * 0.32)
  )

  context.fillStyle = '#3f3f46'
  context.font = `600 ${fontSize}px sans-serif`
  context.textAlign = 'center'
  context.textBaseline = 'top'

  for (let value = 0; value <= boardWidth; value += labelStep) {
    context.fillText(
      formatCm(value),
      left + mm(value),
      bottom + mm(4.5)
    )
  }

  context.textAlign = 'center'
  context.textBaseline = 'middle'

  for (let value = 0; value <= boardHeight; value += labelStep) {
    context.save()
    context.translate(left - mm(4.5), bottom - mm(value))
    context.rotate(-Math.PI / 2)
    context.fillText(formatCm(value), 0, 0)
    context.restore()
  }

  const texture = new THREE.CanvasTexture(canvas)

  texture.colorSpace = THREE.SRGBColorSpace

  return texture
}

function PreviewModal({
  data: { grid, width, height },
  onClose
}: {
  data: {
    grid: string[][]
    width: number
    height: number
  }
  onClose: () => void
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const container = containerRef.current

    if (!container) {
      return
    }

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 10000)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    renderer.domElement.style.display = 'block'
    renderer.domElement.style.height = '100%'
    renderer.domElement.style.width = '100%'
    container.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)

    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.enablePan = false
    controls.minDistance = 10
    controls.maxDistance = 5000

    scene.add(new THREE.AmbientLight(0xffffff, 1.6))

    const directionalLight = new THREE.DirectionalLight(0xffffff, 2.4)

    directionalLight.position.set(60, 100, 80)
    scene.add(directionalLight)

    const geometry = createBeadGeometry()
    const opaqueMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0,
      roughness: 0.55,
      side: THREE.DoubleSide
    })
    const transparentMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      depthWrite: false,
      metalness: 0,
      opacity: 0.5,
      roughness: 0.35,
      side: THREE.DoubleSide,
      transparent: true
    })

    const spacing = BEAD_DIAMETER_MM
    const offsetX = ((width - 1) * spacing) / 2
    const offsetZ = ((height - 1) * spacing) / 2
    const beads: { code: string; row: number; column: number }[] = []

    for (let row = 0; row < height; row++) {
      for (let column = 0; column < width; column++) {
        const code = grid[row]?.[column]

        if (code) {
          beads.push({ code, row, column })
        }
      }
    }

    const opaqueBeads = beads.filter(({ code }) => code !== 'T1')
    const transparentBeads = beads.filter(({ code }) => code === 'T1')
    const matrix = new THREE.Matrix4()

    const addBeadMesh = (
      entries: typeof beads,
      material: THREE.Material
    ) => {
      if (entries.length === 0) {
        return
      }

      const mesh = new THREE.InstancedMesh(geometry, material, entries.length)

      entries.forEach(({ code, row, column }, index) => {
        matrix.makeTranslation(
          column * spacing - offsetX,
          0,
          row * spacing - offsetZ
        )
        mesh.setMatrixAt(index, matrix)
        mesh.setColorAt(
          index,
          new THREE.Color(MARD_BY_CODE.get(code) ?? '#ffffff')
        )
      })

      mesh.instanceMatrix.needsUpdate = true

      if (mesh.instanceColor) {
        mesh.instanceColor.needsUpdate = true
      }

      scene.add(mesh)
    }

    addBeadMesh(opaqueBeads, opaqueMaterial)
    addBeadMesh(transparentBeads, transparentMaterial)

    const boardWidth = width * spacing
    const boardHeight = height * spacing
    const plateWidth = boardWidth + PLATE_MARGIN_MM * 2
    const plateDepth = boardHeight + PLATE_MARGIN_MM * 2
    const plateTopY = -BEAD_HEIGHT_MM / 2
    const measurementTexture = createMeasurementTexture(
      plateWidth,
      plateDepth,
      boardWidth,
      boardHeight,
      PLATE_MARGIN_MM
    )
    const plateGeometry = new THREE.PlaneGeometry(plateWidth, plateDepth)
    const plateMaterial = new THREE.MeshBasicMaterial({
      color: measurementTexture ? 0xffffff : 0xe4e4e7,
      map: measurementTexture ?? undefined,
      side: THREE.DoubleSide
    })
    const plate = new THREE.Mesh(plateGeometry, plateMaterial)

    plate.rotation.x = -Math.PI / 2
    plate.position.y = plateTopY - 0.02
    scene.add(plate)

    const boardSize = Math.max(plateWidth, plateDepth, 20)
    const fitHeightDistance =
      boardSize / (2 * Math.tan((camera.fov * Math.PI) / 360))
    const distance = fitHeightDistance * 1.4

    camera.position.set(distance * 0.7, distance * 0.75, distance * 0.7)
    camera.lookAt(0, 0, 0)
    controls.target.set(0, 0, 0)
    controls.update()

    const resize = () => {
      const { clientWidth, clientHeight } = container

      if (clientWidth === 0 || clientHeight === 0) {
        return
      }

      camera.aspect = clientWidth / clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(clientWidth, clientHeight)
    }

    const resizeObserver = new ResizeObserver(resize)

    resizeObserver.observe(container)
    resize()

    let animationFrame = 0

    const animate = () => {
      animationFrame = requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }

    animate()

    return () => {
      cancelAnimationFrame(animationFrame)
      resizeObserver.disconnect()
      controls.dispose()
      geometry.dispose()
      opaqueMaterial.dispose()
      transparentMaterial.dispose()
      plateGeometry.dispose()
      plateMaterial.dispose()
      measurementTexture?.dispose()

      renderer.dispose()

      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [grid, width, height])

  return (
    <Stack minWidth={{ base: '90vw', md: '60vw' }}>
      <ModalHeader icon="tabler:cube" title="preview" onClose={onClose} />
      <Box
        ref={containerRef}
        bg={surface.light}
        height="60vh"
        minHeight="24em"
        overflow="hidden"
        r="lg"
        width="100%"
      />
    </Stack>
  )
}

export default PreviewModal
