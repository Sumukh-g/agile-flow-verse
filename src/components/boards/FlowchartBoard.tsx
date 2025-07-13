import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import React, { useRef, useState } from 'react';
import { toast } from 'sonner';

// Types
export type FlowNode = {
  id: string;
  label: string;
  parentId?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
};
export type FlowEdge = {
  from: string;
  to: string;
  points: { x: number; y: number }[];
};
export type FlowchartExport = {
  nodes: FlowNode[];
  edges: FlowEdge[];
};

const TEMPLATES = [
  { value: 'vertical', label: 'Vertical' },
  { value: 'horizontal', label: 'Horizontal' },
  { value: 'radial', label: 'Radial' },
  { value: 'swimlane', label: 'Swimlane' },
  { value: 'creative1', label: 'Creative Zigzag' },
  { value: 'creative2', label: 'Creative Spiral' },
];

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

// --- Sidebar for linear step input ---
function SidebarStepInput({ onGenerate }: { onGenerate: (steps: string[]) => void }) {
  const [steps, setSteps] = useState<string>('');
  return (
    <div className="p-4 border-r bg-slate-50 min-w-[220px] flex flex-col gap-4 h-full">
      <h3 className="font-semibold text-lg">Quick Linear Flow</h3>
      <Textarea
        rows={8}
        value={steps}
        onChange={e => setSteps(e.target.value)}
        placeholder="Enter each step on a new line..."
        className="resize-none"
      />
      <Button
        onClick={() => {
          const list = steps.split('\n').map(s => s.trim()).filter(Boolean);
          if (list.length < 2) {
            toast.error('Enter at least 2 steps');
            return;
          }
          onGenerate(list);
        }}
      >
        Generate Flowchart
      </Button>
      <div className="text-xs text-muted-foreground mt-2">
        Instantly create a linear flowchart from a list of steps.
      </div>
    </div>
  );
}

// --- Node Input (form and JSON) ---
function NodeInput({ nodes, setNodes }: { nodes: FlowNode[]; setNodes: (n: FlowNode[]) => void }) {
  const [label, setLabel] = useState('');
  const [parentId, setParentId] = useState('');
  const [json, setJson] = useState('');
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Input value={label} onChange={e => setLabel(e.target.value)} placeholder="Node label" />
        <Input value={parentId} onChange={e => setParentId(e.target.value)} placeholder="Parent ID (optional)" />
        <Button
          onClick={() => {
            if (!label.trim()) return toast.error('Label required');
            setNodes([
              ...nodes,
              { id: generateId(), label: label.trim(), parentId: parentId.trim() || undefined },
            ]);
            setLabel('');
            setParentId('');
          }}
        >
          Add Node
        </Button>
      </div>
      <Textarea
        rows={4}
        value={json}
        onChange={e => setJson(e.target.value)}
        placeholder="Paste JSON array of nodes here..."
      />
      <Button
        variant="outline"
        onClick={() => {
          try {
            const arr = JSON.parse(json);
            if (!Array.isArray(arr)) throw new Error();
            setNodes(arr.map((n, i) => ({ ...n, id: n.id || generateId() })));
            setJson('');
          } catch {
            toast.error('Invalid JSON');
          }
        }}
      >
        Import JSON
      </Button>
    </div>
  );
}

