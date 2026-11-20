import { useCallback, useEffect, useRef, useState } from 'react'
import { LoaderCircle, RotateCcw, Trophy } from 'lucide-react'
import CategoryPills from './CategoryPills.jsx'
import { TRIVIA_CATEGORIES } from '../lib/categories.js'
import { answerTrivia, newTrivia } from '../lib/api.js'

const FEEDBACK_MS = 1100
const LETTERS = ['A', 'B', 'C', 'D']

function verdict(score, total) {
  const ratio = score / total
  if (ratio === 1) return 'Perfect score!'
  if (ratio >= 0.7) return 'Great job!'
  if (ratio >= 0.4) return 'Not bad, keep going!'
  return 'Keep practicing!'
}

function optionTone(index, feedback) {
  if (!feedback) {
    return 'bg-white text-slate-800 ring-slate-200 hover:bg-blue-50 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700 dark:hover:bg-slate-700'
  }
  if (index === feedback.answer) return 'bg-emerald-500 text-white ring-emerald-500'
  if (index === feedback.chosen) return 'bg-red-500 text-white ring-red-500'
  return 'bg-white/60 text-slate-400 ring-slate-200 dark:bg-slate-800/60 dark:text-slate-500 dark:ring-slate-700'
}

export default function TriviaGame({ initial = null }) {
  const [game, setGame] = useState(initial)
  const [category, setCategory] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [busy, setBusy] = useState(!initial)
  const [error, setError] = useState('')
  const pending = useRef(false)
  const timer = useRef(null)

  const advance = useCallback((next) => {
    clearTimeout(timer.current)
    setGame(next)
    setFeedback(null)
  }, [])

  const start = useCallback(async (selected) => {
    if (pending.current) return
    pending.current = true
    clearTimeout(timer.current)
    setBusy(true)
    setError('')
    setFeedback(null)
    try {
      setGame(await newTrivia(selected))
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

  useEffect(() => () => clearTimeout(timer.current), [])

  const choose = async (index) => {
    if (!game || game.status !== 'playing' || feedback || pending.current) return
    pending.current = true
    setError('')
    try {
      const result = await answerTrivia(game.id, index)
      setFeedback({ chosen: index, answer: result.answer, correct: result.correct, next: result })
      timer.current = setTimeout(() => advance(result), FEEDBACK_MS)
    } catch (err) {
      setError(err.message)
    } finally {
      pending.current = false
    }
  }

  const finished = game?.status === 'finished'
  const score = feedback ? feedback.next.score : game?.score

  return (
    <div className="text-left">
      <CategoryPills
        items={TRIVIA_CATEGORIES}
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
            Try again
          </button>
        </div>
      )}

      {game && finished && (
        <div className="flex flex-col items-center gap-3 rounded-3xl bg-white/80 p-8 text-center ring-1 ring-slate-200/70 dark:bg-slate-900/70 dark:ring-slate-800">
          <Trophy className="h-10 w-10 text-amber-500" />
          <p className="text-4xl font-extrabold">
            {game.score}/{game.total}
          </p>
          <p className="text-slate-600 dark:text-slate-300">{verdict(game.score, game.total)}</p>
          <button
            onClick={() => start(category)}
            disabled={busy}
            className="mt-2 inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4" />
            Play again
          </button>
        </div>
      )}

      {game && !finished && game.question && (
        <div className="rounded-3xl bg-white/80 p-5 ring-1 ring-slate-200/70 dark:bg-slate-900/70 dark:ring-slate-800">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <span>
              Question {game.index + 1} of {game.total}
            </span>
            <span>Score {score}</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-blue-600 transition-all"
              style={{ width: `${(game.index / game.total) * 100}%` }}
            />
          </div>

          <h2 className="mt-5 text-lg font-semibold leading-snug">{game.question.text}</h2>

          <div className="mt-5 space-y-2.5">
            {game.question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => choose(index)}
                disabled={Boolean(feedback)}
                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-[15px] font-medium shadow-sm ring-1 transition ${optionTone(index, feedback)}`}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black/5 text-xs font-bold dark:bg-white/10">
                  {LETTERS[index]}
                </span>
                <span>{option}</span>
              </button>
            ))}
          </div>

          {feedback && (
            <div className="mt-4 flex items-center justify-between">
              <span
                className={`text-sm font-semibold ${feedback.correct ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}
              >
                {feedback.correct ? 'Correct!' : 'Not quite'}
              </span>
              <button
                onClick={() => advance(feedback.next)}
                className="text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400"
              >
                {feedback.next.status === 'finished' ? 'See results' : 'Next'}
              </button>
            </div>
          )}
        </div>
      )}

      {!game && busy && (
        <div className="flex justify-center py-16">
          <LoaderCircle className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      )}

      <p className="mt-4 text-center text-[11px] text-slate-400">
        Questions: Open Trivia DB (CC BY-SA 4.0) and Duta's Kenya set
      </p>
    </div>
  )
}