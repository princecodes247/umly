import { HeadContent, Scripts, createRootRoute, useRouterState } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import Footer from '../components/Footer'
import Header from '../components/Header'

import appCss from '../styles.css?url'

const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var mode=(stored==='light'||stored==='dark'||stored==='auto')?stored:'auto';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);if(mode==='auto'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',mode)}root.style.colorScheme=resolved;}catch(e){}})();`

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
        title: 'UMLy — Hands-On UML Use Case Puzzle Game',
      },
      {
        name: 'description',
        content:
          'Learn UML use case diagrams through interactive, auto-graded browser puzzle levels. No login, instant feedback.',
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
      <a href="/" className="notion-btn notion-btn-primary">Back to Puzzles</a>
    </div>
  ),
})

function RootDocument({ children }: { children: React.ReactNode }) {
  const routerState = useRouterState()
  const isPlayPage = routerState.location.pathname.startsWith('/play')
  const isStudioPage = routerState.location.pathname === '/'

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body className="font-sans antialiased text-[var(--text-primary)] bg-[var(--bg-primary)] [overflow-wrap:anywhere] selection:bg-[var(--selection-bg)] min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col min-h-0 w-full">
          {children}
        </div>
        {!isPlayPage && !isStudioPage && <Footer />}
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
