import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './styles.css';

// 导入自定义组件
import FilterHeader from './components/FilterHeader';
import Sidebar from './components/SideBar';
import MapContent from './components/MapContent';

// 导入工具函数和配置
import { CATEGORY_CONFIG } from './utils/constants';
import { mapOSMTagsToCategory } from './utils/mapHelpers';

export default function App() {
  // 1. 初始化全局状态
  const [data, setData] = useState({ communities: null, facilities: null, metro: null });
  const [selectedIds, setSelectedIds] = useState([]); // 存储选中小区的名称或ID
  const [activeFilters, setActiveFilters] = useState(Object.keys(CATEGORY_CONFIG));
  const [loading, setLoading] = useState(true);

  // 2. 加载并预处理数据
  useEffect(() => {
    Promise.all([
      fetch('/communities.geojson').then(res => res.json()),
      fetch('/facilities.geojson').then(res => res.json()),
      fetch('/metro_lines.geojson').then(res => res.json())
    ]).then(([comm, fac, met]) => {
      // 在加载阶段就完成 OSM 标签到分类的映射，提升后续交互性能
      const processedFac = {
        ...fac,
        features: fac.features.map(f => {
          const mapping = mapOSMTagsToCategory(f.properties);
          return {
            ...f,
            properties: {
              ...f.properties,
              category: mapping.category,
              subtype: mapping.subtype,
              // 优先级：原有name > 中文名 > 分类名
              name: f.properties.name || f.properties['name:zh'] || mapping.subtype
            }
          };
        })
      };

      setData({ communities: comm, facilities: processedFac, metro: met });
      setLoading(false);
    });
  }, []);

  // 加载状态提示
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 font-sans">
        <div className="text-center">
          <div className="text-xl font-bold text-blue-600 mb-2">Shenzhen Data Loading...</div>
          <div className="text-slate-400">Processing 16,000+ communities...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden font-sans text-slate-800">
      {/* 顶部标题与分类过滤器组件 */}
      <FilterHeader 
        activeFilters={activeFilters} 
        setActiveFilters={setActiveFilters} 
      />

      <div className="flex flex-1 overflow-hidden">
        {/* 地图主区域 */}
        <main className="flex-1 relative">
          <MapContainer 
            center={[22.54, 114.05]} 
            zoom={12} 
            className="h-full w-full"
            preferCanvas={true} // 启用 Canvas 渲染以提升万级数据下的缩放性能
          >
            {/* 极简底图图层 */}
            <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />

            {/* 地图核心内容组件：负责渲染所有 GeoJSON、Circle 和交互逻辑 */}
            <MapContent 
              data={data}
              selectedIds={selectedIds}
              setSelectedIds={setSelectedIds}
              activeFilters={activeFilters}
            />
          </MapContainer>
        </main>

        {/* 右侧边栏组件：负责展示详情和设施清单 */}
        <Sidebar 
          data={data}
          selectedIds={selectedIds}
          activeFilters={activeFilters}
        />
      </div>
    </div>
  );
}