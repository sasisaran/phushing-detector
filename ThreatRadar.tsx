
import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { ThreatVector, ThreatLevel } from '../types';

interface ThreatRadarProps {
  data: ThreatVector[];
  level: ThreatLevel;
}

const ThreatRadar: React.FC<ThreatRadarProps> = ({ data, level }) => {
  const getColor = (level: ThreatLevel) => {
    switch (level) {
      case ThreatLevel.LOW: return '#10b981';
      case ThreatLevel.MEDIUM: return '#f59e0b';
      case ThreatLevel.HIGH: return '#ef4444';
      case ThreatLevel.CRITICAL: return '#7f1d1d';
      default: return '#3b82f6';
    }
  };

  const color = getColor(level);

  return (
    <div className="h-64 w-full relative">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="#334155" strokeDasharray="3 3" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }} 
          />
          <Radar
            name="Threat Intensity"
            dataKey="score"
            stroke={color}
            fill={color}
            fillOpacity={0.3}
            animationBegin={500}
            animationDuration={1500}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ThreatRadar;
