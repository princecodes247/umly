# UMLy

An interactive diagramming studio and puzzle-based learning platform for software architecture and system modeling.

## Features

- **Multi-Diagram Studio (`/studio`)** — Build and edit diagrams on an interactive `@xyflow/react` canvas with local draft persistence, version history, a built-in notation guide, light/dark themes, and PNG/SVG/JSON export.
- **Workspace & Starter Templates (`/workspace`)** — Manage saved local diagrams or start quickly from curated templates across all supported diagram types.
- **49 Interactive Puzzles (`/puzzles`, `/play/$levelId`)** — Practice modeling with instant validation, progressive hints, and `build`, `classify`, and `fix` challenges across four difficulty tiers (`Beginner`, `Easy`, `Intermediate`, `Advanced`):
  - **Use Case Diagrams** (`13` puzzles) — Actors, use cases, system boundaries, `association`, `include`, `extend`, and `generalization`.
  - **Entity-Relationship Diagrams (ERD)** (`12` puzzles) — Entities, attributes, primary/foreign keys, and Crow's Foot cardinalities.
  - **UML Class Diagrams** (`12` puzzles) — Classes, abstract classes, interfaces, enums, `generalization`, `realization`, `composition`, `aggregation`, `dependency`, and `association`.
  - **Data Flow Diagrams (DFD)** (`12` puzzles) — External entities, numbered processes, data stores, and Level-1 `data_flow` syntax rules.

## Tech Stack

- **Framework:** [TanStack Start](https://tanstack.com/start) & [TanStack Router](https://tanstack.com/router)
- **UI & Canvas:** React 19, [React Flow (`@xyflow/react`)](https://reactflow.dev/), [Tailwind CSS v4](https://tailwindcss.com/), `lucide-react`, `motion`
- **Build & Server:** Vite 8, TypeScript, [Nitro](https://v3.nitro.build/)

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

| Command | Description |
| :--- | :--- |
| `pnpm dev` | Start the Vite development server on port `3000` |
| `pnpm puzzles:index` | Regenerate `src/data/puzzles/index.ts` from puzzle JSON files |
| `pnpm build` | Regenerate the puzzle index (`prebuild`) and build for production |
| `pnpm preview` | Preview the production build locally |
| `pnpm generate-routes` | Regenerate TanStack Router route tree (`tsr generate`) |

## Project Structure

```text
├── scripts/
│   └── generate-puzzle-index.mjs   # Validates & indexes puzzle JSON files
├── src/
│   ├── components/                 # Shared UI, canvas nodes, edges, modals, guides
│   ├── data/
│   │   └── puzzles/
│   │       ├── use_case/           # Use Case puzzle definitions (13)
│   │       ├── er/                 # ER Diagram puzzle definitions (12)
│   │       ├── class/              # Class Diagram puzzle definitions (12)
│   │       ├── dfd/                # Data Flow Diagram puzzle definitions (12)
│   │       └── index.ts            # Auto-generated puzzle registry
│   ├── lib/                        # Validation, storage, export, and helper utilities
│   ├── routes/                     # File-based TanStack Router routes
│   │   ├── index.tsx               # Landing page
│   │   ├── workspace.tsx           # Local drafts & starter templates
│   │   ├── studio.index.tsx        # New studio session
│   │   ├── studio.$diagramId.tsx   # Diagram editor by ID
│   │   ├── puzzles.tsx             # Puzzle catalog & progress tracker
│   │   ├── play.$levelId.tsx       # Interactive puzzle player
│   │   └── about.tsx               # About page
│   └── types/                      # Shared TypeScript definitions
└── package.json
```

## Authoring Puzzles

Puzzle definitions live as JSON files under `src/data/puzzles/{use_case,er,class,dfd}/`. After adding or editing a puzzle JSON file, regenerate the index (this also runs automatically before `pnpm build`):

```bash
pnpm puzzles:index
```
