import React from 'react';
import { CATEGORY_CONFIG } from '../utils/constants';
import { getNearbyData } from '../utils/mapHelpers';

const Sidebar = ({ data, selectedIds, activeFilters }) => {
  if (selectedIds.length === 0) {
    return (
      <aside className="w-96 bg-slate-50 border-l overflow-y-auto flex flex-col">
        <div className="p-20 text-center text-slate-400 flex flex-col gap-2">
          <div className="text-lg font-medium">Click on the community on the map to start exploring</div>
          <div className="text-sm opacity-80">Click on highlighted facilities to view their information.</div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-96 bg-slate-50 border-l overflow-y-auto flex flex-col">
      {selectedIds.map((id, index) => {
        const comm = data.communities.features.find(f => 
          (f.properties.name || f.properties['@id']) === id
        );
        const { nearby, score } = getNearbyData(comm, data.facilities, activeFilters);

        return (
          <div key={id} className={`p-6 ${index === 1 ? 'border-t-4 border-blue-200 bg-white' : ''}`}>
            <h2 className="text-xl font-bold mb-1">{comm.properties.name}</h2>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                convenience score: {score}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mb-6">
              {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                <div key={key} className="text-xs bg-white p-2 border rounded flex justify-between">
                  <span>{cfg.label}</span>
                  <span className="font-bold text-blue-600">
                    {nearby.filter(f => f.properties.category === key).length}
                  </span>
                </div>
              ))}
            </div>

            <h3 className="text-sm font-bold text-slate-500 uppercase mb-2">
              Facilities List ({nearby.length})
            </h3>
            <div className="space-y-2">
              {nearby.map((f, i) => (
                <div 
                  key={i}
                  className="text-sm p-2 bg-white rounded border-l-4 shadow-sm"
                  style={{ borderColor: CATEGORY_CONFIG[f.properties.category]?.color }}
                >
                  <div className="font-medium text-slate-800">{f.properties.name}</div>
                  {/* 中英双语支持 */}
                  {f.properties['name:en'] && (
                    <div className="text-xs text-slate-500 italic mb-1">
                      {f.properties['name:en']}
                    </div>
                  )}
                  <div className="text-xs text-slate-400">
                    {f.properties.subtype} · {f.properties.opening_hours || '/'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </aside>
  );
};

export default Sidebar;