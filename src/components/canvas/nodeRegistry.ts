import type { EdgeTypes, NodeTypes } from '@xyflow/react'
import { ActorNode } from './nodes/ActorNode'
import { UseCaseNode } from './nodes/UseCaseNode'
import { BoundaryNode } from './nodes/BoundaryNode'
import { NoteNode } from './nodes/NoteNode'
import { ErEntityNode } from './nodes/ErEntityNode'
import { ClassNode } from './nodes/ClassNode'
import {
  DfdProcessNode,
  DfdDataStoreNode,
  DfdExternalEntityNode,
} from './nodes/DfdNodes'
import { UmlEdge } from './edges/UmlEdge'

export const UML_NODE_TYPES: NodeTypes = {
  actor: ActorNode,
  useCase: UseCaseNode,
  boundary: BoundaryNode,
  note: NoteNode,
  erEntity: ErEntityNode,
  umlClass: ClassNode,
  dfdProcess: DfdProcessNode,
  dfdDataStore: DfdDataStoreNode,
  dfdExternalEntity: DfdExternalEntityNode,
}

export const UML_EDGE_TYPES: EdgeTypes = {
  umlEdge: UmlEdge,
}

