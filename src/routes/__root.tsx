import { HeadContent, Scripts, createRootRoute, useRouterState } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import Footer from '../components/Footer'
import Header from '../components/Header'

import appCss from '../styles.css?url'

const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var resolved=(stored==='light'||stored==='dark')?stored:(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);root.setAttribute('data-theme',resolved);root.style.colorScheme=resolved;if(stored!=='light'&&stored!=='dark'){window.localStorage.setItem('theme',resolved);}}catch(e){}})();`

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'UMLy | Interactive Diagramming Studio, Puzzles & Case Studies',
      },
      {
        name: 'description',
        content:
          'Design Use Case, ER, Class, and Data Flow diagrams in an interactive browser studio. Practice with 49 auto-graded puzzles and 12 system modeling case studies with instant feedback.',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
  notFoundComponent: () => (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
      <div className="text-4xl">🔍</div>
      <h1 className="text-lg font-bold text-[var(--text-primary)]">Page Not Found</h1>
      <p className="text-xs text-[var(--text-secondary)]">The requested puzzle level could not be found.</p>
      <a href="/puzzles" className="notion-btn notion-btn-primary">Back to Puzzles</a>
    </div>
  ),
})

function RootDocument({ children }: { children: React.ReactNode }) {
  const routerState = useRouterState()
  const isLandingPage = routerState.location.pathname === '/'
  const isPlayPage = routerState.location.pathname.startsWith('/play')
  const isStudioPage = routerState.location.pathname.startsWith('/studio')

  const isFullViewportPage = isPlayPage || isStudioPage

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body
        className={`font-sans antialiased text-[var(--text-primary)] bg-[var(--bg-primary)] [overflow-wrap:anywhere] selection:bg-[var(--selection-bg)] flex flex-col ${
          isFullViewportPage ? 'h-screen overflow-hidden' : 'min-h-screen'
        }`}
      >
        {!isStudioPage && !isLandingPage && <Header />}
        <div
          className={`flex-1 flex flex-col w-full ${
            isFullViewportPage ? 'min-h-0' : ''
          }`}
        >
          {children}
        </div>
        {!isFullViewportPage && !isLandingPage && <Footer />}
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
