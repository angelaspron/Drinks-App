import { useState, useEffect, useRef } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
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
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [ingredientes, setIngredientes] = useState('');
  const [modoPreparo, setModoPreparo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingFotoUrl, setEditingFotoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    console.log('Conectando ao Firestore...');
    const q = query(collection(db, 'drinks'), orderBy('created_at', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log("Docs carregados:", snapshot.docs.length);
      const drinksData: Drink[] = [];
      snapshot.forEach((doc) => {
        drinksData.push({ id: doc.id, ...doc.data() } as Drink);
      });
      setDrinks(drinksData);
    }, (error) => {
      console.error('Erro de permissão ou rede ao buscar drinks:', error);
    });

    return () => unsubscribe();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFotoFile(file);
      const previewUrl = URL.createObjectURL(file);
      setFotoPreview(previewUrl);
    }
  };

  const resetForm = () => {
    setNome('');
    setFotoFile(null);
    if (fotoPreview) {
      URL.revokeObjectURL(fotoPreview);
      setFotoPreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setIngredientes('');
    setModoPreparo('');
    setEditingId(null);
    setEditingFotoUrl(null);
  };

  const handleEdit = (drink: Drink) => {
    setNome(drink.nome);
    setIngredientes(drink.ingredientes);
    setModoPreparo(drink.modo_preparo);
    setEditingId(drink.id);
    setEditingFotoUrl(drink.foto_url);
    
    setFotoFile(null);
    if (fotoPreview) {
      URL.revokeObjectURL(fotoPreview);
      setFotoPreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta receita?')) {
      try {
        await deleteDoc(doc(db, 'drinks', id));
        if (editingId === id) {
          resetForm();
        }
      } catch (error) {
        console.error('Erro ao excluir:', error);
        alert('Erro ao excluir a receita.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !ingredientes || !modoPreparo) return;

    const apiKey = import.meta.env.VITE_IMGBB_API_KEY;
    if (fotoFile && !apiKey) {
      alert('Chave da API do ImgBB não encontrada');
      return;
    }

    setIsSubmitting(true);
    try {
      let finalFotoUrl = editingId && editingFotoUrl 
        ? editingFotoUrl 
        : 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=600';

      if (fotoFile) {
        const formData = new FormData();
        formData.append('image', fotoFile);

        const imgbbResponse = await fetch(`https://api.imgbb.com/1/upload?key=${import.meta.env.VITE_IMGBB_API_KEY}`, {
          method: 'POST',
          body: formData,
        });

        if (!imgbbResponse.ok) {
          throw new Error(`O upload para o ImgBB falhou (Status: ${imgbbResponse.status})`);
        }

        const imgbbData = await imgbbResponse.json();
        if (imgbbData && imgbbData.data && imgbbData.data.display_url) {
          finalFotoUrl = imgbbData.data.display_url;
        } else {
          throw new Error('Resposta inválida do ImgBB');
        }
      }

      if (editingId) {
        await updateDoc(doc(db, 'drinks', editingId), {
          nome,
          foto_url: finalFotoUrl,
          ingredientes,
          modo_preparo: modoPreparo
        });
      } else {
        await addDoc(collection(db, 'drinks'), {
          nome,
          foto_url: finalFotoUrl,
          ingredientes,
          modo_preparo: modoPreparo,
          created_at: serverTimestamp()
        });
      }

      resetForm();
    } catch (error: any) {
      console.error('Erro ao salvar drink:', error);
      alert(`Falha no processo: ${error.message || 'Erro desconhecido'}. O drink não foi salvo.`);
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
          Cadastrar / Editar Receita
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
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileChange}
                  className="pl-10 py-2 w-full text-sm text-gray-400 file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-amber-500/10 file:text-amber-500 hover:file:bg-amber-500/20 focus:outline-none bg-[#14161c] border border-white/5 rounded-lg"
                />
              </div>
              {fotoPreview && (
                <div className="mt-3 relative w-full h-48 bg-gray-900/50 rounded flex justify-center items-center overflow-hidden border border-gray-700/50 shadow-md">
                  <img src={fotoPreview} alt="Preview" className="max-h-full max-w-full object-contain mx-auto" />
                  <button 
                    type="button" 
                    onClick={() => {
                      setFotoFile(null);
                      URL.revokeObjectURL(fotoPreview);
                      setFotoPreview(null);
                    }} 
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-lg z-10"
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
          <div className="flex gap-4 mt-4">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="btn-primary flex-1 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Salvando...' : editingId ? 'Atualizar Receita' : 'Salvar Receita no Acervo'}
            </button>
            {editingId && (
              <button 
                type="button" 
                onClick={resetForm}
                disabled={isSubmitting}
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
            )}
          </div>
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
              <div key={drink.id} className="glass-panel p-0 overflow-hidden group hover:-translate-y-2 transition-all duration-300 flex flex-col">
                <div className="w-full h-56 relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-[#191c23]/90 to-transparent z-10 pointer-events-none" />
                  <img 
                    src={drink.foto_url} 
                    alt={drink.nome} 
                    className="w-full h-full object-cover relative z-0"
                  />
                  <h4 className="absolute bottom-3 left-4 z-30 text-xl font-bold text-white drop-shadow-md">
                    {drink.nome}
                  </h4>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="space-y-3 flex-1">
                    <div>
                      <span className="text-xs uppercase tracking-wider text-amber-500 font-bold block mb-1">Ingredientes</span>
                      <p className="text-sm text-gray-300 line-clamp-2">{drink.ingredientes}</p>
                    </div>
                    <div>
                      <span className="text-xs uppercase tracking-wider text-amber-500 font-bold block mb-1">Preparo</span>
                      <p className="text-sm text-gray-400 line-clamp-3">{drink.modo_preparo}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button 
                      onClick={() => handleEdit(drink)} 
                      className="btn-secondary flex-1"
                    >
                      Editar
                    </button>
                    <button 
                      onClick={() => handleDelete(drink.id)} 
                      className="btn-danger flex-1"
                    >
                      Excluir
                    </button>
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
