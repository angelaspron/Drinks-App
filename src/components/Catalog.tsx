import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  const [selectedDrink, setSelectedDrink] = useState<Drink | null>(null);
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

  const fecharModal = () => {
    setSelectedDrink(null);
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
              <div 
                key={drink.id} 
                className="glass-panel p-0 overflow-hidden group hover:-translate-y-2 transition-all duration-300 flex flex-col cursor-pointer"
                onClick={() => setSelectedDrink(drink)}
              >
                <div className="w-full h-56 relative overflow-hidden group-image">
                  <div className="absolute inset-0 bg-gradient-to-t from-[#191c23]/90 to-transparent z-10 pointer-events-none" />
                  <img 
                    src={drink.foto_url} 
                    alt={drink.nome} 
                    className="w-full h-full object-cover relative z-0 transition-transform duration-500 group-hover:scale-105"
                  />
                  <h4 className="absolute bottom-3 left-4 z-30 text-xl font-bold text-white drop-shadow-md pointer-events-none">
                    {drink.nome}
                  </h4>
                </div>
                <div className="p-4 bg-[#191c23]/80 backdrop-blur-sm flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <button 
                    onClick={() => handleEdit(drink)} 
                    className="btn-secondary flex-1 text-sm py-2"
                  >
                    Editar
                  </button>
                  <button 
                    onClick={() => handleDelete(drink.id)} 
                    className="btn-danger flex-1 text-sm py-2"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Modal de Detalhes do Drink */}
      {selectedDrink && document.body && createPortal(
        <div 
          className="fixed inset-0 z-50 bg-black/80 flex justify-center items-center p-4" 
          onClick={fecharModal}
          style={{ position: 'fixed', top: 0, right: 0, bottom: 0, left: 0, zIndex: 9999, backgroundColor: 'rgba(0, 0, 0, 0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}
        >
          <div 
            className="bg-gray-900 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl relative shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
            style={{ backgroundColor: '#111827', width: '100%', maxWidth: '42rem', maxHeight: '90vh', overflowY: 'auto', borderRadius: '0.75rem', position: 'relative', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}
          >
            {/* Botão de Fechar */}
            <button 
              onClick={fecharModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-3xl font-bold z-10 cursor-pointer"
              style={{ background: 'transparent', border: 'none', position: 'absolute', top: '1rem', right: '1rem', zIndex: 10, cursor: 'pointer', lineHeight: 1 }}
            >
              &times;
            </button>
            
            {/* Foto Area */}
            <div 
              className="w-full h-[250px] sm:h-[300px] bg-black flex justify-center items-center p-4 rounded-t-xl relative"
              style={{ width: '100%', height: '280px', backgroundColor: '#000000', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem', borderTopLeftRadius: '0.75rem', borderTopRightRadius: '0.75rem', position: 'relative', flexShrink: 0 }}
            >
              <img 
                src={selectedDrink.foto_url} 
                alt={selectedDrink.nome} 
                className="max-w-full max-h-full object-contain drop-shadow-lg"
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              />
            </div>
            
            {/* Content Area */}
            <div className="p-6" style={{ padding: '1.5rem' }}>
              {/* Top Row: Title + Edit Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-3xl font-bold text-white">{selectedDrink.nome}</h2>
                <button 
                  onClick={() => {
                    const drinkToEdit = selectedDrink;
                    setSelectedDrink(null);
                    handleEdit(drinkToEdit);
                  }}
                  className="btn-secondary whitespace-nowrap"
                >
                  Editar Receita
                </button>
              </div>
              
              {/* Ingredientes Card */}
              <div className="bg-gray-800 p-4 rounded-lg mt-4" style={{ backgroundColor: '#1f2937', padding: '1rem', borderRadius: '0.5rem', marginTop: '1rem' }}>
                <h3 className="text-sm uppercase tracking-wider text-amber-500 font-bold mb-3 flex items-center">
                  <Wine className="mr-2" size={18} />
                  Ingredientes
                </h3>
                <p className="text-gray-300 whitespace-pre-wrap leading-relaxed text-base">{selectedDrink.ingredientes}</p>
              </div>
              
              {/* Modo de Preparo Card */}
              <div className="bg-gray-800 p-4 rounded-lg mt-4" style={{ backgroundColor: '#1f2937', padding: '1rem', borderRadius: '0.5rem', marginTop: '1rem' }}>
                <h3 className="text-sm uppercase tracking-wider text-amber-500 font-bold mb-3 flex items-center">
                  <AlignLeft className="mr-2" size={18} />
                  Modo de Preparo
                </h3>
                <p className="text-gray-300 whitespace-pre-wrap leading-relaxed text-base">{selectedDrink.modo_preparo}</p>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
