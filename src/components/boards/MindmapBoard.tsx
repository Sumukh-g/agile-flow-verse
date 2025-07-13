// MindmapBoard: The most advanced, creative, and feature-rich mindmap tool on the internet!
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
    Brain,
    Download,
    FileText,
    Grid,
    Link,
    Lock,
    Plus,
    Search,
    ZoomIn, ZoomOut
} from 'lucide-react';
import React, { useCallback, useRef, useState } from 'react';

// Enhanced Types
export type MindmapNode = {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  borderStyle: 'solid' | 'dashed' | 'dotted';
  shape: 'rectangle' | 'circle' | 'ellipse' | 'diamond' | 'hexagon' | 'cloud' | 'star';
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textAlign: 'left' | 'center' | 'right';
  opacity: number;
  rotation: number;
  zIndex: number;
  locked: boolean;
  hidden: boolean;
  parentId?: string;
  children: string[];
  level: number;
  expanded: boolean;
  icon?: string;
  image?: string;
  link?: string;
  notes: string;
  tags: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'idea' | 'in-progress' | 'completed' | 'blocked';
  createdAt: string;
  updatedAt: string;
  attachments: { id: string; name: string; type: string; url: string }[];
};

export type MindmapConnection = {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  type: 'straight' | 'curved' | 'elbow' | 'bezier';
  color: string;
  width: number;
  style: 'solid' | 'dashed' | 'dotted';
  animated: boolean;
  label?: string;
  labelPosition: 'start' | 'middle' | 'end';
  arrowStart: boolean;
  arrowEnd: boolean;
  opacity: number;
};

export type MindmapTemplate = {
  id: string;
  name: string;
  description: string;
  category: string;
  nodes: Omit<MindmapNode, 'id' | 'createdAt' | 'updatedAt'>[];
  connections: Omit<MindmapConnection, 'id'>[];
  thumbnail: string;
};

