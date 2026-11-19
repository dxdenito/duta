import NewsView from '../components/NewsView.jsx'

export default function News() {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col px-4 pb-4 pt-2">
      <div className="mb-5">
        <h1 className="text-3xl font-extrabold tracking-tight">News</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Kenya first, then the world</p>
      </div>
      <NewsView />
    </div>
  )
}