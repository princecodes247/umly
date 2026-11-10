import type { DiagramTemplate } from './types'

export const DFD_TEMPLATES: DiagramTemplate[] = [
  {
    id: 'order-processing-dfd',
    name: 'Order Processing DFD',
    description: 'Level-1 Data Flow Diagram with Customer, Processes, Data Stores, and Warehouse',
    diagramType: 'dfd',
    nodes: [
      {
        id: 'dfd-ext-customer',
        type: 'dfdExternalEntity',
        position: { x: 60, y: 180 },
        data: {
          nodeType: 'dfdExternalEntity',
          label: 'Customer',
        },
      },
      {
        id: 'dfd-proc-validate',
        type: 'dfdProcess',
        position: { x: 300, y: 172 },
        data: {
          nodeType: 'dfdProcess',
          processNumber: '1.0',
          label: 'Validate Order',
        },
      },
      {
        id: 'dfd-proc-payment',
        type: 'dfdProcess',
        position: { x: 560, y: 90 },
        data: {
          nodeType: 'dfdProcess',
          processNumber: '2.0',
          label: 'Process Payment',
        },
      },
      {
        id: 'dfd-proc-fulfill',
        type: 'dfdProcess',
        position: { x: 560, y: 260 },
        data: {
          nodeType: 'dfdProcess',
          processNumber: '3.0',
          label: 'Fulfill Order',
        },
      },
      {
        id: 'dfd-store-orders',
        type: 'dfdDataStore',
        position: { x: 290, y: 340 },
        data: {
          nodeType: 'dfdDataStore',
          dataStoreId: 'D1',
          label: 'Orders',
        },
      },
      {
        id: 'dfd-store-inventory',
        type: 'dfdDataStore',
        position: { x: 550, y: 410 },
        data: {
          nodeType: 'dfdDataStore',
          dataStoreId: 'D2',
          label: 'Inventory',
        },
      },
      {
        id: 'dfd-ext-warehouse',
        type: 'dfdExternalEntity',
        position: { x: 820, y: 268 },
        data: {
          nodeType: 'dfdExternalEntity',
          label: 'Warehouse',
        },
      },
    ],
    edges: [
      {
        id: 'e-cust-validate',
        source: 'dfd-ext-customer',
        target: 'dfd-proc-validate',
        type: 'umlEdge',
        data: {
          relationshipType: 'data_flow',
          label: 'Order Request',
          routingStyle: 'bezier',
          curveOffset: -28,
        },
      },
      {
        id: 'e-validate-cust',
        source: 'dfd-proc-validate',
        target: 'dfd-ext-customer',
        type: 'umlEdge',
        data: {
          relationshipType: 'data_flow',
          label: 'Confirmation',
          routingStyle: 'bezier',
          curveOffset: 28,
        },
      },
      {
        id: 'e-validate-payment',
        source: 'dfd-proc-validate',
        target: 'dfd-proc-payment',
        type: 'umlEdge',
        data: {
          relationshipType: 'data_flow',
          label: 'Payment Details',
        },
      },
      {
        id: 'e-validate-orders',
        source: 'dfd-proc-validate',
        target: 'dfd-store-orders',
        type: 'umlEdge',
        data: {
          relationshipType: 'data_flow',
          label: 'New Order',
        },
      },
      {
        id: 'e-payment-fulfill',
        source: 'dfd-proc-payment',
        target: 'dfd-proc-fulfill',
        type: 'umlEdge',
        data: {
          relationshipType: 'data_flow',
          label: 'Payment Receipt',
        },
      },
      {
        id: 'e-fulfill-inventory',
        source: 'dfd-proc-fulfill',
        target: 'dfd-store-inventory',
        type: 'umlEdge',
        data: {
          relationshipType: 'data_flow',
          label: 'Stock Update',
        },
      },
      {
        id: 'e-fulfill-warehouse',
        source: 'dfd-proc-fulfill',
        target: 'dfd-ext-warehouse',
        type: 'umlEdge',
        data: {
          relationshipType: 'data_flow',
          label: 'Packing Slip',
        },
      },
    ],
  },
  {
    id: 'auth-session-dfd',
    name: 'User Authentication DFD',
    description: 'Login, credential verification, session issuance, and audit logging flows',
    diagramType: 'dfd',
    nodes: [
      {
        id: 'dfd-auth-user',
        type: 'dfdExternalEntity',
        position: { x: 60, y: 170 },
        data: {
          nodeType: 'dfdExternalEntity',
          label: 'End User',
        },
      },
      {
        id: 'dfd-auth-verify',
        type: 'dfdProcess',
        position: { x: 320, y: 162 },
        data: {
          nodeType: 'dfdProcess',
          processNumber: '1.0',
          label: 'Verify Credentials',
        },
      },
      {
        id: 'dfd-auth-token',
        type: 'dfdProcess',
        position: { x: 600, y: 162 },
        data: {
          nodeType: 'dfdProcess',
          processNumber: '2.0',
          label: 'Issue Session Token',
        },
      },
      {
        id: 'dfd-auth-users-db',
        type: 'dfdDataStore',
        position: { x: 308, y: 330 },
        data: {
          nodeType: 'dfdDataStore',
          dataStoreId: 'D1',
          label: 'Users',
        },
      },
      {
        id: 'dfd-auth-sessions-db',
        type: 'dfdDataStore',
        position: { x: 588, y: 330 },
        data: {
          nodeType: 'dfdDataStore',
          dataStoreId: 'D2',
          label: 'Sessions',
        },
      },
    ],
    edges: [
      {
        id: 'e-user-verify',
        source: 'dfd-auth-user',
        target: 'dfd-auth-verify',
        type: 'umlEdge',
        data: {
          relationshipType: 'data_flow',
          label: 'Credentials',
        },
      },
      {
        id: 'e-users-verify',
        source: 'dfd-auth-users-db',
        target: 'dfd-auth-verify',
        type: 'umlEdge',
        data: {
          relationshipType: 'data_flow',
          label: 'Password Hash',
        },
      },
      {
        id: 'e-verify-token',
        source: 'dfd-auth-verify',
        target: 'dfd-auth-token',
        type: 'umlEdge',
        data: {
          relationshipType: 'data_flow',
          label: 'User Identity',
        },
      },
      {
        id: 'e-token-sessions',
        source: 'dfd-auth-token',
        target: 'dfd-auth-sessions-db',
        type: 'umlEdge',
        data: {
          relationshipType: 'data_flow',
          label: 'Session Record',
        },
      },
      {
        id: 'e-token-user',
        source: 'dfd-auth-token',
        target: 'dfd-auth-user',
        type: 'umlEdge',
        data: {
          relationshipType: 'data_flow',
          label: 'JWT Cookie',
          routingStyle: 'bezier',
          curveOffset: -90,
        },
      },
    ],
  },
  {
    id: 'atm-transaction-dfd',
    name: 'ATM Withdrawal DFD',
    description: 'Cardholder PIN check, account balance lookup, and cash dispensing flow',
    diagramType: 'dfd',
    nodes: [
      {
        id: 'dfd-atm-cardholder',
        type: 'dfdExternalEntity',
        position: { x: 60, y: 170 },
        data: {
          nodeType: 'dfdExternalEntity',
          label: 'Cardholder',
        },
      },
      {
        id: 'dfd-atm-pin',
        type: 'dfdProcess',
        position: { x: 310, y: 162 },
        data: {
          nodeType: 'dfdProcess',
          processNumber: '1.0',
          label: 'Authenticate PIN',
        },
      },
      {
        id: 'dfd-atm-dispense',
        type: 'dfdProcess',
        position: { x: 580, y: 162 },
        data: {
          nodeType: 'dfdProcess',
          processNumber: '2.0',
          label: 'Dispense Cash',
        },
      },
      {
        id: 'dfd-atm-accounts',
        type: 'dfdDataStore',
        position: { x: 430, y: 330 },
        data: {
          nodeType: 'dfdDataStore',
          dataStoreId: 'D1',
          label: 'Bank Accounts',
        },
      },
      {
        id: 'dfd-atm-ledger',
        type: 'dfdDataStore',
        position: { x: 700, y: 330 },
        data: {
          nodeType: 'dfdDataStore',
          dataStoreId: 'D2',
          label: 'Transaction Log',
        },
      },
    ],
    edges: [
      {
        id: 'e-card-pin',
        source: 'dfd-atm-cardholder',
        target: 'dfd-atm-pin',
        type: 'umlEdge',
        data: {
          relationshipType: 'data_flow',
          label: 'Card & PIN',
        },
      },
      {
        id: 'e-acc-pin',
        source: 'dfd-atm-accounts',
        target: 'dfd-atm-pin',
        type: 'umlEdge',
        data: {
          relationshipType: 'data_flow',
          label: 'Account Status',
        },
      },
      {
        id: 'e-pin-dispense',
        source: 'dfd-atm-pin',
        target: 'dfd-atm-dispense',
        type: 'umlEdge',
        data: {
          relationshipType: 'data_flow',
          label: 'Auth Approval',
        },
      },
      {
        id: 'e-dispense-acc',
        source: 'dfd-atm-dispense',
        target: 'dfd-atm-accounts',
        type: 'umlEdge',
        data: {
          relationshipType: 'data_flow',
          label: 'Debit Amount',
        },
      },
      {
        id: 'e-dispense-ledger',
        source: 'dfd-atm-dispense',
        target: 'dfd-atm-ledger',
        type: 'umlEdge',
        data: {
          relationshipType: 'data_flow',
          label: 'Audit Entry',
        },
      },
    ],
  },
]

