import type { LevelDefinition } from '../../types/game'

export const CLASS_LEVELS: LevelDefinition[] = [
  {
    id: 'class-1-payment-strategy',
    number: 11,
    title: 'Payment Gateway Interface',
    diagramType: 'class',
    type: 'build',
    difficulty: 'Beginner',
    category: 'Class Architecture',
    scenario:
      'A checkout service processes payments through a PaymentProcessor interface. StripeGateway and PayPalGateway both implement PaymentProcessor, while CheckoutService depends on PaymentProcessor.',
    goal: 'Connect StripeGateway and PayPalGateway to PaymentProcessor with Realization, and CheckoutService to PaymentProcessor with Dependency.',
    learningObjective:
      'Distinguish Realization (implementing an interface) from Dependency (using an interface).',
    hints: [
      'Realization arrows point from the concrete class (StripeGateway / PayPalGateway) to the interface (PaymentProcessor).',
      'Dependency arrows point from the consumer (CheckoutService) to the interface it uses (PaymentProcessor).',
    ],
    solutionExplanation:
      'Both StripeGateway and PayPalGateway realize PaymentProcessor, allowing CheckoutService to depend only on the PaymentProcessor abstraction.',
    initialNodes: [
      {
        id: 'cls-interface',
        type: 'umlClass',
        position: { x: 320, y: 70 },
        data: {
          label: 'PaymentProcessor',
          nodeType: 'umlClass',
          classKind: 'interface',
          classMethods: [
            { id: 'm1', visibility: '+', name: 'charge', params: 'amount: number', returnType: 'boolean' },
          ],
        },
      },
      {
        id: 'cls-stripe',
        type: 'umlClass',
        position: { x: 110, y: 280 },
        data: {
          label: 'StripeGateway',
          nodeType: 'umlClass',
          classKind: 'class',
          classMethods: [
            { id: 'm2', visibility: '+', name: 'charge', params: 'amount: number', returnType: 'boolean' },
          ],
        },
      },
      {
        id: 'cls-paypal',
        type: 'umlClass',
        position: { x: 350, y: 280 },
        data: {
          label: 'PayPalGateway',
          nodeType: 'umlClass',
          classKind: 'class',
          classMethods: [
            { id: 'm3', visibility: '+', name: 'charge', params: 'amount: number', returnType: 'boolean' },
          ],
        },
      },
      {
        id: 'cls-checkout',
        type: 'umlClass',
        position: { x: 600, y: 70 },
        data: {
          label: 'CheckoutService',
          nodeType: 'umlClass',
          classKind: 'class',
          classMethods: [
            { id: 'm4', visibility: '+', name: 'completeOrder', params: 'orderId: string', returnType: 'void' },
          ],
        },
      },
    ],
    solutions: [
      {
        description: 'Strategy pattern with Realization and Dependency',
        edges: [
          {
            source: 'cls-stripe',
            target: 'cls-interface',
            type: 'realization',
            description: 'StripeGateway implements PaymentProcessor',
          },
          {
            source: 'cls-paypal',
            target: 'cls-interface',
            type: 'realization',
            description: 'PayPalGateway implements PaymentProcessor',
          },
          {
            source: 'cls-checkout',
            target: 'cls-interface',
            type: 'dependency',
            description: 'CheckoutService depends on PaymentProcessor',
          },
        ],
      },
    ],
  },
  {
    id: 'class-2-composition-vs-inheritance',
    number: 12,
    title: 'Document Composition & Inheritance',
    diagramType: 'class',
    type: 'classify',
    difficulty: 'Intermediate',
    category: 'Class Architecture',
    scenario:
      'In a rich-text editor, a Document strictly owns its Page objects (pages cannot exist without the document). Meanwhile, TextBlock and ImageBlock are specialized types of Block.',
    goal: 'Connect Document to Page using Composition, and connect TextBlock and ImageBlock to Block using Generalization.',
    learningObjective:
      'Use Composition for strong lifecycle ownership and Generalization for is-a inheritance.',
    hints: [
      'Composition goes from the whole (Document) to the part (Page) or check the diamond side.',
      'Generalization arrows point from the subclass (TextBlock, ImageBlock) up to the base class (Block).',
    ],
    solutionExplanation:
      'Document owns Page via Composition, while TextBlock and ImageBlock inherit from Block via Generalization.',
    initialNodes: [
      {
        id: 'cls-doc',
        type: 'umlClass',
        position: { x: 80, y: 90 },
        data: {
          label: 'Document',
          nodeType: 'umlClass',
          classKind: 'class',
          classAttributes: [{ id: 'a1', visibility: '-', name: 'title', type: 'string' }],
        },
      },
      {
        id: 'cls-page',
        type: 'umlClass',
        position: { x: 80, y: 290 },
        data: {
          label: 'Page',
          nodeType: 'umlClass',
          classKind: 'class',
          classAttributes: [{ id: 'a2', visibility: '-', name: 'pageNumber', type: 'number' }],
        },
      },
      {
        id: 'cls-block',
        type: 'umlClass',
        position: { x: 420, y: 90 },
        data: {
          label: 'Block',
          nodeType: 'umlClass',
          classKind: 'abstract',
          classMethods: [{ id: 'm1', visibility: '+', name: 'render', returnType: 'void', isAbstract: true }],
        },
      },
      {
        id: 'cls-text',
        type: 'umlClass',
        position: { x: 320, y: 290 },
        data: {
          label: 'TextBlock',
          nodeType: 'umlClass',
          classKind: 'class',
          classAttributes: [{ id: 'a3', visibility: '-', name: 'text', type: 'string' }],
        },
      },
      {
        id: 'cls-image',
        type: 'umlClass',
        position: { x: 540, y: 290 },
        data: {
          label: 'ImageBlock',
          nodeType: 'umlClass',
          classKind: 'class',
          classAttributes: [{ id: 'a4', visibility: '-', name: 'src', type: 'string' }],
        },
      },
    ],
    solutions: [
      {
        description: 'Composition + Generalization',
        edges: [
          {
            source: 'cls-doc',
            target: 'cls-page',
            type: 'composition',
            description: 'Document owns Page',
          },
          {
            source: 'cls-text',
            target: 'cls-block',
            type: 'generalization',
            description: 'TextBlock extends Block',
          },
          {
            source: 'cls-image',
            target: 'cls-block',
            type: 'generalization',
            description: 'ImageBlock extends Block',
          },
        ],
      },
    ],
  },
]

