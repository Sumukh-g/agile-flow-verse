
import React from 'react';
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Widget } from '@/types/dashboard';

interface ProjectProgressWidgetProps {
  widget: Widget;
}

const ProjectProgressWidget: React.FC<ProjectProgressWidgetProps> = ({ widget }) => {
  return (
    <>
      <CardHeader>
        <CardTitle>{widget.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {widget.data?.projects?.map((project: any, index: number) => (
            <div key={index} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>{project.name}</span>
                <span className="font-medium">{project.progress}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden bg-secondary">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </>
  );
};

export default ProjectProgressWidget;
