import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { StudioCanvas } from '../components/studio/StudioCanvas'
import { NewDiagramModal } from '../components/studio/NewDiagramModal'

export const Route = createFileRoute('/studio/$diagramId')({
  component: StudioDiagramPage,
})

function StudioDiagramPage() {
  const { diagramId } = Route.useParams()
  const navigate = useNavigate()
  const [showNewModal, setShowNewModal] = useState(false)

  const handleDiagramCreated = (newId: string) => {
    navigate({ to: '/studio/$diagramId', params: { diagramId: newId } })
  }

  return (
    <main className="flex-1 w-full h-[calc(100vh-2.75rem)] min-h-[500px] flex flex-col overflow-hidden bg-[var(--bg-primary)]">
      <StudioCanvas
        diagramId={diagramId}
        onOpenNewDiagram={() => setShowNewModal(true)}
      />

      <NewDiagramModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        onCreated={handleDiagramCreated}
      />
    </main>
  )
}

