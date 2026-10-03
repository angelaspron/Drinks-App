export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface Drink {
  id: string;
  nome: string;
  foto_url: string;
  ingredientes: string[];
  modo_preparo: string;
  categorias: string[]; // array of category IDs
}
