import StocksView from '../components/StocksView.jsx'

export default function Stocks() {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col px-4 pb-8 pt-2">
      <div className="mb-5">
        <h1 className="text-3xl font-extrabold tracking-tight">Stocks</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
           NSE news and where to check prices
        </p>
      </div>
      <StocksView />
    </div>
  )
}