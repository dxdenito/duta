import { useEffect, useState } from 'react'
import ScoresView from '../components/ScoresView.jsx'
import { fetchLeagues, fetchScores } from '../lib/api.js'

const REFRESH_MS = 30000

function Skeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2" aria-busy="true">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="h-28 animate-pulse rounded-2xl bg-slate-200/70 dark:bg-slate-800/70" />
      ))}
    </div>
  )
}

export default function Live() {
  const [leagues, setLeagues] = useState([])
  const [league, setLeague] = useState('ken.1')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchLeagues()
      .then(setLeagues)
      .catch(() => {})
  }, [])

  useEffect(() => {
    let controller = new AbortController()

    const load = async () => {
      controller.abort()
      controller = new AbortController()
      try {
        setData(await fetchScores(league, controller.signal))
        setError('')
      } catch (err) {
        if (err.name !== 'AbortError') setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    setLoading(true)
    setData(null)
    setError('')
    load()
    const timer = setInterval(() => {
      if (!document.hidden) load()
    }, REFRESH_MS)

    return () => {
      clearInterval(timer)
      controller.abort()
    }
  }, [league])

  return (
    <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col px-4 pb-8 pt-2">
      <div className="mb-4">
        <h1 className="text-3xl font-extrabold tracking-tight">Live</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Scores and live commentary</p>
      </div>

      <div className="no-scrollbar -mx-4 mb-5 flex gap-2 overflow-x-auto px-4">
        {leagues.map((item) => (
          <button
            key={item.id}
            onClick={() => setLeague(item.id)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium ring-1 transition ${
              league === item.id
                ? 'bg-blue-600 text-white ring-blue-600'
                : 'bg-white/80 text-slate-700 ring-slate-200 hover:text-blue-600 dark:bg-slate-900/70 dark:text-slate-200 dark:ring-slate-800'
            }`}
          >
            {item.name}
          </button>
        ))}
      </div>

      {loading && <Skeleton />}

      {error && !loading && (
        <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </div>
      )}

      {data && !loading && (
        <ScoresView matches={data.matches} emptyText="No recent or upcoming matches in this league." />
      )}
    </div>
  )
}