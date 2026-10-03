import { useState, useEffect, useRef } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { Plus, Wine, AlignLeft, Upload, X, Save, Trash2 } from 'lucide-react';
import { Category, Drink } from '../types';

const ICONS = ['Wine', 'Beer', 'Coffee', 'Droplets', 'Martini', 'GlassWater'];

export function Registration() {
  const [activeTab, setActiveTab] = useState<'recipes' | 'categories'>('recipes');

  // Recipes State
  const [nome, setNome] = useState('');
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [ingredientes, setIngredientes] = useState<string[]>(['']);
  const [modoPreparo, setModoPreparo] = useState('');
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Categories State
  const [catName, setCatName] = useState('');
  const [catIcon, setCatIcon] = useState('Wine');
  
  // Data State
  const [categories, setCategories] = useState<Category[]>([]);
  const [drinks, setDrinks] = useState<Drink[]>([]);
  
  const [editingDrinkId, setEditingDrinkId] = useState<string | null>(null);
  const [editingDrinkFoto, setEditingDrinkFoto] = useState<string | null>(null);

  useEffect(() => {
    const qCat = query(collection(db, 'categorias'), orderBy('name', 'asc'));
    const unsubCat = onSnapshot(qCat, (snapshot) => {
      const catData: Category[] = [];
      snapshot.forEach(doc => {
        catData.push({ id: doc.id, ...doc.data() } as Category);
      });
      setCategories(catData);
    });

    const qDrinks = query(collection(db, 'drinks'), orderBy('created_at', 'desc'));
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

  // --- Handlers for Recipes ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFotoFile(file);
      setFotoPreview(URL.createObjectURL(file));
    }
  };

  const handleAddIngredient = () => {
    setIngredientes([...ingredientes, '']);
  };

  const handleRemoveIngredient = (index: number) => {
    const newIngs = [...ingredientes];
    newIngs.splice(index, 1);
    setIngredientes(newIngs);
  };

  const handleIngredientChange = (index: number, value: string) => {
    const newIngs = [...ingredientes];
    newIngs[index] = value;
    setIngredientes(newIngs);
  };

  const toggleCategory = (id: string) => {
    if (selectedCats.includes(id)) {
      setSelectedCats(selectedCats.filter(catId => catId !== id));
    } else {
      setSelectedCats([...selectedCats, id]);
    }
  };

  const resetRecipeForm = () => {
    setNome('');
    setFotoFile(null);
    if (fotoPreview) {
      URL.revokeObjectURL(fotoPreview);
      setFotoPreview(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
    setIngredientes(['']);
    setModoPreparo('');
    setSelectedCats([]);
    setEditingDrinkId(null);
    setEditingDrinkFoto(null);
  };

  const handleEditDrink = (drink: Drink) => {
    setNome(drink.nome);
    setIngredientes(drink.ingredientes.length ? drink.ingredientes : ['']);
    setModoPreparo(drink.modo_preparo);
    setSelectedCats(drink.categorias);
    setEditingDrinkId(drink.id);
    setEditingDrinkFoto(drink.foto_url);
    
    setFotoFile(null);
    if (fotoPreview) {
      URL.revokeObjectURL(fotoPreview);
      setFotoPreview(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteDrink = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta receita?')) {
      try {
        await deleteDoc(doc(db, 'drinks', id));
        if (editingDrinkId === id) resetRecipeForm();
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleRecipeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || ingredientes.every(i => !i.trim()) || !modoPreparo || selectedCats.length === 0) {
      alert('Preencha todos os campos e selecione pelo menos uma categoria.');
      return;
    }

    const apiKey = import.meta.env.VITE_IMGBB_API_KEY;
    if (fotoFile && !apiKey) {
      alert('Chave da API do ImgBB não encontrada');
      return;
    }

    setIsSubmitting(true);
    try {
      let finalFotoUrl = editingDrinkId && editingDrinkFoto 
        ? editingDrinkFoto 
        : 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=600';

      if (fotoFile) {
        const formData = new FormData();
        formData.append('image', fotoFile);
        const imgbbResponse = await fetch(`https://api.imgbb.com/1/upload?key=${import.meta.env.VITE_IMGBB_API_KEY}`, {
          method: 'POST',
          body: formData,
        });

        if (!imgbbResponse.ok) throw new Error(`ImgBB fail: ${imgbbResponse.status}`);

        const imgbbData = await imgbbResponse.json();
        if (imgbbData?.data?.display_url) {
          finalFotoUrl = imgbbData.data.display_url;
        }
      }

      if (editingDrinkId) {
        await updateDoc(doc(db, 'drinks', editingDrinkId), {
          nome,
          foto_url: finalFotoUrl,
          ingredientes: ingredientes.filter(i => i.trim() !== ''),
          modo_preparo: modoPreparo,
          categorias: selectedCats
        });
        alert('Receita atualizada com sucesso!');
      } else {
        await addDoc(collection(db, 'drinks'), {
          nome,
          foto_url: finalFotoUrl,
          ingredientes: ingredientes.filter(i => i.trim() !== ''),
          modo_preparo: modoPreparo,
          categorias: selectedCats,
          created_at: serverTimestamp()
        });
        alert('Receita cadastrada com sucesso!');
      }

      resetRecipeForm();
    } catch (error: any) {
      console.error('Erro ao salvar drink:', error);
      alert(`Falha no processo: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Handlers for Categories ---
  const handleCatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName) return;

    try {
      await addDoc(collection(db, 'categorias'), {
        name: catName,
        icon: catIcon,
        created_at: serverTimestamp()
      });
      setCatName('');
      setCatIcon('Wine');
      alert('Categoria criada!');
    } catch (error) {
      console.error(error);
      alert('Erro ao criar categoria.');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta categoria?')) {
      try {
        await deleteDoc(doc(db, 'categorias', id));
      } catch (error) {
        console.error(error);
      }
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-3xl mx-auto">
      {/* Tabs */}
      <div className="flex bg-black/40 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab('recipes')}
          className={`flex-1 py-3 text-center rounded-lg transition-all font-semibold ${
            activeTab === 'recipes' ? 'bg-amber-500 text-white shadow-md' : 'text-gray-400 hover:text-white'
          }`}
        >
          Receitas
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`flex-1 py-3 text-center rounded-lg transition-all font-semibold ${
            activeTab === 'categories' ? 'bg-amber-500 text-white shadow-md' : 'text-gray-400 hover:text-white'
          }`}
        >
          Categorias
        </button>
      </div>

      {/* Receitas Tab */}
      {activeTab === 'recipes' && (
        <section className="glass-panel animate-slide-up">
          <h3 className="text-xl font-semibold mb-6 flex items-center text-amber-500">
            <Plus className="mr-2" size={24} />
            {editingDrinkId ? 'Editar Receita' : 'Cadastrar Receita'}
          </h3>
          <form onSubmit={handleRecipeSubmit} className="space-y-6">
            
            {/* Nome e Foto */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Nome do Drink</label>
                <div className="relative">
                  <Wine className="absolute left-3 top-3.5 text-gray-500" size={18} />
                  <input 
                    type="text" 
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="pl-10 p-3 w-full"
                    placeholder="Ex: Mojito Clássico"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Foto do Drink</label>
                <div className="relative">
                  <Upload className="absolute left-3 top-3.5 text-gray-500" size={18} />
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileChange}
                    className="pl-10 p-2 w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-amber-500/10 file:text-amber-500 hover:file:bg-amber-500/20 focus:outline-none bg-[#14161c] border border-white/5 rounded-lg"
                  />
                </div>
                {fotoPreview && (
                  <div className="mt-3 relative w-full h-32 bg-gray-900/50 rounded-lg flex justify-center items-center overflow-hidden border border-gray-700/50">
                    <img src={fotoPreview} alt="Preview" className="max-h-full max-w-full object-contain" />
                    <button 
                      type="button" 
                      onClick={() => {
                        setFotoFile(null);
                        URL.revokeObjectURL(fotoPreview);
                        setFotoPreview(null);
                      }} 
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-lg"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Categorias (Checkboxes) */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Categorias (Selecione pelo menos uma)</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {categories.map(cat => (
                  <label key={cat.id} className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedCats.includes(cat.id) 
                      ? 'border-amber-500 bg-amber-500/10 text-amber-400' 
                      : 'border-white/10 bg-black/20 text-gray-400 hover:bg-black/40'
                  }`}>
                    <input 
                      type="checkbox" 
                      checked={selectedCats.includes(cat.id)}
                      onChange={() => toggleCategory(cat.id)}
                      className="hidden"
                    />
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                      selectedCats.includes(cat.id) ? 'bg-amber-500 border-amber-500 text-black' : 'border-gray-500'
                    }`}>
                      {selectedCats.includes(cat.id) && <Plus size={12} className="rotate-45" />}
                    </div>
                    {cat.name}
                  </label>
                ))}
              </div>
            </div>

            {/* Ingredientes Dinâmicos */}
            <div>
              <label className="block text-sm text-gray-400 mb-2 flex justify-between items-center">
                <span>Ingredientes</span>
                <button type="button" onClick={handleAddIngredient} className="text-amber-500 text-xs flex items-center hover:text-amber-400">
                  <Plus size={14} className="mr-1"/> Adicionar
                </button>
              </label>
              <div className="space-y-3">
                {ingredientes.map((ing, index) => (
                  <div key={index} className="flex gap-2">
                    <input 
                      type="text" 
                      value={ing}
                      onChange={(e) => handleIngredientChange(index, e.target.value)}
                      className="flex-1 p-3"
                      placeholder={`Ingrediente ${index + 1}`}
                      required
                    />
                    {ingredientes.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => handleRemoveIngredient(index)}
                        className="p-3 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-all border border-red-500/20"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Modo de Preparo */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Modo de Preparo</label>
              <div className="relative">
                <AlignLeft className="absolute left-3 top-4 text-gray-500" size={18} />
                <textarea 
                  value={modoPreparo}
                  onChange={(e) => setModoPreparo(e.target.value)}
                  className="pl-10 p-4 min-h-[150px] resize-y text-lg"
                  rows={6}
                  placeholder="Descreva o passo a passo..."
                  required
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                type="submit" 
                disabled={isSubmitting || selectedCats.length === 0}
                className="btn-primary flex-1 py-4 text-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="mr-2" />
                {isSubmitting ? 'Salvando...' : editingDrinkId ? 'Atualizar Receita' : 'Salvar Receita'}
              </button>
              {editingDrinkId && (
                <button 
                  type="button" 
                  onClick={resetRecipeForm}
                  disabled={isSubmitting}
                  className="px-6 py-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-all disabled:opacity-50"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>

          {/* List of existing recipes to edit/delete */}
          <div className="mt-12">
            <h4 className="text-lg font-semibold text-gray-200 mb-4 border-b border-white/10 pb-2">Receitas Cadastradas</h4>
            <div className="space-y-3">
              {drinks.map(drink => (
                <div key={drink.id} className="bg-black/30 p-3 rounded-lg flex items-center justify-between border border-white/5">
                  <div className="flex items-center gap-3">
                    <img src={drink.foto_url} alt={drink.nome} className="w-10 h-10 rounded object-cover" />
                    <span className="font-medium text-gray-200">{drink.nome}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleEditDrink(drink)}
                      className="text-gray-400 hover:text-amber-500 transition-colors p-2 bg-white/5 rounded"
                    >
                      Editar
                    </button>
                    <button 
                      onClick={() => handleDeleteDrink(drink.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-2 bg-white/5 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              {drinks.length === 0 && (
                <p className="text-gray-500 text-sm">Nenhuma receita cadastrada.</p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Categorias Tab */}
      {activeTab === 'categories' && (
        <section className="glass-panel animate-slide-up">
          <h3 className="text-xl font-semibold mb-6 flex items-center text-amber-500">
            <Plus className="mr-2" size={24} />
            Gerenciar Categorias
          </h3>
          <form onSubmit={handleCatSubmit} className="flex gap-4 items-end mb-8">
            <div className="flex-1">
              <label className="block text-sm text-gray-400 mb-2">Nome da Categoria</label>
              <input 
                type="text" 
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder="Ex: Clássicos"
                className="p-3"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Ícone</label>
              <select 
                value={catIcon}
                onChange={(e) => setCatIcon(e.target.value)}
                className="p-3 bg-[#0a1526] border border-white/10 rounded-lg text-white"
              >
                {ICONS.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <button type="submit" className="btn-primary py-3 px-6 h-[50px]">Adicionar</button>
          </form>

          <div>
            <h4 className="text-sm text-gray-400 mb-4">Categorias Cadastradas</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {categories.map(cat => (
                <div key={cat.id} className="bg-black/30 p-3 rounded-lg flex items-center justify-between border border-white/5">
                  <span className="font-medium text-gray-200">{cat.name}</span>
                  <button 
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="text-gray-500 hover:text-red-500 transition-colors p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {categories.length === 0 && (
                <p className="text-gray-500 text-sm col-span-full">Nenhuma categoria cadastrada.</p>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
