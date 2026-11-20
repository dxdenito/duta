import { Link } from 'react-router-dom'
import StatusPill from './StatusPill.jsx'

function Team({ team, showScore }) {
  return (
    <div className="flex items-center gap-3">
      {team.logo ? (
        <img
          src={team.logo}
          alt=""
          loading="lazy"
          onError={(event) => {
            event.currentTarget.style.visibility = 'hidden'
          }}
          className="h-6 w-6 shrink-0 object-contain"
        />
      ) : (
        <span className="h-6 w-6 shrink-0 rounded-full bg-slate-200 dark:bg-slate-700" />
      )}
      <span className="min-w-0 flex-1 truncate text-[15px] font-medium">{team.name}</span>
      {showScore && <span className="text-lg font-bold tabular-nums">{team.score ?? '-'}</span>}
    </div>
  )
}

export default function MatchCard({ match }) {
  const showScore = match.state !== 'pre'

  return (
    <Link
      to={`/live/${match.league}/${match.id}`}
      className="block rounded-2xl bg-white/80 p-4 ring-1 ring-slate-200/70 transition hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-900/70 dark:ring-slate-800"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="truncate text-xs text-slate-500 dark:text-slate-400">{match.league_name}</span>
        <StatusPill match={match} />
      </div>
      <div className="space-y-2">
        <Team team={match.home} showScore={showScore} />
        <Team team={match.away} showScore={showScore} />
      </div>
    </Link>
  )
}