import { createFileRoute } from '@tanstack/react-router'
import { StudioCanvas } from '../components/studio/StudioCanvas'

export const Route = createFileRoute('/')({
  component: StudioPage,
})

function StudioPage() {
  return (
    <main className="flex-1 w-full h-[calc(100vh-2.75rem)] min-h-[500px] flex flex-col overflow-hidden bg-[var(--bg-primary)]">
      <StudioCanvas />
    </main>
  )
}
