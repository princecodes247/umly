import { createFileRoute, Link } from '@tanstack/react-router'
import { PenTool, Puzzle, Download } from 'lucide-react'
import { LEVEL_SUMMARIES } from '../data/levels'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

function PaintSlooshesAndNodes() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none select-none absolute inset-0 overflow-hidden z-0"
    >
      {/* Top-Left Yellow Paint Sloosh */}
      <svg
        viewBox="0 0 340 260"
        fill="none"
        className="absolute -top-10 -left-12 w-52 sm:w-72 md:w-80 opacity-90"
      >
        <path
          d="M28 18 C 70 -8, 92 78, 52 108 C 12 138, 128 38, 165 62 C 202 86, 84 162, 122 192 C 160 222, 238 92, 276 122 C 304 144, 232 204, 212 224"
          stroke="#F7C948"
          strokeWidth="44"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Top-Right Coral Paint Sloosh */}
      <svg
        viewBox="0 0 320 280"
        fill="none"
        className="absolute top-12 -right-12 w-48 sm:w-64 md:w-76 opacity-90"
      >
        <path
          d="M285 28 C 235 42, 265 135, 222 146 C 179 157, 218 52, 170 64 C 122 76, 166 198, 118 214 C 70 230, 108 118, 60 138 C 32 150, 44 218, 46 244"
          stroke="#FF7849"
          strokeWidth="42"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Bottom-Left Emerald Paint Sloosh */}
      <svg
        viewBox="0 0 360 280"
        fill="none"
        className="absolute top-[410px] sm:top-[440px] -left-10 w-56 sm:w-72 md:w-88 opacity-90"
      >
        <path
          d="M22 252 C 56 200, 122 238, 140 190 C 158 142, 82 148, 108 100 C 134 52, 206 138, 236 96 C 266 54, 218 24, 260 28"
          stroke="#06B67D"
          strokeWidth="44"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Bottom-Right Purple Paint Sloosh */}
      <svg
        viewBox="0 0 320 260"
        fill="none"
        className="absolute top-[430px] sm:top-[460px] -right-12 w-52 sm:w-64 md:w-80 opacity-85"
      >
        <path
          d="M292 228 C 242 216, 264 134, 216 142 C 168 150, 202 222, 152 206 C 102 190, 146 92, 96 86 C 58 82, 68 148, 42 166"
          stroke="#7C6CF0"
          strokeWidth="42"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Floating UML Nodes alongside the slooshes */}
      {/* Left: Actor Node */}
      <div className="hidden md:flex flex-col items-center gap-1 absolute top-44 left-12 lg:left-24 -rotate-6 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white/95 dark:bg-neutral-900/95 shadow-md">
        <svg
          width="24"
          height="32"
          viewBox="0 0 28 36"
          fill="none"
          className="text-gray-900 dark:text-white"
        >
          <circle cx="14" cy="7" r="5" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="M14 12v11M5 17h18M14 23l-6 10M14 23l6 10"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
        <span className="text-[11px] font-semibold text-gray-900 dark:text-white">
          Customer
        </span>
      </div>

      {/* Left: Class Node */}
      <div className="hidden lg:block absolute top-[320px] left-16 xl:left-28 rotate-3 w-44 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white/95 dark:bg-neutral-900/95 shadow-md overflow-hidden">
        <div className="px-2.5 py-1 border-b border-gray-200 dark:border-neutral-700 bg-purple-50 dark:bg-purple-950/50 text-[10px] font-mono text-purple-700 dark:text-purple-300">
          «interface»
        </div>
        <div className="px-2.5 py-1.5 font-bold text-xs text-gray-900 dark:text-white border-b border-gray-200 dark:border-neutral-700">
          PaymentGateway
        </div>
        <div className="px-2.5 py-1.5 text-[10px] font-mono text-gray-600 dark:text-neutral-300">
          + charge(amt): bool
        </div>
      </div>

      {/* Right: Use Case Oval */}
      <div className="hidden md:flex flex-col items-center justify-center absolute top-40 right-12 lg:right-24 rotate-6 px-6 py-3 rounded-full border-2 border-gray-900 dark:border-neutral-200 bg-white/95 dark:bg-neutral-900/95 shadow-md">
        <span className="text-[10px] font-mono text-gray-500 dark:text-neutral-400">
          «use case»
        </span>
        <span className="text-xs font-bold text-gray-900 dark:text-white">
          Checkout Cart
        </span>
      </div>

      {/* Right: ER Entity Node */}
      <div className="hidden lg:block absolute top-[315px] right-16 xl:right-28 -rotate-3 w-44 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white/95 dark:bg-neutral-900/95 shadow-md overflow-hidden">
        <div className="px-2.5 py-1.5 border-b border-gray-200 dark:border-neutral-700 bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-900 dark:text-white">
            OrderItem
          </span>
          <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300">
            1 : N
          </span>
        </div>
        <div className="px-2.5 py-1.5 text-[10px] font-mono text-gray-600 dark:text-neutral-300 space-y-0.5">
          <div>PK order_id : UUID</div>
          <div>FK product_id : UUID</div>
        </div>
      </div>

      {/* Bottom-Left: DFD Process */}
      <div className="hidden md:flex items-center gap-2 absolute top-[545px] left-24 lg:left-40 rotate-2 px-3.5 py-2 rounded-xl border border-amber-400 bg-white/95 dark:bg-neutral-900/95 shadow-md">
        <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 text-[10px] font-mono font-bold">
          1.0
        </span>
        <span className="text-xs font-bold text-gray-900 dark:text-white">
          Process Order
        </span>
      </div>

      {/* Bottom-Right: DFD Data Store */}
      <div className="hidden md:flex items-center gap-2 absolute top-[540px] right-24 lg:right-40 -rotate-2 px-3.5 py-2 border-y-2 border-l-2 border-gray-900 dark:border-neutral-200 bg-white/95 dark:bg-neutral-900/95 shadow-md">
        <span className="text-[10px] font-mono font-bold text-gray-500 dark:text-neutral-400 pr-2 border-r border-gray-300 dark:border-neutral-700">
          D1
        </span>
        <span className="text-xs font-bold text-gray-900 dark:text-white">
          Orders Store
        </span>
      </div>
    </div>
  )
}

