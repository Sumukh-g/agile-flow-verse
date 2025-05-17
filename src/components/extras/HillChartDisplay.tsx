
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const HillChartDisplay = () => {
  // Static data for example tasks
  const tasks = [
    { id: 'task1', name: 'Initial idea', x: 10, y: 30, color: 'bg-blue-500' },
    { id: 'task2', name: 'Figuring it out', x: 30, y: 70, color: 'bg-yellow-500' },
    { id: 'task3', name: 'Getting clear', x: 50, y: 90, color: 'bg-green-500' },
    { id: 'task4', name: 'Implementing', x: 70, y: 70, color: 'bg-purple-500' },
    { id: 'task5', name: 'Done', x: 90, y: 30, color: 'bg-gray-500' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hill Chart</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative w-full h-72 bg-slate-50 rounded-md overflow-hidden border">
          {/* Hill SVG Background */}
          <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path 
              d="M 0 100 Q 25 0, 50 0 T 100 100" 
              fill="none" 
              stroke="#e2e8f0" 
              strokeWidth="0.5"
            />
            <path 
              d="M 0 30 Q 25 100, 50 100 T 100 30" 
              fill="#f1f5f9" 
              stroke="#e2e8f0" 
              strokeWidth="0.5"
            />
            {/* Center line */}
            <line x1="50" y1="0" x2="50" y2="100" stroke="#cbd5e1" strokeWidth="0.2" strokeDasharray="2,2" />
            
            {/* Labels */}
            <text x="15" y="95" fontSize="3" fill="#64748b" textAnchor="middle">Figuring things out</text>
            <text x="85" y="95" fontSize="3" fill="#64748b" textAnchor="middle">Making it happen</text>
          </svg>

          {/* Tasks */}
          {tasks.map(task => (
            <div
              key={task.id}
              className={`absolute w-3 h-3 rounded-full ${task.color} transform -translate-x-1/2 -translate-y-1/2 shadow-md cursor-pointer group`}
              style={{ left: `${task.x}%`, top: `${100 - task.y}%` }} // Invert Y for typical chart coordinates
              title={task.name}
            >
              <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-1.5 py-0.5 text-xs bg-slate-700 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {task.name}
              </span>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          This is a static representation of a Hill Chart. Tasks are positioned to show progress from discovery (left) to completion (right).
        </p>
      </CardContent>
    </Card>
  );
};

export default HillChartDisplay;

