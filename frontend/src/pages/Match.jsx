import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowLeftRight, CircleDot, RectangleVertical } from 'lucide-react'
import StatusPill from '../components/StatusPill.jsx'
import { useMatch } from '../hooks/useMatch.js'

const KIND_ICONS = {
  goal: CircleDot,
  card: RectangleVertical,
  'red-card': RectangleVertical,
  sub: ArrowLeftRight,
}

const KIND_TONES = {
  goal: 'text-emerald-600 dark:text-emerald-400',
  card: 'text-amber-500',
  'red-card': 'text-red-500',
  sub: 'text-sky-500',
}

function TeamBlock({ team }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-2">
      {team.logo ? (
        <img
          src={team.logo}
          alt=""
          className="h-12 w-12 object-contain"
          onError={(event) => {
            event.currentTarget.style.visibility = 'hidden'
          }}
        />
      ) : (
        <span className="h-12 w-12 rounded-full bg-slate-200 dark:bg-slate-700" />
      )}
      <span className="w-full truncate text-sm font-semibold">{team.name}</span>
    </div>
  )
}

function Scoreboard({ match }) {
  const showScore = match.state !== 'pre'

  return (
    <div className="rounded-3xl bg-white/80 p-5 ring-1 ring-slate-200/70 dark:bg-slate-900/70 dark:ring-slate-800">
      <div className="mb-4 flex items-center justify-between gap-2">
        <span className="truncate text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {match.league_name}
        </span>
        <StatusPill match={match} />
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
        <TeamBlock team={match.home} />
        <div className="text-3xl font-extrabold tabular-nums">
          {showScore ? `${match.home.score ?? 0} - ${match.away.score ?? 0}` : 'vs'}
        </div>
        <TeamBlock team={match.away} />
      </div>
      {match.venue && (
        <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">{match.venue}</p>
      )}
    </div>
  )
}

function CommentaryItem({ item }) {
  const Icon = KIND_ICONS[item.kind]

  return (
    <li
      className={`flex gap-3 rounded-2xl p-3 ${
        item.kind === 'goal' ? 'bg-emerald-50 dark:bg-emerald-500/10' : ''
      }`}
    >
      <span className="w-11 shrink-0 pt-0.5 text-right text-xs font-semibold tabular-nums text-slate-500 dark:text-slate-400">
        {item.minute}
      </span>
      <span className="mt-0.5 w-4 shrink-0">
        {Icon && <Icon className={`h-4 w-4 ${KIND_TONES[item.kind]}`} />}
      </span>
      <p className="min-w-0 flex-1 text-[15px] leading-snug">{item.text}</p>
    </li>
  )
}

function LiveIndicator({ connected }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
      <span
        className={`h-2 w-2 rounded-full ${connected ? 'animate-pulse bg-emerald-500' : 'bg-amber-500'}`}
      />
      {connected ? 'Live updates on' : 'Reconnecting…'}
    </span>
  )
}

export default function Match() {
  const { league, eventId } = useParams()
  const { match, feed, source, error, connected } = useMatch(league, eventId)
  const items = useMemo(() => [...feed].reverse(), [feed])

  return (
    <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col px-4 pb-8 pt-2">
      <Link
        to="/live"
        className="mb-4 inline-flex w-fit items-center gap-1 text-sm font-medium text-slate-500 transition hover:text-blue-600 dark:text-slate-400"
      >
        <ArrowLeft className="h-4 w-4" />
        Live
      </Link>

      {error && (
        <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </div>
      )}

      {!match && !error && (
        <div className="h-44 animate-pulse rounded-3xl bg-slate-200/70 dark:bg-slate-800/70" />
      )}

      {match && (
        <>
          <Scoreboard match={match} />

          <div className="mb-2 mt-6 flex items-center justify-between px-1">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {source === 'keyEvents' ? 'Key events' : 'Commentary'}
            </h2>
            {match.state !== 'post' && <LiveIndicator connected={connected} />}
          </div>

          {items.length > 0 ? (
            <ul className="space-y-1">
              {items.map((item) => (
                <CommentaryItem key={item.seq} item={item} />
              ))}
            </ul>
          ) : (
            <p className="rounded-2xl bg-white/60 p-4 text-sm text-slate-500 dark:bg-slate-900/50 dark:text-slate-400">
              {match.state === 'pre'
                ? 'Commentary will appear here once the match kicks off.'
                : 'No commentary is available for this match. Smaller leagues often only have scores.'}
            </p>
          )}
        </>
      )}
    </div>
  )
}