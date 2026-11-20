import MatchCard from './MatchCard.jsx'

const GROUPS = [
  { state: 'in', label: 'Live now' },
  { state: 'pre', label: 'Upcoming' },
  { state: 'post', label: 'Finished' },
]

export default function ScoresView({ matches, emptyText = 'No matches found.' }) {
  if (!matches.length) {
    return <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">{emptyText}</p>
  }

  const grouped = { in: [], pre: [], post: [] }
  for (const match of matches) (grouped[match.state] ?? grouped.pre).push(match)

  return (
    <div className="space-y-6 text-left">
      {GROUPS.filter((group) => grouped[group.state].length > 0).map((group) => (
        <section key={group.state}>
          <h2 className="mb-3 px-1 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {group.label}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {grouped[group.state].map((match) => (
              <MatchCard key={`${match.league}-${match.id}`} match={match} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}