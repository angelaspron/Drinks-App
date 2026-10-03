import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { Search as SearchIcon, Wine } from 'lucide-react';
import { Drink } from '../types';
import { DrinkCard } from './DrinkCard';
import { DrinkModal } from './DrinkModal';

export function Search() {
  const [searchTerm, setSearchTerm] = useState('');
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [selectedDrink, setSelectedDrink] = useState<Drink | null>(null);

  useEffect(() => {
    // We fetch all drinks and filter locally since Firestore 
    // doesn't support complex full-text search easily without external extensions (like Algolia)
    const qDrinks = query(collection(db, 'drinks'));
    const unsub = onSnapshot(qDrinks, (snapshot) => {
      const drinksData: Drink[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        drinksData.push({ 
          id: doc.id, 
          ...data,
          ingredientes: Array.isArray(data.ingredientes) ? data.ingredientes : (data.ingredientes?.split(',') || []),
          categorias: data.categorias || []
        } as Drink);
      });
      setDrinks(drinksData);
    });

    return () => unsub();
  }, []);

  const filteredDrinks = drinks.filter(drink => {
    if (!searchTerm.trim()) return false; // Show nothing or everything when empty? Let's show nothing initially or show all if we want. Wait, standard is to show all if empty, but for a "Search Screen" it's better to guide them. Let's show all if empty so it doesn't look broken.
    if (!searchTerm.trim()) return true;

    const term = searchTerm.toLowerCase();
    
    // Check name
    if (drink.nome.toLowerCase().includes(term)) return true;
    
    // Check ingredients
    const matchIngredient = drink.ingredientes.some(ing => ing.toLowerCase().includes(term));
    if (matchIngredient) return true;

    // Check preparation instructions
    if (drink.modo_preparo.toLowerCase().includes(term)) return true;

    return false;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="max-w-2xl mx-auto text-center mb-10">
        <h2 className="text-3xl font-bold text-amber-500 mb-4">Buscar Receitas</h2>
        <div className="relative">
          <SearchIcon className="absolute left-4 top-4 text-amber-500" size={24} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Busque por nome, ingrediente ou palavra-chave..."
            className="w-full pl-14 pr-4 py-4 rounded-full text-lg shadow-xl bg-black/40 border border-amber-500/30 focus:border-amber-500 focus:bg-black/60 transition-all placeholder:text-gray-500"
          />
        </div>
        <p className="text-gray-400 mt-4">
          {searchTerm.trim() 
            ? `${filteredDrinks.length} resultado(s) para "${searchTerm}"`
            : `Busque em nosso acervo de ${drinks.length} drinks`
          }
        </p>
      </div>

      {filteredDrinks.length === 0 ? (
        <div className="text-center text-gray-500 py-16 glass-panel">
          <Wine className="mx-auto mb-4 opacity-30" size={64} />
          <p className="text-xl">Nenhum drink encontrado com esses termos.</p>
          <p className="text-sm mt-2">Tente buscar por um ingrediente diferente!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up">
          {filteredDrinks.map(drink => (
            <DrinkCard 
              key={drink.id} 
              drink={drink} 
              onClick={setSelectedDrink} 
            />
          ))}
        </div>
      )}

      {selectedDrink && (
        <DrinkModal 
          drink={selectedDrink} 
          onClose={() => setSelectedDrink(null)} 
        />
      )}
    </div>
  );
}
