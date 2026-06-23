import { useEffect, useState } from 'react'

/** Create an object URL for a File and revoke it on unmount / file change. */
export function useObjectUrl(file: File): string | null {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    const u = URL.createObjectURL(file)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncs React state with the externally-created object URL
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [file])
  return url
}
