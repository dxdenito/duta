import { useEffect, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { fetchNews } from '../lib/api.js'
import { timeAgo } from '../lib/time.js'

const TICKERS = [
  ['SCOM', 'Safaricom'],
  ['EQTY', 'Equity Group'],
  ['KCB', 'KCB Group'],
  ['EABL', 'East African Breweries'],
  ['COOP', 'Co-op Bank'],
  ['ABSA', 'Absa Bank Kenya'],
  ['NCBA', 'NCBA Group'],
  ['KEGN', 'KenGen'],
  ['KPLC', 'Kenya Power'],
  ['BAT', 'BAT Kenya'],
]

function Heading({ children }) {
  return (
    <h2 className="mb-3 px-1 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
      {children}
    </h2>
  )
}

function NewsRow({ item }) {
  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-2xl bg-white/80 p-4 ring-1 ring-slate-200/70 transition hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-900/70 dark:ring-slate-800"
    >
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
    </a>
  )
}

export default function StocksView() {
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    fetchNews('business', controller.signal)
      .then((data) => {
        const section = data.sections.find((entry) => entry.label.startsWith('NSE'))
        setItems(section ? section.items : [])
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message)
      })
    return () => controller.abort()
  }, [])

  return (
    <div className="space-y-8 text-left">
      <section>
        <Heading>Latest NSE news</Heading>
        {error && (
          <p className="rounded-2xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </p>
        )}
        {!error && items === null && (
          <div className="h-24 animate-pulse rounded-2xl bg-slate-200/70 dark:bg-slate-800/70" />
        )}
        {items && items.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400">No NSE headlines right now.</p>
        )}
        {items && items.length > 0 && (
          <div className="space-y-3">
            {items.map((item) => (
              <NewsRow key={item.link} item={item} />
            ))}
          </div>
        )}
      </section>

      <section>
        <Heading>Check prices</Heading>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {TICKERS.map(([code, name]) => (
            <a
              key={code}
              href={`https://live.mystocks.co.ke/stock=${code}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-2 rounded-2xl bg-white/80 px-4 py-3 ring-1 ring-slate-200/70 transition hover:text-blue-600 dark:bg-slate-900/70 dark:ring-slate-800"
            >
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{code}</span>
                <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{name}</span>
              </span>
              <ExternalLink className="h-4 w-4 shrink-0 text-slate-400" />
            </a>
          ))}
        </div>
        <p className="mt-3 px-1 text-xs text-slate-500 dark:text-slate-400">
          Duta doesn't show prices because NSE market data is licensed. These links open delayed quotes
          on myStocks. For official figures, visit{' '}
          <a
            href="https://www.nse.co.ke/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2"
          >
            nse.co.ke
          </a>
          .
        </p>
      </section>
    </div>
  )
}