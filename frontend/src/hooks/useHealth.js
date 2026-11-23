import { useEffect, useState } from 'react'

export function useHealth() {
  const [online, setOnline] = useState(null)

  useEffect(() => {
    const controller = new AbortController()
    fetch(`${import.meta.env.VITE_API_URL}/api/health`, {
  signal: controller.signal,
})
      .then((response) => setOnline(response.ok))
      .catch((error) => {
        if (error.name !== 'AbortError') setOnline(false)
      })
    return () => controller.abort()
  }, [])

  return online
}