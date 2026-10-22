import type { Node, Edge } from '@xyflow/react'

export interface DiagramTemplate {
  id: string
  name: string
  description: string
  nodes: Node[]
  edges: Edge[]
}

export const DIAGRAM_TEMPLATES: DiagramTemplate[] = [
  {
    id: 'blank',
    name: 'Blank Canvas',
    description: 'Empty workspace to design your UML diagram from scratch',
    nodes: [],
    edges: [],
  },
  {
    id: 'atm-banking',
    name: 'ATM Banking System',
    description: 'Classic ATM with customer authentication, cash withdrawal, and receipt printing',
    nodes: [
      {
        id: 'b-atm',
        type: 'boundary',
        position: { x: 200, y: 40 },
        data: {
          nodeType: 'boundary',
          boundaryTitle: 'ATM Banking System',
          label: 'ATM Banking System',
          width: 520,
          height: 480,
        },
        zIndex: -1,
      },
      {
        id: 'actor-customer',
        type: 'actor',
        position: { x: 40, y: 160 },
        data: {
          nodeType: 'actor',
          label: 'Bank Customer',
          actorType: 'primary',
        },
      },
      {
        id: 'actor-vip',
        type: 'actor',
        position: { x: 40, y: 340 },
        data: {
          nodeType: 'actor',
          label: 'VIP Customer',
          actorType: 'primary',
        },
      },
      {
        id: 'actor-core',
        type: 'actor',
        position: { x: 770, y: 220 },
        data: {
          nodeType: 'actor',
          label: 'Core Banking API',
          actorType: 'secondary',
        },
      },
      {
        id: 'uc-withdraw',
        type: 'useCase',
        position: { x: 260, y: 100 },
        data: {
          nodeType: 'useCase',
          label: 'Withdraw Cash',
        },
      },
      {
        id: 'uc-auth',
        type: 'useCase',
        position: { x: 520, y: 100 },
        data: {
          nodeType: 'useCase',
          label: 'Authenticate PIN',
        },
      },
      {
        id: 'uc-balance',
        type: 'useCase',
        position: { x: 260, y: 240 },
        data: {
          nodeType: 'useCase',
          label: 'Check Balance',
        },
      },
      {
        id: 'uc-receipt',
        type: 'useCase',
        position: { x: 260, y: 380 },
        data: {
          nodeType: 'useCase',
          label: 'Print Paper Receipt',
        },
      },
      {
        id: 'note-1',
        type: 'note',
        position: { x: 540, y: 360 },
        data: {
          nodeType: 'note',
          description: 'Extension Condition:\nTriggered only if user selects receipt option and paper is available.',
          label: 'Extension Condition',
        },
      },
    ],
    edges: [
      {
        id: 'e-cust-withdraw',
        source: 'actor-customer',
        target: 'uc-withdraw',
        type: 'umlEdge',
        data: { relationshipType: 'association' },
      },
      {
        id: 'e-cust-balance',
        source: 'actor-customer',
        target: 'uc-balance',
        type: 'umlEdge',
        data: { relationshipType: 'association' },
      },
      {
        id: 'e-vip-generalization',
        source: 'actor-vip',
        target: 'actor-customer',
        type: 'umlEdge',
        data: { relationshipType: 'generalization' },
      },
      {
        id: 'e-withdraw-include-auth',
        source: 'uc-withdraw',
        target: 'uc-auth',
        type: 'umlEdge',
        data: { relationshipType: 'include' },
      },
      {
        id: 'e-balance-include-auth',
        source: 'uc-balance',
        target: 'uc-auth',
        type: 'umlEdge',
        data: { relationshipType: 'include' },
      },
      {
        id: 'e-receipt-extend-withdraw',
        source: 'uc-receipt',
        target: 'uc-withdraw',
        type: 'umlEdge',
        data: {
          relationshipType: 'extend',
          condition: 'if requested',
        },
      },
      {
        id: 'e-auth-core',
        source: 'uc-auth',
        target: 'actor-core',
        type: 'umlEdge',
        data: { relationshipType: 'association' },
      },
    ],
  },
  {
    id: 'ecommerce',
    name: 'E-Commerce Store',
    description: 'Online store with browsing, checkout, payment gateway, and promo discounts',
    nodes: [
      {
        id: 'b-store',
        type: 'boundary',
        position: { x: 220, y: 50 },
        data: {
          nodeType: 'boundary',
          boundaryTitle: 'Online Shopping Portal',
          label: 'Online Shopping Portal',
          width: 500,
          height: 480,
        },
        zIndex: -1,
      },
      {
        id: 'actor-shopper',
        type: 'actor',
        position: { x: 50, y: 160 },
        data: {
          nodeType: 'actor',
          label: 'Shopper',
          actorType: 'primary',
        },
      },
      {
        id: 'actor-stripe',
        type: 'actor',
        position: { x: 770, y: 220 },
        data: {
          nodeType: 'actor',
          label: 'Payment Processor',
          actorType: 'secondary',
        },
      },
      {
        id: 'uc-browse',
        type: 'useCase',
        position: { x: 280, y: 110 },
        data: {
          nodeType: 'useCase',
          label: 'Browse Catalog',
        },
      },
      {
        id: 'uc-checkout',
        type: 'useCase',
        position: { x: 280, y: 240 },
        data: {
          nodeType: 'useCase',
          label: 'Checkout Order',
        },
      },
      {
        id: 'uc-payment',
        type: 'useCase',
        position: { x: 510, y: 240 },
        data: {
          nodeType: 'useCase',
          label: 'Process Credit Card',
        },
      },
      {
        id: 'uc-discount',
        type: 'useCase',
        position: { x: 280, y: 390 },
        data: {
          nodeType: 'useCase',
          label: 'Apply Coupon Code',
        },
      },
    ],
    edges: [
      {
        id: 'e-shopper-browse',
        source: 'actor-shopper',
        target: 'uc-browse',
        type: 'umlEdge',
        data: { relationshipType: 'association' },
      },
      {
        id: 'e-shopper-checkout',
        source: 'actor-shopper',
        target: 'uc-checkout',
        type: 'umlEdge',
        data: { relationshipType: 'association' },
      },
      {
        id: 'e-checkout-include-payment',
        source: 'uc-checkout',
        target: 'uc-payment',
        type: 'umlEdge',
        data: { relationshipType: 'include' },
      },
      {
        id: 'e-discount-extend-checkout',
        source: 'uc-discount',
        target: 'uc-checkout',
        type: 'umlEdge',
        data: {
          relationshipType: 'extend',
          condition: 'valid coupon',
        },
      },
      {
        id: 'e-payment-stripe',
        source: 'uc-payment',
        target: 'actor-stripe',
        type: 'umlEdge',
        data: { relationshipType: 'association' },
      },
    ],
  },
  {
    id: 'clinic',
    name: 'Healthcare Clinic',
    description: 'Patient appointment booking, doctor consultations, and health insurance verification',
    nodes: [
      {
        id: 'b-clinic',
        type: 'boundary',
        position: { x: 220, y: 50 },
        data: {
          nodeType: 'boundary',
          boundaryTitle: 'Clinical Management System',
          label: 'Clinical Management System',
          width: 520,
          height: 440,
        },
        zIndex: -1,
      },
      {
        id: 'actor-patient',
        type: 'actor',
        position: { x: 50, y: 120 },
        data: {
          nodeType: 'actor',
          label: 'Patient',
          actorType: 'primary',
        },
      },
      {
        id: 'actor-doctor',
        type: 'actor',
        position: { x: 50, y: 300 },
        data: {
          nodeType: 'actor',
          label: 'Doctor',
          actorType: 'primary',
        },
      },
      {
        id: 'actor-insurance',
        type: 'actor',
        position: { x: 780, y: 160 },
        data: {
          nodeType: 'actor',
          label: 'Insurance Provider',
          actorType: 'secondary',
        },
      },
      {
        id: 'uc-book',
        type: 'useCase',
        position: { x: 280, y: 100 },
        data: {
          nodeType: 'useCase',
          label: 'Book Appointment',
        },
      },
      {
        id: 'uc-verify-insurance',
        type: 'useCase',
        position: { x: 520, y: 100 },
        data: {
          nodeType: 'useCase',
          label: 'Verify Insurance Coverage',
        },
      },
      {
        id: 'uc-consult',
        type: 'useCase',
        position: { x: 280, y: 240 },
        data: {
          nodeType: 'useCase',
          label: 'Conduct Consultation',
        },
      },
      {
        id: 'uc-prescribe',
        type: 'useCase',
        position: { x: 280, y: 360 },
        data: {
          nodeType: 'useCase',
          label: 'Prescribe Medication',
        },
      },
    ],
    edges: [
      {
        id: 'e-patient-book',
        source: 'actor-patient',
        target: 'uc-book',
        type: 'umlEdge',
        data: { relationshipType: 'association' },
      },
      {
        id: 'e-book-insurance',
        source: 'uc-book',
        target: 'uc-verify-insurance',
        type: 'umlEdge',
        data: { relationshipType: 'include' },
      },
      {
        id: 'e-insurance-actor',
        source: 'uc-verify-insurance',
        target: 'actor-insurance',
        type: 'umlEdge',
        data: { relationshipType: 'association' },
      },
      {
        id: 'e-doctor-consult',
        source: 'actor-doctor',
        target: 'uc-consult',
        type: 'umlEdge',
        data: { relationshipType: 'association' },
      },
      {
        id: 'e-doctor-prescribe',
        source: 'actor-doctor',
        target: 'uc-prescribe',
        type: 'umlEdge',
        data: { relationshipType: 'association' },
      },
    ],
  },
]

