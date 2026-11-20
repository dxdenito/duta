export default function CategoryPills({ items, value, onChange, disabled }) {
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onChange(item.id)}
          disabled={disabled}
          className={`rounded-full px-3.5 py-1.5 text-sm font-medium ring-1 transition disabled:opacity-60 ${
            value === item.id
              ? 'bg-blue-600 text-white ring-blue-600'
              : 'bg-white/80 text-slate-700 ring-slate-200 hover:text-blue-600 dark:bg-slate-900/70 dark:text-slate-200 dark:ring-slate-800'
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}