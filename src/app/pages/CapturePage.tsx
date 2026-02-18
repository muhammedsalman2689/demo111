import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ChevronLeft, Ruler, Move, ZoomIn, ZoomOut, Trash2, Check } from 'lucide-react';
import { useAppStore } from '../store';

interface Point {
  x: number;
  y: number;
}

interface MeasurementLine {
  id: string;
  start: Point;
  end: Point;
  distance: number;
}

export function CapturePage() {
  const { projectId, roomId, elementId } = useParams();
  const navigate = useNavigate();
  const { getElement, getElementFrames } = useAppStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const element = getElement(elementId!);
  const frames = getElementFrames(elementId!);

  const [selectedFrameIndex, setSelectedFrameIndex] = useState(0);
  const [measurements, setMeasurements] = useState<MeasurementLine[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoint, setCurrentPoint] = useState<Point | null>(null);
  const [scale, setScale] = useState(1);
  const [mode, setMode] = useState<'measure' | 'pan'>('measure');

  useEffect(() => {
    if (!canvasRef.current || frames.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = frames[selectedFrameIndex].url;

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw image
      ctx.drawImage(img, 0, 0);

      // Draw measurements
      measurements.forEach((measurement) => {
        drawMeasurement(ctx, measurement);
      });

      // Draw current line being drawn
      if (currentPoint && isDrawing) {
        ctx.strokeStyle = '#0066cc';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(currentPoint.x, currentPoint.y);
        // We'll add the end point when mouse moves
        ctx.stroke();
        ctx.setLineDash([]);
      }
    };
  }, [frames, selectedFrameIndex, measurements, currentPoint, isDrawing]);

  const drawMeasurement = (ctx: CanvasRenderingContext2D, measurement: MeasurementLine) => {
    const { start, end, distance } = measurement;

    // Draw line
    ctx.strokeStyle = '#0066cc';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();

    // Draw endpoints
    ctx.fillStyle = '#0066cc';
    ctx.beginPath();
    ctx.arc(start.x, start.y, 6, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(end.x, end.y, 6, 0, 2 * Math.PI);
    ctx.fill();

    // Draw distance label
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;

    ctx.fillStyle = 'rgba(0, 102, 204, 0.9)';
    ctx.font = '14px Inter';
    const text = `${distance.toFixed(1)} cm`;
    const metrics = ctx.measureText(text);
    const padding = 8;

    ctx.fillRect(
      midX - metrics.width / 2 - padding,
      midY - 12 - padding,
      metrics.width + padding * 2,
      24 + padding
    );

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, midX, midY);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (mode !== 'measure' || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (!isDrawing) {
      // Start new measurement
      setCurrentPoint({ x, y });
      setIsDrawing(true);
    } else {
      // Complete measurement
      if (currentPoint) {
        const distance = Math.sqrt(Math.pow(x - currentPoint.x, 2) + Math.pow(y - currentPoint.y, 2));
        const pixelsPerCm = 10; // Mock conversion - in real app this would be calibrated
        const distanceInCm = distance / pixelsPerCm;

        const newMeasurement: MeasurementLine = {
          id: Date.now().toString(),
          start: currentPoint,
          end: { x, y },
          distance: distanceInCm,
        };

        setMeasurements([...measurements, newMeasurement]);
        setCurrentPoint(null);
        setIsDrawing(false);
      }
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentPoint || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Redraw canvas with preview line
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = frames[selectedFrameIndex].url;

    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      // Draw existing measurements
      measurements.forEach((m) => drawMeasurement(ctx, m));

      // Draw preview line
      ctx.strokeStyle = '#0066cc';
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(currentPoint.x, currentPoint.y);
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw start point
      ctx.fillStyle = '#0066cc';
      ctx.beginPath();
      ctx.arc(currentPoint.x, currentPoint.y, 6, 0, 2 * Math.PI);
      ctx.fill();
    };
  };

  const deleteMeasurement = (id: string) => {
    setMeasurements(measurements.filter((m) => m.id !== id));
  };

  if (!element || frames.length === 0) {
    return <div>No frames available</div>;
  }

  return (
    <div className="min-h-screen bg-[#000000]">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/80 border-b border-white/10">
        <div className="max-w-[1440px] mx-auto px-5 md:px-8 h-12 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/project/${projectId}/room/${roomId}/element/${elementId}`)}
              className="text-[#0066cc] hover:text-[#0077ed] transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="text-[17px] tracking-[-0.022em] text-white" style={{ fontFamily: 'var(--font-display)' }}>
              {element.name} - Measurement
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMode('measure')}
              className={`p-2 rounded-xl transition-colors ${
                mode === 'measure' ? 'bg-[#0066cc] text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              <Ruler className="w-5 h-5" />
            </button>
            <button
              onClick={() => setMode('pan')}
              className={`p-2 rounded-xl transition-colors ${
                mode === 'pan' ? 'bg-[#0066cc] text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              <Move className="w-5 h-5" />
            </button>
            <div className="w-px h-6 bg-white/20" />
            <button
              onClick={() => setScale(Math.max(0.5, scale - 0.25))}
              className="p-2 rounded-xl bg-white/10 text-white/60 hover:bg-white/20 transition-colors"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <span className="text-[14px] text-white/60 min-w-[60px] text-center">{Math.round(scale * 100)}%</span>
            <button
              onClick={() => setScale(Math.min(3, scale + 0.25))}
              className="p-2 rounded-xl bg-white/10 text-white/60 hover:bg-white/20 transition-colors"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-48px)]">
        {/* Canvas Area */}
        <div className="flex-1 flex items-center justify-center p-8 overflow-auto" ref={containerRef}>
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            onMouseMove={handleCanvasMouseMove}
            className="max-w-full h-auto rounded-2xl shadow-2xl"
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'center',
              cursor: mode === 'measure' ? 'crosshair' : 'grab',
            }}
          />
        </div>

        {/* Sidebar */}
        <div className="w-[360px] bg-[#1d1d1f] border-l border-white/10 overflow-y-auto">
          {/* Frame Thumbnails */}
          <div className="p-6 border-b border-white/10">
            <h3
              className="text-[17px] tracking-[-0.022em] text-white mb-4"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}
            >
              Frames
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {frames.map((frame, index) => (
                <button
                  key={frame.id}
                  onClick={() => {
                    setSelectedFrameIndex(index);
                    setMeasurements([]);
                    setIsDrawing(false);
                    setCurrentPoint(null);
                  }}
                  className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                    selectedFrameIndex === index ? 'border-[#0066cc]' : 'border-transparent hover:border-white/20'
                  }`}
                >
                  <img src={frame.url} alt={`Frame ${index + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Measurements List */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3
                className="text-[17px] tracking-[-0.022em] text-white"
                style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}
              >
                Measurements
              </h3>
              <span className="text-[14px] text-white/60">{measurements.length}</span>
            </div>
            <div className="space-y-3">
              {measurements.length === 0 ? (
                <p className="text-[14px] text-white/40 text-center py-8">
                  Click on the image to start measuring
                </p>
              ) : (
                measurements.map((measurement, index) => (
                  <div key={measurement.id} className="bg-white/5 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[14px] text-white/60">Measurement {index + 1}</span>
                      <button
                        onClick={() => deleteMeasurement(measurement.id)}
                        className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-white/60" />
                      </button>
                    </div>
                    <div className="text-[24px] text-white" style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                      {measurement.distance.toFixed(1)} cm
                    </div>
                  </div>
                ))
              )}
            </div>

            {measurements.length > 0 && (
              <button
                className="w-full mt-6 px-6 py-3 bg-[#0066cc] text-white rounded-full text-[17px] hover:bg-[#0077ed] transition-colors inline-flex items-center justify-center gap-2"
                style={{ fontFamily: 'var(--font-text)' }}
              >
                <Check className="w-5 h-5" />
                Save Measurements
              </button>
            )}
          </div>

          {/* Instructions */}
          <div className="p-6 border-t border-white/10">
            <h4 className="text-[14px] text-white/60 mb-3" style={{ fontFamily: 'var(--font-text)' }}>
              How to measure
            </h4>
            <ol className="text-[14px] text-white/40 space-y-2 list-decimal list-inside">
              <li>Select the Measure tool</li>
              <li>Click to set the start point</li>
              <li>Click again to set the end point</li>
              <li>Measurements are synced across frames</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
