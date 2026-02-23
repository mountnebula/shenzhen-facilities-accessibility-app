import React from 'react';
import { GeoJSON, Circle, Popup } from 'react-leaflet';
import * as turf from '@turf/turf';
import { CATEGORY_CONFIG } from '../utils/constants';
import { getNearbyData } from '../utils/mapHelpers';

const MapContent = ({ data, selectedIds, setSelectedIds, activeFilters }) => {
  const handleCommunityClick = (feature) => {
    const id = feature.properties.name || feature.properties['@id'];
    if (!id) return;
    setSelectedIds(prev => {
      if (prev.includes(id)) return prev.filter(i => i !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  return (
    <>
      {/* 1. 地铁线底图：过滤站点，只留线条 */}
      {data.metro && (
        <GeoJSON
          data={data.metro} 
          filter={(feature) => 
            feature.geometry.type === 'LineString' || feature.geometry.type === 'MultiLineString'
          }
          style={{ color: '#78a9a2ff', weight: 2, opacity: 0.5, interactive: false }}
        />
      )}

      {/* 2. 小区斑块图层 */}
      {data.communities && (
        <GeoJSON
          data={data.communities}
          onEachFeature={(feature, layer) => {
            const name = feature.properties.name || "unknown";
            const isSelected = selectedIds.includes(name);

            layer.bindTooltip(name, {
              permanent: isSelected, // 选中常亮，平衡性能
              direction: 'center',
              sticky: true,
              className: isSelected ? 'label-active' : 'label-hover' 
            });

            layer.on('click', () => handleCommunityClick(feature));
            layer.on('mouseover', () => !isSelected && layer.openTooltip());
            layer.on('mouseout', () => !isSelected && layer.closeTooltip());
          }}
          style={(f) => ({
            fillColor: selectedIds.includes(f.properties.name) ? '#3B82F6' : '#94A3B8',
            weight: 2, color: 'white', fillOpacity: 0.6
          })}
        />
      )}

      {/* 3. 选中小区后的生活圈与高亮设施 */}
      {selectedIds.map(id => {
        const comm = data.communities.features.find(f => (f.properties.name || f.properties['@id']) === id);
        const { nearby, center, buffer1km } = getNearbyData(comm, data.facilities, activeFilters);

        // 高亮经过 1km 圈内的地铁线
        const highlightedLines = data.metro ? {
          ...data.metro,
          features: data.metro.features.filter(feature =>
            (feature.geometry.type === 'LineString' || feature.geometry.type === 'MultiLineString') &&
             turf.booleanIntersects(feature, buffer1km) // 修复了之前的 line 变量错误
          )
        } : null;

        return (
          <React.Fragment key={id}>
            {/* 动态高亮地铁线 */}
            {highlightedLines && (
              <GeoJSON data={highlightedLines} style={{ color: '#288264ff', weight: 2.5, opacity: 0.9 }} />
            )}
            
            {/* 1.2km 生活圈外圈 */}
            <Circle 
              center={[center.geometry.coordinates[1], center.geometry.coordinates[0]]} 
              radius={1200} 
              pathOptions={{ color: '#3B82F6', fillOpacity: 0.1, dashArray: '5, 10' }} 
            />

            {/* 圈内设施渲染 */}
            {nearby.map((f, idx) => {
              const categoryColor = CATEGORY_CONFIG[f.properties.category]?.color;
              
              // 处理点状要素 (车站、商场等)
              if (f.geometry.type === 'Point') {
                let pointColor = categoryColor;
                if (f.properties.subtype === 'subway_station') pointColor = '#059669'; // 地铁绿
                if (f.properties.subtype === 'bus_stop') pointColor = '#475b90ff'; // 公交蓝

                return (
                  <Circle
                    key={`${id}-p-${idx}`}
                    center={[f.geometry.coordinates[1], f.geometry.coordinates[0]]} 
                    radius={30} 
                    pathOptions={{ fillColor: pointColor, fillOpacity: 1, stroke: true, color: 'white', weight: 2 }}
                  >
                    <Popup>
                      <div className="font-bold">{f.properties.name}</div>
                      {f.properties['name:en'] && (
                        <div className="text-xs text-slate-500 italic">{f.properties['name:en']}</div>
                      )}
                    </Popup>
                  </Circle>
                );
              }
              
              // 处理面状要素 (公园)
              if (f.geometry.type.includes('Polygon')) {
                return (
                  <GeoJSON
                    key={`${id}-s-${idx}`}
                    data={f}
                    style={{ color: '#7dc798ff', fillColor: '#7dc798ff', fillOpacity: 0.5, weight: 1 }}
                  >
                    <Popup>
                      <div className="font-bold">{f.properties.name}</div>
                      {f.properties['name:en'] && (
                        <div className="text-xs text-slate-500 italic">{f.properties['name:en']}</div>
                      )}
                    </Popup>
                  </GeoJSON>
                );
              }
              return null;
            })}
          </React.Fragment>
        );
      })}
    </>
  );
};

export default MapContent;