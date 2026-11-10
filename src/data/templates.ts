import type { DiagramTemplate } from './templates/types'
import { USE_CASE_TEMPLATES } from './templates/useCaseTemplates'
import { ER_TEMPLATES } from './templates/erTemplates'
import { CLASS_TEMPLATES } from './templates/classTemplates'
import { DFD_TEMPLATES } from './templates/dfdTemplates'

export type { DiagramTemplate }

export const DIAGRAM_TEMPLATES: DiagramTemplate[] = [
  {
    id: 'blank',
    name: 'Blank Canvas',
    description: 'Empty workspace to design your UML diagram from scratch',
    nodes: [],
    edges: [],
  },
  ...USE_CASE_TEMPLATES,
  ...ER_TEMPLATES,
  ...CLASS_TEMPLATES,
  ...DFD_TEMPLATES,
]
