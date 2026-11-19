import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, Gamepad2, LayoutGrid, Newspaper } from 'lucide-react'
import CommandBar from '../components/CommandBar.jsx'
import Logo from '../components/Logo.jsx'
import Results from '../components/Results.jsx'
import { runCommand } from '../lib/api.js'
import { useHealth } from '../hooks/useHealth.js'
import { USER_NAME } from '../config.js'


const CARDS = [
  {
    to: '/news',
    title: 'Latest News',
    text: 'Top stories from Kenya and the world',
    icon: Newspaper,
    tint: 'from-sky-100 to-indigo-100 dark:from-sky-500/10 dark:to-indigo-500/10',
    color: 'text-sky-600 dark:text-sky-400',
  },
  {
    to: '/wiki',
    title: 'Wikipedia',
    text: 'Search and learn anything',
    icon: BookOpen,
    tint: 'from-slate-100 to-stone-200 dark:from-slate-500/10 dark:to-stone-500/10',
    color: 'text-slate-600 dark:text-slate-300',
  },
  {
    to: '/games',
    title: 'Games',
    text: 'Play and have fun',
    icon: Gamepad2,
    tint: 'from-violet-100 to-fuchsia-100 dark:from-violet-500/10 dark:to-fuchsia-500/10',
    color: 'text-violet-600 dark:text-violet-400',
  },
  {
    to: '/more',
    title: 'More Tools',
    text: 'Discover more features',
    icon: LayoutGrid,
    tint: 'from-cyan-100 to-teal-100 dark:from-cyan-500/10 dark:to-teal-500/10',
    color: 'text-teal-600 dark:text-teal-400',
  },
]

function StatusLine({ online }) {
  const dot = online === false ? 'bg-red-500' : online ? 'bg-emerald-500' : 'bg-slate-400'
  const label =
    online === false ? 'Offline • Backend unreachable' : online ? 'Online • Ready to help!' : 'Connecting…'

  return (
    <div className="mt-10 flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
      <span className="h-px w-10 bg-slate-300 dark:bg-slate-700" />
      <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
      <span>{label}</span>
      <span className="h-px w-10 bg-slate-300 dark:bg-slate-700" />
    </div>
  )
}

export default function Home() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const online = useHealth()

  const counter = useRef(0)

  const submit = async (text) => {
    setLoading(true)
    let response
    try {
      response = await runCommand(text)
    } catch (error) {
      response = { type: 'error', command: '', data: { message: error.message } }
    }
    counter.current += 1
    setResult({ ...response, id: counter.current })
    setLoading(false)
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col items-center px-4 pb-8 pt-2 text-center">
      {result === null && (
        <>
          <Logo className="h-24 w-24 md:h-28 md:w-28" />
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight md:text-6xl">
            Hello{' '}
            <span className="bg-linear-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent">
              {USER_NAME}!
            </span>
          </h1>
          <p className="mb-8 mt-3 max-w-xl text-base text-slate-600 md:text-lg dark:text-slate-300">
            Search the web, read the latest news, explore Wikipedia, play games and more, all in one place.
          </p>
        </>
      )}

      <CommandBar onSubmit={submit} loading={loading} />

      {result !== null ? (
        <Results key={result.id} result={result} onClose={() => setResult(null)} />
      ) : (
        <div className="mt-10 grid w-full grid-cols-2 gap-3 md:grid-cols-4">
          {CARDS.map((card) => (
            <Link
              key={card.to}
              to={card.to}
              className={`flex min-h-40 flex-col justify-between rounded-3xl bg-linear-to-br p-4 text-left ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-lg dark:ring-white/5 ${card.tint}`}
            >
              <card.icon className={`h-9 w-9 ${card.color}`} />
              <div className="flex items-end justify-between gap-2">
                <div>
                  <h3 className="font-semibold">{card.title}</h3>
                  <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">{card.text}</p>
                </div>
                <ArrowRight className="h-5 w-5 shrink-0 text-slate-500 dark:text-slate-400" />
              </div>
            </Link>
          ))}
        </div>
      )}

      <StatusLine online={online} />
    </div>
  )
}