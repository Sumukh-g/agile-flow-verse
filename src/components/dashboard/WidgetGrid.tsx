
import React from 'react';
import { Card } from "@/components/ui/card";
import { DragDropContext, Draggable, Droppable, DropResult } from 'react-beautiful-dnd';
import { Move, Trash } from 'lucide-react';
import WidgetRenderer from './WidgetRenderer';
import { Widget } from '@/types/dashboard';

interface WidgetGridProps {
  widgets: Widget[];
  editMode: boolean;
  onDragEnd: (result: DropResult) => void;
  onDeleteWidget: (widgetId: string) => void;
}

const WidgetGrid: React.FC<WidgetGridProps> = ({
  widgets,
  editMode,
  onDragEnd,
  onDeleteWidget,
}) => {
  if (editMode) {
    return (
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="dashboard-widgets" direction="horizontal">
          {(provided) => (
            <div 
              className="grid grid-cols-4 gap-4 w-full" 
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {widgets.map((widget, index) => (
                <Draggable key={widget.id} draggableId={widget.id} index={index}>
                  {(providedDraggable) => (
                    <div
                      ref={providedDraggable.innerRef}
                      {...providedDraggable.draggableProps}
                      // Tailwind JIT compiler needs full class names
                      className={`${
                        widget.width === 1 ? 'col-span-1' :
                        widget.width === 2 ? 'col-span-2' :
                        widget.width === 3 ? 'col-span-3' :
                        'col-span-4'
                      } ${
                        widget.height === 1 ? 'row-span-1' :
                        'row-span-2'
                      } relative group`}
                    >
                      <div 
                        {...providedDraggable.dragHandleProps} 
                        className="absolute right-2 top-2 bg-background/80 p-1 rounded-md border opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-move"
                      >
                        <Move className="h-4 w-4" />
                      </div>
                      <div 
                        className="absolute right-10 top-2 bg-background/80 p-1 rounded-md border opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        onClick={() => onDeleteWidget(widget.id)}
                      >
                        <Trash className="h-4 w-4 cursor-pointer text-red-500" />
                      </div>
                      <Card className="h-full">
                        <WidgetRenderer widget={widget} />
                      </Card>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-4">
      {widgets.map(widget => (
        <Card 
          key={widget.id} 
          // Tailwind JIT compiler needs full class names
          className={`${
            widget.width === 1 ? 'col-span-1' :
            widget.width === 2 ? 'col-span-2' :
            widget.width === 3 ? 'col-span-3' :
            'col-span-4'
          } ${
            widget.height === 1 ? 'row-span-1' :
            'row-span-2'
          } h-full`}
        >
          <WidgetRenderer widget={widget} />
        </Card>
      ))}
    </div>
  );
};

export default WidgetGrid;
