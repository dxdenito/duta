import { useEffect, useState } from 'react'
import { fetchCommands } from '../lib/api.js'

let pending = null

function load() {
  if (!pending) {
    pending = fetchCommands().catch(() => {
      pending = null
      return []
    })
  }
  return pending
}

export function useCommands() {
  const [commands, setCommands] = useState([])

  useEffect(() => {
    let active = true
    load().then((items) => {
      if (active) setCommands(items)
    })
    return () => {
      active = false
    }
  }, [])

  return commands
}