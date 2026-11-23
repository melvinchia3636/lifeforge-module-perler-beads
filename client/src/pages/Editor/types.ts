export interface EditorState {
  grid: string[][]
  width: number
  height: number
  blueprint?: SavedBlueprint
}

export interface SavedBlueprint {
  id: string
  name: string
}

export type BucketMode = 'fill' | 'clear'

export type EditorTool = 'hand' | 'bucket' | 'brush' | 'eraser' | 'eyedropper'

export type ResizeEdge = 'top' | 'right' | 'bottom' | 'left'

export type BeadShape = 'square' | 'rounded' | 'circle' | 'ring'

export interface ViewTransform {
  x: number
  y: number
  scale: number
}
