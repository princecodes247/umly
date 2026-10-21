import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  component: About,
})

function About() {
  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-8 py-12 space-y-6">
      <div className="w-12 h-12 rounded-md flex items-center justify-center text-3xl select-none">
        ℹ️
      </div>

      <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
        About UMLy
      </h1>

      <div className="notion-callout notion-callout-blue">
        <span>💡</span>
        <div className="space-y-1">
          <p className="font-semibold text-xs text-[var(--text-primary)]">
            Mission & Purpose
          </p>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            UMLy was built to make learning UML Use Case Diagrams intuitive,
            accessible, and fun. No enterprise installations, no login walls,
            and instant auto-graded feedback for software engineering students
            and system architects.
          </p>
        </div>
      </div>

      <div className="text-xs leading-relaxed text-[var(--text-secondary)] space-y-3">
        <p>
          Each level evaluates the structural relationships between external Actors, Use Cases,
          and the System Boundary against the OMG Unified Modeling Language 2.5 standard.
        </p>
      </div>
    </main>
  )
}
