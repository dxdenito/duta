import { useEffect, useState } from 'react'

export function useHealth() {
  const [online, setOnline] = useState(null)

  useEffect(() => {
    const controller = new AbortController()
    const url = `${import.meta.env.VITE_API_URL}/api/health`

    console.log('Health check URL:', url)

    fetch(url, { signal: controller.signal })
      .then(async (response) => {
        console.log('Health response:', response.status, response.url)
        setOnline(response.ok)
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          console.error('Health check failed:', error)
          setOnline(false)
        }
      })

    return () => controller.abort()
  }, [])

  return online
}