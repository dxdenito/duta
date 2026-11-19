import { useEffect, useRef, useState } from 'react'
import { ArrowRight, BookOpen, LoaderCircle, Search, Shuffle } from 'lucide-react'
import WikiView from '../components/WikiView.jsx'
import { useDebounced } from '../hooks/useDebounced.js'
import { fetchArticle, lookupWiki, randomArticle, suggestWiki } from '../lib/api.js'

const TOPICS = ['Kenya', 'Mount Kenya', 'Nairobi', 'M-Pesa', 'Black hole', 'Swahili language']

export default function Wiki() {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [open, setOpen] = useState(false)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const request = useRef(0)
  const boxRef = useRef(null)
  const debounced = useDebounced(query.trim(), 250)

  useEffect(() => {
    if (debounced.length < 2) {
      setSuggestions([])
      return undefined
    }
    const controller = new AbortController()
    suggestWiki(debounced, controller.signal)
      .then(setSuggestions)
      .catch(() => {})
    return () => controller.abort()
  }, [debounced])

  useEffect(() => {
    const close = (event) => {
      if (boxRef.current && !boxRef.current.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [])

  const show = async (task) => {
    const id = ++request.current
    setLoading(true)
    setError('')
    setOpen(false)
    try {
      const data = await task()
      if (id === request.current) setResult({ ...data, id })
    } catch (err) {
      if (id === request.current) setError(err.message)
    } finally {
      if (id === request.current) setLoading(false)
    }
  }

  const submit = (event) => {
    event.preventDefault()
    const text = query.trim()
    if (text) show(() => lookupWiki(text))
  }

  const pick = (item) => {
    setQuery(item.title)
    show(() => fetchArticle(item.key))
  }

  const pickTopic = (name) => {
    setQuery(name)
    show(() => lookupWiki(name))
  }

  const random = () => show(() => randomArticle())

  return (
    <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col px-4 pb-8 pt-2">
      <div className="mb-5">
        <h1 className="text-3xl font-extrabold tracking-tight">Wikipedia</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Search and learn anything</p>
      </div>

      <div ref={boxRef} className="relative">
        <form
          onSubmit={submit}
          className="flex items-center gap-2 rounded-full bg-white py-2 pl-5 pr-2 shadow-md ring-1 ring-slate-200/80 transition focus-within:ring-2 focus-within:ring-blue-500/60 dark:bg-slate-900 dark:ring-slate-800"
        >
          <Search className="h-5 w-5 shrink-0 text-slate-400" />
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(event) => event.key === 'Escape' && setOpen(false)}
            maxLength={200}
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="search"
            placeholder="Search Wikipedia"
            className="min-w-0 flex-1 bg-transparent text-base placeholder:text-slate-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={random}
            disabled={loading}
            aria-label="Random article"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 disabled:opacity-50 dark:hover:bg-slate-800"
          >
            <Shuffle className="h-5 w-5" />
          </button>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            aria-label="Search"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white transition hover:bg-blue-500 disabled:opacity-50"
          >
            {loading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
          </button>
        </form>

        {open && suggestions.length > 0 && (
          <ul className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
            {suggestions.map((item) => (
              <li key={item.key}>
                <button
                  type="button"
                  onClick={() => pick(item)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <BookOpen className="h-4 w-4 shrink-0 text-slate-400" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{item.title}</span>
                    {item.description && (
                      <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                        {item.description}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && (
        <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </p>
      )}

      {result ? (
        <div className="mt-6">
          <WikiView key={result.id} initial={result} />
        </div>
      ) : (
        <div className="mt-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Try one of these
          </p>
          <div className="flex flex-wrap gap-2">
            {TOPICS.map((topic) => (
              <button
                key={topic}
                onClick={() => pickTopic(topic)}
                disabled={loading}
                className="rounded-full bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200 transition hover:text-blue-600 disabled:opacity-50 dark:bg-slate-900/70 dark:text-slate-200 dark:ring-slate-800"
              >
                {topic}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}