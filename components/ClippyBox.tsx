import React, { useState, useEffect, useRef } from 'react';
import { exo2 } from '../utils/fonts';
import { ParkFeature } from '@/types/ParkData';

interface ClippyBoxProps {
  score: number;
  totalParks: number;
  averageDistance: string;
  lastDistance: number[] | null;
  currentPark: string | null;
  guessedInCurrentSession: boolean;
  selectedParks: ParkFeature[];
}

const ClippyBox: React.FC<ClippyBoxProps> = ({
  score,
  totalParks,
  averageDistance,
  lastDistance,
  currentPark,
  guessedInCurrentSession,
  selectedParks
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [selectedPhrase, setSelectedPhrase] = useState('');
  const [appendedText, setAppendedText] = useState('');
  const textContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDisplayedText(`Progress: ${score}/${totalParks} | Average Distance: ${averageDistance} miles`);
  }, [score, totalParks, averageDistance])

  useEffect(() => {
    if (textContainerRef.current) {
      textContainerRef.current.style.minHeight = '100px'; // Set a minimum height to prevent text cut-off
      textContainerRef.current.style.height = `${textContainerRef.current.scrollHeight}px`;
    }
  }, [displayedText, appendedText]);

  useEffect(() => {
    const fetchPhrase = async () => {
      try {
        const response = await fetch('/data/fun.json');
        const data = await response.json();
        if (lastDistance !== null && guessedInCurrentSession) {
          const lastDistanceNum = lastDistance[lastDistance.length - 1];
          const phraseKey = lastDistanceNum <= 1 ? 'good' : 'bad';
          const phrases = data[phraseKey];
          const randomIndex = Math.floor(Math.random() * phrases.length);
          const phrase = phrases[randomIndex];
          setSelectedPhrase(phrase);
        }
      } catch (error) {
        console.error('Error fetching fun phrase:', error);
      }
    };
    fetchPhrase();
  }, [lastDistance, guessedInCurrentSession]);

  useEffect(() => {
    if (currentPark) {
      const distanceText = `${selectedPhrase}`.split(' ');
      const welcomeText = `Try and guess the approximate location of all the parks in SF! I will give you a name and click on the map to guess where it is.`.split(' ');
      const parkText = `Next Park: ${currentPark}`.split(' ');

      let combinedText: string[];
      if (!selectedParks || selectedParks.length === 0) {
        combinedText = [...welcomeText, '\n\n', ...parkText];
      } else {
        combinedText = guessedInCurrentSession ? [...distanceText, '\n\n', ...parkText] : [...parkText];
      }
      let currentIndex = 0;
  
      const printText = () => {
        if (currentIndex < combinedText.length) {
          const currentPiece = combinedText[currentIndex] === '\n\n' ? '\n\n' : `${combinedText[currentIndex]} `;
          setAppendedText(prevText => prevText + currentPiece);
          currentIndex++;
          setTimeout(printText, 50);
        }
      };
      setAppendedText(''); // Clear the text before starting
      printText();
    }
  }, [currentPark]);
  
  // Update the rendering logic to handle new lines
  const renderedAppendedText = appendedText.split('\n').map((line, index) => (
    <React.Fragment key={index}>
      {line}
      <br />
    </React.Fragment>
  ));
  
  return (
    <div className="flex items-start space-x-4 max-w-screen-sm mx-auto">
      <div className="flex-shrink-0">
        <div className="relative h-24 w-24">
          <img className="absolute inset-0 h-full w-full object-contain" src="/clippy.png" alt="Clippy" />
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="relative">
          <div className="absolute inset-0 overflow-hidden rounded-lg shadow-sm ring-1 ring-inset ring-gray-300 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/paper_background.png')", opacity: 0.75 }}></div>
          <div className="relative overflow-hidden rounded-lg">
            <div className={`block w-full resize-none border-0 bg-transparent py-1.5 focus:ring-0 sm:text-sm sm:leading-6 p-4 text-black ${exo2.className} font-normal`}>
              <div ref={textContainerRef} className="min-h-[6rem] overflow-hidden">
                {/* Display the initial text on its own line */}
                <div className="leading-6">{displayedText}</div>
                <br />
                <hr />
                {/* Display the appended text underneath */}
                <div className="leading-6">{renderedAppendedText}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClippyBox;