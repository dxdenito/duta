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

export function newHangman(category = '') {
  return request(`/api/games/hangman?category=${encodeURIComponent(category)}`, {
    method: 'POST',
  })
}

export function guessHangman(id, letter) {
  return request(`/api/games/hangman/${encodeURIComponent(id)}/guess`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ letter }),
  })
}

function post(url, body) {
  return request(url, {
    method: 'POST',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
}

export function newScramble(category = '') {
  return post(`/api/games/scramble?category=${encodeURIComponent(category)}`)
}

export function answerScramble(id, answer) {
  return post(`/api/games/scramble/${encodeURIComponent(id)}/answer`, { answer })
}

export function hintScramble(id) {
  return post(`/api/games/scramble/${encodeURIComponent(id)}/hint`)
}

export function giveUpScramble(id) {
  return post(`/api/games/scramble/${encodeURIComponent(id)}/giveup`)
}

export function newTrivia(category = '') {
  return post(`/api/games/trivia?category=${encodeURIComponent(category)}`)
}

export function answerTrivia(id, choice) {
  return post(`/api/games/trivia/${encodeURIComponent(id)}/answer`, { choice })
}

export function fetchLeagues() {
  return request('/api/sports/leagues')
}

export function fetchScores(league, signal) {
  return request(`/api/sports/scores?league=${encodeURIComponent(league)}`, { signal })
}

export function fetchMatch(league, id, signal) {
  return request(
    `/api/sports/match/${encodeURIComponent(league)}/${encodeURIComponent(id)}`,
    { signal },
  )
}

export function fetchDefine(word) {
  return request(`/api/tools/define?word=${encodeURIComponent(word)}`)
}

export function fetchWeather(place) {
  return request(`/api/tools/weather?place=${encodeURIComponent(place)}`)
}

export function fetchConvert(query) {
  return request(`/api/tools/convert?q=${encodeURIComponent(query)}`)
}

export function fetchJoke(exclude = -1) {
  return request(`/api/tools/joke?exclude=${exclude}`)
}

export function fetchCommands() {
  return request('/api/commands')
}