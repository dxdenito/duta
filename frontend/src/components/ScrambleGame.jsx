import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, Flag, Lightbulb, LoaderCircle, RotateCcw, Trophy } from 'lucide-react'
import CategoryPills from './CategoryPills.jsx'
import { WORD_CATEGORIES } from '../lib/categories.js'
import { answerScramble, giveUpScramble, hintScramble, newScramble } from '../lib/api.js'

function tileTone(status) {
  if (status === 'solved') return 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20'
  if (status === 'revealed') return 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/20'
  return 'bg-blue-50 text-blue-700 ring-blue-100 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/20'
}

export default function ScrambleGame({ initial = null }) {
  const [game, setGame] = useState(initial)
  const [category, setCategory] = useState('')
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(!initial)
  const [error, setError] = useState('')
  const [miss, setMiss] = useState(false)
  const [solved, setSolved] = useState(0)
  const pending = useRef(false)

  const run = useCallback(async (task, after) => {
    if (pending.current) return
    pending.current = true
    setBusy(true)
    setError('')
    try {
      const next = await task()
      setGame(next)
      if (after) after(next)
    } catch (err) {
      setError(err.message)
    } finally {
      pending.current = false
      setBusy(false)
    }
  }, [])

  const start = useCallback(
    (selected) =>
      run(
        () => newScramble(selected),
        () => {
          setText('')
          setMiss(false)
        },
      ),
    [run],
  )

  useEffect(() => {
    if (!initial) start('')
  }, [initial, start])

  const submit = (event) => {
    event.preventDefault()
    const value = text.trim()
    if (!value || !game || game.status !== 'playing') return
    run(
      () => answerScramble(game.id, value),
      (next) => {
        if (next.status === 'solved') {
          setSolved((count) => count + 1)
        } else {
          setMiss(true)
          setTimeout(() => setMiss(false), 500)
        }
      },
    )
  }

  const hint = () => run(() => hintScramble(game.id))
  const giveUp = () => run(() => giveUpScramble(game.id))

  const playing = game?.status === 'playing'

  return (
    <div className="text-left">
      <CategoryPills
        items={WORD_CATEGORIES}
        value={category}
        disabled={busy}
        onChange={(id) => {
          setCategory(id)
          start(id)
        }}
      />

      {error && (
        <div className="mb-4 rounded-2xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
          {error}
          <button onClick={() => start(category)} className="ml-2 font-semibold underline underline-offset-2">
            New word
          </button>
        </div>
      )}

      {game ? (
        <div className="rounded-3xl bg-white/80 p-5 ring-1 ring-slate-200/70 dark:bg-slate-900/70 dark:ring-slate-800">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <span>{game.category}</span>
            <span>Solved {solved}</span>
          </div>

          <div className="my-6 flex flex-wrap justify-center gap-2">
            {[...(playing ? game.scrambled : game.word)].map((letter, index) => (
              <span
                key={index}
                className={`flex h-12 w-12 items-center justify-center rounded-xl text-xl font-bold uppercase ring-1 ${tileTone(game.status)}`}
              >
                {letter}
              </span>
            ))}
          </div>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            {game.length} letters
            {game.prefix && (
              <>
                {' '}
                • starts with{' '}
                <span className="font-semibold uppercase text-slate-700 dark:text-slate-200">{game.prefix}</span>
              </>
            )}
          </p>

          {playing ? (
            <>
              <form onSubmit={submit} className={`mt-6 flex gap-2 ${miss ? 'shake' : ''}`}>
                <input
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  maxLength={40}
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  enterKeyHint="go"
                  placeholder="Your answer"
                  className="min-w-0 flex-1 rounded-full bg-white px-5 py-3 text-base ring-1 ring-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/60 dark:bg-slate-800 dark:ring-slate-700"
                />
                <button
                  type="submit"
                  disabled={busy || !text.trim()}
                  aria-label="Check answer"
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white transition hover:bg-blue-500 disabled:opacity-50"
                >
                  {busy ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
                </button>
              </form>
              {miss && <p className="mt-2 text-center text-sm text-red-500">Not quite, try again</p>}

              <div className="mt-4 flex justify-center gap-3">
                <button
                  onClick={hint}
                  disabled={busy || game.hints >= game.max_hints}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-slate-600 ring-1 ring-slate-200 transition hover:text-blue-600 disabled:opacity-50 dark:text-slate-300 dark:ring-slate-700"
                >
                  <Lightbulb className="h-4 w-4" />
                  Hint ({game.max_hints - game.hints})
                </button>
                <button
                  onClick={giveUp}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-slate-600 ring-1 ring-slate-200 transition hover:text-red-600 disabled:opacity-50 dark:text-slate-300 dark:ring-slate-700"
                >
                  <Flag className="h-4 w-4" />
                  Give up
                </button>
              </div>
            </>
          ) : (
            <div
              className={`mt-6 flex flex-col items-center gap-3 rounded-2xl p-4 text-center ${
                game.status === 'solved'
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                  : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300'
              }`}
            >
              <div className="flex items-center gap-2 font-semibold">
                {game.status === 'solved' ? <Trophy className="h-5 w-5" /> : <Flag className="h-5 w-5" />}
                {game.status === 'solved'
                  ? `Solved in ${game.attempts} ${game.attempts === 1 ? 'try' : 'tries'}!`
                  : 'The word was revealed'}
              </div>
              <button
                onClick={() => start(category)}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50"
              >
                <RotateCcw className="h-4 w-4" />
                Next word
              </button>
            </div>
          )}
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