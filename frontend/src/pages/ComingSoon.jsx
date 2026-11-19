export default function ComingSoon({ title, icon: Icon }) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
        <Icon className="h-8 w-8" />
      </span>
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400">Coming soon</p>
    </div>
  )
}