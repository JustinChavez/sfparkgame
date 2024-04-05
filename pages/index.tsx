import React, { useState, useEffect } from 'react';
import MapLibreMap from '../components/MapLibreMap';
import ClippyBox from '../components/ClippyBox';
import { ParkFeature } from '@/types/ParkData';
import { updateCurrentPark } from '../utils/mapUtils';

const HomePage: React.FC = () => {
  const [selectedParks, setSelectedParks] = useState<ParkFeature[]>([]);
  const [totalParks, setTotalParks] = useState<number>(0);
  const [guessedDistances, setGuessedDistances] = useState<number[]>([]);
  const [currentPark, setCurrentPark] = useState<ParkFeature | null>(null);
  const [lastDistance, setLastDistance] = useState<number | null>(null);
  const [guessedInCurrentSession, setGuessedInCurrentSession] = useState<boolean>(false);

  useEffect(() => {
    const fetchTotalParks = async () => {
      try {
        const response = await fetch('/data/sfparks_entire2.json');
        const data = await response.json();
        const allParks = data.features as ParkFeature[];
        setTotalParks(allParks.length);
      } catch (error) {
        console.error("Error fetching total parks: ", error);
      }
    };

    const loadGameState = () => {
      const savedParks = localStorage.getItem('selectedParks');
      const parsedParks: ParkFeature[] = savedParks ? JSON.parse(savedParks) : [];
      setSelectedParks(parsedParks);

      const savedDistances = localStorage.getItem('guessedDistances');
      const parsedDistances: number[] = savedDistances ? JSON.parse(savedDistances) : [];
      setGuessedDistances(parsedDistances);
    };

    const selectInitialPark = async () => {
      if (totalParks > 0) {
        const savedParks = localStorage.getItem('selectedParks');
        if (!savedParks) {
          localStorage.setItem('selectedParks', JSON.stringify([]));
        }
        const parsedParks: ParkFeature[] = savedParks ? JSON.parse(savedParks) : [];

        const park = await updateCurrentPark(parsedParks, totalParks);
        setCurrentPark(park);
      }
    };

    fetchTotalParks();
    loadGameState();
    selectInitialPark();
  }, [totalParks]);

  const handleGuess = (distance: number) => {
    setGuessedDistances([...guessedDistances, distance]);
    setGuessedInCurrentSession(true);

    // Update the selected parks and current park
    const updatedParks = [...selectedParks, currentPark!];
    setSelectedParks(updatedParks);

    // Store the updated selected parks in the localStorage
    localStorage.setItem('selectedParks', JSON.stringify(updatedParks));

    updateCurrentPark(updatedParks, totalParks).then((park) => {
      setCurrentPark(park);
    });
  };
  

  const calculateAverageDistance = () => {
    if (guessedDistances.length === 0) {
      return '0.00';
    }
    const totalDistance = guessedDistances.reduce((sum, distance) => sum + distance, 0);
    const averageDistance = (totalDistance / guessedDistances.length).toFixed(2);
    return averageDistance;
  };

  const handleClearGame = () => {
    localStorage.removeItem('selectedParks');
    localStorage.removeItem('guessedDistances');
    window.location.reload();
  };

  return (
    <div>
      <div className="relative">
        <div className="absolute top-2 left-2 z-50">
          <ClippyBox
            score={selectedParks.length}
            totalParks={totalParks}
            averageDistance={calculateAverageDistance()}
            lastDistance={guessedDistances || null}
            currentPark={currentPark?.properties.park_name || null}
            guessedInCurrentSession={guessedInCurrentSession}
            selectedParks={selectedParks}
          />
        </div>
        <MapLibreMap
          selectedParks={selectedParks}
          setSelectedParks={setSelectedParks}
          totalParks={totalParks}
          handleGuess={handleGuess}
          handleClearGame={handleClearGame}
          guessedDistances={guessedDistances}
          setGuessedDistances={setGuessedDistances}
          currentPark={currentPark}
        />
        </div>
    </div>
  );
};

export default HomePage;