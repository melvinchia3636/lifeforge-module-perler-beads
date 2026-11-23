import { useCallback, useReducer } from 'react'

import type { EditorState } from '../types'

type BoardUpdater = (current: EditorState | null) => EditorState | null

interface HistoryState {
  past: EditorState[]
  present: EditorState | null
  future: EditorState[]
}

type HistoryAction =
  | { type: 'update'; updater: BoardUpdater }
  | { type: 'undo' }
  | { type: 'redo' }

function reducer(state: HistoryState, action: HistoryAction): HistoryState {
  if (action.type === 'update') {
    const next = action.updater(state.present)

    if (next === state.present) {
      return state
    }

    return {
      past: state.present ? [...state.past, state.present] : state.past,
      present: next,
      future: []
    }
  }

  if (action.type === 'undo') {
    const previous = state.past[state.past.length - 1]

    if (!previous) {
      return state
    }

    return {
      past: state.past.slice(0, -1),
      present: previous,
      future: state.present ? [state.present, ...state.future] : state.future
    }
  }

  const next = state.future[0]

  if (!next) {
    return state
  }

  return {
    past: state.present ? [...state.past, state.present] : state.past,
    present: next,
    future: state.future.slice(1)
  }
}

export function useBoardHistory(initialBoard: EditorState | null) {
  const [state, dispatch] = useReducer(reducer, {
    past: [],
    present: initialBoard,
    future: []
  })

  const setBoard = useCallback((updater: BoardUpdater) => {
    dispatch({ type: 'update', updater })
  }, [])

  const undo = useCallback(() => {
    dispatch({ type: 'undo' })
  }, [])

  const redo = useCallback(() => {
    dispatch({ type: 'redo' })
  }, [])

  return {
    board: state.present,
    setBoard,
    undo,
    redo,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0
  }
}
