import { useRef, useState } from 'react'
import { ArrowRight, ArrowRightLeft, Book, CloudSun, LoaderCircle, Smile } from 'lucide-react'
import { ConvertView, DefineView, JokeView, WeatherView } from '../components/ToolViews.jsx'
import { fetchConvert, fetchDefine, fetchJoke, fetchWeather } from '../lib/api.js'

const TOOLS = [
  {
    id: 'define',
    label: 'Define',
    icon: Book,
    placeholder: 'Type a word',
    fetcher: fetchDefine,
    View: DefineView,
    examples: ['serendipity', 'ubiquitous', 'harambee'],
  },
  {
    id: 'weather',
    label: 'Weather',
    icon: CloudSun,
    placeholder: 'City (default Nairobi)',
    fetcher: fetchWeather,
    View: WeatherView,
    examples: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru'],
    auto: true,
  },
  {
    id: 'convert',
    label: 'Convert',
    icon: ArrowRightLeft,
    placeholder: '100 usd to kes',
    fetcher: fetchConvert,
    View: ConvertView,
    examples: ['100 usd to kes', '5 km to miles', '72 f to c', '2 kg to lb'],
  },
  {
    id: 'joke',
    label: 'Joke',
    icon: Smile,
    fetcher: () => fetchJoke(),
    View: JokeView,
    auto: true,
    noInput: true,
  },
]

export default function Tools() {
  const [toolId, setToolId] = useState('define')
  const [query, setQuery] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const request = useRef(0)

  const tool = TOOLS.find((item) => item.id === toolId)

  const run = async (target, text) => {
    const id = ++request.current
    setLoading(true)
    setError('')
    try {
      const data = await target.fetcher(text)
      if (id === request.current) setResult({ tool: target.id, data, id })
    } catch (err) {
      if (id === request.current) setError(err.message)
    } finally {
      if (id === request.current) setLoading(false)
    }
  }

  const select = (id) => {
    const next = TOOLS.find((item) => item.id === id)
    request.current += 1
    setToolId(id)
    setQuery('')
    setResult(null)
    setError('')
    setLoading(false)
    if (next.auto) run(next, '')
  }

  const submit = (event) => {
    event.preventDefault()
    const text = query.trim()
    if (text) run(tool, text)
  }

  const useExample = (text) => {
    setQuery(text)
    run(tool, text)
  }

  const Active = result ? TOOLS.find((item) => item.id === result.tool).View : null

  return (
    <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col px-4 pb-8 pt-2">
      <div className="mb-5">
        <h1 className="text-3xl font-extrabold tracking-tight">More Tools</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Small helpers for everyday things</p>
      </div>

      <div className="mb-5 grid grid-cols-4 gap-2">
        {TOOLS.map((item) => (
          <button
            key={item.id}
            onClick={() => select(item.id)}
            className={`flex flex-col items-center gap-1 rounded-2xl px-2 py-3 text-xs font-medium ring-1 transition ${
              toolId === item.id
                ? 'bg-blue-50 text-blue-600 ring-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/30'
                : 'bg-white/80 text-slate-600 ring-slate-200 hover:text-blue-600 dark:bg-slate-900/70 dark:text-slate-300 dark:ring-slate-800'
            }`}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </button>
        ))}
      </div>

      {!tool.noInput && (
        <form
          onSubmit={submit}
          className="flex items-center gap-2 rounded-full bg-white py-2 pl-5 pr-2 shadow-md ring-1 ring-slate-200/80 transition focus-within:ring-2 focus-within:ring-blue-500/60 dark:bg-slate-900 dark:ring-slate-800"
        >
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            maxLength={100}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            placeholder={tool.placeholder}
            className="min-w-0 flex-1 bg-transparent text-base placeholder:text-slate-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            aria-label="Go"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white transition hover:bg-blue-500 disabled:opacity-50"
          >
            {loading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
          </button>
        </form>
      )}

      {tool.examples && (
        <div className="mt-3 flex flex-wrap gap-2">
          {tool.examples.map((text) => (
            <button
              key={text}
              onClick={() => useExample(text)}
              disabled={loading}
              className="rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200 transition hover:text-blue-600 disabled:opacity-50 dark:bg-slate-900/70 dark:text-slate-300 dark:ring-slate-800"
            >
              {text}
            </button>
          ))}
        </div>
      )}

      {error && (
        <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </p>
      )}

      {loading && !result && (
        <div className="flex justify-center py-12">
          <LoaderCircle className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      )}

      {Active && (
        <div className="mt-6 rounded-3xl bg-white/80 p-5 ring-1 ring-slate-200/70 dark:bg-slate-900/70 dark:ring-slate-800">
          <Active key={result.id} data={result.data} />
        </div>
      )}
    </div>
  )
}