export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-20 border-t border-[var(--border-subtle)] px-4 py-8 text-[var(--text-tertiary)] text-xs select-none">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="m-0 flex items-center gap-1.5">
          <span>📐</span>
          <span>
            &copy; {year} UMLy — Interactive UML Use Case Diagram Playground
          </span>
        </p>
        <div className="flex items-center gap-3 text-[11px]">
          <span>UML 2.5 Standard</span>
          <span>•</span>
          <span>Zero setup</span>
          <span>•</span>
          <span>Local storage</span>
        </div>
      </div>
    </footer>
  )
}
