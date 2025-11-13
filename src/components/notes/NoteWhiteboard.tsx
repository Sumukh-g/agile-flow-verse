import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
    ArrowRight,
    Circle,
    Eraser,
    Highlighter,
    Palette,
    Pen,
    RotateCcw,
    Save,
    Share,
    Square,
    Trash2,
    Type,
    ZoomIn,
    ZoomOut
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface DrawingTool {
  type: 'pen' | 'highlighter' | 'eraser' | 'shape' | 'text';
  color: string;
  size: number;
  shape?: 'rectangle' | 'circle' | 'arrow';
}

interface WhiteboardElement {
  id: string;
  type: 'drawing' | 'shape' | 'text';
  data: any;
  position: { x: number; y: number };
  size: { width: number; height: number };
  color: string;
  strokeWidth: number;
}

const NoteWhiteboard: React.FC<{ note: any; onUpdateNote: (noteId: string, updates: any) => void }> = ({ note, onUpdateNote }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState<DrawingTool>({
    type: 'pen',
    color: '#000000',
    size: 2
  });
  const [elements, setElements] = useState<WhiteboardElement[]>([]);
  const [zoom, setZoom] = useState(100);
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });

  const colors = [
    '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
    '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#FFC0CB'
  ];

  const tools = [
    { type: 'pen', icon: <Pen className="h-4 w-4" />, label: 'Pen' },
    { type: 'highlighter', icon: <Highlighter className="h-4 w-4" />, label: 'Highlighter' },
    { type: 'eraser', icon: <Eraser className="h-4 w-4" />, label: 'Eraser' },
    { type: 'shape', icon: <Square className="h-4 w-4" />, label: 'Shape' },
    { type: 'text', icon: <Type className="h-4 w-4" />, label: 'Text' }
  ];

  const shapes = [
    { type: 'rectangle', icon: <Square className="h-4 w-4" />, label: 'Rectangle' },
    { type: 'circle', icon: <Circle className="h-4 w-4" />, label: 'Circle' },
    { type: 'arrow', icon: <ArrowRight className="h-4 w-4" />, label: 'Arrow' }
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all elements
    elements.forEach(element => {
      drawElement(ctx, element);
    });
  }, [elements, zoom]);

  const drawElement = (ctx: CanvasRenderingContext2D, element: WhiteboardElement) => {
    ctx.save();
    ctx.translate(element.position.x, element.position.y);
    ctx.scale(zoom / 100, zoom / 100);

    ctx.strokeStyle = element.color;
    ctx.lineWidth = element.strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (element.type === 'drawing') {
      ctx.beginPath();
      element.data.forEach((point: any, index: number) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      ctx.stroke();
    } else if (element.type === 'shape') {
      const { shape } = element.data;
      if (shape === 'rectangle') {
        ctx.strokeRect(0, 0, element.size.width, element.size.height);
      } else if (shape === 'circle') {
        ctx.beginPath();
        ctx.arc(element.size.width / 2, element.size.height / 2, Math.min(element.size.width, element.size.height) / 2, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (shape === 'arrow') {
        ctx.beginPath();
        ctx.moveTo(0, element.size.height / 2);
        ctx.lineTo(element.size.width, element.size.height / 2);
        ctx.lineTo(element.size.width - 10, element.size.height / 2 - 5);
        ctx.moveTo(element.size.width, element.size.height / 2);
        ctx.lineTo(element.size.width - 10, element.size.height / 2 + 5);
        ctx.stroke();
      }
    } else if (element.type === 'text') {
      ctx.fillStyle = element.color;
      ctx.font = `${element.strokeWidth * 2}px Arial`;
      ctx.fillText(element.data.text, 0, 0);
    }

    ctx.restore();
  };

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - canvasOffset.x) / (zoom / 100),
      y: (e.clientY - rect.top - canvasOffset.y) / (zoom / 100)
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (currentTool.type === 'pen' || currentTool.type === 'highlighter') {
      setIsDrawing(true);
      const pos = getMousePos(e);
      const newElement: WhiteboardElement = {
        id: Date.now().toString(),
        type: 'drawing',
        data: [{ x: pos.x, y: pos.y }],
        position: { x: 0, y: 0 },
        size: { width: 0, height: 0 },
        color: currentTool.color,
        strokeWidth: currentTool.size
      };
      setElements(prev => [...prev, newElement]);
    } else if (currentTool.type === 'eraser') {
      const pos = getMousePos(e);
      setElements(prev => prev.filter(element => {
        // Simple eraser logic - remove elements near the click point
        return !(Math.abs(element.position.x - pos.x) < 20 && Math.abs(element.position.y - pos.y) < 20);
      }));
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDrawing && (currentTool.type === 'pen' || currentTool.type === 'highlighter')) {
      const pos = getMousePos(e);
      setElements(prev => {
        const newElements = [...prev];
        const lastElement = newElements[newElements.length - 1];
        if (lastElement && lastElement.type === 'drawing') {
          lastElement.data.push({ x: pos.x, y: pos.y });
        }
        return newElements;
      });
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const handleClearCanvas = () => {
    setElements([]);
    toast.success('Canvas cleared');
  };

  const handleSaveCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = 'whiteboard.png';
    link.href = canvas.toDataURL();
    link.click();
    toast.success('Canvas saved');
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 300));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 25));
  };

  const handleResetZoom = () => {
    setZoom(100);
    setCanvasOffset({ x: 0, y: 0 });
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Whiteboard</h3>
          <p className="text-sm text-muted-foreground">
            Draw, sketch, and collaborate visually
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">{zoom}%</span>
          <Button variant="outline" size="sm" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleResetZoom}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            {/* Tools */}
            <div className="flex items-center space-x-2">
              {tools.map((tool) => (
                <Button
                  key={tool.type}
                  variant={currentTool.type === tool.type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentTool(prev => ({ ...prev, type: tool.type as any }))}
                >
                  {tool.icon}
                  <span className="ml-1">{tool.label}</span>
                </Button>
              ))}
            </div>

            {/* Colors */}
            <div className="flex items-center space-x-2">
              <Label className="text-sm">Color:</Label>
              <div className="flex space-x-1">
                {colors.map((color) => (
                  <button
                    key={color}
                    className={`w-6 h-6 rounded border-2 ${
                      currentTool.color === color ? 'border-gray-400' : 'border-gray-200'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setCurrentTool(prev => ({ ...prev, color }))}
                  />
                ))}
              </div>
            </div>

            {/* Size */}
            <div className="flex items-center space-x-2">
              <Label className="text-sm">Size:</Label>
              <div className="w-24">
                <Slider
                  value={[currentTool.size]}
                  onValueChange={([value]) => setCurrentTool(prev => ({ ...prev, size: value }))}
                  min={1}
                  max={20}
                  step={1}
                  className="w-full"
                />
              </div>
              <span className="text-sm w-8">{currentTool.size}</span>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleSaveCanvas}>
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>
              <Button variant="outline" size="sm" onClick={handleClearCanvas}>
                <Trash2 className="h-4 w-4 mr-1" />
                Clear
              </Button>
              <Button variant="outline" size="sm">
                <Share className="h-4 w-4 mr-1" />
                Share
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Canvas */}
      <Card className="border-2 border-dashed border-gray-300">
        <CardContent className="p-0">
          <div className="relative overflow-hidden">
            <canvas
              ref={canvasRef}
              className="w-full h-[600px] cursor-crosshair"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{
                transform: `scale(${zoom / 100}) translate(${canvasOffset.x}px, ${canvasOffset.y}px)`,
                transformOrigin: 'top left'
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className="text-blue-600">
              <Palette className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-medium text-blue-900">Whiteboard Tips</h4>
              <ul className="text-sm text-blue-800 mt-1 space-y-1">
                <li>• Use the pen tool to draw freehand</li>
                <li>• Select different colors and brush sizes</li>
                <li>• Use the eraser to remove drawings</li>
                <li>• Zoom in/out for detailed work</li>
                <li>• Save your work when finished</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NoteWhiteboard; 