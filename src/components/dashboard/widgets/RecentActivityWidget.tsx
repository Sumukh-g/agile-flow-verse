
import React from 'react';
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Widget } from '@/types/dashboard';

interface RecentActivityWidgetProps {
  widget: Widget;
}

const RecentActivityWidget: React.FC<RecentActivityWidgetProps> = ({ widget }) => {
  return (
    <>
      <CardHeader>
        <CardTitle>{widget.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {widget.data?.activities?.map((activity: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                {activity.user.charAt(0)}
              </div>
              <span>
                <span className="font-medium">{activity.user}</span> {activity.action}{" "}
                <span className="font-medium">{activity.target}</span>
                <span className="text-xs text-muted-foreground block">
                  {activity.time}
                </span>
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </>
  );
};

export default RecentActivityWidget;
