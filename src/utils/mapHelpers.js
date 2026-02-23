import * as turf from '@turf/turf';

/**
 * 将 OpenStreetMap 的原始标签映射到定义的分类中
 * @param {Object} props - GeoJSON 要素的属性 (properties)
 * @returns {Object} 包含 category 和 subtype 的对象
 */
export const mapOSMTagsToCategory = (props) => {
  // 1. 医疗
  if (props.amenity === 'hospital' || props.amenity === 'clinic') {
    return { 
      category: 'health', 
      subtype: props.amenity === 'hospital' ? 'hospital' : 'clinic' 
    };
  }
  
  // 2. 教育
  if (props.amenity === 'school' || props.amenity === 'kindergarten') {
    return { 
      category: 'education', 
      subtype: props.amenity === 'school' ? 'school' : 'kindergarten' 
    };
  }
  
  // 3. 商业
  if (props.shop === 'supermarket' || props.shop === 'mall') {
    return { 
      category: 'commercial', 
      subtype: props.shop === 'supermarket' ? 'supermarket' : 'mall' 
    };
  }
  
  // 4. 健身
  if (props.leisure === 'fitness_centre' || props.amenity === 'gym') {
    return { 
      category: 'fitness', 
      subtype: 'gym' 
    };
  }
  
  // 5. 公园 (支持面状要素检测)
  if (props.leisure === 'park') {
    return { 
      category: 'park', 
      subtype: 'park' 
    };
  }
  
  // 6. 交通 (细分地铁站和公交站)
  if (props.highway === 'bus_stop' || props.station === 'subway') {
    return { 
      category: 'transport', 
      subtype: props.station === 'subway' ? 'subway_station' : 'bus_stop' 
    };
  }
  
  // 默认兜底分类
  return { category: 'other', subtype: 'other_facilities' };
};

/**
 * 空间计算：获取选中区域周边的设施
 * @param {Object} communityFeature - 选中的小区要素
 * @param {Object} facilitiesData - 完整的设施 GeoJSON 数据
 * @param {Array} activeFilters - 当前激活的分类过滤器
 * @returns {Object} 包含附近设施列表、得分、中心点及1km缓冲区
 */
export const getNearbyData = (communityFeature, facilitiesData, activeFilters) => {
  // 基础校验
  if (!communityFeature || !facilitiesData) {
    return { nearby: [], score: 0, center: null, buffer1km: null };
  }

  // 计算中心点
  const center = turf.centroid(communityFeature);
  // 创建 1km 和 500m 的缓冲区 (Units: kilometers)
  const buffer1km = turf.buffer(center, 1.0, { units: 'kilometers' });
  const buffer500m = turf.buffer(center, 0.5, { units: 'kilometers' });
  
  // 初始筛选：根据距离和过滤器过滤
  const nearbyRaw = facilitiesData.features.filter(f => {
    const category = f.properties.category;
    const subtype = f.properties.subtype;

    // 检查分类是否被过滤器选中
    if (!activeFilters.includes(category)) return false;

    // 空间逻辑判断：
    // 使用 booleanIntersects 兼容 Point (点) 和 Polygon (面，如公园)
    if (subtype === 'bus_stop') {
      // 需求：公交站只取 500 米以内
      return turf.booleanIntersects(f, buffer500m);
    }
    
    // 其他设施取 1 公里以内
    return turf.booleanIntersects(f, buffer1km);
  });

  // 去重逻辑：如果名称相同（如公交站 A 方向和 B 方向），只保留一个
  const seenNames = new Set();
  const nearby = nearbyRaw.filter(f => {
    const name = f.properties.name;
    const isDuplicate = seenNames.has(name);
    seenNames.add(name);
    return !isDuplicate;
  });

  // 计算便利性得分：基础逻辑为设施数量 * 5，最高 100 分
  const score = Math.min(100, nearby.length * 5);

  return { nearby, score, center, buffer1km };
};