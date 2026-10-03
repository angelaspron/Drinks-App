import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Category, Drink } from '../types';
import { DrinkCard } from './DrinkCard';
import { DrinkModal } from './DrinkModal';
import { Wine, Beer, Coffee, Droplets, Martini, GlassWater } from 'lucide-react';

const ICON_MAP: Record<string, any> = {
  Wine,
  Beer,
  Coffee,
  Droplets,
  Martini,
  GlassWater,
};

export function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedDrink, setSelectedDrink] = useState<Drink | null>(null);

  useEffect(() => {
    // Fetch Categories
    const qCat = query(collection(db, 'categorias'), orderBy('name', 'asc'));
    const unsubCat = onSnapshot(qCat, (snapshot) => {
      const catData: Category[] = [];
      snapshot.forEach(doc => {
        catData.push({ id: doc.id, ...doc.data() } as Category);
      });
      setCategories(catData);
    });

    // Fetch Drinks
    // Note: To order by name locally after filtering to ensure strict alphabetical ordering
    const qDrinks = query(collection(db, 'drinks'));
    const unsubDrinks = onSnapshot(qDrinks, (snapshot) => {
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

    return () => {
      unsubCat();
      unsubDrinks();
    };
  }, []);

  // Filter and sort drinks when category is selected
  const filteredDrinks = selectedCategory
    ? drinks
        .filter(drink => drink.categorias.includes(selectedCategory.id))
        .sort((a, b) => a.nome.localeCompare(b.nome))
    : [];

  return (
    <div className="space-y-12 animate-fade-in">
      {!selectedCategory ? (
        <section>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-amber-500 mb-2">Categorias</h2>
            <p className="text-gray-400">Escolha uma categoria para explorar nossos drinks</p>
          </div>
          
          {categories.length === 0 ? (
            <div className="text-center text-gray-500 py-10 glass-panel">
              <Wine className="mx-auto mb-4 opacity-50" size={48} />
              <p>Nenhuma categoria cadastrada. Cadastre na aba de Registro!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {categories.map(cat => {
                const IconComponent = ICON_MAP[cat.icon] || Wine;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat)}
                    className="glass-panel flex flex-col items-center justify-center p-6 gap-4 hover:bg-amber-500/10 hover:border-amber-500/50 transition-all group"
                  >
                    <div className="w-16 h-16 rounded-full bg-black/40 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <IconComponent className="text-amber-500" size={32} />
                    </div>
                    <span className="font-semibold text-lg">{cat.name}</span>
                  </button>
                )
              })}
            </div>
          )}
        </section>
      ) : (
        <section className="animate-slide-up">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-amber-500 flex items-center gap-3">
                {selectedCategory.name}
              </h2>
              <p className="text-gray-400 mt-1">{filteredDrinks.length} drink(s) encontrado(s)</p>
            </div>
            <button 
              onClick={() => setSelectedCategory(null)}
              className="btn-secondary"
            >
              Voltar às Categorias
            </button>
          </div>

          {filteredDrinks.length === 0 ? (
             <div className="text-center text-gray-500 py-10 glass-panel">
               <Wine className="mx-auto mb-4 opacity-50" size={48} />
               <p>Nenhum drink cadastrado nesta categoria ainda.</p>
             </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDrinks.map(drink => (
                <DrinkCard 
                  key={drink.id} 
                  drink={drink} 
                  onClick={setSelectedDrink} 
                />
              ))}
            </div>
          )}
        </section>
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
