import { useState } from 'react'
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSnow,
  CloudSun,
  Droplets,
  Moon,
  RefreshCw,
  Sun,
  Thermometer,
  Volume2,
  Wind,
} from 'lucide-react'
import { fetchJoke } from '../lib/api.js'

const WEATHER_ICONS = {
  Sun,
  Moon,
  CloudSun,
  CloudMoon,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  CloudLightning,
}

const dayName = new Intl.DateTimeFormat(undefined, { weekday: 'short' })

function WeatherIcon({ name, className }) {
  const Icon = WEATHER_ICONS[name] ?? Cloud
  return <Icon className={className} />
}

function dayLabel(date, index) {
  if (index === 0) return 'Today'
  return dayName.format(new Date(`${date}T12:00:00`))
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl bg-slate-50 py-3 dark:bg-slate-800/60">
      <Icon className="h-4 w-4 text-slate-400" />
      <span className="text-sm font-semibold">{value}</span>
      <span className="text-[11px] text-slate-500 dark:text-slate-400">{label}</span>
    </div>
  )
}

export function DefineView({ data }) {
  const play = () => {
    if (data.audio) new Audio(data.audio).play().catch(() => {})
  }

  return (
    <article className="space-y-4 text-left">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">{data.word}</h2>
          {data.phonetic && <p className="text-sm text-slate-500 dark:text-slate-400">{data.phonetic}</p>}
        </div>
        {data.audio && (
          <button
            onClick={play}
            aria-label="Play pronunciation"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400"
          >
            <Volume2 className="h-5 w-5" />
          </button>
        )}
      </header>

      {data.meanings.map((meaning) => (
        <section key={meaning.part}>
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            {meaning.part}
          </h3>
          <ol className="list-decimal space-y-2 pl-5 text-[15px]">
            {meaning.definitions.map((item, index) => (
              <li key={index}>
                <p>{item.definition}</p>
                {item.example && (
                  <p className="mt-0.5 text-sm italic text-slate-500 dark:text-slate-400">“{item.example}”</p>
                )}
              </li>
            ))}
          </ol>
        </section>
      ))}

      {data.synonyms.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Synonyms
          </span>
          {data.synonyms.map((word) => (
            <span
              key={word}
              className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              {word}
            </span>
          ))}
        </div>
      )}
    </article>
  )
}

export function WeatherView({ data }) {
  const { place, current, days } = data
  const where = [place.name, place.region, place.country].filter(Boolean).join(', ')

  return (
    <div className="space-y-5 text-left">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-500 dark:text-slate-400">{where}</p>
          <p className="mt-1 text-5xl font-extrabold tracking-tight">{current.temp ?? '-'}°</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{current.label}</p>
        </div>
        <WeatherIcon name={current.icon} className="h-16 w-16 shrink-0 text-sky-500 dark:text-sky-400" />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat icon={Thermometer} label="Feels like" value={`${current.feels ?? '-'}°`} />
        <Stat icon={Droplets} label="Humidity" value={`${current.humidity ?? '-'}%`} />
        <Stat icon={Wind} label="Wind" value={`${current.wind ?? '-'} km/h`} />
      </div>

      <div className="grid grid-cols-5 gap-2">
        {days.map((day, index) => (
          <div
            key={day.date}
            className="flex flex-col items-center gap-1 rounded-2xl bg-slate-50 py-3 dark:bg-slate-800/60"
          >
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {dayLabel(day.date, index)}
            </span>
            <WeatherIcon name={day.icon} className="h-6 w-6 text-sky-500 dark:text-sky-400" />
            <span className="text-sm font-semibold">{day.high ?? '-'}°</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{day.low ?? '-'}°</span>
            <span className="text-[10px] text-sky-600 dark:text-sky-400">{day.rain ?? 0}%</span>
          </div>
        ))}
      </div>

      <p className="text-center text-[11px] text-slate-400">
        <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer" className="hover:underline">
          Weather data by Open-Meteo.com
        </a>
      </p>
    </div>
  )
}

export function ConvertView({ data }) {
  return (
    <div className="space-y-1 text-left">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {data.kind === 'currency' ? 'Currency' : 'Units'}
      </p>
      <p className="pt-1 text-lg text-slate-600 dark:text-slate-300">{data.from_text} =</p>
      <p className="text-3xl font-extrabold tracking-tight">{data.to_text}</p>

      {data.kind === 'currency' && (
        <p className="pt-3 text-xs text-slate-500 dark:text-slate-400">
          {data.rate_text}
          {data.updated && ` • Updated ${new Date(data.updated).toLocaleDateString()}`} • Rates by{' '}
          <a
            href={data.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2"
          >
            {data.source}
          </a>
        </p>
      )}
    </div>
  )
}

export function JokeView({ data }) {
  const [joke, setJoke] = useState(data)
  const [shown, setShown] = useState(false)
  const [busy, setBusy] = useState(false)

  const next = async () => {
    if (busy) return
    setBusy(true)
    const fresh = await fetchJoke(joke.id).catch(() => null)
    if (fresh) {
      setJoke(fresh)
      setShown(false)
    }
    setBusy(false)
  }

  return (
    <div className="space-y-4 text-left">
      <p className="text-lg font-semibold leading-snug">{joke.setup}</p>

      {shown ? (
        <p className="text-lg text-blue-600 dark:text-blue-400">{joke.punchline}</p>
      ) : (
        <button
          onClick={() => setShown(true)}
          className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
        >
          Reveal
        </button>
      )}

      <button
        onClick={next}
        disabled={busy}
        className="flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-blue-600 disabled:opacity-50 dark:text-slate-400"
      >
        <RefreshCw className="h-4 w-4" />
        Another joke
      </button>
    </div>
  )
}