import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Frown, Heart, LoaderCircle, RotateCcw, Trophy } from 'lucide-react'
import { guessHangman, newHangman } from '../lib/api.js'

const ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm']

const CATEGORIES = [
  { id: '', label: 'Any' },
  { id: 'kenya', label: 'Kenya' },
  { id: 'animals', label: 'Animals' },
  { id: 'food', label: 'Food' },
  { id: 'countries', label: 'Countries' },
  { id: 'tech', label: 'Tech' },
]

const PARTS = [
  <circle key="head" cx="85" cy="40" r="12" />,
  <path key="body" d="M85 52v36" />,
  <path key="left-arm" d="M85 62l-18 14" />,
  <path key="right-arm" d="M85 62l18 14" />,
  <path key="left-leg" d="M85 88l-16 24" />,
  <path key="right-leg" d="M85 88l16 24" />,
]

function Gallows({ wrong }) {
  return (
    <svg
      viewBox="0 0 120 140"
      className="h-40 w-36 shrink-0"
      fill="none"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 130h76M30 130V12h55v16" className="stroke-slate-300 dark:stroke-slate-600" />
      <g className="stroke-blue-600 dark:stroke-blue-400">{PARTS.slice(0, wrong)}</g>
    </svg>
  )
}

function WordDisplay({ game }) {
  const lost = game.status === 'lost'
  const chars = game.word ? [...game.word] : game.mask

  return (
    <div className="flex flex-wrap justify-center gap-x-1.5 gap-y-3">
      {chars.map((char, index) => {
        if (char === ' ') return <span key={index} className="w-4" />
        const missing = lost && game.mask[index] === null
        return (
          <span
            key={index}
            className={`flex h-11 w-7 items-center justify-center border-b-4 text-2xl font-bold uppercase sm:h-12 sm:w-9 ${
              missing
                ? 'border-red-400 text-red-500'
                : 'border-slate-300 dark:border-slate-600'
            }`}
          >
            {char ?? ''}
          </span>
        )
      })}
    </div>
  )
}

function Keyboard({ guessed, missed, disabled, onGuess }) {
  return (
    <div className="mx-auto mt-6 max-w-md space-y-2">
      {ROWS.map((row) => (
        <div key={row} className="flex justify-center gap-1.5">
          {[...row].map((letter) => {
            const isMissed = missed.has(letter)
            const isHit = guessed.has(letter) && !isMissed
            const used = isMissed || isHit
            let tone =
              'bg-white text-slate-800 ring-slate-200 hover:bg-blue-50 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700 dark:hover:bg-slate-700'
            if (isHit) tone = 'bg-emerald-500 text-white ring-emerald-500'
            if (isMissed)
              tone = 'bg-red-100 text-red-400 ring-red-200 dark:bg-red-500/10 dark:ring-red-500/20'
            return (
              <button
                key={letter}
                onClick={() => onGuess(letter)}
                disabled={disabled || used}
                className={`h-11 min-w-0 flex-1 rounded-lg text-sm font-semibold uppercase shadow-sm ring-1 transition disabled:cursor-not-allowed ${tone} ${
                  disabled && !used ? 'opacity-50' : ''
                } ${used ? '' : 'active:scale-95'}`}
              >
                {letter}
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}

export default function HangmanGame({ initial = null }) {
  const [game, setGame] = useState(initial)
  const [category, setCategory] = useState('')
  const [busy, setBusy] = useState(!initial)
  const [error, setError] = useState('')
  const pending = useRef(false)

  const start = useCallback(async (selected) => {
    pending.current = true
    setBusy(true)
    setError('')
    try {
      setGame(await newHangman(selected))
    } catch (err) {
      setError(err.message)
    } finally {
      pending.current = false
      setBusy(false)
    }
  }, [])

  useEffect(() => {
    if (!initial) start('')
  }, [initial, start])

  const guess = useCallback(
    async (letter) => {
      if (!game || game.status !== 'playing' || pending.current) return
      if (game.guessed.includes(letter)) return
      pending.current = true
      setError('')
      try {
        setGame(await guessHangman(game.id, letter))
      } catch (err) {
        setError(err.message)
      } finally {
        pending.current = false
      }
    },
    [game],
  )

  useEffect(() => {
    const onKey = (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return
      if (/^[a-z]$/i.test(event.key)) guess(event.key.toLowerCase())
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [guess])

  const guessed = useMemo(() => new Set(game?.guessed), [game])
  const missed = useMemo(() => new Set(game?.missed), [game])
  const playing = game?.status === 'playing'

  const pickCategory = (id) => {
    setCategory(id)
    start(id)
  }

  return (
    <div className="text-left">
      <div className="mb-4 flex flex-wrap gap-2">
        {CATEGORIES.map((item) => (
          <button
            key={item.id}
            onClick={() => pickCategory(item.id)}
            disabled={busy}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium ring-1 transition disabled:opacity-60 ${
              category === item.id
                ? 'bg-blue-600 text-white ring-blue-600'
                : 'bg-white/80 text-slate-700 ring-slate-200 hover:text-blue-600 dark:bg-slate-900/70 dark:text-slate-200 dark:ring-slate-800'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-2xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
          {error}
          <button onClick={() => start(category)} className="ml-2 font-semibold underline underline-offset-2">
            New game
          </button>
        </div>
      )}

      {game ? (
        <div className="rounded-3xl bg-white/80 p-5 ring-1 ring-slate-200/70 dark:bg-slate-900/70 dark:ring-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {game.category}
            </span>
            <span
              className="flex items-center gap-0.5 text-red-500"
              aria-label={`${game.max_wrong - game.wrong} tries left`}
            >
              {Array.from({ length: game.max_wrong }, (_, index) => (
                <Heart
                  key={index}
                  className={`h-4 w-4 ${index < game.max_wrong - game.wrong ? 'fill-current' : 'opacity-25'}`}
                />
              ))}
            </span>
          </div>

          <div className="my-4 flex justify-center">
            <Gallows wrong={game.wrong} />
          </div>

          <WordDisplay game={game} />

          {!playing && (
            <div
              className={`mt-6 flex flex-col items-center gap-3 rounded-2xl p-4 text-center ${
                game.status === 'won'
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                  : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300'
              }`}
            >
              <div className="flex items-center gap-2 font-semibold">
                {game.status === 'won' ? <Trophy className="h-5 w-5" /> : <Frown className="h-5 w-5" />}
                {game.status === 'won' ? 'You got it!' : 'Out of tries'}
              </div>
              <button
                onClick={() => start(category)}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50"
              >
                <RotateCcw className="h-4 w-4" />
                Play again
              </button>
            </div>
          )}

          <Keyboard guessed={guessed} missed={missed} disabled={!playing} onGuess={guess} />
        </div>
      ) : (
        busy && (
          <div className="flex justify-center py-16">
            <LoaderCircle className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        )
      )}
    </div>
  )
}