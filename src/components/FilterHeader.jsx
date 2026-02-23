import { CATEGORY_CONFIG } from '../utils/constants';

const FilterHeader = ({ activeFilters, setActiveFilters }) => {
  const toggleFilter = (key) => {
    setActiveFilters(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  return (
    <header className="h-16 bg-white border-b shadow-sm flex items-center px-6 z-[1000] justify-between">
      <h1 className="text-xl font-bold text-blue-600">
        The Convenience of Residential Communities in Shenzhen
      </h1>
      <div className="flex gap-2">
        {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => toggleFilter(key)}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm border transition ${
              activeFilters.includes(key) ? 'bg-slate-100 border-blue-500 text-blue-600' : 'opacity-50'
            }`}
          >
            {cfg.icon} {cfg.label}
          </button>
        ))}
      </div>
    </header>
  );
};

export default FilterHeader;