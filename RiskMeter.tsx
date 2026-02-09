
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { ThreatLevel } from '../types';

interface RiskMeterProps {
  score: number;
  level: ThreatLevel;
}

const RiskMeter: React.FC<RiskMeterProps> = ({ score, level }) => {
  const data = [
    { value: score },
    { value: 100 - score },
  ];

  const getColor = (level: ThreatLevel) => {
    switch (level) {
      case ThreatLevel.LOW: return '#10b981';
      case ThreatLevel.MEDIUM: return '#f59e0b';
      case ThreatLevel.HIGH: return '#ef4444';
      case ThreatLevel.CRITICAL: return '#7f1d1d';
      default: return '#3b82f6';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center relative h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="100%"
            startAngle={180}
            endAngle={0}
            innerRadius={80}
            outerRadius={110}
            paddingAngle={0}
            dataKey="value"
          >
            <Cell fill={getColor(level)} />
            <Cell fill="#1f2937" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute bottom-4 flex flex-col items-center">
        <span className="text-4xl font-bold">{score}%</span>
        <span className="text-sm uppercase tracking-widest text-gray-400 font-semibold">{level} RISK</span>
      </div>
    </div>
  );
};

export default RiskMeter;