function LandingPage() {
  return (
    <div className="relative flex flex-col min-h-screen bg-[var(--bg-primary)] overflow-hidden">
      <PaintSlooshesAndNodes />

      {/* Jive-style 3-column Header */}
      <header className="relative z-20 px-4 lg:px-6 py-4">
        <nav className="grid grid-cols-3 items-center mx-auto max-w-screen-xl">
          <div className="flex justify-start items-center col-span-1">
            <Link
              to="/puzzles"
              className="md:hidden text-[var(--text-primary)] bg-[var(--bg-primary)] border border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-800 font-medium rounded-full text-sm px-4 py-2 transition"
            >
              Puzzles
            </Link>
          </div>

          <div className="flex items-center justify-center col-span-1">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-2xl font-extrabold tracking-tight text-[var(--text-primary)]"
            >
              <span>📐</span>
              <span>UMLy</span>
            </Link>
          </div>

          <div className="flex justify-end items-center col-span-1">
            <Link
              to="/puzzles"
              className="hidden md:inline-flex text-[var(--text-primary)] bg-[var(--bg-primary)] border border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-800 font-medium rounded-full text-sm md:text-base px-5 py-2 transition"
            >
              Puzzles
            </Link>
            <Link
              to="/workspace"
              className="text-white dark:text-neutral-900 bg-gray-900 dark:bg-white hover:opacity-90 font-medium rounded-full text-sm md:text-base px-5 py-2 ml-2 transition"
            >
              Workspace
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-grow">
        <section className="max-w-screen-xl px-6 pt-14 pb-20 sm:pt-20 sm:pb-28 mx-auto text-center">
          <div className="max-w-xl mx-auto">
            <h1 className="text-5xl font-extrabold leading-none tracking-tight text-[var(--text-primary)] md:text-7xl mb-6">
              Don&apos;t make diagramming awkward
            </h1>
            <p className="mb-8 text-base sm:text-xl font-normal text-[var(--text-secondary)] leading-relaxed">
              No more fighting clunky desktop tools or messy whiteboards. UMLy
              makes it effortless to sketch Use Case, ER, Class, and Data Flow
              diagrams—and practice with auto-graded puzzles.
            </p>
            <Link
              to="/workspace"
              className="inline-block text-white dark:text-neutral-900 bg-gray-900 dark:bg-white hover:opacity-90 font-semibold rounded-full text-base sm:text-lg px-9 py-4 transition shadow-sm"
            >
              Start diagramming free
            </Link>
          </div>
        </section>

        {/* Jive-style 3-Step Features Section */}
        <section className="max-w-screen-xl px-6 py-12 sm:py-16 mx-auto text-center">
          <div className="space-y-10 md:grid md:grid-cols-3 md:gap-12 md:space-y-0 mb-14">
            <div className="max-w-xs mx-auto">
              <div className="mx-auto mb-4 w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300 flex items-center justify-center">
                <PenTool className="w-6 h-6" />
              </div>
              <h3 className="mb-2 text-2xl font-bold text-[var(--text-primary)]">
                Pick a diagram type
              </h3>
              <p className="text-[var(--text-secondary)] text-base sm:text-lg">
                Sketch Use Case, ER, Class, and Data Flow diagrams with dedicated
                nodes and smart connectors.
              </p>
            </div>

            <div className="max-w-xs mx-auto">
              <div className="mx-auto mb-4 w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center">
                <Puzzle className="w-6 h-6" />
              </div>
              <h3 className="mb-2 text-2xl font-bold text-[var(--text-primary)]">
                Practice with puzzles
              </h3>
              <p className="text-[var(--text-secondary)] text-base sm:text-lg">
                Master relationships across {LEVEL_SUMMARIES.length} interactive
                challenges with instant auto-graded feedback.
              </p>
            </div>

            <div className="max-w-xs mx-auto">
              <div className="mx-auto mb-4 w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 flex items-center justify-center">
                <Download className="w-6 h-6" />
              </div>
              <h3 className="mb-2 text-2xl font-bold text-[var(--text-primary)]">
                Export from your browser
              </h3>
              <p className="text-[var(--text-secondary)] text-base sm:text-lg">
                Everything stays saved locally with zero setup. Export crisp PNG,
                SVG, or JSON in one click.
              </p>
            </div>
          </div>

          <Link
            to="/workspace"
            className="inline-block text-white dark:text-neutral-900 bg-gray-900 dark:bg-white hover:opacity-90 font-semibold rounded-full text-lg sm:text-xl px-12 py-4 transition"
          >
            Start diagramming
          </Link>
        </section>
      </main>

      {/* Jive-style Centered Footer */}
      <footer className="relative z-10 p-6 md:p-10 text-center">
        <div className="mx-auto max-w-screen-xl">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xl font-extrabold tracking-tight text-[var(--text-primary)]"
          >
            <span>📐</span>
            <span>UMLy</span>
          </Link>
          <p className="my-4 text-sm text-[var(--text-secondary)]">
            Sketch cleanly and master system design.
          </p>
          <ul className="flex flex-wrap justify-center items-center gap-6 mb-4 text-sm text-[var(--text-primary)]">
            <li>
              <Link to="/workspace" className="hover:opacity-70 transition">
                Workspace
              </Link>
            </li>
            <li>
              <Link to="/puzzles" className="hover:opacity-70 transition">
                Puzzles
              </Link>
            </li>
            <li>
              <Link to="/studio" className="hover:opacity-70 transition">
                Studio
              </Link>
            </li>
          </ul>
          <span className="text-xs text-[var(--text-tertiary)]">
            &copy; {new Date().getFullYear()} UMLy
          </span>
        </div>
      </footer>
    </div>
  )
}
