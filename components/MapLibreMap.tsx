import React, { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl, { Map, Popup } from 'maplibre-gl';
import { russoOne } from '../utils/fonts';
import { ParkData, ParkFeature } from '@/types/ParkData';
import 'maplibre-gl/dist/maplibre-gl.css';
import { calculateDistance, addParkToMap, updateCurrentPark } from '../utils/mapUtils';
// @ts-ignore
import * as turf from '@turf/turf';

interface MapLibreMapProps {
  selectedParks: ParkFeature[];
  setSelectedParks: (parks: ParkFeature[]) => void;
  totalParks: number;
  handleGuess: (distance: number) => void;
  handleClearGame: () => void;
  guessedDistances: number[];
  setGuessedDistances: (callback: (prevDistances: number[]) => number[]) => void;
  currentPark: ParkFeature | null;
}

const MapLibreMap: React.FC<MapLibreMapProps> = ({ selectedParks, setSelectedParks, totalParks, handleGuess, handleClearGame, guessedDistances, setGuessedDistances, currentPark }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const [lastGuessedPark, setLastGuessedPark] = useState<ParkFeature | null>(null);
  const [lastClickedPoint, setLastClickedPoint] = useState<maplibregl.LngLat | null>(null);
  const [lastDistance, setLastDistance] = useState<number | null>(null);


  const handleClick = useCallback((e: { lngLat: any; }) => {
    const clickedPoint = e.lngLat;
    setLastClickedPoint(clickedPoint);
    
  
    if (currentPark && mapRef.current) {
      
      const { distance, closestPoint } = calculateDistance(currentPark, clickedPoint);
      setLastDistance(distance);

      setGuessedDistances((prevDistances: number[]) => {
        const updatedDistances = [...prevDistances, distance];
        localStorage.setItem('guessedDistances', JSON.stringify(updatedDistances));
        return updatedDistances;
      });

      // Call the handleGuess function with the guessed distance
      handleGuess(distance);
  
      addParkToMap(currentPark, mapRef.current);
  
      if (closestPoint) {
  
        const lineCoordinates = [
          [clickedPoint.lng, clickedPoint.lat],
          closestPoint
        ];
        const lineLayerId = 'line-id';
        if (mapRef.current.getLayer(lineLayerId)) {
          mapRef.current.removeLayer(lineLayerId);
          mapRef.current.removeSource(lineLayerId);
        }

        mapRef.current.addSource(lineLayerId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: lineCoordinates
            }
          }
        });
  
        mapRef.current.addLayer({
          id: lineLayerId,
          type: 'line',
          source: lineLayerId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': 'black',
            'line-width': 2,
            'line-opacity': 1,
          } as any
        });

        let midDistOffset = {
          'center': [0, 0] as [number, number],
          'top': [0, 50] as [number, number],
          'top-left': [0,0] as [number, number],
          'top-right': [0,0] as [number, number],
          'bottom': [0, -50] as [number, number],
          'bottom-left': [0, 0] as [number, number],
          'bottom-right': [0, 0] as [number, number],
          'left': [0, 0] as [number, number],
          'right': [0, 0] as [number, number]
        };

        let popupOffsets = {
          'center': [0, 0] as [number, number],
          'top': [0, 0] as [number, number],
          'top-left': [0, 0] as [number, number],
          'top-right': [0, 0] as [number, number],
          'bottom': [0, -18] as [number, number] ,
          'bottom-left': [0, -18] as [number, number],
          'bottom-right': [0, -18] as [number, number],
          'left': [38, 0] as [number, number],
          'right': [-38, 0] as [number, number]
        };
        
        const popup = new maplibregl.Popup({
          closeButton: false,
          closeOnClick: true,
          offset: popupOffsets, // Use the popupOffsets object for dynamic offsets
          className: 'custom-popup',
        });

        popup
        .setLngLat(closestPoint as [number, number])
        .setHTML(`
          <div class="w-16 h-16 bg-cover bg-center" style="background-image: url('/tree-bg.png');"></div>
        `)
        .addTo(mapRef.current);

        // Create a popup for displaying the distance
        const midDist = new maplibregl.Popup({
          closeButton: false,
          closeOnClick: true,
          offset: midDistOffset
        });

        // Add the distance label as a popup at the midpoint of the line
        const midpoint = turf.midpoint(turf.point(lineCoordinates[0]), turf.point(lineCoordinates[1]));
        midDist
          .setLngLat(midpoint.geometry.coordinates as [number, number])
          .setHTML(`<div class="text-lg">${distance.toFixed(2)} miles</div>`)
          .addTo(mapRef.current);
  
        // Calculate the bounding box of the park
        const parkBounds = turf.bbox(currentPark);
        const parkBoundsPolygon = turf.bboxPolygon(parkBounds);
  
        // Convert the clicked point to a GeoJSON Point
        const clickedPointGeoJSON = turf.point([clickedPoint.lng, clickedPoint.lat]);
  
        // Check if the clicked point is within the park bounds
        const isClickedPointInPark = turf.booleanPointInPolygon(clickedPointGeoJSON, parkBoundsPolygon);
  
        if (!isClickedPointInPark) {
          // If the clicked point is outside the park bounds, zoom out to fit the park and the clicked point
          const bounds = new maplibregl.LngLatBounds();
          bounds.extend(clickedPoint);
          bounds.extend([parkBounds[0], parkBounds[1]]);
          bounds.extend([parkBounds[2], parkBounds[3]]);
  
          mapRef.current.fitBounds(bounds, {
            padding: 100,
            duration: 750, // Increase the duration for a slower and smoother transition
            easing: (t) => t * (2 - t), // Use a custom easing function for a smoother transition
            essential: true // This ensures that the animation is not interrupted by other map interactions
          });
        }
  
      } else {
        console.warn("Closest point not found for the current park.");
      }
    }
  }, [currentPark, handleGuess]);


  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    map.on('click', handleClick);

    return () => {
      if (map) {
        map.off('click', handleClick);
      }
    };
  }, [handleClick]);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) {
      return; // Do nothing if SSR or the ref is not set
    }

    const minZoom = 10; // Minimum zoom level
    const maxZoom = 15; // Maximum zoom level
    const bounds: [number, number, number, number] = [-122.60, 37.68, -122.30, 37.845]; // [west, south, east, north]

    const map = new Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {},
        layers: [
          {
            "id": "background",
            "type": "background",
            "paint": {"background-color": "#fff"}
          }
        ],
      },
      center: [-122.42, 37.77], // San Francisco coordinates
      zoom: 12,
      minZoom: minZoom,
      maxZoom: maxZoom,
      maxBounds: bounds
    });

    // Assign the map instance to the ref
    mapRef.current = map;

    // map.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.on('load', async () => {
      // Load the image for the water pattern
      map.loadImage('water-ripple.jpeg', (error, image) => {
        if (error) throw error;

        // Check if the image is loaded
        if (image) {
          // Add the image to the map style
          map.addImage('water-pattern', image);

          // Now add your water source and layer as before
          map.addSource('water-source', {
            type: 'geojson',
            data: '/data/water.json',
          });

          map.addLayer({
            id: 'water-layer',
            type: 'fill',
            source: 'water-source',
            paint: {
              'fill-pattern': 'water-pattern', // Use the image as the fill pattern
            },
          });

          // Add your streets source and layer as before
          map.addSource('sfstreets-source', {
            type: 'geojson',
            data: '/data/sfstreets.json',
          });

          map.addLayer({
            id: 'sfstreets-layer',
            type: 'line',
            source: 'sfstreets-source',
            paint: {
              'line-color': 'gray', // Use a muted color
              'line-opacity': 0.7, // Adjust opacity if needed
              'line-width': {
                type: 'exponential',
                stops: [
                  [12, 1], // Zoom level 12 and below, line width 1
                  [14, 2], // Zoom level 14, line width 2
                  [16, 4], // Zoom level 16 and above, line width 4
                ]
              },
              'line-dasharray': [2, 2], // Create a dashed line pattern
            },
          });

          // Add your parks source and layer with a distinctive outline
          map.addSource('sfparks-source', {
            type: 'geojson',
            data: '/data/sfparks_entire2.json',
          });

          let popupOffsets = {
            'center': [0, 0] as [number, number],
            'top': [0, 50] as [number, number],
            'top-left': [0,0] as [number, number],
            'top-right': [0,0] as [number, number],
            'bottom': [0, -50] as [number, number],
            'bottom-left': [0, 0] as [number, number],
            'bottom-right': [0, 0] as [number, number],
            'left': [0, 0] as [number, number],
            'right': [0, 0] as [number, number]
          };

          // Create a popup, but don't add it to the map yet.
          const popup = new Popup({
            closeButton: false,
            closeOnClick: false,
            offset: popupOffsets
          });

          let hoveredParkId: number | string | null = null;

          map.addLayer({
            id: 'sfparks-highlight-layer', 
            type: 'fill',
            source: 'sfparks-source',
            paint: {
              'fill-color': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                '#32CD32', // Light green color when not hovered
                'transparent' // Transparent color when hovered
              ],
              'fill-opacity': 1, // Customize the fill opacity
            },
          });

          map.on('mousemove', 'sfparks-highlight-layer', (e) => {
            const features = map.queryRenderedFeatures(e.point, { layers: ['sfparks-highlight-layer'] });
            if (features.length > 0) {
              const feature = features[0];
              const layerId = `park-layer-${feature.id}`;

              let parkFillQuery = [];
              if (map.getLayer(layerId)) {
                parkFillQuery = map.queryRenderedFeatures(e.point, { layers: [layerId] });
                popup.setLngLat(e.lngLat)
                  .setHTML(`<span style="color: black; font-size: large; font-weight: bold;">${feature.properties.park_name}</span>`)
                  .addTo(map);
              }
            }
          });

          map.on('mouseleave', 'sfparks-highlight-layer', () => {
            popup.remove();
            if (hoveredParkId !== null) {
              map.setFeatureState({ source: 'sfparks-source', id: hoveredParkId }, { hover: false });
              hoveredParkId = null;
            }
          });
        }

        // Fetch or retrieve your parks data here if not already available
        const savedParks = localStorage.getItem('selectedParks');
        const parsedParks: ParkFeature[] = savedParks ? JSON.parse(savedParks) : [];

        setSelectedParks(parsedParks);

        const savedDistances = localStorage.getItem('guessedDistances');
        const parsedDistances: number[] = savedDistances ? JSON.parse(savedDistances) : [];
        setGuessedDistances(() => parsedDistances);
        
        parsedParks.forEach(park => addParkToMap(park, map));

        map.getCanvasContainer().style.cursor = 'crosshair';
      });
    });

    return () => {
      map.remove();
    };
  }, [setSelectedParks, setGuessedDistances, totalParks]);

  return (
    <div className="relative w-screen h-screen">
      <div ref={mapContainerRef} className="w-full h-full"/>
      <div className="absolute bottom-2 right-2 z-10">
        <div className="flex items-center whitespace-nowrap">
          Made with <img src="/heart.png" alt="heart" className="w-4 h-4 inline mx-1" /> by
        </div>
        <div className="text-right">
          <a href="https://twitter.com/jus10chavez" target="_blank" rel="noopener noreferrer" className={`${russoOne.className}`}>
            Justin Chavez
          </a>
        </div>
      </div>
    </div>
  );
};

export default MapLibreMap;