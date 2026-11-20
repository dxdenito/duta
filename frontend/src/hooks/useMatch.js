import { useEffect, useState } from 'react'
import { fetchMatch } from '../lib/api.js'

const MAX_ITEMS = 500

const EMPTY = { match: null, feed: [], source: 'none', error: '', connected: false }

export function useMatch(league, eventId) {
  const [state, setState] = useState(EMPTY)

  useEffect(() => {
    const controller = new AbortController()
    let source = null

    setState(EMPTY)
    const patch = (changes) => setState((prev) => ({ ...prev, ...changes }))

    fetchMatch(league, eventId, controller.signal)
      .then((snapshot) => {
        if (controller.signal.aborted) return
        const last = snapshot.feed.at(-1)
        patch({ match: snapshot.match, feed: snapshot.feed, source: snapshot.source })
        if (snapshot.match.state === 'post') return

        const after = last ? last.seq : 0
        source = new EventSource(
          `/api/sports/match/${league}/${eventId}/stream?after=${after}`,
        )
        source.onopen = () => patch({ connected: true })
        source.onerror = () => patch({ connected: false })
        source.addEventListener('match', (event) => patch({ match: JSON.parse(event.data) }))
        source.addEventListener('commentary', (event) => {
          const { items } = JSON.parse(event.data)
          setState((prev) => ({ ...prev, feed: [...prev.feed, ...items].slice(-MAX_ITEMS) }))
        })
        source.addEventListener('end', () => {
          source.close()
          patch({ connected: false })
        })
      })
      .catch((err) => {
        if (err.name !== 'AbortError') patch({ error: err.message })
      })

    return () => {
      controller.abort()
      if (source) source.close()
    }
  }, [league, eventId])

  return state
}