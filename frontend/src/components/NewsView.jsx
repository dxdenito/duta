import { useEffect, useState } from 'react'
import { Cpu, Globe, Landmark, Newspaper, TrendingUp, Trophy } from 'lucide-react'
import { fetchNews } from '../lib/api.js'
import { timeAgo } from '../lib/time.js'

const CACHE_TTL = 120000

const TAB_ICONS = {
  Newspaper,
  Landmark,
  TrendingUp,
  Globe,
  Trophy,
  Cpu,
}

function Skeleton() {
  return (
    <div className="space-y-3" aria-busy="true">
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="h-24 animate-pulse rounded-2xl bg-slate-200/70 dark:bg-slate-800/70" />
      ))}
    </div>
  )
}

function NewsItem({ item }) {
  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-4 rounded-2xl bg-white/80 p-4 ring-1 ring-slate-200/70 transition hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-900/70 dark:ring-slate-800"
    >
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="truncate font-semibold text-blue-600 dark:text-blue-400">{item.source}</span>
          {item.published && (
            <>
              <span>•</span>
              <span className="shrink-0">{timeAgo(item.published)}</span>
            </>
          )}
        </div>
        <h3 className="text-[15px] font-semibold leading-snug">{item.title}</h3>
        {item.summary && (
          <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">{item.summary}</p>
        )}
      </div>
      {item.image && (
        <img
          src={item.image}
          alt=""
          loading="lazy"
          onError={(event) => {
            event.currentTarget.style.display = 'none'
          }}
          className="h-20 w-20 shrink-0 rounded-xl object-cover"
        />
      )}
    </a>
  )
}

function Section({ section }) {
  return (
    <section>
      <h2 className="mb-3 px-1 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {section.label}
      </h2>
      <div className="space-y-3">
        {section.items.map((item) => (
          <NewsItem key={item.link} item={item} />
        ))}
      </div>
    </section>
  )
}

function TabBar({ tabs, active, onSelect }) {
  if (!tabs.length) return null

  return (
    <nav className="sticky bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-20 mx-auto mt-6 w-full max-w-md rounded-2xl border border-slate-200/70 bg-white/90 p-1 shadow-lg backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
      <ul className="no-scrollbar flex gap-1 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = TAB_ICONS[tab.icon] ?? Newspaper
          const isActive = tab.id === active
          return (
            <li key={tab.id} className="flex-1">
              <button
                onClick={() => onSelect(tab.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex w-full min-w-14 flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-[11px] font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="h-5 w-5" />
                {tab.label}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export default function NewsView({ initial = null }) {
  const [category, setCategory] = useState(initial?.category ?? 'top')
  const [data, setData] = useState(initial)
  const [tabs, setTabs] = useState(initial?.tabs ?? [])
  const [loading, setLoading] = useState(!initial)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [cache] = useState(
    () => new Map(initial ? [[initial.category, { at: Date.now(), payload: initial }]] : []),
  )

  useEffect(() => {
    const cached = cache.get(category)
    if (cached && Date.now() - cached.at < CACHE_TTL) {
      setData(cached.payload)
      setError('')
      setLoading(false)
      return undefined
    }

    const controller = new AbortController()
    setLoading(true)
    setError('')

    fetchNews(category, controller.signal)
      .then((payload) => {
        cache.set(category, { at: Date.now(), payload })
        setData(payload)
        setTabs(payload.tabs)
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [category, attempt, cache])

  let content
  if (loading) {
    content = <Skeleton />
  } else if (error) {
    content = (
      <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
        <p>{error}</p>
        <button
          onClick={() => setAttempt((value) => value + 1)}
          className="mt-2 font-semibold underline underline-offset-2"
        >
          Try again
        </button>
      </div>
    )
  } else if (data) {
    content = (
      <div className="space-y-8">
        {data.sections.map((section) => (
          <Section key={section.label} section={section} />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col text-left">
      <div>{content}</div>
      <TabBar tabs={tabs} active={category} onSelect={setCategory} />
    </div>
  )
}