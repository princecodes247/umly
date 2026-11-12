import type { LevelDefinition } from '../../types/game'

export const USE_CASE_LEVELS: LevelDefinition[] = [
  {
    id: 'level-1-coffee',
    number: 1,
    title: 'First Steps: Smart Coffee Kiosk',
    type: 'build',
    difficulty: 'Beginner',
    category: 'Foundations',
    scenario:
      'A smart coffee shop has a digital self-service kiosk. A Customer interacts with the kiosk to Order Coffee. A Barista in the back interacts with the system to Prepare Drink. Both use cases reside inside the Coffee Kiosk system boundary.',
    goal: 'Connect the Customer to "Order Coffee", and the Barista to "Prepare Drink" using standard UML Associations.',
    learningObjective:
      'Understand Actors (outside the boundary), Use Cases (inside the boundary), and Associations (solid lines representing direct interaction).',
    hints: [
      'Actors represent external roles (human or system) interacting with use cases.',
      'Connect the Customer actor to the "Order Coffee" use case using an Association.',
      'Connect the Barista actor to the "Prepare Drink" use case using an Association.',
    ],
    solutionExplanation:
      'In UML use case diagrams, actors interact with use cases using simple solid lines called Associations. Use cases live inside the system boundary, while actors remain outside.',
    initialNodes: [
      {
        id: 'boundary-1',
        type: 'boundary',
        position: { x: 220, y: 40 },
        data: {
          label: 'System Boundary',
          nodeType: 'boundary',
          boundaryTitle: 'Smart Coffee Kiosk System',
          width: 380,
          height: 380,
        },
      },
      {
        id: 'actor-customer',
        type: 'actor',
        position: { x: 50, y: 120 },
        data: {
          label: 'Customer',
          nodeType: 'actor',
          actorType: 'primary',
          description: 'Places beverage orders',
        },
      },
      {
        id: 'actor-barista',
        type: 'actor',
        position: { x: 650, y: 220 },
        data: {
          label: 'Barista',
          nodeType: 'actor',
          actorType: 'secondary',
          description: 'Fulfills orders in the kitchen',
        },
      },
      {
        id: 'uc-order-coffee',
        type: 'useCase',
        position: { x: 310, y: 110 },
        data: {
          label: 'Order Coffee',
          nodeType: 'useCase',
          description: 'Customer chooses drink and submits order',
        },
      },
      {
        id: 'uc-prepare-drink',
        type: 'useCase',
        position: { x: 310, y: 250 },
        data: {
          label: 'Prepare Drink',
          nodeType: 'useCase',
          description: 'Barista brews and packages beverage',
        },
      },
    ],
    solutions: [
      {
        description: 'Direct associations from actors to their respective use cases',
        edges: [
          {
            source: 'actor-customer',
            target: 'uc-order-coffee',
            type: 'association',
            bidirectional: true,
            description: 'Customer orders coffee',
          },
          {
            source: 'actor-barista',
            target: 'uc-prepare-drink',
            type: 'association',
            bidirectional: true,
            description: 'Barista prepares drink',
          },
        ],
      },
    ],
  },
  {
    id: 'level-2-atm-include',
    number: 2,
    title: 'ATM Cash Withdrawal & Mandatory PIN',
    type: 'build',
    difficulty: 'Beginner',
    category: '«include» Relationships',
    scenario:
      'At an ATM, a Bank Customer wants to "Withdraw Cash". However, the bank security protocol strictly requires that every cash withdrawal MUST verify the user’s PIN ("Verify PIN") as an inseparable, mandatory sub-flow.',
    goal: 'Create an Association from Bank Customer to "Withdraw Cash", and an «include» relationship from "Withdraw Cash" to "Verify PIN".',
    learningObjective:
      'Learn the «include» relationship. It represents mandatory behavior extracted into a common use case. The dashed arrow ALWAYS points from the base use case TO the included use case.',
    hints: [
      'The Bank Customer initiates "Withdraw Cash", so draw an Association between them.',
      'Is PIN verification mandatory for cash withdrawal? Yes! Use «include».',
      'The arrow for «include» points from the base ("Withdraw Cash") toward the included case ("Verify PIN").',
    ],
    solutionExplanation:
      'The «include» relationship is used when a base use case unconditionally delegates to or requires another use case. The arrow points from the base use case to the included one, labeled «include».',
    initialNodes: [
      {
        id: 'boundary-atm',
        type: 'boundary',
        position: { x: 220, y: 40 },
        data: {
          label: 'System Boundary',
          nodeType: 'boundary',
          boundaryTitle: 'ATM Banking Terminal',
          width: 440,
          height: 380,
        },
      },
      {
        id: 'actor-customer',
        type: 'actor',
        position: { x: 50, y: 150 },
        data: {
          label: 'Bank Customer',
          nodeType: 'actor',
          actorType: 'primary',
        },
      },
      {
        id: 'uc-withdraw',
        type: 'useCase',
        position: { x: 290, y: 100 },
        data: {
          label: 'Withdraw Cash',
          nodeType: 'useCase',
        },
      },
      {
        id: 'uc-verify-pin',
        type: 'useCase',
        position: { x: 440, y: 240 },
        data: {
          label: 'Verify PIN',
          nodeType: 'useCase',
        },
      },
    ],
    solutions: [
      {
        description: 'Customer associates with Withdraw Cash, which includes Verify PIN',
        edges: [
          {
            source: 'actor-customer',
            target: 'uc-withdraw',
            type: 'association',
            bidirectional: true,
          },
          {
            source: 'uc-withdraw',
            target: 'uc-verify-pin',
            type: 'include',
            description: 'Mandatory PIN check',
          },
        ],
      },
    ],
  },
  {
    id: 'level-3-classify-relationships',
    number: 3,
    title: 'Classify: Include vs. Extend Dilemma',
    type: 'classify',
    difficulty: 'Intermediate',
    category: 'Relationship Semantics',
    scenario:
      'In an online store checkout system:\n1. Every shopper who performs "Checkout" MUST have their inventory deducted via "Update Inventory" (mandatory).\n2. During "Checkout", shoppers CAN OPTIONALLY choose to "Apply Discount Coupon" if they happen to have a coupon code (optional/conditional enhancement).',
    goal: 'Classify and connect the relationships between Checkout and its two related use cases using either «include» or «extend» in the correct directions.',
    learningObjective:
      'Distinguish between «include» (mandatory sub-flow, points base -> included) and «extend» (optional conditional flow, points extension -> base).',
    hints: [
      '"Update Inventory" happens every single time. That is an «include»!',
      '«include» points from Checkout -> Update Inventory.',
      '"Apply Discount Coupon" is optional. That is an «extend»!',
      'CRITICAL: «extend» points FROM the optional extension ("Apply Discount Coupon") BACK TO the base ("Checkout")!',
    ],
    solutionExplanation:
      'Remember the golden rule of UML: Base «include» points to Mandatory. Optional «extend» points BACK to Base.',
    initialNodes: [
      {
        id: 'boundary-shop',
        type: 'boundary',
        position: { x: 180, y: 40 },
        data: {
          label: 'System Boundary',
          nodeType: 'boundary',
          boundaryTitle: 'E-Commerce Core',
          width: 500,
          height: 380,
        },
      },
      {
        id: 'uc-checkout',
        type: 'useCase',
        position: { x: 240, y: 170 },
        data: {
          label: 'Checkout',
          nodeType: 'useCase',
        },
      },
      {
        id: 'uc-update-inventory',
        type: 'useCase',
        position: { x: 470, y: 90 },
        data: {
          label: 'Update Inventory',
          nodeType: 'useCase',
        },
      },
      {
        id: 'uc-apply-coupon',
        type: 'useCase',
        position: { x: 470, y: 260 },
        data: {
          label: 'Apply Discount Coupon',
          nodeType: 'useCase',
        },
      },
    ],
    solutions: [
      {
        description: 'Checkout includes Update Inventory; Apply Discount Coupon extends Checkout',
        edges: [
          {
            source: 'uc-checkout',
            target: 'uc-update-inventory',
            type: 'include',
            description: 'Mandatory inventory decrement',
          },
          {
            source: 'uc-apply-coupon',
            target: 'uc-checkout',
            type: 'extend',
            description: 'Optional coupon application points back to Checkout',
          },
        ],
      },
    ],
  },
  {
    id: 'level-4-fix-bookstore',
    number: 4,
    title: 'Fix: The Glitched Online Bookstore',
    type: 'fix',
    difficulty: 'Intermediate',
    category: 'Diagram Debugging',
    scenario:
      'An inexperienced intern drafted this Use Case diagram for a Bookstore system. A Customer searches books and checks out. "Process Payment" is mandatory for Checkout, and "Gift Wrap" is an optional add-on during Checkout. But the intern made 3 glaring UML mistakes! Find and correct them.',
    goal: '1. Remove the invalid «include» between Customer and "Search Catalog" (Actors must use Associations!).\n2. Fix the reversed «extend» arrow between Checkout and Gift Wrap.\n3. Make sure Process Payment is an «include» from Checkout.',
    learningObjective:
      'Identify and repair common UML anti-patterns: actors cannot have «include»/«extend» edges, and «extend» arrows must point to the base use case.',
    hints: [
      'Actors can NEVER have «include» or «extend» relationships directly with Use Cases. That must be a plain Association!',
      'Process Payment is required when checking out: it must be «include» from Checkout to Process Payment.',
      '«extend» must point FROM the extension ("Gift Wrap") TO the base ("Checkout").',
    ],
    solutionExplanation:
      'Actors communicate via Associations. «include» and «extend» only connect Use Cases to other Use Cases. Furthermore, the extension arrow points toward the base use case.',
    initialNodes: [
      {
        id: 'boundary-bookstore',
        type: 'boundary',
        position: { x: 220, y: 40 },
        data: {
          label: 'System Boundary',
          nodeType: 'boundary',
          boundaryTitle: 'Online Bookstore',
          width: 480,
          height: 420,
        },
      },
      {
        id: 'actor-customer',
        type: 'actor',
        position: { x: 40, y: 160 },
        data: {
          label: 'Customer',
          nodeType: 'actor',
        },
      },
      {
        id: 'uc-search',
        type: 'useCase',
        position: { x: 280, y: 80 },
        data: {
          label: 'Search Catalog',
          nodeType: 'useCase',
        },
      },
      {
        id: 'uc-checkout',
        type: 'useCase',
        position: { x: 280, y: 220 },
        data: {
          label: 'Checkout',
          nodeType: 'useCase',
        },
      },
      {
        id: 'uc-payment',
        type: 'useCase',
        position: { x: 500, y: 150 },
        data: {
          label: 'Process Payment',
          nodeType: 'useCase',
        },
      },
      {
        id: 'uc-giftwrap',
        type: 'useCase',
        position: { x: 500, y: 310 },
        data: {
          label: 'Gift Wrap Items',
          nodeType: 'useCase',
        },
      },
    ],
    initialEdges: [
      // Bug 1: Customer connected with «include» instead of Association
      {
        id: 'edge-bug-1',
        source: 'actor-customer',
        target: 'uc-search',
        data: { relationshipType: 'include' },
      },
      // Valid edge
      {
        id: 'edge-valid-1',
        source: 'actor-customer',
        target: 'uc-checkout',
        data: { relationshipType: 'association' },
      },
      // Bug 2: Checkout to Payment is labeled 'extend' instead of 'include'
      {
        id: 'edge-bug-2',
        source: 'uc-checkout',
        target: 'uc-payment',
        data: { relationshipType: 'extend' },
      },
      // Bug 3: Reversed extend (Checkout -> Giftwrap instead of Giftwrap -> Checkout)
      {
        id: 'edge-bug-3',
        source: 'uc-checkout',
        target: 'uc-giftwrap',
        data: { relationshipType: 'extend' },
      },
    ],
    solutions: [
      {
        description: 'Repaired bookstore diagram',
        edges: [
          {
            source: 'actor-customer',
            target: 'uc-search',
            type: 'association',
            bidirectional: true,
          },
          {
            source: 'actor-customer',
            target: 'uc-checkout',
            type: 'association',
            bidirectional: true,
          },
          {
            source: 'uc-checkout',
            target: 'uc-payment',
            type: 'include',
            description: 'Payment is mandatory for checkout',
          },
          {
            source: 'uc-giftwrap',
            target: 'uc-checkout',
            type: 'extend',
            description: 'Gift wrap optionally extends checkout',
          },
        ],
      },
    ],
  },
  {
    id: 'level-5-hospital-generalization',
    number: 5,
    title: 'Specialization: Hospital Medical Staff',
    type: 'build',
    difficulty: 'Intermediate',
    category: 'Generalization',
    scenario:
      'In a hospital system, a generic Doctor can "View Patient Records". A Cardiologist is a specialized type of Doctor who inherits all capabilities of a Doctor, and additionally can "Perform Heart Angioplasty".',
    goal: 'Create an Actor Generalization from Cardiologist to Doctor, and connect the appropriate actors to their specific use cases with Associations.',
    learningObjective:
      'Model Generalization (inheritance). Generalization has an open triangle arrow pointing from the child/specialized entity to the parent/general entity.',
    hints: [
      'Cardiologist is a specialized Doctor. Draw a Generalization edge pointing FROM Cardiologist TO Doctor.',
      'Doctor interacts with "View Patient Records" via Association.',
      'Cardiologist interacts with "Perform Heart Angioplasty" via Association.',
    ],
    solutionExplanation:
      'Actor Generalization signifies that the child actor can perform everything the parent actor can, plus their own specialized use cases. The arrow has a hollow triangular head pointing toward the general parent.',
    initialNodes: [
      {
        id: 'boundary-hospital',
        type: 'boundary',
        position: { x: 260, y: 40 },
        data: {
          label: 'System Boundary',
          nodeType: 'boundary',
          boundaryTitle: 'Hospital Clinical EHR',
          width: 420,
          height: 380,
        },
      },
      {
        id: 'actor-doctor',
        type: 'actor',
        position: { x: 60, y: 100 },
        data: {
          label: 'Doctor',
          nodeType: 'actor',
        },
      },
      {
        id: 'actor-cardiologist',
        type: 'actor',
        position: { x: 60, y: 260 },
        data: {
          label: 'Cardiologist',
          nodeType: 'actor',
        },
      },
      {
        id: 'uc-view-records',
        type: 'useCase',
        position: { x: 350, y: 100 },
        data: {
          label: 'View Patient Records',
          nodeType: 'useCase',
        },
      },
      {
        id: 'uc-angioplasty',
        type: 'useCase',
        position: { x: 350, y: 250 },
        data: {
          label: 'Perform Heart Angioplasty',
          nodeType: 'useCase',
        },
      },
    ],
    solutions: [
      {
        description: 'Cardiologist generalizes Doctor; both connected to their use cases',
        edges: [
          {
            source: 'actor-cardiologist',
            target: 'actor-doctor',
            type: 'generalization',
            description: 'Cardiologist is a specialized Doctor',
          },
          {
            source: 'actor-doctor',
            target: 'uc-view-records',
            type: 'association',
            bidirectional: true,
          },
          {
            source: 'actor-cardiologist',
            target: 'uc-angioplasty',
            type: 'association',
            bidirectional: true,
          },
        ],
      },
    ],
  },
  {
    id: 'level-6-ride-sharing',
    number: 6,
    title: 'Ride-Sharing: The Complete Lifecycle',
    type: 'build',
    difficulty: 'Advanced',
    category: 'Comprehensive',
    scenario:
      'In a ride-hailing app, a Passenger triggers "Request Ride". As an unavoidable requirement, "Request Ride" MUST «include» "Calculate Fare". After completing the trip, the Passenger can OPTIONALLY "Tip Driver" as an «extend» to the trip completion ("Complete Ride"). The Driver receives and executes "Complete Ride".',
    goal: 'Construct the diagram with Associations from Passenger to Request Ride, Driver to Complete Ride, include from Request Ride to Calculate Fare, and extend from Tip Driver to Complete Ride.',
    learningObjective:
      'Combine multiple actors, multiple use cases, «include», and «extend» in a real-world multi-sided platform scenario.',
    hints: [
      'Passenger connects to "Request Ride" via Association.',
      '"Request Ride" includes "Calculate Fare" (arrow points -> Calculate Fare).',
      'Driver connects to "Complete Ride" via Association.',
      '"Tip Driver" optionally extends "Complete Ride" (arrow points from Tip Driver -> Complete Ride).',
    ],
    solutionExplanation:
      'Complex systems combine both include and extend seamlessly. Notice how secondary actors (Driver) anchor downstream fulfillment use cases.',
    initialNodes: [
      {
        id: 'boundary-rides',
        type: 'boundary',
        position: { x: 200, y: 40 },
        data: {
          label: 'System Boundary',
          nodeType: 'boundary',
          boundaryTitle: 'UrbanMove Dispatch System',
          width: 480,
          height: 420,
        },
      },
      {
        id: 'actor-passenger',
        type: 'actor',
        position: { x: 40, y: 120 },
        data: {
          label: 'Passenger',
          nodeType: 'actor',
        },
      },
      {
        id: 'actor-driver',
        type: 'actor',
        position: { x: 710, y: 240 },
        data: {
          label: 'Driver',
          nodeType: 'actor',
          actorType: 'secondary',
        },
      },
      {
        id: 'uc-request-ride',
        type: 'useCase',
        position: { x: 260, y: 90 },
        data: {
          label: 'Request Ride',
          nodeType: 'useCase',
        },
      },
      {
        id: 'uc-calculate-fare',
        type: 'useCase',
        position: { x: 480, y: 90 },
        data: {
          label: 'Calculate Fare',
          nodeType: 'useCase',
        },
      },
      {
        id: 'uc-complete-ride',
        type: 'useCase',
        position: { x: 480, y: 240 },
        data: {
          label: 'Complete Ride',
          nodeType: 'useCase',
        },
      },
      {
        id: 'uc-tip-driver',
        type: 'useCase',
        position: { x: 260, y: 310 },
        data: {
          label: 'Tip Driver',
          nodeType: 'useCase',
        },
      },
    ],
    solutions: [
      {
        description: 'UrbanMove ride sharing use case diagram',
        edges: [
          {
            source: 'actor-passenger',
            target: 'uc-request-ride',
            type: 'association',
            bidirectional: true,
          },
          {
            source: 'uc-request-ride',
            target: 'uc-calculate-fare',
            type: 'include',
            description: 'Fare calculation is mandatory',
          },
          {
            source: 'actor-driver',
            target: 'uc-complete-ride',
            type: 'association',
            bidirectional: true,
          },
          {
            source: 'uc-tip-driver',
            target: 'uc-complete-ride',
            type: 'extend',
            description: 'Tipping optionally extends ride completion',
          },
        ],
      },
    ],
  },
  {
    id: 'level-7-fix-streaming-service',
    number: 7,
    title: 'Fix: Music Streaming App Chaos',
    type: 'fix',
    difficulty: 'Advanced',
    category: 'Diagram Debugging',
    scenario:
      'A streaming platform has a Subscriber actor. "Stream Song" requires "Authenticate User" (mandatory). When streaming a song, a subscriber can optionally "Download for Offline Play". However, the edges are totally scrambled! Clean up the incorrect relationship types and directions.',
    goal: '1. Replace the invalid generalization between Subscriber and Stream Song with an Association.\n2. Change the relationship to Authenticate User to «include».\n3. Orient «extend» properly from Download for Offline Play to Stream Song.',
    learningObjective:
      'Master error detection in dense diagrams and reinforce that actors do not generalize use cases.',
    hints: [
      'Actors can NEVER have a Generalization to a Use Case. Subscriber must have an Association to "Stream Song".',
      'Authentication is mandatory: it should be «include» from Stream Song to Authenticate User.',
      'Offline download is an optional extension: «extend» points from Download for Offline Play to Stream Song.',
    ],
    solutionExplanation:
      'Generalization only exists between elements of the same kind (Actor to Actor, or Use Case to Use Case). Actors communicate with Use Cases solely through Associations.',
    initialNodes: [
      {
        id: 'boundary-streaming',
        type: 'boundary',
        position: { x: 220, y: 40 },
        data: {
          label: 'System Boundary',
          nodeType: 'boundary',
          boundaryTitle: 'BeatPulse Streaming Service',
          width: 480,
          height: 380,
        },
      },
      {
        id: 'actor-subscriber',
        type: 'actor',
        position: { x: 50, y: 160 },
        data: {
          label: 'Subscriber',
          nodeType: 'actor',
        },
      },
      {
        id: 'uc-stream',
        type: 'useCase',
        position: { x: 280, y: 150 },
        data: {
          label: 'Stream Song',
          nodeType: 'useCase',
        },
      },
      {
        id: 'uc-auth',
        type: 'useCase',
        position: { x: 500, y: 80 },
        data: {
          label: 'Authenticate User',
          nodeType: 'useCase',
        },
      },
      {
        id: 'uc-download',
        type: 'useCase',
        position: { x: 500, y: 260 },
        data: {
          label: 'Download Offline',
          nodeType: 'useCase',
        },
      },
    ],
    initialEdges: [
      // Bug 1: Subscriber -> Stream Song is Generalization instead of Association!
      {
        id: 'edge-err-1',
        source: 'actor-subscriber',
        target: 'uc-stream',
        data: { relationshipType: 'generalization' },
      },
      // Bug 2: Stream Song -> Auth is Extend instead of Include!
      {
        id: 'edge-err-2',
        source: 'uc-stream',
        target: 'uc-auth',
        data: { relationshipType: 'extend' },
      },
      // Bug 3: Stream -> Download is Include instead of Download -> Stream Extend!
      {
        id: 'edge-err-3',
        source: 'uc-stream',
        target: 'uc-download',
        data: { relationshipType: 'include' },
      },
    ],
    solutions: [
      {
        description: 'Fixed streaming diagram',
        edges: [
          {
            source: 'actor-subscriber',
            target: 'uc-stream',
            type: 'association',
            bidirectional: true,
          },
          {
            source: 'uc-stream',
            target: 'uc-auth',
            type: 'include',
            description: 'Authentication is required to stream',
          },
          {
            source: 'uc-download',
            target: 'uc-stream',
            type: 'extend',
            description: 'Offline download optionally extends streaming',
          },
        ],
      },
    ],
  },
  {
    id: 'level-8-classify-payment-generalization',
    number: 8,
    title: 'Classify: Use Case Generalization',
    type: 'classify',
    difficulty: 'Intermediate',
    category: 'Generalization',
    scenario:
      'A Customer can execute "Pay for Order". In modern systems, this can be fulfilled in several specific ways: "Pay via Credit Card" or "Pay via PayPal". Each specific payment type is a specialization of the generic "Pay for Order" use case.',
    goal: 'Classify the relationship between the specific payment methods and the generic payment use case using Use Case Generalization.',
    learningObjective:
      'Learn Use Case Generalization. Just like actors, use cases can specialize other use cases. The arrow points from the specific child use case to the abstract parent use case.',
    hints: [
      'Customer connects to the general "Pay for Order" via Association.',
      'Pay via Credit Card is a specialized form of Pay for Order. Draw Generalization pointing to "Pay for Order".',
      'Pay via PayPal is also a specialized form. Draw Generalization pointing to "Pay for Order".',
    ],
    solutionExplanation:
      'Use Case Generalization means the child use case inherits the behavior and meaning of the parent use case, providing a concrete implementation.',
    initialNodes: [
      {
        id: 'boundary-pay',
        type: 'boundary',
        position: { x: 220, y: 40 },
        data: {
          label: 'System Boundary',
          nodeType: 'boundary',
          boundaryTitle: 'Payment Gateway',
          width: 480,
          height: 380,
        },
      },
      {
        id: 'actor-shopper',
        type: 'actor',
        position: { x: 50, y: 160 },
        data: {
          label: 'Customer',
          nodeType: 'actor',
        },
      },
      {
        id: 'uc-pay-general',
        type: 'useCase',
        position: { x: 270, y: 150 },
        data: {
          label: 'Pay for Order',
          nodeType: 'useCase',
        },
      },
      {
        id: 'uc-pay-card',
        type: 'useCase',
        position: { x: 500, y: 90 },
        data: {
          label: 'Pay via Credit Card',
          nodeType: 'useCase',
        },
      },
      {
        id: 'uc-pay-paypal',
        type: 'useCase',
        position: { x: 500, y: 240 },
        data: {
          label: 'Pay via PayPal',
          nodeType: 'useCase',
        },
      },
    ],
    solutions: [
      {
        description: 'Customer associates with Pay for Order; subcases generalize it',
        edges: [
          {
            source: 'actor-shopper',
            target: 'uc-pay-general',
            type: 'association',
            bidirectional: true,
          },
          {
            source: 'uc-pay-card',
            target: 'uc-pay-general',
            type: 'generalization',
            description: 'Credit Card specializes Payment',
          },
          {
            source: 'uc-pay-paypal',
            target: 'uc-pay-general',
            type: 'generalization',
            description: 'PayPal specializes Payment',
          },
        ],
      },
    ],
  },
  {
    id: 'level-9-palette-library',
    number: 9,
    title: 'Build: University Library Management',
    type: 'build',
    difficulty: 'Advanced',
    category: 'Freeform Modeling',
    scenario:
      'Design a University Library system with two actors: Student (primary) and Librarian (secondary staff). Students "Borrow Book". Borrowing a book unconditionally «includes» "Check Student Fine Balance". If the student returns a book late during "Return Book", they are optionally triggered to "Pay Overdue Fine" via «extend».',
    goal: 'Build the entire relationship structure using the canvas tools: connect Student, Librarian, Borrow Book, Return Book, Check Fine Balance, and Pay Overdue Fine.',
    learningObjective:
      'Synthesize multiple interconnected use cases with dual actors and distinct include/extend pathways.',
    hints: [
      'Student associates with "Borrow Book" and "Return Book".',
      'Librarian is a secondary actor assisting with "Return Book" and "Pay Overdue Fine".',
      '"Borrow Book" includes "Check Fine Balance" (arrow points -> Check Fine Balance).',
      '"Pay Overdue Fine" extends "Return Book" (arrow points from Pay Overdue Fine -> Return Book).',
    ],
    solutionExplanation:
      'Real world business workflows often trigger extensions upon exceptional circumstances (like an overdue return requiring a fine payment).',
    initialNodes: [
      {
        id: 'boundary-library',
        type: 'boundary',
        position: { x: 220, y: 30 },
        data: {
          label: 'System Boundary',
          nodeType: 'boundary',
          boundaryTitle: 'University Library System',
          width: 500,
          height: 440,
        },
      },
      {
        id: 'actor-student',
        type: 'actor',
        position: { x: 40, y: 160 },
        data: {
          label: 'Student',
          nodeType: 'actor',
        },
      },
      {
        id: 'actor-librarian',
        type: 'actor',
        position: { x: 740, y: 220 },
        data: {
          label: 'Librarian',
          nodeType: 'actor',
          actorType: 'secondary',
        },
      },
      {
        id: 'uc-borrow',
        type: 'useCase',
        position: { x: 260, y: 80 },
        data: {
          label: 'Borrow Book',
          nodeType: 'useCase',
        },
      },
      {
        id: 'uc-check-fines',
        type: 'useCase',
        position: { x: 500, y: 80 },
        data: {
          label: 'Check Fine Balance',
          nodeType: 'useCase',
        },
      },
      {
        id: 'uc-return',
        type: 'useCase',
        position: { x: 260, y: 240 },
        data: {
          label: 'Return Book',
          nodeType: 'useCase',
        },
      },
      {
        id: 'uc-pay-fine',
        type: 'useCase',
        position: { x: 500, y: 310 },
        data: {
          label: 'Pay Overdue Fine',
          nodeType: 'useCase',
        },
      },
    ],
    solutions: [
      {
        description: 'Complete Library System Diagram',
        edges: [
          {
            source: 'actor-student',
            target: 'uc-borrow',
            type: 'association',
            bidirectional: true,
          },
          {
            source: 'actor-student',
            target: 'uc-return',
            type: 'association',
            bidirectional: true,
          },
          {
            source: 'actor-librarian',
            target: 'uc-return',
            type: 'association',
            bidirectional: true,
          },
          {
            source: 'uc-borrow',
            target: 'uc-check-fines',
            type: 'include',
            description: 'Checking fines is mandatory before borrowing',
          },
          {
            source: 'uc-pay-fine',
            target: 'uc-return',
            type: 'extend',
            description: 'Paying fine optionally extends returning an overdue book',
          },
        ],
      },
      // Alternative valid design: Librarian also directly handles Pay Overdue Fine
      {
        description: 'Complete Library System with Librarian associated with Pay Fine',
        edges: [
          {
            source: 'actor-student',
            target: 'uc-borrow',
            type: 'association',
            bidirectional: true,
          },
          {
            source: 'actor-student',
            target: 'uc-return',
            type: 'association',
            bidirectional: true,
          },
          {
            source: 'actor-librarian',
            target: 'uc-return',
            type: 'association',
            bidirectional: true,
          },
          {
            source: 'actor-librarian',
            target: 'uc-pay-fine',
            type: 'association',
            bidirectional: true,
          },
          {
            source: 'uc-borrow',
            target: 'uc-check-fines',
            type: 'include',
          },
          {
            source: 'uc-pay-fine',
            target: 'uc-return',
            type: 'extend',
          },
        ],
      },
    ],
  },
  {
    id: 'level-10-hotel-boss',
    number: 10,
    title: 'Master Challenge: Luxury Hotel & Smart Keys',
    type: 'build',
    difficulty: 'Advanced',
    category: 'Mastery',
    scenario:
      'A Grand Hotel offers digital reservations. A Guest can "Book Room". Booking a room strictly «includes» "Process Deposit". When arriving, the Guest executes "Check In". During Check In, if the room is equipped with IoT locks, the system can optionally "Issue Digital Key" via «extend». The Hotel Receptionist participates as secondary actor in "Check In".',
    goal: 'Assemble the full diagram connecting Guest, Receptionist, Book Room, Process Deposit, Check In, and Issue Digital Key.',
    learningObjective:
      'Demonstrate complete mastery of Use Case Diagrams: Actors, Boundaries, Associations, Include, and Extend.',
    hints: [
      'Guest connects to "Book Room" and "Check In" via Association.',
      '"Book Room" includes "Process Deposit" (mandatory payment).',
      'Receptionist associates with "Check In".',
      '"Issue Digital Key" extends "Check In" (points from Issue Digital Key -> Check In).',
    ],
    solutionExplanation:
      'Congratulations! You have mastered UML Use Case Diagrams from foundational actor-case associations to nuanced include and extend semantics.',
    initialNodes: [
      {
        id: 'boundary-hotel',
        type: 'boundary',
        position: { x: 220, y: 30 },
        data: {
          label: 'System Boundary',
          nodeType: 'boundary',
          boundaryTitle: 'Grand Hotel Hospitality Platform',
          width: 500,
          height: 440,
        },
      },
      {
        id: 'actor-guest',
        type: 'actor',
        position: { x: 40, y: 150 },
        data: {
          label: 'Hotel Guest',
          nodeType: 'actor',
        },
      },
      {
        id: 'actor-receptionist',
        type: 'actor',
        position: { x: 740, y: 240 },
        data: {
          label: 'Receptionist',
          nodeType: 'actor',
          actorType: 'secondary',
        },
      },
      {
        id: 'uc-book',
        type: 'useCase',
        position: { x: 270, y: 80 },
        data: {
          label: 'Book Room',
          nodeType: 'useCase',
        },
      },
      {
        id: 'uc-deposit',
        type: 'useCase',
        position: { x: 500, y: 80 },
        data: {
          label: 'Process Deposit',
          nodeType: 'useCase',
        },
      },
      {
        id: 'uc-checkin',
        type: 'useCase',
        position: { x: 300, y: 250 },
        data: {
          label: 'Check In',
          nodeType: 'useCase',
        },
      },
      {
        id: 'uc-digital-key',
        type: 'useCase',
        position: { x: 500, y: 340 },
        data: {
          label: 'Issue Digital Key',
          nodeType: 'useCase',
        },
      },
    ],
    solutions: [
      {
        description: 'Complete Hotel Reservation Diagram',
        edges: [
          {
            source: 'actor-guest',
            target: 'uc-book',
            type: 'association',
            bidirectional: true,
          },
          {
            source: 'actor-guest',
            target: 'uc-checkin',
            type: 'association',
            bidirectional: true,
          },
          {
            source: 'actor-receptionist',
            target: 'uc-checkin',
            type: 'association',
            bidirectional: true,
          },
          {
            source: 'uc-book',
            target: 'uc-deposit',
            type: 'include',
            description: 'Mandatory deposit',
          },
          {
            source: 'uc-digital-key',
            target: 'uc-checkin',
            type: 'extend',
            description: 'Digital key optionally extends check in',
          },
        ],
      },
    ],
  },
]
