const formatter = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

export function kickoffLabel(iso) {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? 'TBD' : formatter.format(date)
}