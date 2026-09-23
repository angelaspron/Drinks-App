import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { Plus, Wine, AlignLeft, Upload, X } from 'lucide-react';

interface Drink {
  id: string;
  nome: string;
  foto_url: string;
  ingredientes: string;
  modo_preparo: string;
}

export function Catalog() {
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [nome, setNome] = useState('');
  const [fotoBase64, setFotoBase64] = useState<string | null>(null);
  const [ingredientes, setIngredientes] = useState('');
  const [modoPreparo, setModoPreparo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'drinks'), orderBy('created_at', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const drinksData: Drink[] = [];
      snapshot.forEach((doc) => {
        drinksData.push({ id: doc.id, ...doc.data() } as Drink);
      });
      setDrinks(drinksData);
    }, (error) => {
      console.error('Erro ao buscar drinks:', error);
    });

    return () => unsubscribe();
  }, []);

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const max_size = 800;

          if (width > height) {
            if (width > max_size) {
              height *= max_size / width;
              width = max_size;
            }
          } else {
            if (height > max_size) {
              width *= max_size / height;
              height = max_size;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await compressImage(file);
        setFotoBase64(base64);
      } catch (error) {
        console.error("Erro ao comprimir imagem", error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !ingredientes || !modoPreparo) return;

    setIsSubmitting(true);
    try {
      const finalFotoUrl = fotoBase64 || 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=600';

      await addDoc(collection(db, 'drinks'), {
        nome,
        foto_url: finalFotoUrl,
        ingredientes,
        modo_preparo: modoPreparo,
        created_at: serverTimestamp()
      });

      setNome('');
      setFotoBase64(null);
      setIngredientes('');
      setModoPreparo('');
    } catch (error) {
      console.error('Erro ao adicionar drink:', error);
      alert('Erro ao salvar o drink. Verifique as configurações do Firebase.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-12 animate-fade-in">
      {/* Formulário de Cadastro */}
      <section className="glass-panel max-w-2xl mx-auto">
        <h3 className="text-xl font-semibold mb-6 flex items-center text-amber-500">
          <Plus className="mr-2" size={24} />
          Cadastrar Nova Receita
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Nome do Drink</label>
              <div className="relative">
                <Wine className="absolute left-3 top-3 text-gray-500" size={18} />
                <input 
                  type="text" 
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="pl-10"
                  placeholder="Ex: Mojito Clássico"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Foto do Drink</label>
              <div className="relative">
                <Upload className="absolute left-3 top-3 text-gray-500" size={18} />
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleFileChange}
                  className="pl-10 py-2 w-full text-sm text-gray-400 file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-amber-500/10 file:text-amber-500 hover:file:bg-amber-500/20 focus:outline-none bg-[#14161c] border border-white/5 rounded-lg"
                />
              </div>
              {fotoBase64 && (
                <div className="mt-3 relative inline-block">
                  <img src={fotoBase64} alt="Preview" className="h-24 w-24 object-cover rounded-lg border border-gray-700/50 shadow-md" />
                  <button 
                    type="button" 
                    onClick={() => setFotoBase64(null)} 
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-lg"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Ingredientes (separados por vírgula)</label>
            <textarea 
              value={ingredientes}
              onChange={(e) => setIngredientes(e.target.value)}
              rows={2}
              placeholder="Ex: Hortelã, Rum branco, Limão, Açúcar, Água com gás"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Modo de Preparo</label>
            <div className="relative">
              <AlignLeft className="absolute left-3 top-3 text-gray-500" size={18} />
              <textarea 
                value={modoPreparo}
                onChange={(e) => setModoPreparo(e.target.value)}
                className="pl-10"
                rows={3}
                placeholder="Ex: Macere a hortelã com o açúcar e o limão..."
                required
              />
            </div>
          </div>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="btn-primary w-full flex items-center justify-center mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Salvando...' : 'Salvar Receita no Acervo'}
          </button>
        </form>
      </section>

      {/* Galeria de Drinks */}
      <section>
        <h3 className="text-xl font-semibold mb-6 text-gray-200">Nosso Acervo ({drinks.length})</h3>
        {drinks.length === 0 ? (
          <div className="text-center text-gray-500 py-10 glass-panel">
            <Wine className="mx-auto mb-4 opacity-50" size={48} />
            <p>Nenhum drink cadastrado ainda. Seja o primeiro a adicionar!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {drinks.map(drink => (
              <div key={drink.id} className="glass-panel p-0 overflow-hidden group hover:-translate-y-2 transition-all duration-300">
                <div className="h-48 overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-[#191c23] to-transparent z-10" />
                  <img 
                    src={drink.foto_url} 
                    alt={drink.nome} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <h4 className="absolute bottom-3 left-4 z-20 text-xl font-bold text-white drop-shadow-md">
                    {drink.nome}
                  </h4>
                </div>
                <div className="p-5 space-y-3">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-amber-500 font-bold block mb-1">Ingredientes</span>
                    <p className="text-sm text-gray-300 line-clamp-2">{drink.ingredientes}</p>
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wider text-amber-500 font-bold block mb-1">Preparo</span>
                    <p className="text-sm text-gray-400 line-clamp-3">{drink.modo_preparo}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
