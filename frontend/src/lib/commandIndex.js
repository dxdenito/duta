export function buildIndex(commands) {
  const entries = []
  const byKey = new Map()

  for (const command of commands) {
    for (const key of [command.name, ...command.aliases]) {
      entries.push([key, command])
      byKey.set(key, command)
    }
  }

  entries.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
  return { commands, entries, byKey }
}

function lowerBound(entries, prefix) {
  let low = 0
  let high = entries.length
  while (low < high) {
    const mid = (low + high) >> 1
    if (entries[mid][0] < prefix) low = mid + 1
    else high = mid
  }
  return low
}

export function matchPrefix(index, prefix, limit = 8) {
  if (!prefix) return index.commands.slice(0, limit)

  const results = []
  const seen = new Set()

  for (
    let position = lowerBound(index.entries, prefix);
    position < index.entries.length && results.length < limit;
    position += 1
  ) {
    const [key, command] = index.entries[position]
    if (!key.startsWith(prefix)) break
    if (seen.has(command.name)) continue
    seen.add(command.name)
    results.push(command)
  }

  return results
}