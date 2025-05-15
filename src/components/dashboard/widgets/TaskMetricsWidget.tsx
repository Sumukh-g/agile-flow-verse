
import React from 'react';
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Widget } from '@/types/dashboard';

interface TaskMetricsWidgetProps {
  widget: Widget;
}

const TaskMetricsWidget: React.FC<TaskMetricsWidgetProps> = ({ widget }) => {
  return (
    <>
      <CardHeader>
        <CardTitle>{widget.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {widget.data?.metrics?.map((metric: any, index: number) => (
            <div key={index} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>{metric.name}</span>
                <span className="font-medium">{metric.value}</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden bg-secondary">
                <div
                  className="h-full"
                  style={{ 
                    width: `${(metric.value / widget.data.metrics.reduce((total: number, m: any) => total + m.value, 0)) * 100}%`, 
                    backgroundColor: metric.color 
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </>
  );
};

export default TaskMetricsWidget;
