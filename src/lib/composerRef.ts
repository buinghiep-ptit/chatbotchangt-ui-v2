/** Module-level ref to the active Composer textarea.
 *  Registered on mount so callers can call .focus() synchronously
 *  inside a user gesture handler (required on mobile browsers). */
export const composerRef = { current: null as HTMLTextAreaElement | null }
