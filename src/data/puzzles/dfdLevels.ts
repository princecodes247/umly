import type { LevelDefinition } from '../../types/game'

export const DFD_LEVELS: LevelDefinition[] = [
  {
    id: 'dfd-1-checkout-flow',
    number: 13,
    title: 'Online Order Data Flow',
    diagramType: 'dfd',
    type: 'build',
    difficulty: 'Beginner',
    category: 'Data Flow',
    scenario:
      'A Customer submits an Order Request to the "1.0 Process Order" process. The process writes order records to the "D1 Orders" data store and sends a Confirmation back to the Customer.',
    goal: 'Connect Customer -> 1.0 Process Order, 1.0 Process Order -> D1 Orders, and 1.0 Process Order -> Customer using Data Flow edges.',
    learningObjective:
      'Trace how data moves between External Entities, Processes, and Data Stores in a Level-1 DFD.',
    hints: [
      'Data flows are directional: drag from the sender to the receiver.',
      'External entities (Customer) communicate with processes (1.0 Process Order), not directly with data stores.',
      'Include the return flow from 1.0 Process Order back to Customer.',
    ],
    solutionExplanation:
      'Customer sends the request to 1.0 Process Order, which persists the order in D1 Orders and returns a confirmation to Customer.',
    initialNodes: [
      {
        id: 'dfd-customer',
        type: 'dfdExternalEntity',
        position: { x: 80, y: 170 },
        data: {
          label: 'Customer',
          nodeType: 'dfdExternalEntity',
        },
      },
      {
        id: 'dfd-process',
        type: 'dfdProcess',
        position: { x: 350, y: 160 },
        data: {
          label: 'Process Order',
          nodeType: 'dfdProcess',
          processNumber: '1.0',
        },
      },
      {
        id: 'dfd-store',
        type: 'dfdDataStore',
        position: { x: 630, y: 170 },
        data: {
          label: 'Orders',
          nodeType: 'dfdDataStore',
          dataStoreId: 'D1',
        },
      },
    ],
    solutions: [
      {
        description: 'Standard Request-Store-Response DFD',
        edges: [
          {
            source: 'dfd-customer',
            target: 'dfd-process',
            type: 'data_flow',
            description: 'Customer submits order request',
          },
          {
            source: 'dfd-process',
            target: 'dfd-store',
            type: 'data_flow',
            description: 'Process stores order record',
          },
          {
            source: 'dfd-process',
            target: 'dfd-customer',
            type: 'data_flow',
            description: 'Process sends confirmation to Customer',
          },
        ],
      },
    ],
  },
  {
    id: 'dfd-2-fix-illegal-store-flow',
    number: 14,
    title: 'Fix Illegal Direct Store Flow',
    diagramType: 'dfd',
    type: 'fix',
    difficulty: 'Intermediate',
    category: 'Data Flow',
    scenario:
      'In a valid Data Flow Diagram, an External Entity can never read or write directly to a Data Store without passing through a Process. Fix this broken payroll DFD!',
    goal: 'Remove the illegal Employee -> D1 Timesheets edge and route data properly through "2.0 Record Hours".',
    learningObjective:
      'Enforce the DFD rule that all data transformations and store writes must pass through a Process.',
    hints: [
      'Delete the direct edge between Employee and D1 Timesheets.',
      'Connect Employee -> 2.0 Record Hours, and 2.0 Record Hours -> D1 Timesheets.',
    ],
    solutionExplanation:
      'External Entities cannot access Data Stores directly. Routing Employee -> 2.0 Record Hours -> D1 Timesheets satisfies DFD syntax rules.',
    initialNodes: [
      {
        id: 'dfd-emp',
        type: 'dfdExternalEntity',
        position: { x: 80, y: 180 },
        data: {
          label: 'Employee',
          nodeType: 'dfdExternalEntity',
        },
      },
      {
        id: 'dfd-proc',
        type: 'dfdProcess',
        position: { x: 350, y: 90 },
        data: {
          label: 'Record Hours',
          nodeType: 'dfdProcess',
          processNumber: '2.0',
        },
      },
      {
        id: 'dfd-timesheets',
        type: 'dfdDataStore',
        position: { x: 610, y: 180 },
        data: {
          label: 'Timesheets',
          nodeType: 'dfdDataStore',
          dataStoreId: 'D1',
        },
      },
    ],
    initialEdges: [
      {
        id: 'illegal-direct-flow',
        source: 'dfd-emp',
        target: 'dfd-timesheets',
        data: {
          relationshipType: 'data_flow',
          label: 'Direct Write (Invalid)',
        },
      },
    ],
    solutions: [
      {
        description: 'Valid Process-mediated Data Flow',
        edges: [
          {
            source: 'dfd-emp',
            target: 'dfd-proc',
            type: 'data_flow',
            description: 'Employee submits hours to process',
          },
          {
            source: 'dfd-proc',
            target: 'dfd-timesheets',
            type: 'data_flow',
            description: 'Process saves validated timesheet',
          },
        ],
      },
    ],
  },
]

