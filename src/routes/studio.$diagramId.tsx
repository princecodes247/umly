import { createFileRoute } from '@tanstack/react-router'
import { StudioCanvas } from '../components/studio/StudioCanvas'

export const Route = createFileRoute('/studio/$diagramId')({
  component: StudioDiagramPage,
})

function StudioDiagramPage() {
  const { diagramId } = Route.useParams()

  return (
    <main className="flex-1 w-full h-screen min-h-[500px] flex flex-col overflow-hidden bg-[var(--bg-primary)]">
      <StudioCanvas diagramId={diagramId} />
    </main>
  )
}

