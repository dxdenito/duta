export default function Logo({ className = 'h-10 w-10' }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
      <circle cx="32" cy="7" r="3.5" fill="#3b82f6" />
      <rect x="30.5" y="9" width="3" height="7" rx="1.5" fill="#6366f1" />
      <rect x="5" y="26" width="6" height="14" rx="3" fill="#6366f1" />
      <rect x="53" y="26" width="6" height="14" rx="3" fill="#6366f1" />
      <rect x="9" y="15" width="46" height="40" rx="17" fill="#4f46e5" />
      <rect x="14" y="21" width="36" height="28" rx="12" fill="#0f172a" />
      <path d="M22 33c1.5-3 5-3 6.5 0" stroke="#e0f2fe" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M35.5 33c1.5-3 5-3 6.5 0" stroke="#e0f2fe" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M27 40c3 3 7 3 10 0" stroke="#e0f2fe" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}