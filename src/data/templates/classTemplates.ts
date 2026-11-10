import type { DiagramTemplate } from './types'

export const CLASS_TEMPLATES: DiagramTemplate[] = [
  {
    id: 'ecommerce-class-model',
    name: 'E-Commerce Class Model',
    description: 'Domain model with Users, Orders, OrderItems, Products, and Payment interface',
    diagramType: 'class',
    nodes: [
      {
        id: 'cls-user',
        type: 'umlClass',
        position: { x: 80, y: 80 },
        data: {
          nodeType: 'umlClass',
          label: 'User',
          classKind: 'class',
          classAttributes: [
            { id: 'u-a1', visibility: '-', name: 'id', type: 'UUID' },
            { id: 'u-a2', visibility: '-', name: 'email', type: 'string' },
            { id: 'u-a3', visibility: '+', name: 'name', type: 'string' },
          ],
          classMethods: [
            { id: 'u-m1', visibility: '+', name: 'register', params: '', returnType: 'void' },
            { id: 'u-m2', visibility: '+', name: 'placeOrder', params: 'cart: Cart', returnType: 'Order' },
          ],
        },
      },
      {
        id: 'cls-order',
        type: 'umlClass',
        position: { x: 400, y: 80 },
        data: {
          nodeType: 'umlClass',
          label: 'Order',
          classKind: 'class',
          classAttributes: [
            { id: 'o-a1', visibility: '-', name: 'id', type: 'UUID' },
            { id: 'o-a2', visibility: '-', name: 'createdAt', type: 'Date' },
            { id: 'o-a3', visibility: '+', name: 'status', type: 'OrderStatus' },
          ],
          classMethods: [
            { id: 'o-m1', visibility: '+', name: 'calculateTotal', params: '', returnType: 'number' },
            { id: 'o-m2', visibility: '+', name: 'cancel', params: '', returnType: 'void' },
          ],
        },
      },
      {
        id: 'cls-item',
        type: 'umlClass',
        position: { x: 720, y: 80 },
        data: {
          nodeType: 'umlClass',
          label: 'OrderItem',
          classKind: 'class',
          classAttributes: [
            { id: 'oi-a1', visibility: '-', name: 'quantity', type: 'number' },
            { id: 'oi-a2', visibility: '-', name: 'unitPrice', type: 'number' },
          ],
          classMethods: [
            { id: 'oi-m1', visibility: '+', name: 'getSubtotal', params: '', returnType: 'number' },
          ],
        },
      },
      {
        id: 'cls-product',
        type: 'umlClass',
        position: { x: 720, y: 310 },
        data: {
          nodeType: 'umlClass',
          label: 'Product',
          classKind: 'class',
          classAttributes: [
            { id: 'p-a1', visibility: '-', name: 'sku', type: 'string' },
            { id: 'p-a2', visibility: '+', name: 'title', type: 'string' },
            { id: 'p-a3', visibility: '+', name: 'price', type: 'number' },
          ],
          classMethods: [
            { id: 'p-m1', visibility: '+', name: 'inStock', params: 'qty: number', returnType: 'boolean' },
          ],
        },
      },
      {
        id: 'cls-payable',
        type: 'umlClass',
        position: { x: 80, y: 310 },
        data: {
          nodeType: 'umlClass',
          label: 'Payable',
          classKind: 'interface',
          classAttributes: [],
          classMethods: [
            { id: 'pay-m1', visibility: '+', name: 'charge', params: 'amount: number', returnType: 'boolean' },
          ],
        },
      },
      {
        id: 'cls-card-payment',
        type: 'umlClass',
        position: { x: 400, y: 310 },
        data: {
          nodeType: 'umlClass',
          label: 'CardPayment',
          classKind: 'class',
          classAttributes: [
            { id: 'cp-a1', visibility: '-', name: 'last4', type: 'string' },
          ],
          classMethods: [
            { id: 'cp-m1', visibility: '+', name: 'charge', params: 'amount: number', returnType: 'boolean' },
          ],
        },
      },
    ],
    edges: [
      {
        id: 'e-user-order',
        source: 'cls-user',
        target: 'cls-order',
        type: 'umlEdge',
        data: {
          relationshipType: 'association',
          label: 'places',
          sourceMultiplicity: '1',
          targetMultiplicity: '0..*',
        },
      },
      {
        id: 'e-order-item',
        source: 'cls-order',
        target: 'cls-item',
        type: 'umlEdge',
        data: {
          relationshipType: 'composition',
          label: 'contains',
          sourceMultiplicity: '1',
          targetMultiplicity: '1..*',
        },
      },
      {
        id: 'e-item-product',
        source: 'cls-item',
        target: 'cls-product',
        type: 'umlEdge',
        data: {
          relationshipType: 'association',
          label: 'references',
          sourceMultiplicity: '*',
          targetMultiplicity: '1',
        },
      },
      {
        id: 'e-card-payable',
        source: 'cls-card-payment',
        target: 'cls-payable',
        type: 'umlEdge',
        data: {
          relationshipType: 'realization',
        },
      },
      {
        id: 'e-order-card',
        source: 'cls-order',
        target: 'cls-card-payment',
        type: 'umlEdge',
        data: {
          relationshipType: 'dependency',
          label: 'uses',
        },
      },
    ],
  },
  {
    id: 'auth-rbac-class-model',
    name: 'Auth & RBAC Model',
    description: 'Users, Roles, Permissions, and AuthProvider inheritance hierarchy',
    diagramType: 'class',
    nodes: [
      {
        id: 'cls-auth-provider',
        type: 'umlClass',
        position: { x: 80, y: 80 },
        data: {
          nodeType: 'umlClass',
          label: 'AuthProvider',
          classKind: 'abstract',
          accentColor: 'purple',
          classAttributes: [
            { id: 'ap-a1', visibility: '#', name: 'issuer', type: 'string' },
          ],
          classMethods: [
            { id: 'ap-m1', visibility: '+', name: 'authenticate', params: 'token: string', returnType: 'Account' },
          ],
        },
      },
      {
        id: 'cls-oauth',
        type: 'umlClass',
        position: { x: 80, y: 290 },
        data: {
          nodeType: 'umlClass',
          label: 'OAuthProvider',
          classKind: 'class',
          classAttributes: [
            { id: 'oa-a1', visibility: '-', name: 'clientId', type: 'string' },
          ],
          classMethods: [
            { id: 'oa-m1', visibility: '+', name: 'authenticate', params: 'token: string', returnType: 'Account' },
          ],
        },
      },
      {
        id: 'cls-account',
        type: 'umlClass',
        position: { x: 400, y: 80 },
        data: {
          nodeType: 'umlClass',
          label: 'Account',
          classKind: 'class',
          accentColor: 'blue',
          classAttributes: [
            { id: 'ac-a1', visibility: '-', name: 'id', type: 'UUID' },
            { id: 'ac-a2', visibility: '+', name: 'email', type: 'string' },
          ],
          classMethods: [
            { id: 'ac-m1', visibility: '+', name: 'hasRole', params: 'name: string', returnType: 'boolean' },
          ],
        },
      },
      {
        id: 'cls-role',
        type: 'umlClass',
        position: { x: 400, y: 290 },
        data: {
          nodeType: 'umlClass',
          label: 'Role',
          classKind: 'class',
          accentColor: 'green',
          classAttributes: [
            { id: 'rl-a1', visibility: '+', name: 'name', type: 'string' },
          ],
          classMethods: [
            { id: 'rl-m1', visibility: '+', name: 'grant', params: 'perm: Permission', returnType: 'void' },
          ],
        },
      },
      {
        id: 'cls-permission',
        type: 'umlClass',
        position: { x: 700, y: 290 },
        data: {
          nodeType: 'umlClass',
          label: 'Permission',
          classKind: 'enum',
          classAttributes: [
            { id: 'pm-a1', visibility: '+', name: 'READ', type: '' },
            { id: 'pm-a2', visibility: '+', name: 'WRITE', type: '' },
            { id: 'pm-a3', visibility: '+', name: 'ADMIN', type: '' },
          ],
          classMethods: [],
        },
      },
    ],
    edges: [
      {
        id: 'e-oauth-provider',
        source: 'cls-oauth',
        target: 'cls-auth-provider',
        type: 'umlEdge',
        data: { relationshipType: 'generalization' },
      },
      {
        id: 'e-provider-account',
        source: 'cls-auth-provider',
        target: 'cls-account',
        type: 'umlEdge',
        data: { relationshipType: 'dependency', label: 'verifies' },
      },
      {
        id: 'e-account-role',
        source: 'cls-account',
        target: 'cls-role',
        type: 'umlEdge',
        data: {
          relationshipType: 'aggregation',
          label: 'assigned',
          sourceMultiplicity: '*',
          targetMultiplicity: '1..*',
        },
      },
      {
        id: 'e-role-perm',
        source: 'cls-role',
        target: 'cls-permission',
        type: 'umlEdge',
        data: {
          relationshipType: 'association',
          label: 'grants',
          sourceMultiplicity: '1..*',
          targetMultiplicity: '1..*',
        },
      },
    ],
  },
  {
    id: 'library-class-model',
    name: 'Library Management Model',
    description: 'Catalog Items, Books, Members, and Loans with inheritance and composition',
    diagramType: 'class',
    nodes: [
      {
        id: 'cls-member',
        type: 'umlClass',
        position: { x: 80, y: 100 },
        data: {
          nodeType: 'umlClass',
          label: 'Member',
          classKind: 'class',
          accentColor: 'blue',
          classAttributes: [
            { id: 'mb-a1', visibility: '-', name: 'memberId', type: 'string' },
            { id: 'mb-a2', visibility: '+', name: 'name', type: 'string' },
          ],
          classMethods: [
            { id: 'mb-m1', visibility: '+', name: 'borrow', params: 'item: CatalogItem', returnType: 'Loan' },
          ],
        },
      },
      {
        id: 'cls-loan',
        type: 'umlClass',
        position: { x: 400, y: 100 },
        data: {
          nodeType: 'umlClass',
          label: 'Loan',
          classKind: 'class',
          accentColor: 'amber',
          classAttributes: [
            { id: 'ln-a1', visibility: '-', name: 'dueDate', type: 'Date' },
            { id: 'ln-a2', visibility: '+', name: 'returned', type: 'boolean' },
          ],
          classMethods: [
            { id: 'ln-m1', visibility: '+', name: 'isOverdue', params: '', returnType: 'boolean' },
          ],
        },
      },
      {
        id: 'cls-catalog-item',
        type: 'umlClass',
        position: { x: 720, y: 100 },
        data: {
          nodeType: 'umlClass',
          label: 'CatalogItem',
          classKind: 'abstract',
          classAttributes: [
            { id: 'ci-a1', visibility: '#', name: 'isbn', type: 'string' },
            { id: 'ci-a2', visibility: '+', name: 'title', type: 'string' },
          ],
          classMethods: [
            { id: 'ci-m1', visibility: '+', name: 'isAvailable', params: '', returnType: 'boolean' },
          ],
        },
      },
      {
        id: 'cls-book',
        type: 'umlClass',
        position: { x: 720, y: 310 },
        data: {
          nodeType: 'umlClass',
          label: 'Book',
          classKind: 'class',
          classAttributes: [
            { id: 'bk-a1', visibility: '-', name: 'author', type: 'string' },
            { id: 'bk-a2', visibility: '-', name: 'pages', type: 'number' },
          ],
          classMethods: [],
        },
      },
    ],
    edges: [
      {
        id: 'e-member-loan',
        source: 'cls-member',
        target: 'cls-loan',
        type: 'umlEdge',
        data: {
          relationshipType: 'association',
          label: 'borrows',
          sourceMultiplicity: '1',
          targetMultiplicity: '0..*',
        },
      },
      {
        id: 'e-loan-item',
        source: 'cls-loan',
        target: 'cls-catalog-item',
        type: 'umlEdge',
        data: {
          relationshipType: 'association',
          label: 'tracks',
          sourceMultiplicity: '0..1',
          targetMultiplicity: '1',
        },
      },
      {
        id: 'e-book-item',
        source: 'cls-book',
        target: 'cls-catalog-item',
        type: 'umlEdge',
        data: { relationshipType: 'generalization' },
      },
    ],
  },
]

