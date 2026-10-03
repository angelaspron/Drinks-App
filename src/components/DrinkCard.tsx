import { Drink } from '../types';

interface DrinkCardProps {
  drink: Drink;
  onClick: (drink: Drink) => void;
  onEdit?: (drink: Drink) => void;
  onDelete?: (id: string) => void;
}

export function DrinkCard({ drink, onClick, onEdit, onDelete }: DrinkCardProps) {
  return (
    <div 
      className="glass-panel p-0 overflow-hidden group hover:-translate-y-2 transition-all duration-300 flex flex-col cursor-pointer border border-white/10"
      onClick={() => onClick(drink)}
    >
      <div className="w-full h-56 relative overflow-hidden group-image shrink-0">
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
      {(onEdit || onDelete) && (
        <div className="p-4 bg-[#191c23]/80 backdrop-blur-sm flex gap-2 border-t border-white/5" onClick={(e) => e.stopPropagation()}>
          {onEdit && (
            <button 
              onClick={() => onEdit(drink)} 
              className="btn-secondary flex-1 text-sm py-2"
            >
              Editar
            </button>
          )}
          {onDelete && (
            <button 
              onClick={() => onDelete(drink.id)} 
              className="btn-danger flex-1 text-sm py-2"
            >
              Excluir
            </button>
          )}
        </div>
      )}
    </div>
  );
}
