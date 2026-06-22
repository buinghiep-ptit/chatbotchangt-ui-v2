import { useEffect, useState } from 'react'

/** Create an object URL for a File and revoke it on unmount / file change. */
export function useObjectUrl(file: File): string | null {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    const u = URL.createObjectURL(file)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [file])
  return url
}
