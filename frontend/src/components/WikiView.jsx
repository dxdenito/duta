import { useState } from 'react'
import { BookOpen, ExternalLink, Info, LoaderCircle } from 'lucide-react'
import { fetchArticle } from '../lib/api.js'

const MAX_RELATED = 8

function ArticleCard({ article }) {
  return (
    <article className="flex flex-col gap-4 rounded-2xl bg-white/80 p-4 ring-1 ring-slate-200/70 sm:flex-row dark:bg-slate-900/70 dark:ring-slate-800">
      {article.image && (
        <img
          src={article.image}
          alt={article.title}
          loading="lazy"
          onError={(event) => {
            event.currentTarget.style.display = 'none'
          }}
          className="h-48 w-full shrink-0 rounded-xl object-cover sm:h-40 sm:w-40"
        />
      )}
      <div className="min-w-0">
        <h2 className="text-xl font-bold leading-tight">{article.title}</h2>
        {article.description && (
          <p className="mt-0.5 text-sm capitalize text-slate-500 dark:text-slate-400">
            {article.description}
          </p>
        )}
        {article.extract && <p className="mt-3 text-[15px] leading-relaxed">{article.extract}</p>}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
          {article.url && (
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:underline dark:text-blue-400"
            >
              Read full article
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
          <span>Source: Wikipedia (CC BY-SA 4.0)</span>
        </div>
      </div>
    </article>
  )
}

function RelatedItem({ item, busy, onOpen }) {
  return (
    <button
      onClick={() => onOpen(item.key)}
      disabled={busy}
      className="flex w-full items-center gap-3 rounded-2xl bg-white/80 p-3 text-left ring-1 ring-slate-200/70 transition hover:-translate-y-0.5 hover:shadow-md disabled:opacity-60 dark:bg-slate-900/70 dark:ring-slate-800"
    >
      {item.image ? (
        <img
          src={item.image}
          alt=""
          loading="lazy"
          className="h-12 w-12 shrink-0 rounded-xl object-cover"
        />
      ) : (
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400 dark:bg-slate-800">
          <BookOpen className="h-5 w-5" />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{item.title}</span>
        {item.description && (
          <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
            {item.description}
          </span>
        )}
      </span>
    </button>
  )
}

export default function WikiView({ initial }) {
  const [data, setData] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const open = async (key) => {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const next = await fetchArticle(key)
      setData((prev) => ({
        ...next,
        related: [prev.article, ...prev.related]
          .filter((item) => item.key !== next.article.key)
          .slice(0, MAX_RELATED),
      }))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const { article, related } = data

  return (
    <div className="space-y-4 text-left">
      {article.type === 'disambiguation' && (
        <div className="flex items-start gap-2 rounded-2xl bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <span>This term can mean several things. Pick one from the related list below.</span>
        </div>
      )}

      <div className="relative">
        <ArticleCard article={article} />
        {busy && (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/60 dark:bg-slate-950/60">
            <LoaderCircle className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {related.length > 0 && (
        <section>
          <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Related
          </h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {related.map((item) => (
              <RelatedItem key={item.key} item={item} busy={busy} onOpen={open} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}