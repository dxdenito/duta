import { useCallback, useEffect, useState } from 'react'

const KEY = 'duta-theme'

export function useTheme() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    try {
      localStorage.setItem(KEY, dark ? 'dark' : 'light')
    } catch {}
  }, [dark])

  const toggle = useCallback(() => setDark((value) => !value), [])

  return { dark, toggle }
}