// --- Main FlowchartBoard Component ---
const FlowchartBoard: React.FC = () => {
  const [nodes, setNodes] = useState<FlowNode[]>([]);
  const [edges, setEdges] = useState<FlowEdge[]>([]);
  const [template, setTemplate] = useState('vertical');
  const [showSidebar, setShowSidebar] = useState(true);
  const svgRef = useRef<SVGSVGElement>(null);

  // --- Layout Algorithms ---
  function layoutNodes(nodes: FlowNode[], template: string): FlowNode[] {
    // Auto-size: estimate width/height by label length
    const PAD_X = 24, PAD_Y = 16, CHAR_W = 8, CHAR_H = 18;
    let laidOut: FlowNode[] = [];
    if (template === 'vertical') {
      // Roots at top, children below
      const roots = nodes.filter(n => !n.parentId);
      let y = 40;
      roots.forEach((root, i) => {
        const width = root.label.length * CHAR_W + PAD_X;
        const height = CHAR_H + PAD_Y;
        laidOut.push({ ...root, x: 100 + i * 220, y, width, height });
        let children = nodes.filter(n => n.parentId === root.id);
        let cy = y + 120;
        children.forEach((child, j) => {
          const cwidth = child.label.length * CHAR_W + PAD_X;
          const cheight = CHAR_H + PAD_Y;
          laidOut.push({ ...child, x: 100 + i * 220, y: cy + j * 120, width: cwidth, height: cheight });
        });
      });
    } else if (template === 'horizontal') {
      // Roots at left, children to right
      const roots = nodes.filter(n => !n.parentId);
      let x = 80;
      roots.forEach((root, i) => {
        const width = root.label.length * CHAR_W + PAD_X;
        const height = CHAR_H + PAD_Y;
        laidOut.push({ ...root, x, y: 100 + i * 160, width, height });
        let children = nodes.filter(n => n.parentId === root.id);
        let cx = x + 200;
        children.forEach((child, j) => {
          const cwidth = child.label.length * CHAR_W + PAD_X;
          const cheight = CHAR_H + PAD_Y;
          laidOut.push({ ...child, x: cx + j * 200, y: 100 + i * 160, width: cwidth, height: cheight });
        });
      });
    } else if (template === 'radial') {
      // Roots at center, children in rings
      const centerX = 400, centerY = 300, R1 = 120, R2 = 220;
      const roots = nodes.filter(n => !n.parentId);
      roots.forEach((root, i) => {
        const angle = (2 * Math.PI * i) / roots.length;
        const width = root.label.length * CHAR_W + PAD_X;
        const height = CHAR_H + PAD_Y;
        const x = centerX + Math.cos(angle) * R1;
        const y = centerY + Math.sin(angle) * R1;
        laidOut.push({ ...root, x, y, width, height });
        let children = nodes.filter(n => n.parentId === root.id);
        children.forEach((child, j) => {
          const cangle = angle + ((j - (children.length - 1) / 2) * Math.PI) / 8;
          const cwidth = child.label.length * CHAR_W + PAD_X;
          const cheight = CHAR_H + PAD_Y;
          const cx = centerX + Math.cos(cangle) * R2;
          const cy = centerY + Math.sin(cangle) * R2;
          laidOut.push({ ...child, x: cx, y: cy, width: cwidth, height: cheight });
        });
      });
    } else if (template === 'swimlane') {
      // Group by parentId (or label prefix)
      const lanes = Array.from(new Set(nodes.map(n => n.parentId || n.label.split(' ')[0])));
      lanes.forEach((lane, i) => {
        const laneNodes = nodes.filter(n => (n.parentId || n.label.split(' ')[0]) === lane);
        laneNodes.forEach((node, j) => {
          const width = node.label.length * CHAR_W + PAD_X;
          const height = CHAR_H + PAD_Y;
          laidOut.push({ ...node, x: 120 + j * 220, y: 80 + i * 140, width, height });
        });
      });
    } else if (template === 'creative1') {
      // Zigzag
      nodes.forEach((node, i) => {
        const width = node.label.length * CHAR_W + PAD_X;
        const height = CHAR_H + PAD_Y;
        laidOut.push({ ...node, x: 120 + (i % 2) * 180, y: 80 + i * 100, width, height });
      });
    } else if (template === 'creative2') {
      // Spiral
      const centerX = 400, centerY = 300, baseR = 60;
      nodes.forEach((node, i) => {
        const angle = i * 0.7;
        const r = baseR + i * 40;
        const width = node.label.length * CHAR_W + PAD_X;
        const height = CHAR_H + PAD_Y;
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;
        laidOut.push({ ...node, x, y, width, height });
      });
    }
    return laidOut;
  }

  // --- Edge Generation ---
  function generateEdges(nodes: FlowNode[]): FlowEdge[] {
    const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));
    let edges: FlowEdge[] = [];
    nodes.forEach(n => {
      if (n.parentId && nodeMap[n.parentId]) {
        // Cubic Bézier from parent center to child center
        const from = nodeMap[n.parentId];
        const to = n;
        const p1 = { x: from.x! + from.width! / 2, y: from.y! + from.height! / 2 };
        const p2 = { x: to.x! + to.width! / 2, y: to.y! + to.height! / 2 };
        // Control points: horizontal or vertical offset
        let c1, c2;
        if (Math.abs(p1.x - p2.x) > Math.abs(p1.y - p2.y)) {
          c1 = { x: (p1.x + p2.x) / 2, y: p1.y };
          c2 = { x: (p1.x + p2.x) / 2, y: p2.y };
        } else {
          c1 = { x: p1.x, y: (p1.y + p2.y) / 2 };
          c2 = { x: p2.x, y: (p1.y + p2.y) / 2 };
        }
        edges.push({ from: from.id, to: to.id, points: [p1, c1, c2, p2] });
      }
    });
    return edges;
  }

  // --- Export ---
  function exportSVG(): string {
    if (!svgRef.current) return '';
    return svgRef.current.outerHTML;
  }
  function exportJSON(): FlowchartExport {
    return { nodes, edges };
  }

  // --- Handlers ---
  function handleSidebarGenerate(steps: string[]) {
    // Linear flow: each step is a node, parentId is previous
    const newNodes = steps.map((label, i) => ({
      id: generateId(),
      label,
      parentId: i === 0 ? undefined : `step${i - 1}`,
    })).map((n, i) => ({ ...n, id: `step${i}` }));
    setNodes(newNodes);
  }

  // --- Layout and edges ---
  const laidOutNodes = layoutNodes(nodes, template);
  const generatedEdges = generateEdges(laidOutNodes);

  // --- Render ---
  return (
    <div className="flex h-[700px] bg-white rounded-lg shadow-lg overflow-hidden border">
      {/* Sidebar */}
      {showSidebar && (
        <SidebarStepInput onGenerate={handleSidebarGenerate} />
      )}
      {/* Main Canvas */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center gap-4 p-3 border-b bg-slate-50">
          <Select value={template} onValueChange={setTemplate}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Template" />
            </SelectTrigger>
            <SelectContent>
              {TEMPLATES.map(t => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => setShowSidebar(s => !s)}>
            {showSidebar ? 'Hide Steps Sidebar' : 'Show Steps Sidebar'}
          </Button>
          <Button variant="outline" onClick={() => {
            const svg = exportSVG();
            navigator.clipboard.writeText(svg);
            toast.success('SVG copied to clipboard');
          }}>Export SVG</Button>
          <Button variant="outline" onClick={() => {
            const json = JSON.stringify(exportJSON(), null, 2);
            navigator.clipboard.writeText(json);
            toast.success('JSON copied to clipboard');
          }}>Export JSON</Button>
        </div>
        <div className="flex gap-4 p-4 flex-1 overflow-auto">
          <div className="flex-1 relative bg-slate-100 rounded-lg border flex items-center justify-center">
            <svg
              ref={svgRef}
              width={900}
              height={650}
              style={{ background: 'white', borderRadius: 12 }}
            >
              {/* Edges */}
              {generatedEdges.map((edge, i) => (
                <path
                  key={i}
                  d={`M${edge.points[0].x},${edge.points[0].y} C${edge.points[1].x},${edge.points[1].y} ${edge.points[2].x},${edge.points[2].y} ${edge.points[3].x},${edge.points[3].y}`}
                  stroke="#e11d48"
                  strokeWidth={2.5}
                  fill="none"
                  markerEnd="url(#arrowhead)"
                />
              ))}
              <defs>
                <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto" markerUnits="strokeWidth">
                  <path d="M0,0 L8,4 L0,8 Z" fill="#e11d48" />
                </marker>
              </defs>
              {/* Nodes */}
              {laidOutNodes.map((node, i) => (
                <g key={node.id}>
                  <rect
                    x={node.x}
                    y={node.y}
                    width={node.width}
                    height={node.height}
                    rx={16}
                    fill="#2563eb"
                    stroke="#1e293b"
                    strokeWidth={2}
                    filter="url(#shadow)"
                  />
                  <text
                    x={node.x! + node.width! / 2}
                    y={node.y! + node.height! / 2 + 6}
                    textAnchor="middle"
                    fontSize={18}
                    fill="white"
                    fontFamily="Inter, sans-serif"
                  >
                    {node.label}
                  </text>
                </g>
              ))}
              <defs>
                <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.12" />
                </filter>
              </defs>
            </svg>
          </div>
          {/* Node Input */}
          <Card className="min-w-[320px] max-w-[340px] h-fit self-start">
            <CardHeader>
              <CardTitle>Nodes</CardTitle>
            </CardHeader>
            <CardContent>
              <NodeInput nodes={nodes} setNodes={setNodes} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FlowchartBoard; 