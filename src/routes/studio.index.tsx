import { createFileRoute, redirect } from '@tanstack/react-router'
import { getLastActiveDiagramId } from '../lib/diagramStorage'

export const Route = createFileRoute('/studio/')({
  beforeLoad: () => {
    const activeId = getLastActiveDiagramId()
    throw redirect({
      to: '/studio/$diagramId',
      params: { diagramId: activeId },
    })
  },
})