const MINDMAP_TEMPLATES: MindmapTemplate[] = [
  {
    id: 'brainstorming',
    name: 'Brainstorming Session',
    category: 'Creative',
    description: 'Perfect for idea generation and creative thinking',
    thumbnail: '🧠',
    nodes: [
      { text: 'Main Topic', x: 400, y: 300, width: 120, height: 60, color: '#ffffff', backgroundColor: '#6366f1', borderColor: '#4f46e5', borderWidth: 2, borderStyle: 'solid', shape: 'ellipse', fontSize: 16, fontWeight: 'bold', fontStyle: 'normal', textAlign: 'center', opacity: 1, rotation: 0, zIndex: 1, locked: false, hidden: false, children: ['idea1', 'idea2', 'idea3'], level: 0, expanded: true, notes: '', tags: [], priority: 'high', status: 'idea', attachments: [] },
      { text: 'Idea 1', x: 200, y: 200, width: 100, height: 50, color: '#ffffff', backgroundColor: '#10b981', borderColor: '#059669', borderWidth: 2, borderStyle: 'solid', shape: 'rectangle', fontSize: 14, fontWeight: 'normal', fontStyle: 'normal', textAlign: 'center', opacity: 1, rotation: 0, zIndex: 1, locked: false, hidden: false, parentId: 'main', children: [], level: 1, expanded: true, notes: '', tags: [], priority: 'medium', status: 'idea', attachments: [] },
      { text: 'Idea 2', x: 600, y: 200, width: 100, height: 50, color: '#ffffff', backgroundColor: '#f59e0b', borderColor: '#d97706', borderWidth: 2, borderStyle: 'solid', shape: 'rectangle', fontSize: 14, fontWeight: 'normal', fontStyle: 'normal', textAlign: 'center', opacity: 1, rotation: 0, zIndex: 1, locked: false, hidden: false, parentId: 'main', children: [], level: 1, expanded: true, notes: '', tags: [], priority: 'medium', status: 'idea', attachments: [] },
      { text: 'Idea 3', x: 400, y: 100, width: 100, height: 50, color: '#ffffff', backgroundColor: '#ef4444', borderColor: '#dc2626', borderWidth: 2, borderStyle: 'solid', shape: 'rectangle', fontSize: 14, fontWeight: 'normal', fontStyle: 'normal', textAlign: 'center', opacity: 1, rotation: 0, zIndex: 1, locked: false, hidden: false, parentId: 'main', children: [], level: 1, expanded: true, notes: '', tags: [], priority: 'medium', status: 'idea', attachments: [] }
    ],
    connections: [
      { fromNodeId: 'main', toNodeId: 'idea1', type: 'curved', color: '#6b7280', width: 2, style: 'solid', animated: false, labelPosition: 'middle', arrowStart: false, arrowEnd: true, opacity: 1 },
      { fromNodeId: 'main', toNodeId: 'idea2', type: 'curved', color: '#6b7280', width: 2, style: 'solid', animated: false, labelPosition: 'middle', arrowStart: false, arrowEnd: true, opacity: 1 },
      { fromNodeId: 'main', toNodeId: 'idea3', type: 'curved', color: '#6b7280', width: 2, style: 'solid', animated: false, labelPosition: 'middle', arrowStart: false, arrowEnd: true, opacity: 1 }
    ]
  },
  {
    id: 'project-planning',
    name: 'Project Planning',
    category: 'Business',
    description: 'Organize project phases and deliverables',
    thumbnail: '📋',
    nodes: [
      { text: 'Project', x: 400, y: 300, width: 120, height: 60, color: '#ffffff', backgroundColor: '#8b5cf6', borderColor: '#7c3aed', borderWidth: 2, borderStyle: 'solid', shape: 'rectangle', fontSize: 16, fontWeight: 'bold', fontStyle: 'normal', textAlign: 'center', opacity: 1, rotation: 0, zIndex: 1, locked: false, hidden: false, children: ['phase1', 'phase2', 'phase3'], level: 0, expanded: true, notes: '', tags: [], priority: 'high', status: 'in-progress', attachments: [] },
      { text: 'Phase 1', x: 200, y: 200, width: 100, height: 50, color: '#ffffff', backgroundColor: '#06b6d4', borderColor: '#0891b2', borderWidth: 2, borderStyle: 'solid', shape: 'rectangle', fontSize: 14, fontWeight: 'normal', fontStyle: 'normal', textAlign: 'center', opacity: 1, rotation: 0, zIndex: 1, locked: false, hidden: false, parentId: 'project', children: [], level: 1, expanded: true, notes: '', tags: [], priority: 'high', status: 'completed', attachments: [] },
      { text: 'Phase 2', x: 400, y: 150, width: 100, height: 50, color: '#ffffff', backgroundColor: '#10b981', borderColor: '#059669', borderWidth: 2, borderStyle: 'solid', shape: 'rectangle', fontSize: 14, fontWeight: 'normal', fontStyle: 'normal', textAlign: 'center', opacity: 1, rotation: 0, zIndex: 1, locked: false, hidden: false, parentId: 'project', children: [], level: 1, expanded: true, notes: '', tags: [], priority: 'high', status: 'in-progress', attachments: [] },
      { text: 'Phase 3', x: 600, y: 200, width: 100, height: 50, color: '#ffffff', backgroundColor: '#f59e0b', borderColor: '#d97706', borderWidth: 2, borderStyle: 'solid', shape: 'rectangle', fontSize: 14, fontWeight: 'normal', fontStyle: 'normal', textAlign: 'center', opacity: 1, rotation: 0, zIndex: 1, locked: false, hidden: false, parentId: 'project', children: [], level: 1, expanded: true, notes: '', tags: [], priority: 'medium', status: 'idea', attachments: [] }
    ],
    connections: [
      { fromNodeId: 'project', toNodeId: 'phase1', type: 'straight', color: '#6b7280', width: 2, style: 'solid', animated: false, labelPosition: 'middle', arrowStart: false, arrowEnd: true, opacity: 1 },
      { fromNodeId: 'project', toNodeId: 'phase2', type: 'straight', color: '#6b7280', width: 2, style: 'solid', animated: false, labelPosition: 'middle', arrowStart: false, arrowEnd: true, opacity: 1 },
      { fromNodeId: 'project', toNodeId: 'phase3', type: 'straight', color: '#6b7280', width: 2, style: 'solid', animated: false, labelPosition: 'middle', arrowStart: false, arrowEnd: true, opacity: 1 }
    ]
  }
];

