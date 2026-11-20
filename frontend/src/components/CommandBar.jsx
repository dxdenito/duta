import { useState } from 'react'
import { LoaderCircle, Search, Send } from 'lucide-react'

const SUGGESTIONS = ['/news', '/nse', '/wiki Kenya', '/play', '/help']

export default function CommandBar({ onSubmit, loading }) {
  const [value, setValue] = useState('')

  const submit = (event) => {
    event.preventDefault()
    const text = value.trim()
    if (!text || loading) return
    setValue('')
    onSubmit(text)
  }

  return (
    <div className="w-full">
      <form
        onSubmit={submit}
        className="flex w-full items-center gap-3 rounded-full bg-white py-2 pl-5 pr-2 shadow-md ring-1 ring-slate-200/80 transition focus-within:ring-2 focus-within:ring-blue-500/60 dark:bg-slate-900 dark:ring-slate-800"
      >
        <Search className="h-5 w-5 shrink-0 text-slate-400" />
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
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

      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            disabled={loading}
            onClick={() => onSubmit(suggestion)}
            className="rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200 transition hover:bg-white hover:text-blue-600 disabled:opacity-50 dark:bg-slate-900/70 dark:text-slate-300 dark:ring-slate-800"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  )
}