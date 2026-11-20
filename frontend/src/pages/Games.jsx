import { Link } from 'react-router-dom'
import { ArrowRight, Brain, Shuffle, Type } from 'lucide-react'

const GAMES = [
  {
    id: 'hangman',
    title: 'Hangman',
    text: 'Guess the word one letter at a time',
    icon: Type,
    tint: 'from-violet-100 to-fuchsia-100 dark:from-violet-500/10 dark:to-fuchsia-500/10',
    color: 'text-violet-600 dark:text-violet-400',
    available: true,
  },
  {
    id: 'trivia',
    title: 'Trivia',
    text: 'Test your general knowledge',
    icon: Brain,
    tint: 'from-sky-100 to-indigo-100 dark:from-sky-500/10 dark:to-indigo-500/10',
    color: 'text-sky-600 dark:text-sky-400',
    available: true,
  },
  {
    id: 'scramble',
    title: 'Word Scramble',
    text: 'Unscramble the letters',
    icon: Shuffle,
    tint: 'from-cyan-100 to-teal-100 dark:from-cyan-500/10 dark:to-teal-500/10',
    color: 'text-teal-600 dark:text-teal-400',
    available: true,
  },
]

function Card({ game }) {
  const body = (
    <>
      <game.icon className={`h-9 w-9 ${game.color}`} />
      <div className="flex items-end justify-between gap-2">
        <div>
          <h3 className="font-semibold">{game.title}</h3>
          <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">{game.text}</p>
        </div>
        {game.available ? (
          <ArrowRight className="h-5 w-5 shrink-0 text-slate-500 dark:text-slate-400" />
        ) : (
          <span className="shrink-0 rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-medium text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
            Soon
          </span>
        )}
      </div>
    </>
  )

  const base = `flex min-h-40 flex-col justify-between rounded-3xl bg-linear-to-br p-4 text-left ring-1 ring-black/5 dark:ring-white/5 ${game.tint}`

  if (!game.available) return <div className={`${base} opacity-60`}>{body}</div>

  return (
    <Link to={`/games/${game.id}`} className={`${base} transition hover:-translate-y-0.5 hover:shadow-lg`}>
      {body}
    </Link>
  )
}

export default function Games() {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col px-4 pb-8 pt-2">
      <div className="mb-5">
        <h1 className="text-3xl font-extrabold tracking-tight">Games</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Play and have fun</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {GAMES.map((game) => (
          <Card key={game.id} game={game} />
        ))}
      </div>
    </div>
  )
}