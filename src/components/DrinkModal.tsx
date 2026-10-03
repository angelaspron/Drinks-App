import { Drink } from '../types';
import { Wine, AlignLeft } from 'lucide-react';
import { createPortal } from 'react-dom';

interface DrinkModalProps {
  drink: Drink;
  onClose: () => void;
  onEdit?: (drink: Drink) => void;
}

export function DrinkModal({ drink, onClose, onEdit }: DrinkModalProps) {
  return createPortal(
    <div 
      className="fixed inset-0 z-50 bg-black/80 flex justify-center items-center p-4 backdrop-blur-sm" 
      onClick={onClose}
    >
      <div 
        className="bg-gray-900 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl relative shadow-2xl flex flex-col border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white text-3xl font-bold z-10 w-10 h-10 flex items-center justify-center bg-black/50 rounded-full"
        >
          &times;
        </button>
        
        <div className="w-full h-[250px] sm:h-[300px] bg-black flex justify-center items-center p-4 rounded-t-xl relative shrink-0">
          <img 
            src={drink.foto_url} 
            alt={drink.nome} 
            className="max-w-full max-h-full object-contain drop-shadow-lg"
          />
        </div>
        
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-3xl font-bold text-white">{drink.nome}</h2>
            {onEdit && (
              <button 
                onClick={() => onEdit(drink)}
                className="btn-secondary whitespace-nowrap"
              >
                Editar Receita
              </button>
            )}
          </div>
          
          <div className="bg-gray-800 p-4 rounded-lg mt-6 border border-white/5">
            <h3 className="text-sm uppercase tracking-wider text-amber-500 font-bold mb-3 flex items-center">
              <Wine className="mr-2" size={18} />
              Ingredientes
            </h3>
            <ul className="list-disc list-inside text-gray-300 space-y-1">
              {drink.ingredientes.map((ing, idx) => (
                <li key={idx} className="leading-relaxed text-base">{ing}</li>
              ))}
            </ul>
          </div>
          
          <div className="bg-gray-800 p-4 rounded-lg mt-4 border border-white/5">
            <h3 className="text-sm uppercase tracking-wider text-amber-500 font-bold mb-3 flex items-center">
              <AlignLeft className="mr-2" size={18} />
              Modo de Preparo
            </h3>
            <p className="text-gray-300 whitespace-pre-wrap leading-relaxed text-base">
              {drink.modo_preparo}
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
