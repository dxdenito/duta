import { CircleAlert, X } from 'lucide-react'
import NewsView from './NewsView.jsx'
import WikiView from './WikiView.jsx'
import { Link } from 'react-router-dom'
import HangmanGame from './HangmanGame.jsx'
import ScrambleGame from './ScrambleGame.jsx'
import TriviaGame from './TriviaGame.jsx'
import ScoresView from './ScoresView.jsx'
import { ConvertView, DefineView, JokeView, WeatherView } from './ToolViews.jsx'
import StocksView from './StocksView.jsx'

function HelpResult({ data }) {
  return (
    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
      {data.map((command) => (
        <li
          key={command.name}
          className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
        >
          <code className="w-fit rounded-lg bg-slate-100 px-2 py-1 text-sm text-blue-700 dark:bg-slate-800 dark:text-blue-300">
            {command.usage}
          </code>
          <span className="text-sm text-slate-600 dark:text-slate-300">{command.description}</span>
        </li>
      ))}
    </ul>
  )
}

function TextResult({ data }) {
  return <p className="text-base leading-relaxed">{data?.message}</p>
}

function ErrorResult({ data }) {
  return (
    <div className="flex items-start gap-3 text-red-600 dark:text-red-400">
      <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />
      <p className="text-sm">{data?.message}</p>
    </div>
  )
}

function NewsResult({ data }) {
  return <NewsView initial={data} />
}

function WikiResult({ data }) {
  return <WikiView initial={data} />
}

function GamesResult({ data }) {
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {data.map((game) => (
        <li key={game.id}>
          {game.available ? (
            <Link
              to={`/games/${game.id}`}
              className="flex h-full flex-col rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200/70 transition hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-800/60 dark:ring-slate-700"
            >
              <span className="font-semibold">{game.name}</span>
              <span className="text-sm text-slate-600 dark:text-slate-300">{game.description}</span>
            </Link>
          ) : (
            <div className="flex h-full flex-col rounded-2xl bg-slate-50/60 p-4 opacity-60 ring-1 ring-slate-200/70 dark:bg-slate-800/40 dark:ring-slate-700">
              <span className="font-semibold">
                {game.name}
                <span className="ml-2 text-xs font-medium text-slate-500">Soon</span>
              </span>
              <span className="text-sm text-slate-600 dark:text-slate-300">{game.description}</span>
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}

function GameResult({ data }) {
  if (data.game === 'hangman') return <HangmanGame initial={data.state} />
  if (data.game === 'scramble') return <ScrambleGame initial={data.state} />
  if (data.game === 'trivia') return <TriviaGame initial={data.state} />
  return <TextResult data={{ message: 'That game is not available yet.' }} />
}

function ScoresResult({ data }) {
  return (
    <div className="text-left">
      {data.title && <h2 className="mb-3 text-lg font-bold">{data.title}</h2>}
      <ScoresView
        matches={data.matches}
        emptyText={data.league ? 'No recent or upcoming matches.' : 'No live matches right now.'}
      />
    </div>
  )
}

const RENDERERS = {
  help: HelpResult,
  text: TextResult,
  error: ErrorResult,
  news: NewsResult,
  stocks: StocksView,
  wiki: WikiResult,
  games: GamesResult,
  game: GameResult,
  scores: ScoresResult,
  define: DefineView,
  weather: WeatherView,
  convert: ConvertView,
  joke: JokeView,
}

export default function Results({ result, onClose }) {
  const Renderer = RENDERERS[result.type] ?? TextResult

  return (
    <section className="mt-6 flex w-full flex-col rounded-3xl bg-white/80 p-4 text-left shadow-sm ring-1 ring-slate-200/70 backdrop-blur md:p-6 dark:bg-slate-900/70 dark:ring-slate-800">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {result.command ? `/${result.command}` : 'Answer'}
        </span>
        <button
          onClick={onClose}
          aria-label="Close results"
          className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <Renderer data={result.data} />
    </section>
  )
}