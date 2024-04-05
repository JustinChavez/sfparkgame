// @ts-ignore
import * as turf from '@turf/turf';
import { ParkFeature } from '@/types/ParkData'; // Adjust the import path as necessary
import { Map } from 'maplibre-gl';

export const calculateDistance = (
  currentPark: ParkFeature | null,
  clickedPoint: maplibregl.LngLat
): { distance: number; closestPoint: [number, number] | null } => {
  if (!currentPark) return { distance: 0, closestPoint: null };
  const currentParkFeature = currentPark;
  if (!currentParkFeature?.geometry || !Array.isArray(currentParkFeature.geometry.coordinates))
    return { distance: 0, closestPoint: null };

  const from = turf.point([clickedPoint.lng, clickedPoint.lat]);

  // Check if the clicked point is within the park area first
  let pointWithin;
  if (currentParkFeature.geometry.type === 'MultiPolygon') {
    pointWithin = turf.pointsWithinPolygon(from, turf.multiPolygon(currentParkFeature.geometry.coordinates));
  } else if (currentParkFeature.geometry.type === 'Polygon') {
    pointWithin = turf.pointsWithinPolygon(from, turf.polygon(currentParkFeature.geometry.coordinates));
  }

  if (pointWithin && pointWithin.features.length > 0) {
    return { distance: 0, closestPoint: [clickedPoint.lng, clickedPoint.lat] };
  }

  let nearestDistance = Infinity;
  let nearestPoint;

  if (currentParkFeature.geometry.type === 'MultiPolygon') {
    currentParkFeature.geometry.coordinates.forEach((polygonCoordinates: number[][][]) => {
      polygonCoordinates.forEach((linearRingCoordinates: number[][]) => {
        const line = turf.lineString(linearRingCoordinates);
        const tempNearestPoint = turf.nearestPointOnLine(line, from);
        const tempDistance = turf.distance(from, tempNearestPoint, { units: 'miles' });
        if (tempDistance < nearestDistance) {
          nearestDistance = tempDistance;
          nearestPoint = tempNearestPoint;
        }
      });
    });
  } else if (currentParkFeature.geometry.type === 'Polygon') {
    const line = turf.polygonToLine(currentParkFeature.geometry);
    if (line.geometry && Array.isArray(line.geometry.coordinates)) {
      const tempNearestPoint = turf.nearestPointOnLine(turf.lineString(line.geometry.coordinates), from);
      const tempDistance = turf.distance(from, tempNearestPoint, { units: 'miles' });
      if (tempDistance < nearestDistance) {
        nearestDistance = tempDistance;
        nearestPoint = tempNearestPoint;
      }
    }
  }

  return {
    distance: nearestDistance,
    closestPoint: nearestPoint ? (nearestPoint.geometry.coordinates as [number, number]) : null,
  };
};

export const addParkToMap = (park: ParkFeature, map: Map) => {
  if (!map) {
    return;
  }
  const layerId = `park-layer-${park.id}`;

  if (map.getLayer(layerId)) {
    map.removeLayer(layerId);
    map.removeSource(layerId);
  }

  // Add a new source with the park's geometry
  map.addSource(layerId, {
    type: 'geojson',
    data: {
      type: 'Feature',
      geometry: park.geometry,
    },
  });

  // Add a new layer to display the park
  map.addLayer({
    id: layerId,
    type: 'fill',
    source: layerId,
    layout: {},
    paint: {
      'fill-color': '#3DA35D', // Customize the fill color
      'fill-opacity': 0.7, // Customize the fill opacity
    },
  });
};

export const updateCurrentPark = async (
  selectedParks: ParkFeature[],
  totalParks: number
): Promise<ParkFeature | null> => {
  
  const remainingParks = totalParks - selectedParks.length;

  if (remainingParks === totalParks) {
    // If no parks are selected, choose a random park from the entire list
    try {

      const response = await fetch('/data/sfparks_entire2.json');
      const data = await response.json();
      const allParks = data.features as ParkFeature[];
      const randomPark = allParks[Math.floor(Math.random() * allParks.length)];
      return randomPark;
    } catch (error) {
      console.error("Error fetching park data: ", error);
      return null;
    }
  } else if (remainingParks > 0) {
    // If there are remaining parks, choose a random park from the unselected parks
    try {
      const response = await fetch('/data/sfparks_entire2.json');
      const data = await response.json();
      const allParks = data.features as ParkFeature[];
      const unselectedParks = allParks.filter((park: ParkFeature) =>
        !selectedParks.some(selectedPark => selectedPark.properties.park_name === park.properties.park_name)
      );

      if (unselectedParks.length > 0) {
        const randomPark = unselectedParks[Math.floor(Math.random() * unselectedParks.length)];
        return randomPark;
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error fetching park data: ", error);
      return null;
    }
  } else {
    // If all parks are selected, return null to indicate game completion
    return null;
  }
};