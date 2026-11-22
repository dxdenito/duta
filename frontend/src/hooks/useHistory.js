import { useCallback, useRef } from 'react'

const KEY = 'duta-history'
const MAX = 50

function read() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : []
  } catch {
    return []
  }
}

function write(items) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items))
  } catch {}
}

export function useHistory() {
  const items = useRef(read())
  const cursor = useRef(-1)
  const draft = useRef('')

  const push = useCallback((text) => {
    const list = items.current
    if (list[list.length - 1] !== text) {
      list.push(text)
      if (list.length > MAX) list.shift()
      write(list)
    }
    cursor.current = -1
  }, [])

  const older = useCallback((current) => {
    const list = items.current
    if (list.length === 0) return null
    if (cursor.current === -1) {
      draft.current = current
      cursor.current = list.length - 1
    } else if (cursor.current > 0) {
      cursor.current -= 1
    }
    return list[cursor.current]
  }, [])

  const newer = useCallback(() => {
    const list = items.current
    if (cursor.current === -1) return null
    if (cursor.current < list.length - 1) {
      cursor.current += 1
      return list[cursor.current]
    }
    cursor.current = -1
    return draft.current
  }, [])

  const reset = useCallback(() => {
    cursor.current = -1
  }, [])

  return { push, older, newer, reset }
}