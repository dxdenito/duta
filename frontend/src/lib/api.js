async function request(url, options) {
  const response = await fetch(url, options)
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const detail = typeof body?.detail === 'string' ? body.detail : null
    throw new Error(detail || `Request failed (${response.status})`)
  }
  return response.json()
}

export function runCommand(input) {
  return request('/api/command', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input }),
  })
}

export function fetchNews(category, signal) {
  return request(`/api/news?category=${encodeURIComponent(category)}`, { signal })
}

export function lookupWiki(query) {
  return request(`/api/wiki/lookup?q=${encodeURIComponent(query)}`)
}

export function fetchArticle(title) {
  return request(`/api/wiki/article?title=${encodeURIComponent(title)}`)
}

export function randomArticle() {
  return request('/api/wiki/random')
}

export function suggestWiki(query, signal) {
  return request(`/api/wiki/suggest?q=${encodeURIComponent(query)}`, { signal })
}