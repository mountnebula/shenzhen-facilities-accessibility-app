import { School, Hospital, ShoppingBag, Train, Dumbbell, Trees } from 'lucide-react';

export const CATEGORY_CONFIG = {
  education: { color: '#3B82F6', icon: <School size={16}/>, label: 'Education' },
  health: { color: '#EF4444', icon: <Hospital size={16}/>, label: 'Health' },
  commercial: { color: '#F59E0B', icon: <ShoppingBag size={16}/>, label: 'Commercial' },
  transport: { color: '#475b90ff', icon: <Train size={16}/>, label: 'Transport' },
  fitness: { color: '#8B5CF6', icon: <Dumbbell size={16}/>, label: 'Fitness' },
  park: { color: '#22C55E', icon: <Trees size={16}/>, label: 'Park' }
};