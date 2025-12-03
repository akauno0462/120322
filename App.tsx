import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Scene } from './components/Scene';
import { TreeState } from './types';

const App: React.FC = () => {
  const [treeState, setTreeState] = useState<TreeState>(TreeState.TREE_SHAPE);
  const [isAutoMode, setIsAutoMode] = useState(true);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-play Loop Effect with variable timing
  useEffect(() => {
    // Only run the loop if we are in Auto Mode
    if (!isAutoMode) return;

    let timeoutId: ReturnType<typeof setTimeout>;

    if (treeState === TreeState.TREE_SHAPE) {
      // If currently a Tree, hold shape for 8 seconds before scattering
      timeoutId = setTimeout(() => {
        setTreeState(TreeState.SCATTERED);
      }, 8000);
    } else {
      // If currently Scattered:
      // 1. Transition takes ~1.5-2 seconds.
      // 2. User wants to "rotate for 2 seconds" after scattering.
      // Total delay = 4000ms ensures full scatter + approx 2s idle rotation.
      timeoutId = setTimeout(() => {
        setTreeState(TreeState.TREE_SHAPE);
      }, 4000);
    }

    return () => clearTimeout(timeoutId);
  }, [isAutoMode, treeState]);

  const toggleState = useCallback(() => {
    // 1. Handle immediate user interaction
    setTreeState((prev) => 
      prev === TreeState.TREE_SHAPE ? TreeState.SCATTERED : TreeState.TREE_SHAPE
    );

    // 2. Pause Auto Mode so the user isn't interrupted
    setIsAutoMode(false);

    // 3. Clear any existing idle timer
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }

    // 4. Start a new idle timer: If no clicks for 10 seconds, resume Auto Mode
    idleTimerRef.current = setTimeout(() => {
      setIsAutoMode(true);
    }, 10000);
  }, []);

  return (
    <div className="relative w-full h-screen bg-black">
      <Scene treeState={treeState} toggleState={toggleState} />
      
      {/* Subtle UI Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 pointer-events-none opacity-50">
        <div className="w-12 h-12 border border-white/20 rounded-full flex items-center justify-center backdrop-blur-sm transition-all duration-500">
          <div 
            className={`w-3 h-3 rounded-full transition-all duration-700 
            ${treeState === TreeState.TREE_SHAPE 
              ? 'bg-yellow-400 shadow-[0_0_10px_#ffd700]' 
              : 'bg-emerald-500 shadow-[0_0_10px_#00ff88]'
            }
            ${isAutoMode ? 'animate-pulse' : ''} 
            `} 
          />
        </div>
      </div>
    </div>
  );
};

export default App;