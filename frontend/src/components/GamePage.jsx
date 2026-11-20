import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function GamePage({ title, children }) {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col px-4 pb-8 pt-2">
      <Link
        to="/games"
        className="mb-4 inline-flex w-fit items-center gap-1 text-sm font-medium text-slate-500 transition hover:text-blue-600 dark:text-slate-400"
      >
        <ArrowLeft className="h-4 w-4" />
        Games
      </Link>
      <h1 className="mb-5 text-3xl font-extrabold tracking-tight">{title}</h1>
      {children}
    </div>
  )
}