const MindmapBoard: React.FC<{
  onExtractToProject?: (nodes: MindmapNode[], connections: MindmapConnection[]) => void;
  onExtractToCustomDashboard?: (nodes: MindmapNode[], connections: MindmapConnection[]) => void;
  onSaveAsTemplate?: (nodes: MindmapNode[], connections: MindmapConnection[]) => void;
}> = ({ onExtractToProject, onExtractToCustomDashboard, onSaveAsTemplate }) => {
  // Core State
  const [nodes, setNodes] = useState<MindmapNode[]>([]);
  const [connections, setConnections] = useState<MindmapConnection[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStart, setConnectionStart] = useState<string | null>(null);
  
  // Canvas State
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [canvasSize, setCanvasSize] = useState({ width: 2000, height: 1500 });
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [gridSize, setGridSize] = useState(20);
  
  // UI State
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showNodeEditor, setShowNodeEditor] = useState(false);
  const [showConnectionEditor, setShowConnectionEditor] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [editingNode, setEditingNode] = useState<MindmapNode | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Refs
  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  
  // Generate unique ID
  const generateId = () => Math.random().toString(36).slice(2, 10);
  
  // Create new node
  const createNode = useCallback((x: number, y: number, text = 'New Node') => {
    const newNode: MindmapNode = {
      id: generateId(),
      text,
      x: x - panX,
      y: y - panY,
      width: 120,
      height: 60,
      color: '#ffffff',
      backgroundColor: '#6366f1',
      borderColor: '#4f46e5',
      borderWidth: 2,
      borderStyle: 'solid',
      shape: 'rectangle',
      fontSize: 14,
      fontWeight: 'normal',
      fontStyle: 'normal',
      textAlign: 'center',
      opacity: 1,
      rotation: 0,
      zIndex: 1,
      locked: false,
      hidden: false,
      children: [],
      level: 0,
      expanded: true,
      notes: '',
      tags: [],
      priority: 'medium',
      status: 'idea',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      attachments: []
    };
    
    setNodes(prev => [...prev, newNode]);
    setSelectedNodeId(newNode.id);
    return newNode.id;
  }, [panX, panY]);
  
  // Create connection
  const createConnection = useCallback((fromId: string, toId: string) => {
    if (fromId === toId) return;
    
    const existingConnection = connections.find(
      conn => (conn.fromNodeId === fromId && conn.toNodeId === toId) ||
              (conn.fromNodeId === toId && conn.toNodeId === fromId)
    );
    
    if (existingConnection) return;
    
    const newConnection: MindmapConnection = {
      id: generateId(),
      fromNodeId: fromId,
      toNodeId: toId,
      type: 'curved',
      color: '#6b7280',
      width: 2,
      style: 'solid',
      animated: false,
      labelPosition: 'middle',
      arrowStart: false,
      arrowEnd: true,
      opacity: 1
    };
    
    setConnections(prev => [...prev, newConnection]);
    
    // Update parent-child relationships
    setNodes(prev => prev.map(node => {
      if (node.id === fromId) {
        return { ...node, children: [...node.children, toId] };
      }
      if (node.id === toId) {
        return { ...node, parentId: fromId };
      }
      return node;
    }));
  }, [connections]);
  
  // Apply template
  const applyTemplate = (templateId: string) => {
    const template = MINDMAP_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;
    
    const newNodes = template.nodes.map((node, index) => ({
      ...node,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
    
    const nodeIdMap = new Map();
    template.nodes.forEach((node, index) => {
      nodeIdMap.set(index, newNodes[index].id);
    });
    
    const newConnections = template.connections.map(conn => ({
      ...conn,
      id: generateId(),
      fromNodeId: nodeIdMap.get(template.nodes.findIndex(n => n.text === conn.fromNodeId)) || conn.fromNodeId,
      toNodeId: nodeIdMap.get(template.nodes.findIndex(n => n.text === conn.toNodeId)) || conn.toNodeId
    }));
    
    setNodes(newNodes);
    setConnections(newConnections);
    setShowTemplateDialog(false);
  };
  
  // Export functions
  const exportMindmap = (format: 'json' | 'svg' | 'png' | 'pdf') => {
    const data = { nodes, connections };
    
    switch (format) {
      case 'json':
        const jsonBlob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const jsonUrl = URL.createObjectURL(jsonBlob);
        const jsonLink = document.createElement('a');
        jsonLink.href = jsonUrl;
        jsonLink.download = 'mindmap.json';
        jsonLink.click();
        break;
      case 'svg':
        if (svgRef.current) {
          const svgData = new XMLSerializer().serializeToString(svgRef.current);
          const svgBlob = new Blob([svgData], { type: 'image/svg+xml' });
          const svgUrl = URL.createObjectURL(svgBlob);
          const svgLink = document.createElement('a');
          svgLink.href = svgUrl;
          svgLink.download = 'mindmap.svg';
          svgLink.click();
        }
        break;
      default:
        alert(`${format.toUpperCase()} export would be implemented with appropriate libraries`);
    }
  };
  
  // Render connection path
  const renderConnectionPath = (connection: MindmapConnection) => {
    const fromNode = nodes.find(n => n.id === connection.fromNodeId);
    const toNode = nodes.find(n => n.id === connection.toNodeId);
    
    if (!fromNode || !toNode) return '';
    
    const fromX = fromNode.x + fromNode.width / 2;
    const fromY = fromNode.y + fromNode.height / 2;
    const toX = toNode.x + toNode.width / 2;
    const toY = toNode.y + toNode.height / 2;
    
    switch (connection.type) {
      case 'straight':
        return `M ${fromX} ${fromY} L ${toX} ${toY}`;
      case 'curved':
        const midX = (fromX + toX) / 2;
        const midY = (fromY + toY) / 2;
        const controlX = midX + (fromY - toY) * 0.2;
        const controlY = midY + (toX - fromX) * 0.2;
        return `M ${fromX} ${fromY} Q ${controlX} ${controlY} ${toX} ${toY}`;
      case 'elbow':
        const elbowX = fromX + (toX - fromX) / 2;
        return `M ${fromX} ${fromY} L ${elbowX} ${fromY} L ${elbowX} ${toY} L ${toX} ${toY}`;
      case 'bezier':
        const cp1X = fromX + (toX - fromX) * 0.3;
        const cp1Y = fromY;
        const cp2X = toX - (toX - fromX) * 0.3;
        const cp2Y = toY;
        return `M ${fromX} ${fromY} C ${cp1X} ${cp1Y} ${cp2X} ${cp2Y} ${toX} ${toY}`;
      default:
        return `M ${fromX} ${fromY} L ${toX} ${toY}`;
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Enhanced Toolbar */}
      <div className="flex items-center justify-between gap-2 p-3 border-b bg-white shadow-sm">
        <div className="flex items-center gap-2">
          <Brain className="h-6 w-6 text-purple-600" />
          <span className="font-bold text-lg">Mindmap Studio</span>
          <Badge variant="outline">{nodes.length} nodes</Badge>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search nodes..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 w-48"
            />
          </div>
          
          {/* Zoom Controls */}
          <div className="flex items-center gap-1 border rounded">
            <Button variant="ghost" size="sm" onClick={() => setZoom(z => Math.max(0.1, z - 0.1))}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="px-2 text-sm">{Math.round(zoom * 100)}%</span>
            <Button variant="ghost" size="sm" onClick={() => setZoom(z => Math.min(3, z + 0.1))}>
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
          
          {/* View Controls */}
          <Button variant="outline" size="sm" onClick={() => setShowGrid(!showGrid)}>
            <Grid className="h-4 w-4 mr-2" />
            Grid
          </Button>
          
          {/* Tools */}
          <Button 
            variant={isConnecting ? "default" : "outline"} 
            size="sm" 
            onClick={() => setIsConnecting(!isConnecting)}
          >
            <Link className="h-4 w-4 mr-2" />
            Connect
          </Button>
          
          <Button variant="outline" size="sm" onClick={() => setShowTemplateDialog(true)}>
            <FileText className="h-4 w-4 mr-2" />
            Templates
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => exportMindmap('json')}>
                Export JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportMindmap('svg')}>
                Export SVG
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportMindmap('png')}>
                Export PNG
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportMindmap('pdf')}>
                Export PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button onClick={() => createNode(400, 300)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Node
          </Button>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <div
          ref={canvasRef}
          className="w-full h-full cursor-grab active:cursor-grabbing"
          style={{
            transform: `scale(${zoom}) translate(${panX}px, ${panY}px)`,
            transformOrigin: '0 0'
          }}
          onDoubleClick={(e) => {
            const rect = canvasRef.current?.getBoundingClientRect();
            if (rect) {
              const x = (e.clientX - rect.left) / zoom;
              const y = (e.clientY - rect.top) / zoom;
              createNode(x, y);
            }
          }}
        >
          {/* Grid */}
          {showGrid && (
            <svg
              className="absolute inset-0 pointer-events-none"
              width={canvasSize.width}
              height={canvasSize.height}
            >
              <defs>
                <pattern
                  id="grid"
                  width={gridSize}
                  height={gridSize}
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`}
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="1"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          )}
          
          {/* Connections SVG */}
          <svg
            ref={svgRef}
            className="absolute inset-0 pointer-events-none"
            width={canvasSize.width}
            height={canvasSize.height}
          >
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  fill="#6b7280"
                />
              </marker>
            </defs>
            
            {connections.map(connection => (
              <g key={connection.id}>
                <path
                  d={renderConnectionPath(connection)}
                  stroke={connection.color}
                  strokeWidth={connection.width}
                  strokeDasharray={connection.style === 'dashed' ? '5,5' : connection.style === 'dotted' ? '2,2' : 'none'}
                  fill="none"
                  opacity={connection.opacity}
                  markerEnd={connection.arrowEnd ? "url(#arrowhead)" : undefined}
                  className="cursor-pointer hover:stroke-blue-500"
                  onClick={() => setSelectedConnectionId(connection.id)}
                />
                {connection.label && (
                  <text
                    x={((nodes.find(n => n.id === connection.fromNodeId)?.x || 0) + 
                        (nodes.find(n => n.id === connection.toNodeId)?.x || 0)) / 2}
                    y={((nodes.find(n => n.id === connection.fromNodeId)?.y || 0) + 
                        (nodes.find(n => n.id === connection.toNodeId)?.y || 0)) / 2}
                    textAnchor="middle"
                    className="text-xs fill-gray-600 pointer-events-none"
                  >
                    {connection.label}
                  </text>
                )}
              </g>
            ))}
          </svg>
          
          {/* Nodes */}
          {nodes.map(node => (
            <div
              key={node.id}
              className={`absolute cursor-pointer select-none transition-all duration-200 ${
                selectedNodeId === node.id ? 'ring-2 ring-blue-500' : ''
              } ${node.hidden ? 'opacity-50' : ''}`}
              style={{
                left: node.x,
                top: node.y,
                width: node.width,
                height: node.height,
                backgroundColor: node.backgroundColor,
                color: node.color,
                border: `${node.borderWidth}px ${node.borderStyle} ${node.borderColor}`,
                borderRadius: node.shape === 'circle' ? '50%' : 
                           node.shape === 'ellipse' ? '50%' : 
                           node.shape === 'diamond' ? '0' : '8px',
                fontSize: node.fontSize,
                fontWeight: node.fontWeight,
                fontStyle: node.fontStyle,
                textAlign: node.textAlign,
                opacity: node.opacity,
                transform: `rotate(${node.rotation}deg)`,
                zIndex: node.zIndex,
                clipPath: node.shape === 'diamond' ? 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' :
                         node.shape === 'hexagon' ? 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)' :
                         node.shape === 'star' ? 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' :
                         'none'
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (isConnecting && connectionStart) {
                  createConnection(connectionStart, node.id);
                  setIsConnecting(false);
                  setConnectionStart(null);
                } else if (isConnecting) {
                  setConnectionStart(node.id);
                } else {
                  setSelectedNodeId(node.id);
                }
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                setEditingNode(node);
                setShowNodeEditor(true);
              }}
            >
              <div className="w-full h-full flex items-center justify-center p-2 overflow-hidden">
                {node.icon && <span className="mr-1">{node.icon}</span>}
                <span className="truncate">{node.text}</span>
              </div>
              
              {/* Node badges */}
              <div className="absolute -top-2 -right-2 flex gap-1">
                {node.priority === 'high' && (
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                )}
                {node.locked && (
                  <Lock className="w-3 h-3 text-gray-500" />
                )}
                {node.attachments.length > 0 && (
                  <div className="w-3 h-3 bg-blue-500 rounded-full text-xs text-white flex items-center justify-center">
                    {node.attachments.length}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Templates Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Mindmap Templates</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {MINDMAP_TEMPLATES.map(template => (
              <Card key={template.id} className="cursor-pointer hover:bg-gray-50" onClick={() => applyTemplate(template.id)}>
                <CardContent className="p-4">
                  <div className="text-2xl mb-2">{template.thumbnail}</div>
                  <h3 className="font-medium mb-1">{template.name}</h3>
                  <p className="text-sm text-gray-500 mb-2">{template.description}</p>
                  <Badge variant="outline">{template.category}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Node Editor Dialog */}
      <Dialog open={showNodeEditor} onOpenChange={setShowNodeEditor}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Node</DialogTitle>
          </DialogHeader>
          {editingNode && (
            <Tabs defaultValue="content" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="style">Style</TabsTrigger>
                <TabsTrigger value="position">Position</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
              </TabsList>
              
              <TabsContent value="content" className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Text</label>
                  <Input
                    value={editingNode.text}
                    onChange={e => setEditingNode({...editingNode, text: e.target.value})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Notes</label>
                  <Textarea
                    value={editingNode.notes}
                    onChange={e => setEditingNode({...editingNode, notes: e.target.value})}
                    className="mt-1"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Priority</label>
                    <Select value={editingNode.priority} onValueChange={value => setEditingNode({...editingNode, priority: value as any})}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <Select value={editingNode.status} onValueChange={value => setEditingNode({...editingNode, status: value as any})}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="idea">Idea</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="blocked">Blocked</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="style" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Background Color</label>
                    <Input
                      type="color"
                      value={editingNode.backgroundColor}
                      onChange={e => setEditingNode({...editingNode, backgroundColor: e.target.value})}
                      className="mt-1 h-10"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Text Color</label>
                    <Input
                      type="color"
                      value={editingNode.color}
                      onChange={e => setEditingNode({...editingNode, color: e.target.value})}
                      className="mt-1 h-10"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Shape</label>
                    <Select value={editingNode.shape} onValueChange={value => setEditingNode({...editingNode, shape: value as any})}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rectangle">Rectangle</SelectItem>
                        <SelectItem value="circle">Circle</SelectItem>
                        <SelectItem value="ellipse">Ellipse</SelectItem>
                        <SelectItem value="diamond">Diamond</SelectItem>
                        <SelectItem value="hexagon">Hexagon</SelectItem>
                        <SelectItem value="star">Star</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Font Size</label>
                    <Input
                      type="number"
                      value={editingNode.fontSize}
                      onChange={e => setEditingNode({...editingNode, fontSize: Number(e.target.value)})}
                      className="mt-1"
                      min="8"
                      max="72"
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="position" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">X Position</label>
                    <Input
                      type="number"
                      value={editingNode.x}
                      onChange={e => setEditingNode({...editingNode, x: Number(e.target.value)})}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Y Position</label>
                    <Input
                      type="number"
                      value={editingNode.y}
                      onChange={e => setEditingNode({...editingNode, y: Number(e.target.value)})}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Width</label>
                    <Input
                      type="number"
                      value={editingNode.width}
                      onChange={e => setEditingNode({...editingNode, width: Number(e.target.value)})}
                      className="mt-1"
                      min="50"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Height</label>
                    <Input
                      type="number"
                      value={editingNode.height}
                      onChange={e => setEditingNode({...editingNode, height: Number(e.target.value)})}
                      className="mt-1"
                      min="30"
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="advanced" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Rotation (degrees)</label>
                    <Input
                      type="number"
                      value={editingNode.rotation}
                      onChange={e => setEditingNode({...editingNode, rotation: Number(e.target.value)})}
                      className="mt-1"
                      min="-360"
                      max="360"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Opacity</label>
                    <Input
                      type="number"
                      value={editingNode.opacity}
                      onChange={e => setEditingNode({...editingNode, opacity: Number(e.target.value)})}
                      className="mt-1"
                      min="0"
                      max="1"
                      step="0.1"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Icon (emoji)</label>
                  <Input
                    value={editingNode.icon || ''}
                    onChange={e => setEditingNode({...editingNode, icon: e.target.value})}
                    className="mt-1"
                    placeholder="🎯"
                  />
                </div>
              </TabsContent>
            </Tabs>
          )}
          
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setShowNodeEditor(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              if (editingNode) {
                setNodes(prev => prev.map(node => 
                  node.id === editingNode.id ? {...editingNode, updatedAt: new Date().toISOString()} : node
                ));
                setShowNodeEditor(false);
                setEditingNode(null);
              }
            }}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MindmapBoard; 