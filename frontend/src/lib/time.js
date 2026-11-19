const UNITS = [
  ['d', 86400],
  ['h', 3600],
  ['m', 60],
]

export function timeAgo(iso) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000))
  for (const [label, size] of UNITS) {
    if (seconds >= size) return `${Math.floor(seconds / size)}${label} ago`
  }
  return 'just now'
}