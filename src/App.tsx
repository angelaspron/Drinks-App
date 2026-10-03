import { useState } from 'react'
import { Home } from './components/Home'
import { Registration } from './components/Registration'
import { Search } from './components/Search'
import { LayoutGrid, PlusCircle, Search as SearchIcon } from 'lucide-react'

function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'registration' | 'search'>('home')

  return (
    <div className="min-h-screen app-container text-white font-sans pb-10">
      <header className="glass-header sticky top-0 z-20 p-4 border-b border-white/10 shadow-lg">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-600">
            Drinks App
          </h1>
          <nav className="flex gap-2 bg-black/20 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('home')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
                activeTab === 'home' 
                  ? 'bg-amber-500 text-white shadow-md' 
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <LayoutGrid size={18} />
              <span className="hidden sm:inline">Início</span>
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
                activeTab === 'search' 
                  ? 'bg-amber-500 text-white shadow-md' 
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <SearchIcon size={18} />
              <span className="hidden sm:inline">Busca</span>
            </button>
            <button
              onClick={() => setActiveTab('registration')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
                activeTab === 'registration' 
                  ? 'bg-amber-500 text-white shadow-md' 
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <PlusCircle size={18} />
              <span className="hidden sm:inline">Cadastro</span>
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 py-8">
        {activeTab === 'home' && <Home />}
        {activeTab === 'registration' && <Registration />}
        {activeTab === 'search' && <Search />}
      </main>
    </div>
  )
}

export default App
