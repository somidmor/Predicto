/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string
  readonly VITE_FIREBASE_AUTH_DOMAIN: string
  readonly VITE_FIREBASE_PROJECT_ID: string
  readonly VITE_FIREBASE_STORAGE_BUCKET: string
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string
  readonly VITE_FIREBASE_APP_ID: string
  readonly VITE_FIREBASE_DATABASE_URL: string
  readonly VITE_USE_EMULATORS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module 'canvas-confetti' {
  interface Options {
    particleCount?: number
    spread?: number
    origin?: { x?: number; y?: number }
    colors?: string[]
    angle?: number
    startVelocity?: number
    decay?: number
    gravity?: number
    drift?: number
    ticks?: number
    shapes?: string[]
    scalar?: number
    zIndex?: number
    disableForReducedMotion?: boolean
  }

  function confetti(options?: Options): Promise<void>
  export default confetti
}

