import { Toaster as SonnerToaster } from 'sonner'

export function Toaster() {
  return (
    <SonnerToaster
      theme="dark"
      position="bottom-right"
      toastOptions={{
        className: 'bg-bg-secondary border border-border text-text-primary',
        descriptionClassName: 'text-text-secondary',
      }}
    />
  )
}
