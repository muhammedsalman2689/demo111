import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import { ChevronLeft, Trash2 } from "lucide-react";
import { measureApi, getElementDetailApi, getMeasurementRunApi, getMeasurementRunImageApi } from "../../utils/apiEndpoints";

interface Point {
  x: number;
  y: number;
}

interface Line {
  id: number;
  sourceImageName: string;
  obsA: Record<string, Point>;
  obsB: Record<string, Point>;
  projA: Record<string, Point>;
  projB: Record<string, Point>;
  distanceMm: number | null;
  distanceIn: number | null;
  status: "idle" | "loading" | "ok" | "error";
  error: string;
}

interface DraftLine {
  p1: Point;
  p2: Point;
}

interface DragState {
  line: Line;
  endpoint: "p1" | "p2";
  moved: boolean;
  pointerId: number;
  imageName: string;
}

export function MeasurementPage() {
  const { projectId, roomId, elementId } = useParams();
  const navigate = useNavigate();

  const [activeImageName, setActiveImageName] = useState("");
  const [activeImageSrc, setActiveImageSrc] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [draft, setDraft] = useState<DraftLine | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [nextLineId, setNextLineId] = useState(1);
  const [suppressNextClick, setSuppressNextClick] = useState(false);
  const [result, setResult] = useState("Select points on the active image to create a measurement line.");
  const [keyframes, setKeyframes] = useState<string[]>([
    "frame_001.jpg",
    "frame_002.jpg",
    "frame_003.jpg",
  ]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const ENDPOINT_RADIUS = 7;

  const getCanvasXY = (evt: React.MouseEvent<HTMLCanvasElement> | React.PointerEvent<HTMLCanvasElement>): Point | null => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return null;

    const rect = canvas.getBoundingClientRect();
    const imageRect = image.getBoundingClientRect();
    
    // Check if click is within the displayed image bounds
    if (evt.clientX < imageRect.left || evt.clientX > imageRect.right ||
        evt.clientY < imageRect.top || evt.clientY > imageRect.bottom) {
      console.log('Click outside image bounds');
      return null;
    }
    
    // Calculate coordinates relative to the canvas
    const x = (evt.clientX - rect.left) * (canvas.width / rect.width);
    const y = (evt.clientY - rect.top) * (canvas.height / rect.height);
    
    // Additional check against natural image dimensions
    if (x < 0 || x > image.naturalWidth || y < 0 || y > image.naturalHeight) {
      console.log('Click outside natural image dimensions');
      return null;
    }
    
    return { x, y };
  };

  const formatMeasurement = (line: Line): string => {
    if (line.status === "loading") return "Computing...";
    if (line.status === "error") return "Error";
    if (typeof line.distanceMm === "number") {
      const distanceCm = line.distanceMm / 10; // Convert mm to cm
      return `${distanceCm.toFixed(2)} cm`;
    }
    return "";
  };

  const getLinePoint = (line: Line, endpoint: "p1" | "p2", imageName: string): Point | null => {
    if (!line) return null;
    
    const obs = endpoint === "p1" ? line.obsA : line.obsB;
    const proj = endpoint === "p1" ? line.projA : line.projB;
    
    return obs?.[imageName] || proj?.[imageName] || null;
  };

  const getRenderableLine = (line: Line, imageName: string) => {
    if (!line) return null;
    const p1 = getLinePoint(line, "p1", imageName);
    const p2 = getLinePoint(line, "p2", imageName);
    if (!p1 || !p2) return null;
    return { line, p1, p2 };
  };

  const getActiveRenderableLines = () => {
    const rendered: Array<{ line: Line; p1: Point; p2: Point }> = [];
    lines.forEach((line) => {
      if (!line) return;
      const r = getRenderableLine(line, activeImageName);
      if (r) rendered.push(r);
    });
    return rendered;
  };

  const drawEndpoint = (ctx: CanvasRenderingContext2D, point: Point, fill = "#0066cc") => {
    ctx.beginPath();
    ctx.fillStyle = fill;
    ctx.arc(point.x, point.y, ENDPOINT_RADIUS, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawLine = (ctx: CanvasRenderingContext2D, p1: Point, p2: Point, line: Partial<Line>, color = "#0066cc") => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();

    drawEndpoint(ctx, p1, color);
    drawEndpoint(ctx, p2, color);

    // Always show a label - either the measurement or pixel distance
    let label = "";
    if (line.status === "ok" && (line as Line).distanceMm !== null) {
      // Show real measurement if available
      label = formatMeasurement(line as Line);
    } else if (line.status === "loading") {
      label = "Computing...";
    } else if (line.status === "error") {
      label = "Error";
    } else {
      // Show pixel distance for all other cases (idle, draft, or no measurement)
      const pixelDistance = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      label = `${pixelDistance.toFixed(0)} px`;
    }
    
    if (!label) return;

    // Calculate midpoint
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;

    // Calculate perpendicular offset for label (stick to line with small offset)
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const length = Math.hypot(dx, dy);
    const perpX = -dy / length;
    const perpY = dx / length;
    const offset = 20; // Distance from line

    const labelX = midX + perpX * offset;
    const labelY = midY + perpY * offset;

    // Calculate angle of the line
    const angle = Math.atan2(dy, dx);

    // Save context state
    ctx.save();
    
    // Move to label position and rotate
    ctx.translate(labelX, labelY);
    ctx.rotate(angle);
    
    // Set font properties
    ctx.font = "900 14px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    const textWidth = ctx.measureText(label).width;
    const pad = 10;
    const boxW = textWidth + pad * 2;
    const boxH = 28;

    // Draw label background (rotated parallel to line)
    ctx.fillStyle = "rgba(255, 255, 255, 0.98)";
    ctx.strokeStyle = color === "#86868b" ? "rgba(134, 134, 139, 0.3)" : "rgba(0, 102, 204, 0.4)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-boxW / 2, -boxH / 2, boxW, boxH, 8);
    ctx.fill();
    ctx.stroke();

    // Draw label text (parallel to the line)
    ctx.fillStyle = color === "#86868b" ? "#86868b" : "#0066cc";
    ctx.fillText(label, 0, 0);
    
    // Restore context state
    ctx.restore();

    // Draw a small line connecting label to the measurement line
    ctx.strokeStyle = color === "#86868b" ? "rgba(134, 134, 139, 0.3)" : "rgba(0, 102, 204, 0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(midX, midY);
    ctx.lineTo(labelX, labelY);
    ctx.stroke();
    
    // Restore context state
    ctx.restore();
  };

  const redraw = () => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    const ctx = canvas?.getContext("2d");

    if (!canvas || !image || !ctx || !image.naturalWidth || !image.naturalHeight) return;

    // Set canvas size to match the natural image dimensions
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    
    // Set canvas display size to match the displayed image size
    canvas.style.width = `${image.clientWidth}px`;
    canvas.style.height = `${image.clientHeight}px`;
    
    // Position canvas to match image position
    canvas.style.left = '0';
    canvas.style.top = '0';

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const renderableLines = getActiveRenderableLines();
    renderableLines.forEach(({ line, p1, p2 }) => drawLine(ctx, p1, p2, line));

    if (draft) {
      drawLine(ctx, draft.p1, draft.p2, {}, "#86868b");
    }
  };

  useEffect(() => {
    redraw();
  }, [lines, draft, activeImageName, activeImageSrc]);

  useEffect(() => {
    const fetchElementData = async () => {
      if (!elementId) return;
      
      try {
        // Fetch measurement run data
        const measurementRun = await getMeasurementRunApi("video1");
        console.log("Measurement run data:", measurementRun);
        
        // Use keyframes from measurement run if available
        if (measurementRun && (measurementRun as any).keyframes && (measurementRun as any).keyframes.length > 0) {
          const runKeyframes = (measurementRun as any).keyframes;
          setKeyframes(runKeyframes);
          const firstFrame = runKeyframes[0];
          setActiveImageName(firstFrame);
          setActiveImageSrc(getMeasurementRunImageApi("video1", firstFrame));
          setResult(`Loaded ${runKeyframes.length} keyframes from measurement run`);
        } else {
          // Fallback to element data
          const elementData = await getElementDetailApi(elementId);
          
          if (elementData.keyframes && elementData.keyframes.length > 0) {
            setKeyframes(elementData.keyframes);
            const firstFrame = elementData.keyframes[0];
            setActiveImageName(firstFrame);
            setActiveImageSrc(getMeasurementRunImageApi("video1", firstFrame));
          } else if (keyframes.length > 0) {
            const firstFrame = keyframes[0];
            setActiveImageName(firstFrame);
            setActiveImageSrc(`https://images.unsplash.com/photo-1563298723-dcfebaa392e3?w=800&h=600&fit=crop`);
          }
        }
      } catch (error) {
        console.error("Failed to fetch measurement run data:", error);
        // Fallback to sample door image
        if (keyframes.length > 0) {
          const firstFrame = keyframes[0];
          setActiveImageName(firstFrame);
          setActiveImageSrc(`https://images.unsplash.com/photo-1563298723-dcfebaa392e3?w=800&h=600&fit=crop`);
        }
      }
    };

    fetchElementData();
  }, [elementId]);

  const handleCanvasClick = (evt: React.MouseEvent<HTMLCanvasElement>) => {
    console.log('Canvas clicked');
    if (suppressNextClick) {
      console.log('Click suppressed');
      setSuppressNextClick(false);
      return;
    }

    const uv = getCanvasXY(evt);
    if (!uv) {
      console.log('Click outside image boundaries');
      return;
    }
    
    console.log('Click position:', uv);

    if (!draft) {
      console.log('Starting new draft line');
      setDraft({ p1: uv, p2: uv });
      return;
    }

    console.log('Finalizing line, creating measurement');
    const newLine: Line = {
      id: nextLineId,
      sourceImageName: activeImageName,
      obsA: { [activeImageName]: draft.p1 },
      obsB: { [activeImageName]: uv },
      projA: {},
      projB: {},
      distanceMm: null,
      distanceIn: null,
      status: "idle",
      error: "",
    };

    console.log('New line created:', newLine);
    setNextLineId(nextLineId + 1);
    setLines([...lines, newLine]);
    setDraft(null);
    console.log('About to call measureLine');
    measureLine(newLine);
  };

  const hitEndpoint = (point: Point) => {
    const rendered = getActiveRenderableLines();
    for (let i = rendered.length - 1; i >= 0; i -= 1) {
      const { line, p1, p2 } = rendered[i];
      const d1 = Math.hypot(p1.x - point.x, p1.y - point.y);
      if (d1 <= ENDPOINT_RADIUS + 3) return { line, endpoint: "p1" as const };
      const d2 = Math.hypot(p2.x - point.x, p2.y - point.y);
      if (d2 <= ENDPOINT_RADIUS + 3) return { line, endpoint: "p2" as const };
    }
    return null;
  };

  const handlePointerDown = (evt: React.PointerEvent<HTMLCanvasElement>) => {
    const uv = getCanvasXY(evt);
    if (!uv) return;
    
    const hit = hitEndpoint(uv);
    if (!hit) return;

    setDrag({
      line: hit.line,
      endpoint: hit.endpoint,
      moved: false,
      pointerId: evt.pointerId,
      imageName: activeImageName,
    });

    canvasRef.current?.setPointerCapture(evt.pointerId);
  };

  const handlePointerMove = (evt: React.PointerEvent<HTMLCanvasElement>) => {
    const uv = getCanvasXY(evt);
    if (!uv) return;

    if (drag) {
      const updatedLines = lines.map((line) => {
        if (line.id === drag.line.id) {
          const obsMap = drag.endpoint === "p1" ? { ...line.obsA } : { ...line.obsB };
          obsMap[drag.imageName] = uv;
          return drag.endpoint === "p1" ? { ...line, obsA: obsMap } : { ...line, obsB: obsMap };
        }
        return line;
      });
      setLines(updatedLines);
      setDrag({ ...drag, moved: true });
      return;
    }

    if (draft) {
      setDraft({ ...draft, p2: uv });
    }

    const hit = hitEndpoint(uv);
    if (canvasRef.current) {
      canvasRef.current.style.cursor = hit ? "grab" : "crosshair";
    }
  };

  const handlePointerUp = (evt: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drag || drag.pointerId !== evt.pointerId) return;

    const draggedLine = drag.line;
    const moved = drag.moved;

    setDrag(null);
    canvasRef.current?.releasePointerCapture(evt.pointerId);

    if (moved) {
      setSuppressNextClick(true);
      measureLine(draggedLine);
    }
  };

  const measureLine = async (line: Line) => {
    console.log('measureLine called with line:', line);
    
    const updatedLine = { ...line, status: "loading" as const };
    setLines((prev) => prev.map((l) => (l.id === line.id ? updatedLine : l)));
    setResult(`Measuring line ${line.id}...`);

    try {
      // Convert obsA and obsB to the new format
      const point_a = Object.entries(line.obsA).map(([image_name, point]) => ({
        image_name,
        uv: [point.x, point.y] as [number, number],
        enabled: true,
      }));

      const point_b = Object.entries(line.obsB).map(([image_name, point]) => ({
        image_name,
        uv: [point.x, point.y] as [number, number],
        enabled: true,
      }));

      const payload = {
        run_id: "video1",
        point_a,
        point_b,
      };

      console.log('Calling measureApi with payload:', payload);
      const response = await measureApi(payload);
      console.log('measureApi response:', response);
      console.log('point_a:', response.point_a);
      console.log('point_b:', response.point_b);

      // The API returns projections inside point_a.projections and point_b.projections
      const projA: Record<string, Point> = {};
      const projB: Record<string, Point> = {};

      // Extract projections from point_a
      if (response.point_a?.projections && typeof response.point_a.projections === 'object') {
        console.log('Processing point_a.projections...');
        Object.entries(response.point_a.projections).forEach(([imageName, coords]: [string, any]) => {
          if (Array.isArray(coords) && coords.length === 2) {
            projA[imageName] = { x: coords[0], y: coords[1] };
            console.log(`  Added projA[${imageName}]:`, projA[imageName]);
          }
        });
      }

      // Extract projections from point_b
      if (response.point_b?.projections && typeof response.point_b.projections === 'object') {
        console.log('Processing point_b.projections...');
        Object.entries(response.point_b.projections).forEach(([imageName, coords]: [string, any]) => {
          if (Array.isArray(coords) && coords.length === 2) {
            projB[imageName] = { x: coords[0], y: coords[1] };
            console.log(`  Added projB[${imageName}]:`, projB[imageName]);
          }
        });
      }

      console.log('Final converted projA:', projA);
      console.log('Final converted projB:', projB);

      const measuredLine: Line = {
        ...updatedLine,
        distanceMm: response.distance_mm,
        distanceIn: response.distance_in,
        projA: projA,
        projB: projB,
        status: "ok",
        error: "",
      };

      console.log('Measured line with projections:', measuredLine);
      setLines((prev) => prev.map((l) => (l.id === line.id ? measuredLine : l)));
      const distanceCm = response.distance_mm / 10;
      setResult(`Measurement: ${distanceCm.toFixed(2)} cm`);

      // Update keyframes if available in response
      if (response.keyframes && Array.isArray(response.keyframes)) {
        setKeyframes(response.keyframes);
      }
    } catch (error: any) {
      console.error('measureApi error:', error);
      
      // Extract error message from API response
      let errorMessage = "Measurement failed";
      if (error?.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      const errorLine: Line = {
        ...updatedLine,
        status: "error",
        error: errorMessage,
      };
      setLines((prev) => prev.map((l) => (l.id === line.id ? errorLine : l)));
      setResult(`Line ${line.id}: ${errorMessage}`);
    }
  };

  const handleImageSwitch = (newImageName: string) => {
    console.log('Switching to image:', newImageName);
    console.log('Current lines:', lines);
    
    setActiveImageName(newImageName);
    setActiveImageSrc(getMeasurementRunImageApi("video1", newImageName));
    
    // For each line, if it has projection coordinates for this image but no observed coordinates,
    // copy the projections to observed so they show up on the new image
    const updatedLines = lines.map(line => {
      if (!line || !line.projA || !line.projB) {
        console.log('Line missing projections:', line);
        return line;
      }
      
      const hasProjA = line.projA[newImageName];
      const hasProjB = line.projB[newImageName];
      const hasObsA = line.obsA?.[newImageName];
      const hasObsB = line.obsB?.[newImageName];
      
      console.log(`Line ${line.id} - hasProjA:`, hasProjA, 'hasProjB:', hasProjB, 'hasObsA:', hasObsA, 'hasObsB:', hasObsB);
      
      // If we have projections but no observations for this image, use the projections
      if ((hasProjA || hasProjB) && (!hasObsA || !hasObsB)) {
        const newObsA = { ...line.obsA };
        const newObsB = { ...line.obsB };
        
        if (hasProjA && !hasObsA) {
          newObsA[newImageName] = line.projA[newImageName];
          console.log(`Copying projA to obsA for ${newImageName}:`, line.projA[newImageName]);
        }
        
        if (hasProjB && !hasObsB) {
          newObsB[newImageName] = line.projB[newImageName];
          console.log(`Copying projB to obsB for ${newImageName}:`, line.projB[newImageName]);
        }
        
        const updatedLine = {
          ...line,
          obsA: newObsA,
          obsB: newObsB,
        };
        
        console.log('Updated line:', updatedLine);
        return updatedLine;
      }
      
      return line;
    });
    
    console.log('Updated lines:', updatedLines);
    setLines(updatedLines);
    setResult(`Switched to: ${newImageName} - ${updatedLines.filter(l => l.obsA?.[newImageName] && l.obsB?.[newImageName]).length} lines visible`);
  };

  const clearCurrentImage = () => {
    setLines(lines.filter((line) => line.sourceImageName !== activeImageName));
    setDraft(null);
    setResult(`Cleared lines created in ${activeImageName}`);
  };

  const clearAll = () => {
    setLines([]);
    setDraft(null);
    setDrag(null);
    setResult("Cleared all measurement lines");
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-black/10">
        <div className="max-w-[980px] mx-auto px-5 md:px-8 h-12 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/project/${projectId}/room/${roomId}/element/${elementId}`)}
              className="text-[#0066cc] hover:text-[#0077ed] transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="text-[17px] tracking-[-0.022em] text-[#1d1d1f]" style={{ fontFamily: "var(--font-display)" }}>
              Metric 3D Measurement
            </h1>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className=" flex  mx-auto px-5 md:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-8">
          {/* Left Panel */}
          <aside className="space-y-6">
            <div>
              <h2 className="text-[20px] font-semibold text-[#1d1d1f] mb-3" style={{ fontFamily: "var(--font-display)" }}>
                Instructions
              </h2>
              <p className="text-[14px] text-[#86868b] mb-2" style={{ fontFamily: "var(--font-text)" }}>
                1. Click twice on the active image to mark two points (creates a line).
              </p>
              <p className="text-[14px] text-[#86868b] mb-2" style={{ fontFamily: "var(--font-text)" }}>
                2. Switch to another keyframe and mark the SAME two points.
              </p>
              <p className="text-[14px] text-[#86868b] mb-2" style={{ fontFamily: "var(--font-text)" }}>
                3. Repeat for at least 2 views total. The measurement will calculate automatically.
              </p>
              <p className="text-[14px] text-[#86868b]" style={{ fontFamily: "var(--font-text)" }}>
                Drag endpoints to adjust positions.
              </p>
            </div>

            <div className="space-y-2">
              <button
                onClick={clearCurrentImage}
                className="w-full px-4 py-2.5 bg-[#f5f5f7] rounded-full text-[14px] text-[#1d1d1f] hover:bg-[#e8e8ed] transition-colors"
                style={{ fontFamily: "var(--font-text)" }}
              >
                Clear Current Image
              </button>
              <button
                onClick={clearAll}
                className="w-full px-4 py-2.5 bg-[#f5f5f7] rounded-full text-[14px] text-[#1d1d1f] hover:bg-[#e8e8ed] transition-colors flex items-center justify-center gap-2"
                style={{ fontFamily: "var(--font-text)" }}
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </button>
            </div>

            <div className="p-4 bg-[#f5f5f7] rounded-2xl min-h-[100px]">
              <p className="text-[13px] text-[#1d1d1f]" style={{ fontFamily: "var(--font-text)" }}>{result}</p>
            </div>
          </aside>

          {/* Right Panel - Viewer */}
          <main className="flex flex-col gap-6">
            {/* Active Frame */}
            <div className="relative rounded-[8px] w-fit overflow-hidden bg-[#f5f5f7] border border-black/5 shadow-sm inline-block">
              <img
                ref={imageRef}
                src={activeImageSrc || "https://images.unsplash.com/photo-1563298723-dcfebaa392e3?w=800&h=600&fit=crop"}
                alt={activeImageName || "Sample Door"}
                className="block"
                onLoad={redraw}
                onError={(e) => {
                  console.error('Image failed to load:', activeImageSrc);
                  // Fallback to sample door image on error
                  e.currentTarget.src = "https://images.unsplash.com/photo-1563298723-dcfebaa392e3?w=800&h=600&fit=crop";
                }}
              />
              <canvas
                ref={canvasRef}
                className="absolute cursor-crosshair pointer-events-auto"
                style={{ left: 0, top: 0 }}
                onClick={handleCanvasClick}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
              />
            </div>

            {/* Thumbnail Strip */}
            <div className="flex gap-3 pb-2 overflow-x-auto">
              {keyframes.map((frame, index) => (
                <button
                  key={frame}
                  onClick={() => handleImageSwitch(frame)}
                  className={`flex-shrink-0 w-[120px] p-2 relative rounded-2xl transition-all ${
                    activeImageName === frame
                      ? "bg-[#0066cc]/10 ring-2 ring-[#0066cc]"
                      : "bg-[#f5f5f7] hover:bg-[#e8e8ed]"
                  }`}
                >
                  <div className="w-full h-[80px] rounded-xl overflow-hidden mb-2 bg-white">
                    <img
                      src={getMeasurementRunImageApi("video1", frame)}
                      alt={frame}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to sample door images with different angles
                        const doorImages = [
                          "https://images.unsplash.com/photo-1563298723-dcfebaa392e3?w=120&h=80&fit=crop",
                          "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=120&h=80&fit=crop",
                          "https://images.unsplash.com/photo-1534237710431-e2fc698436d0?w=120&h=80&fit=crop"
                        ];
                        e.currentTarget.src = doorImages[index % doorImages.length];
                      }}
                    />
                  </div>
                  <span className="text-[11px] text-[#1d1d1f] truncate block text-center px-1" style={{ fontFamily: "var(--font-text)" }}>
                    {frame}
                  </span>
                </button>
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
