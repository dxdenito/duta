import { kickoffLabel } from '../lib/match.js'

export default function StatusPill({ match }) {
  if (match.state === 'in') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600 dark:bg-red-500/10 dark:text-red-400">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
        {match.status || 'LIVE'}
      </span>
    )
  }

  if (match.state === 'post') {
    return <span className="text-xs font-semibold text-slate-500">{match.status || 'FT'}</span>
  }

  return (
    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
      {kickoffLabel(match.kickoff)}
    </span>
  )
}