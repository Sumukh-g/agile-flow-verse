
import React from 'react';
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Widget } from '@/types/dashboard';

interface TimeTrackingWidgetProps {
  widget: Widget;
}

const TimeTrackingWidget: React.FC<TimeTrackingWidgetProps> = ({ widget }) => {
  return (
    <>
      <CardHeader>
        <CardTitle>{widget.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex h-[120px] items-end gap-2">
          {widget.data?.weeklyHours?.map((day: any, index: number) => (
            <div key={index} className="relative flex flex-1 flex-col justify-end">
              <div 
                className="bg-primary rounded-md w-full" 
                style={{ height: `${(day.hours / 10) * 100}%` }}
              />
              <span className="mt-1 text-center text-xs">{day.day}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 text-center text-sm text-muted-foreground">
          Total: {widget.data?.weeklyHours?.reduce((sum: number, day: any) => sum + day.hours, 0).toFixed(1)} hours
        </div>
      </CardContent>
    </>
  );
};

export default TimeTrackingWidget;
