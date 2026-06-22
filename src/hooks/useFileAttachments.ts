import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'

export const MAX_FILES = 10
export const MAX_FILE_BYTES = 10 * 1024 * 1024

const ACCEPT = {
  'image/*': [],
  'application/pdf': [],
  'application/msword': [],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [],
}

export function useFileAttachments() {
  const [files, setFiles] = useState<File[]>([])

  const addFiles = useCallback((incoming: File[]) => {
    setFiles((prev) => {
      const names = new Set(prev.map((f) => f.name))
      const next = [...prev]
      const rejected: string[] = []
      for (const file of incoming) {
        if (names.has(file.name)) continue
        if (file.size > MAX_FILE_BYTES) { rejected.push(`${file.name} (quá lớn)`); continue }
        if (next.length >= MAX_FILES) { rejected.push(`${file.name} (vượt giới hạn ${MAX_FILES} tệp)`); continue }
        next.push(file)
        names.add(file.name)
      }
      if (rejected.length) console.warn('Đã bỏ qua tệp đính kèm:', rejected.join(', '))
      return next
    })
  }, [])

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const clear = useCallback(() => setFiles([]), [])

  const { getRootProps, getInputProps, open } = useDropzone({
    onDrop: addFiles,
    noClick: true,
    noKeyboard: true,
    accept: ACCEPT,
  })

  return { files, getRootProps, getInputProps, open, addFiles, removeFile, clear }
}
