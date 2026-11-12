import type { LevelDefinition } from '../../types/game'

export const ER_LEVELS: LevelDefinition[] = [
  {
    id: 'er-1-ecommerce-orders',
    number: 9,
    title: 'E-Commerce Order Relationships',
    diagramType: 'er',
    type: 'build',
    difficulty: 'Beginner',
    category: 'Entity-Relationship',
    scenario:
      'An online store tracks Customers, Orders, and Products. A Customer can place multiple Orders, and each Order contains one or more OrderItems referencing a Product.',
    goal: 'Connect Customer -> Order, Order -> OrderItem, and Product -> OrderItem using ER relationship edges.',
    learningObjective:
      'Model core one-to-many and associative table relationships in an Entity-Relationship diagram.',
    hints: [
      'A Customer places Orders, so connect Customer to Order.',
      'OrderItem is the junction entity between Order and Product.',
      'Use the ER Relationship tool to connect Order -> OrderItem and Product -> OrderItem.',
    ],
    solutionExplanation:
      'Customer connects to Order (1:N), Order connects to OrderItem (1:N), and Product connects to OrderItem (1:N) to resolve the many-to-many relationship between Orders and Products.',
    initialNodes: [
      {
        id: 'ent-customer',
        type: 'erEntity',
        position: { x: 80, y: 120 },
        data: {
          label: 'Customer',
          nodeType: 'erEntity',
          attributes: [
            { id: 'c1', name: 'customer_id', dataType: 'UUID', isPrimaryKey: true },
            { id: 'c2', name: 'email', dataType: 'VARCHAR', isUnique: true },
            { id: 'c3', name: 'full_name', dataType: 'VARCHAR' },
          ],
        },
      },
      {
        id: 'ent-order',
        type: 'erEntity',
        position: { x: 380, y: 120 },
        data: {
          label: 'Order',
          nodeType: 'erEntity',
          attributes: [
            { id: 'o1', name: 'order_id', dataType: 'UUID', isPrimaryKey: true },
            { id: 'o2', name: 'customer_id', dataType: 'UUID', isForeignKey: true },
            { id: 'o3', name: 'created_at', dataType: 'TIMESTAMP' },
          ],
        },
      },
      {
        id: 'ent-order-item',
        type: 'erEntity',
        position: { x: 380, y: 340 },
        data: {
          label: 'OrderItem',
          nodeType: 'erEntity',
          isWeakEntity: true,
          attributes: [
            { id: 'oi1', name: 'order_id', dataType: 'UUID', isPrimaryKey: true, isForeignKey: true },
            { id: 'oi2', name: 'product_id', dataType: 'UUID', isPrimaryKey: true, isForeignKey: true },
            { id: 'oi3', name: 'quantity', dataType: 'INT' },
          ],
        },
      },
      {
        id: 'ent-product',
        type: 'erEntity',
        position: { x: 80, y: 340 },
        data: {
          label: 'Product',
          nodeType: 'erEntity',
          attributes: [
            { id: 'p1', name: 'product_id', dataType: 'UUID', isPrimaryKey: true },
            { id: 'p2', name: 'sku', dataType: 'VARCHAR', isUnique: true },
            { id: 'p3', name: 'price_cents', dataType: 'INT' },
          ],
        },
      },
    ],
    solutions: [
      {
        description: 'Standard e-commerce junction schema',
        edges: [
          {
            source: 'ent-customer',
            target: 'ent-order',
            type: 'er',
            bidirectional: true,
            description: 'Customer places Orders',
          },
          {
            source: 'ent-order',
            target: 'ent-order-item',
            type: 'er',
            bidirectional: true,
            description: 'Order contains OrderItems',
          },
          {
            source: 'ent-product',
            target: 'ent-order-item',
            type: 'er',
            bidirectional: true,
            description: 'Product is referenced by OrderItems',
          },
        ],
      },
    ],
  },
  {
    id: 'er-2-university-enrollment',
    number: 10,
    title: 'University Course & Department Schema',
    diagramType: 'er',
    type: 'fix',
    difficulty: 'Intermediate',
    category: 'Entity-Relationship',
    scenario:
      'A university schema has a broken link: Department is mistakenly connected directly to Enrollment instead of Course, and Student is missing its link to Enrollment.',
    goal: 'Remove the incorrect Department -> Enrollment edge and connect Department -> Course and Student -> Enrollment.',
    learningObjective:
      'Normalize ER relationships so associative entities connect the entities whose keys they reference.',
    hints: [
      'Click the edge between Department and Enrollment and delete it.',
      'A Department offers Courses, so connect Department to Course.',
      'A Student enrolls via Enrollment, so connect Student to Enrollment.',
    ],
    solutionExplanation:
      'Department offers Course, and Enrollment is the associative entity linking Student and Course.',
    initialNodes: [
      {
        id: 'ent-dept',
        type: 'erEntity',
        position: { x: 80, y: 110 },
        data: {
          label: 'Department',
          nodeType: 'erEntity',
          attributes: [
            { id: 'd1', name: 'dept_id', dataType: 'INT', isPrimaryKey: true },
            { id: 'd2', name: 'name', dataType: 'VARCHAR' },
          ],
        },
      },
      {
        id: 'ent-course',
        type: 'erEntity',
        position: { x: 390, y: 110 },
        data: {
          label: 'Course',
          nodeType: 'erEntity',
          attributes: [
            { id: 'c1', name: 'course_id', dataType: 'INT', isPrimaryKey: true },
            { id: 'c2', name: 'dept_id', dataType: 'INT', isForeignKey: true },
            { id: 'c3', name: 'title', dataType: 'VARCHAR' },
          ],
        },
      },
      {
        id: 'ent-enrollment',
        type: 'erEntity',
        position: { x: 390, y: 320 },
        data: {
          label: 'Enrollment',
          nodeType: 'erEntity',
          isWeakEntity: true,
          attributes: [
            { id: 'e1', name: 'student_id', dataType: 'INT', isPrimaryKey: true, isForeignKey: true },
            { id: 'e2', name: 'course_id', dataType: 'INT', isPrimaryKey: true, isForeignKey: true },
            { id: 'e3', name: 'grade', dataType: 'CHAR' },
          ],
        },
      },
      {
        id: 'ent-student',
        type: 'erEntity',
        position: { x: 80, y: 320 },
        data: {
          label: 'Student',
          nodeType: 'erEntity',
          attributes: [
            { id: 's1', name: 'student_id', dataType: 'INT', isPrimaryKey: true },
            { id: 's2', name: 'full_name', dataType: 'VARCHAR' },
          ],
        },
      },
    ],
    initialEdges: [
      {
        id: 'bad-edge-dept-enroll',
        source: 'ent-dept',
        target: 'ent-enrollment',
        data: {
          relationshipType: 'er',
          erSourceCardinality: 'one',
          erTargetCardinality: 'many',
        },
      },
      {
        id: 'good-edge-course-enroll',
        source: 'ent-course',
        target: 'ent-enrollment',
        data: {
          relationshipType: 'er',
          erSourceCardinality: 'one',
          erTargetCardinality: 'many',
        },
      },
    ],
    solutions: [
      {
        description: 'Normalized University Schema',
        edges: [
          {
            source: 'ent-dept',
            target: 'ent-course',
            type: 'er',
            bidirectional: true,
            description: 'Department offers Courses',
          },
          {
            source: 'ent-course',
            target: 'ent-enrollment',
            type: 'er',
            bidirectional: true,
            description: 'Course has Enrollments',
          },
          {
            source: 'ent-student',
            target: 'ent-enrollment',
            type: 'er',
            bidirectional: true,
            description: 'Student has Enrollments',
          },
        ],
      },
    ],
  },
]

