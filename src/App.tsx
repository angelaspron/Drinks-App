import { Catalog } from './components/Catalog'

function App() {
  return (
    <div className="min-h-screen app-container text-white font-sans">
      <header className="glass-header sticky top-0 z-10 p-4 border-b border-white/10 shadow-lg">
        <div className="max-w-5xl mx-auto flex items-center justify-center">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-600">
            Drinks App
          </h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 py-8">
        <Catalog />
      </main>
    </div>
  )
}

export default App
