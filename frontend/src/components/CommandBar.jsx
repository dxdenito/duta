import { useEffect, useMemo, useRef, useState } from 'react'
import { LoaderCircle, Search, Send } from 'lucide-react'
import { useCommands } from '../hooks/useCommands.js'
import { useHistory } from '../hooks/useHistory.js'
import { buildIndex, matchPrefix } from '../lib/commandIndex.js'

const SUGGESTIONS = ['/news', '/live', '/weather', '/wiki Kenya', '/play', '/help']
const LIST_ID = 'command-options'

export default function CommandBar({ onSubmit, loading }) {
  const [value, setValue] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const commands = useCommands()
  const history = useHistory()
  const index = useMemo(() => buildIndex(commands), [commands])
  const boxRef = useRef(null)
  const inputRef = useRef(null)

  const typing = value.startsWith('/') && !/\s/.test(value)

  const matches = useMemo(
    () => (open && typing ? matchPrefix(index, value.slice(1).toLowerCase()) : []),
    [open, typing, index, value],
  )

  const hint = useMemo(() => {
    if (!value.startsWith('/') || typing) return null
    return index.byKey.get(value.slice(1).split(/\s/)[0].toLowerCase()) ?? null
  }, [value, typing, index])

  useEffect(() => {
    const close = (event) => {
      if (boxRef.current && !boxRef.current.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [])

  const run = (text) => {
    history.push(text)
    onSubmit(text)
  }

  const complete = (command) => {
    setValue(`/${command.name} `)
    setOpen(false)
    setActive(-1)
    inputRef.current?.focus()
  }

  const submit = (event) => {
    event.preventDefault()
    const text = value.trim()
    if (!text || loading) return
    setValue('')
    setOpen(false)
    setActive(-1)
    run(text)
  }

  const onChange = (event) => {
    setValue(event.target.value)
    setOpen(true)
    setActive(-1)
    history.reset()
  }

  const onKeyDown = (event) => {
    const listOpen = matches.length > 0

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (listOpen) {
        setActive((position) => (position + 1) % matches.length)
      } else {
        const next = history.newer()
        if (next !== null) {
          setValue(next)
          setOpen(false)
        }
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      if (listOpen) {
        setActive((position) => (position <= 0 ? matches.length - 1 : position - 1))
      } else {
        const previous = history.older(value)
        if (previous !== null) {
          setValue(previous)
          setOpen(false)
        }
      }
    } else if (event.key === 'Tab' && listOpen) {
      event.preventDefault()
      complete(matches[active >= 0 ? active : 0])
    } else if (event.key === 'Enter' && listOpen && active >= 0) {
      event.preventDefault()
      complete(matches[active])
    } else if (event.key === 'Escape') {
      setOpen(false)
      setActive(-1)
    }
  }

  return (
    <div ref={boxRef} className="w-full">
      <div className="relative">
        <form
          onSubmit={submit}
          className="flex w-full items-center gap-3 rounded-full bg-white py-2 pl-5 pr-2 shadow-md ring-1 ring-slate-200/80 transition focus-within:ring-2 focus-within:ring-blue-500/60 dark:bg-slate-900 dark:ring-slate-800"
        >
          <Search className="h-5 w-5 shrink-0 text-slate-400" />
          <input
            ref={inputRef}
            value={value}
            onChange={onChange}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            role="combobox"
            aria-expanded={matches.length > 0}
            aria-controls={LIST_ID}
            aria-autocomplete="list"
            aria-activedescendant={active >= 0 ? `${LIST_ID}-${active}` : undefined}
            maxLength={500}
            enterKeyHint="send"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="Ask me anything or try /news"
            className="min-w-0 flex-1 bg-transparent text-base placeholder:text-slate-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !value.trim()}
            aria-label="Send"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white transition hover:bg-blue-500 disabled:opacity-50"
          >
            {loading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </button>
        </form>

        {matches.length > 0 && (
          <ul
            id={LIST_ID}
            role="listbox"
            className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl bg-white text-left shadow-lg ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"
          >
            {matches.map((command, position) => (
              <li
                key={command.name}
                id={`${LIST_ID}-${position}`}
                role="option"
                aria-selected={position === active}
              >
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => complete(command)}
                  className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors ${
                    position === active
                      ? 'bg-blue-50 dark:bg-blue-500/10'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <code className="min-w-0 truncate text-sm font-semibold text-blue-600 dark:text-blue-400">
                    {command.usage}
                  </code>
                  <span className="hidden shrink-0 text-xs text-slate-500 sm:block dark:text-slate-400">
                    {command.description}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {hint && (
        <p className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400">
          <code className="font-semibold text-blue-600 dark:text-blue-400">{hint.usage}</code>
          {' · '}
          {hint.description}
        </p>
      )}

      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            disabled={loading}
            onClick={() => run(suggestion)}
            className="rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200 transition hover:bg-white hover:text-blue-600 disabled:opacity-50 dark:bg-slate-900/70 dark:text-slate-300 dark:ring-slate-800"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  )
}