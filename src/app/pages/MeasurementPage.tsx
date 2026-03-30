import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import { ChevronLeft, Trash2, Plus, Minus } from "lucide-react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { getElementDetailApi, getElementMediaApi, getFrameMediaApi, fetchFrameImageAsDataUrl, extractImageNameFromPath, measureApi, getElementMeasurementsApi, deleteMeasurementApi } from "../../utils/apiEndpoints";

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
  measurementIds?: number[]; // API measurement IDs for deletion
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
  const [keyframes, setKeyframes] = useState<string[]>([]);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [elementMedia, setElementMedia] = useState<any[]>([]);
  const [mediaFrames, setMediaFrames] = useState<Record<number, any[]>>({});
  const [frameImageUrls, setFrameImageUrls] = useState<Record<string, string>>({});
  const [selectedFrameImage, setSelectedFrameImage] = useState<{ frameKey: string; url: string; frameNumber: number; frameId: number; imageName: string; mediaId: number } | null>(null);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [elementMeasurements, setElementMeasurements] = useState<any[]>([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const ENDPOINT_RADIUS = 7;

  const getCanvasXY = (evt: React.MouseEvent<HTMLCanvasElement> | React.PointerEvent<HTMLCanvasElement>): Point | null => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return null;

    const rect = canvas.getBoundingClientRect();
    
    // Calculate coordinates relative to the canvas, accounting for all scaling
    const x = (evt.clientX - rect.left) * (canvas.width / rect.width);
    const y = (evt.clientY - rect.top) * (canvas.height / rect.height);
    
    console.log('Click position (canvas coords):', { x, y });
    console.log('Canvas rect:', rect);
    console.log('Canvas size:', { width: canvas.width, height: canvas.height });
    console.log('Image natural size:', { width: image.naturalWidth, height: image.naturalHeight });
    console.log('Image client size:', { width: image.clientWidth, height: image.clientHeight });
    
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
    console.log(`Getting renderable lines for activeImageName: "${activeImageName}"`);
    lines.forEach((line) => {
      if (!line) return;
      const r = getRenderableLine(line, activeImageName);
      if (r) {
        console.log(`Line ${line.id} renderable on ${activeImageName}:`, {
          p1: r.p1,
          p2: r.p2,
          obsA: line.obsA,
          obsB: line.obsB
        });
        rendered.push(r);
      }
    });
    console.log(`Found ${rendered.length} renderable lines for ${activeImageName}`);
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
    renderableLines.forEach(({ line, p1, p2 }) => {
      drawLine(ctx, p1, p2, line, "#0066cc");
    });

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
        // Fetch element media data
        const media = await getElementMediaApi(elementId);
        console.log("Element media data:", media);
        console.log("Media length:", media?.length);
        setElementMedia(media);
        
        if (!media || media.length === 0) {
          console.warn("No media items found for element");
          setResult("No media items found for this element");
          return;
        }
        
        // Fetch frames for each media item
        const framesMap: Record<number, any[]> = {};
        const imageUrlsMap: Record<string, string> = {};
        
        for (const mediaItem of media) {
          try {
            const frames = await getFrameMediaApi(mediaItem.id.toString());
            console.log(`Frames for media ${mediaItem.id}:`, frames);
            framesMap[mediaItem.id] = frames;
            
            // Fetch image blob URLs for each frame
            for (const frame of frames) {
              try {
                const frameKey = `${mediaItem.id}-${frame.id}`;
                console.log(`Fetching image for frame key: ${frameKey}, storage_path: ${frame.storage_path}`);
                
                if (frame.storage_path) {
                  const blobUrl = await fetchFrameImageAsDataUrl(frame.storage_path);
                  imageUrlsMap[frameKey] = blobUrl;
                  console.log(`Fetched image for frame ${frameKey}:`, blobUrl);
                } else {
                  console.warn(`No storage_path found for frame ${frameKey}`);
                }
              } catch (error) {
                console.error(`Failed to fetch frame image for frame ID ${frame.id}:`, error);
              }
            }
          } catch (error) {
            console.error(`Failed to fetch frames for media ${mediaItem.id}:`, error);
            framesMap[mediaItem.id] = [];
          }
        }
        setMediaFrames(framesMap);
        setFrameImageUrls(imageUrlsMap);
        
        console.log('=== FRAMES LOADED ===');
        console.log('Media frames map:', framesMap);
        console.log('Frame image URLs:', Object.keys(imageUrlsMap));
        
        // Set the first frame image as default (frame number 0 or first available)
        const firstFrameKey = Object.keys(imageUrlsMap)[0];
        if (firstFrameKey) {
          const [mediaId, frameId] = firstFrameKey.split('-');
          const frame = framesMap[parseInt(mediaId)]?.find((f: any) => f.id.toString() === frameId);
          if (frame) {
            const frameNumber = frame.frame_number !== null ? frame.frame_number : frame.id;
            const imageName = extractImageNameFromPath(frame.storage_path);
            setSelectedFrameImage({
              frameKey: firstFrameKey,
              url: imageUrlsMap[firstFrameKey],
              frameNumber,
              frameId: frame.id,
              imageName,
              mediaId: parseInt(mediaId),
            });
          }
        }
        
        // Fetch element data for keyframes
        const elementData = await getElementDetailApi(elementId);
        console.log("Element data:", elementData);
        
        if (elementData.keyframes && elementData.keyframes.length > 0) {
          setKeyframes(elementData.keyframes);
          const firstFrame = elementData.keyframes[0];
          setActiveImageName(firstFrame);
          // TODO: Replace with correct keyframe image endpoint
          // setActiveImageSrc(getMeasurementRunImageApi("video1", firstFrame));
          setResult(`Loaded ${elementData.keyframes.length} keyframes`);
        } else {
          setResult("No keyframes available");
        }
        
        // Fetch existing measurements for this element
        console.log('=== FETCHING MEASUREMENTS ===');
        const measurements = await getElementMeasurementsApi(elementId);
        console.log("Element measurements:", measurements);
        console.log("Measurements type:", typeof measurements);
        console.log("Measurements is array:", Array.isArray(measurements));
        console.log("Measurements length:", measurements?.length);
        setElementMeasurements(measurements || []);
        
        // Map measurements to lines - MUST happen after frames are loaded
        if (measurements && measurements.length > 0 && Object.keys(framesMap).length > 0) {
          console.log(`=== MAPPING ${measurements.length} MEASUREMENTS ===`);
          console.log('Available frames:', framesMap);
          
          // Create a map of frameId to frame info for quick lookup
          const frameIdToFrameMap: Record<number, { frameId: number; mediaId: number; imageName: string }> = {};
          Object.entries(framesMap).forEach(([mediaIdStr, frames]) => {
            const mediaId = parseInt(mediaIdStr);
            frames.forEach((frame: any) => {
              if (frame.storage_path) {
                const imageName = extractImageNameFromPath(frame.storage_path);
                frameIdToFrameMap[frame.id] = {
                  frameId: frame.id,
                  mediaId: mediaId,
                  imageName: imageName,
                };
                console.log(`Mapped frameId ${frame.id} to imageName: "${imageName}", mediaId: ${mediaId}`);
              }
            });
          });
          
          console.log('Frame ID to frame map:', frameIdToFrameMap);
          console.log('Frame IDs available:', Object.keys(frameIdToFrameMap));
          console.log('Frame IDs in measurements:', [...new Set(measurements.map((m: any) => m.frame_id))]);
          
          // Group measurements by their measurement_mm value to identify lines across frames
          const measurementGroups: Record<string, any[]> = {};
          measurements.forEach((measurement: any) => {
            const key = measurement.measurement_mm.toFixed(2);
            if (!measurementGroups[key]) {
              measurementGroups[key] = [];
            }
            measurementGroups[key].push(measurement);
          });
          
          console.log('Measurement groups:', measurementGroups);
          
          const mappedLines: Line[] = [];
          let lineIdCounter = nextLineId;
          
          // Process each measurement group as a single line
          Object.entries(measurementGroups).forEach(([measurementValue, groupMeasurements]) => {
            const obsA: Record<string, Point> = {};
            const obsB: Record<string, Point> = {};
            let distanceMm: number | null = null;
            let sourceImageName = 'unknown';
            const measurementIds: number[] = [];
            
            // Map each measurement in the group to its corresponding frame/image
            groupMeasurements.forEach((measurement: any) => {
              // Store measurement ID for deletion
              measurementIds.push(measurement.id);
              
              const frameInfo = frameIdToFrameMap[measurement.frame_id];
              
              if (frameInfo) {
                const imageName = frameInfo.imageName;
                
                // Map point A
                if (typeof measurement.point_ax === 'number' && typeof measurement.point_ay === 'number') {
                  obsA[imageName] = { x: measurement.point_ax, y: measurement.point_ay };
                  console.log(`Mapped obsA[${imageName}] for frame ${measurement.frame_id}:`, obsA[imageName]);
                }
                
                // Map point B
                if (typeof measurement.point_bx === 'number' && typeof measurement.point_by === 'number') {
                  obsB[imageName] = { x: measurement.point_bx, y: measurement.point_by };
                  console.log(`Mapped obsB[${imageName}] for frame ${measurement.frame_id}:`, obsB[imageName]);
                }
                
                // Set source image name to the first image
                if (sourceImageName === 'unknown') {
                  sourceImageName = imageName;
                }
                
                // Set distance (should be same for all in group)
                if (distanceMm === null && measurement.measurement_mm) {
                  distanceMm = measurement.measurement_mm;
                }
              } else {
                console.warn(`No frame info found for frame_id: ${measurement.frame_id}`);
              }
            });
            
            // Only create line if we have valid points
            if (Object.keys(obsA).length > 0 && Object.keys(obsB).length > 0) {
              const line: Line = {
                id: lineIdCounter++,
                sourceImageName,
                obsA,
                obsB,
                projA: {},
                projB: {},
                distanceMm: distanceMm,
                distanceIn: distanceMm ? distanceMm / 25.4 : null,
                status: "ok",
                error: "",
                measurementIds: measurementIds,
              };
              
              console.log(`Created line ${line.id} with ${Object.keys(obsA).length} images and ${measurementIds.length} measurement IDs:`, line);
              mappedLines.push(line);
            }
          });
          
          
          setLines(mappedLines);
          setNextLineId(lineIdCounter);
          console.log(`Mapped ${mappedLines.length} measurement lines from ${measurements.length} API measurements`);
          
          // Find all unique images that have measurement points
          const imagesWithPoints = new Set<string>();
          mappedLines.forEach(line => {
            Object.keys(line.obsA).forEach(imageName => imagesWithPoints.add(imageName));
            Object.keys(line.obsB).forEach(imageName => imagesWithPoints.add(imageName));
          });
          
          console.log('All images with measurement points:', Array.from(imagesWithPoints));
          
          // Find the first image that has measurement points and switch to it
          const firstImageWithPoints = Array.from(imagesWithPoints).find(imageName => imageName && imageName !== 'unknown');
          
          if (firstImageWithPoints) {
            console.log(`Switching to first image with points: ${firstImageWithPoints}`);
            setActiveImageName(firstImageWithPoints);
            
            // Also find and select the corresponding frame
            const frameEntry = Object.entries(frameIdToFrameMap).find(([_, info]) => info.imageName === firstImageWithPoints);
            if (frameEntry) {
              const [frameIdStr, frameInfo] = frameEntry;
              const frameKey = `${frameInfo.mediaId}-${frameInfo.frameId}`;
              if (frameImageUrls[frameKey]) {
                setSelectedFrameImage({
                  frameKey,
                  url: frameImageUrls[frameKey],
                  frameNumber: frameInfo.frameId,
                  frameId: frameInfo.frameId,
                  imageName: firstImageWithPoints,
                  mediaId: frameInfo.mediaId,
                });
                console.log(`Selected frame: ${frameKey}`);
              }
            }
          }
        } else {
          console.log("No measurements found or measurements is empty");
        }
      } catch (error) {
        console.error("Failed to fetch element data:", error);
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

    // Check if clicking on an existing endpoint - if so, don't create new line
    const hitEp = hitEndpoint(uv);
    if (hitEp) {
      console.log('Clicked on existing endpoint, ignoring click');
      return;
    }

    if (!draft) {
      console.log('Starting new draft line');
      setDraft({ p1: uv, p2: uv });
      return;
    }

    console.log('Finalizing line, creating measurement');
    
    // Use activeImageName or fallback to selectedFrameImage.imageName
    const imageName = activeImageName || selectedFrameImage?.imageName || 'unknown';
    console.log('Using image name for new line:', imageName);
    
    const newLine: Line = {
      id: nextLineId,
      sourceImageName: imageName,
      obsA: { [imageName]: draft.p1 },
      obsB: { [imageName]: uv },
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
    const image = imageRef.current;
    if (!image) return null;
    
    console.log('Checking hit for point:', point, 'against', rendered.length, 'lines');
    
    for (let i = rendered.length - 1; i >= 0; i -= 1) {
      const { line, p1, p2 } = rendered[i];
      const d1 = Math.hypot(p1.x - point.x, p1.y - point.y);
      const d2 = Math.hypot(p2.x - point.x, p2.y - point.y);
      
      console.log(`Line ${line.id}: p1 distance=${d1.toFixed(2)}, p2 distance=${d2.toFixed(2)}`);
      
      // Check direct hit on visible endpoints
      if (d1 <= ENDPOINT_RADIUS + 3) {
        console.log('Hit p1 of line', line.id);
        return { line, endpoint: "p1" as const };
      }
      if (d2 <= ENDPOINT_RADIUS + 3) {
        console.log('Hit p2 of line', line.id);
        return { line, endpoint: "p2" as const };
      }
      
      // Check for endpoints that are outside image boundaries
      // If endpoint is outside, check if click is near where line intersects image edge
      const imageWidth = image.naturalWidth;
      const imageHeight = image.naturalHeight;
      
      // Check if p2 is outside right edge and click is near the intersection
      if (p2.x > imageWidth) {
        // Calculate where line intersects right edge of image
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        if (dx !== 0) {
          const t = (imageWidth - p1.x) / dx;
          const intersectionY = p1.y + t * dy;
          const intersectionPoint = { x: imageWidth, y: intersectionY };
          const distanceToIntersection = Math.hypot(intersectionPoint.x - point.x, intersectionPoint.y - point.y);
          
          if (distanceToIntersection <= ENDPOINT_RADIUS + 5) {
            console.log('Hit p2 at right edge intersection of line', line.id);
            return { line, endpoint: "p2" as const };
          }
        }
      }
      
      // Check if p2 is outside left edge
      if (p2.x < 0) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        if (dx !== 0) {
          const t = (0 - p1.x) / dx;
          const intersectionY = p1.y + t * dy;
          const intersectionPoint = { x: 0, y: intersectionY };
          const distanceToIntersection = Math.hypot(intersectionPoint.x - point.x, intersectionPoint.y - point.y);
          
          if (distanceToIntersection <= ENDPOINT_RADIUS + 5) {
            console.log('Hit p2 at left edge intersection of line', line.id);
            return { line, endpoint: "p2" as const };
          }
        }
      }
      
      // Check if p2 is outside top edge
      if (p2.y < 0) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        if (dy !== 0) {
          const t = (0 - p1.y) / dy;
          const intersectionX = p1.x + t * dx;
          const intersectionPoint = { x: intersectionX, y: 0 };
          const distanceToIntersection = Math.hypot(intersectionPoint.x - point.x, intersectionPoint.y - point.y);
          
          if (distanceToIntersection <= ENDPOINT_RADIUS + 5) {
            console.log('Hit p2 at top edge intersection of line', line.id);
            return { line, endpoint: "p2" as const };
          }
        }
      }
      
      // Check if p2 is outside bottom edge
      if (p2.y > imageHeight) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        if (dy !== 0) {
          const t = (imageHeight - p1.y) / dy;
          const intersectionX = p1.x + t * dx;
          const intersectionPoint = { x: intersectionX, y: imageHeight };
          const distanceToIntersection = Math.hypot(intersectionPoint.x - point.x, intersectionPoint.y - point.y);
          
          if (distanceToIntersection <= ENDPOINT_RADIUS + 5) {
            console.log('Hit p2 at bottom edge intersection of line', line.id);
            return { line, endpoint: "p2" as const };
          }
        }
      }
      
      // Do the same checks for p1 if it's outside boundaries
      if (p1.x > imageWidth) {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        if (dx !== 0) {
          const t = (imageWidth - p2.x) / dx;
          const intersectionY = p2.y + t * dy;
          const intersectionPoint = { x: imageWidth, y: intersectionY };
          const distanceToIntersection = Math.hypot(intersectionPoint.x - point.x, intersectionPoint.y - point.y);
          
          if (distanceToIntersection <= ENDPOINT_RADIUS + 5) {
            console.log('Hit p1 at right edge intersection of line', line.id);
            return { line, endpoint: "p1" as const };
          }
        }
      }
      
      if (p1.x < 0) {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        if (dx !== 0) {
          const t = (0 - p2.x) / dx;
          const intersectionY = p2.y + t * dy;
          const intersectionPoint = { x: 0, y: intersectionY };
          const distanceToIntersection = Math.hypot(intersectionPoint.x - point.x, intersectionPoint.y - point.y);
          
          if (distanceToIntersection <= ENDPOINT_RADIUS + 5) {
            console.log('Hit p1 at left edge intersection of line', line.id);
            return { line, endpoint: "p1" as const };
          }
        }
      }
      
      if (p1.y < 0) {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        if (dy !== 0) {
          const t = (0 - p2.y) / dy;
          const intersectionX = p2.x + t * dx;
          const intersectionPoint = { x: intersectionX, y: 0 };
          const distanceToIntersection = Math.hypot(intersectionPoint.x - point.x, intersectionPoint.y - point.y);
          
          if (distanceToIntersection <= ENDPOINT_RADIUS + 5) {
            console.log('Hit p1 at top edge intersection of line', line.id);
            return { line, endpoint: "p1" as const };
          }
        }
      }
      
      if (p1.y > imageHeight) {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        if (dy !== 0) {
          const t = (imageHeight - p2.y) / dy;
          const intersectionX = p2.x + t * dx;
          const intersectionPoint = { x: intersectionX, y: imageHeight };
          const distanceToIntersection = Math.hypot(intersectionPoint.x - point.x, intersectionPoint.y - point.y);
          
          if (distanceToIntersection <= ENDPOINT_RADIUS + 5) {
            console.log('Hit p1 at bottom edge intersection of line', line.id);
            return { line, endpoint: "p1" as const };
          }
        }
      }
    }
    console.log('No endpoint hit');
    return null;
  };

  const handlePointerDown = (evt: React.PointerEvent<HTMLCanvasElement>) => {
    console.log('Pointer down');
    evt.preventDefault();
    
    const uv = getCanvasXY(evt);
    if (!uv) {
      console.log('No UV from getCanvasXY');
      return;
    }
    
    console.log('UV:', uv);
    const hit = hitEndpoint(uv);
    if (!hit) {
      console.log('No hit detected');
      return;
    }

    console.log('Starting drag:', hit);
    evt.stopPropagation();
    
    const dragState: DragState = {
      line: hit.line,
      endpoint: hit.endpoint,
      moved: false,
      pointerId: evt.pointerId,
      imageName: activeImageName,
    };
    
    dragRef.current = dragState;
    setDrag(dragState);
    canvasRef.current?.setPointerCapture(evt.pointerId);
  };

  const handlePointerMove = (evt: React.PointerEvent<HTMLCanvasElement>) => {
    const uv = getCanvasXY(evt);
    if (!uv) return;

    if (dragRef.current) {
      evt.preventDefault();
      console.log('Dragging to:', uv);
      
      const drag = dragRef.current;
      const updatedLines = lines.map((line) => {
        if (line.id === drag.line.id) {
          const obsMap = drag.endpoint === "p1" ? { ...line.obsA } : { ...line.obsB };
          obsMap[drag.imageName] = uv;
          return drag.endpoint === "p1" ? { ...line, obsA: obsMap } : { ...line, obsB: obsMap };
        }
        return line;
      });
      setLines(updatedLines);
      dragRef.current.moved = true;
      
      if (canvasRef.current) {
        canvasRef.current.style.cursor = "grabbing";
      }
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
    console.log('Pointer up, drag state:', dragRef.current);
    if (!dragRef.current || dragRef.current.pointerId !== evt.pointerId) return;

    const dragState = dragRef.current;
    const moved = dragState.moved;
    const draggedLine = dragState.line;

    console.log('Drag ended, moved:', moved);
    dragRef.current = null;
    setDrag(null);
    canvasRef.current?.releasePointerCapture(evt.pointerId);

    if (moved) {
      console.log('Point was moved, calling measureLine');
      setSuppressNextClick(true);
      // Get the updated line from current state
      const updatedLine = lines.find(l => l.id === draggedLine.id);
      if (updatedLine) {
        measureLine(updatedLine);
      }
    }
  };

  const measureLine = async (line: Line) => {
    console.log('measureLine called with line:', line);
    
    // Validate we have required data
    if (!elementId) {
      setResult('Error: Element ID not found');
      return;
    }
    
    if (!selectedFrameImage?.frameId) {
      setResult('Error: Frame ID not found. Please select a frame.');
      return;
    }
    
    const updatedLine = { ...line, status: "loading" as const };
    setLines((prev) => prev.map((l) => (l.id === line.id ? updatedLine : l)));
    setResult(`Measuring line ${line.id}...`);

    try {
      console.log('measureLine - line.obsA:', line.obsA);
      console.log('measureLine - line.obsB:', line.obsB);
      
      // Check if this is an existing measurement (has measurementIds) or a new one
      const isExistingMeasurement = line.measurementIds && line.measurementIds.length > 0;
      console.log('Is existing measurement:', isExistingMeasurement);
      
      // Start with the current line's points (NEW/UPDATED points)
      const point_a = Object.entries(line.obsA).map(([imageName, point]) => {
        console.log(`Adding point_a for image: ${imageName}, point:`, point);
        return {
          image_name: imageName,
          uv: [point.x, point.y] as [number, number],
          enabled: true,
        };
      });

      const point_b = Object.entries(line.obsB).map(([imageName, point]) => {
        console.log(`Adding point_b for image: ${imageName}, point:`, point);
        return {
          image_name: imageName,
          uv: [point.x, point.y] as [number, number],
          enabled: true,
        };
      });

      // Only add previous measurement points if this is an EXISTING measurement being updated
      if (isExistingMeasurement) {
        console.log('Adding points from GET API response for existing line update...');
        console.log('elementMeasurements:', elementMeasurements);
        
        // Add ALL measurement points from the GET API response
        // Skip measurements that belong to the current line being updated
        elementMeasurements.forEach((measurement: any) => {
          // Skip if this measurement belongs to the current line
          if (line.measurementIds?.includes(measurement.id)) {
            console.log(`Skipping measurement ${measurement.id} - belongs to current line`);
            return;
          }
          
          // Get the frame info to extract image name
          const frameInfo = Object.values(mediaFrames)
            .flat()
            .find((f: any) => f.id === measurement.frame_id);
          
          if (frameInfo && frameInfo.storage_path) {
            const imageName = extractImageNameFromPath(frameInfo.storage_path);
            
            // Add point A if not already present
            if (!point_a.find(p => p.image_name === imageName)) {
              point_a.push({
                image_name: imageName,
                uv: [measurement.point_ax, measurement.point_ay] as [number, number],
                enabled: true,
              });
              console.log(`Added point_a from measurement ${measurement.id} for ${imageName}`);
            }
            
            // Add point B if not already present
            if (!point_b.find(p => p.image_name === imageName)) {
              point_b.push({
                image_name: imageName,
                uv: [measurement.point_bx, measurement.point_by] as [number, number],
                enabled: true,
              });
              console.log(`Added point_b from measurement ${measurement.id} for ${imageName}`);
            }
          } else {
            console.warn(`No frame info found for frame_id: ${measurement.frame_id}`);
          }
        });
      } else {
        console.log('New measurement - only sending current line points');
      }


      const payload = {
        run_id: selectedFrameImage.mediaId,
        frame_id: selectedFrameImage.frameId,
        point_a,
        point_b,
      };

      console.log('Calling measureApi with payload:', payload);
      console.log(`Sending ${point_a.length} points for point_a and ${point_b.length} points for point_b`);
      const response = await measureApi(payload);
      console.log('measureApi response:', response);
      console.log('computed:', response.computed);
      console.log('saved:', response.saved);

      // The API returns projections in computed.point_a.projections and computed.point_b.projections
      const projA: Record<string, Point> = {};
      const projB: Record<string, Point> = {};

      // Extract projections from computed.point_a.projections
      if (response.computed?.point_a?.projections) {
        console.log('Processing point_a projections...');
        Object.entries(response.computed.point_a.projections).forEach(([imageName, coords]: [string, any]) => {
          if (Array.isArray(coords) && coords.length === 2) {
            projA[imageName] = { x: coords[0], y: coords[1] };
            console.log(`  Added projA[${imageName}]:`, projA[imageName]);
          }
        });
      }

      // Extract projections from computed.point_b.projections
      if (response.computed?.point_b?.projections) {
        console.log('Processing point_b projections...');
        Object.entries(response.computed.point_b.projections).forEach(([imageName, coords]: [string, any]) => {
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
        distanceMm: response.computed.distance_mm,
        distanceIn: response.computed.distance_in,
        projA: projA,
        projB: projB,
        status: "ok",
        error: "",
      };

      console.log('Measured line with projections:', measuredLine);
      setLines((prev) => prev.map((l) => (l.id === line.id ? measuredLine : l)));
      const distanceCm = response.computed.distance_mm / 10;
      setResult(`Measurement: ${distanceCm.toFixed(2)} cm (confidence: ${response.computed.confidence})`);

      // Always refresh measurements from server after POST
      try {
        console.log('Refreshing measurements from server after POST...');
        const refreshedMeasurements = await getElementMeasurementsApi(elementId);
        console.log('Refreshed measurements:', refreshedMeasurements);
        setElementMeasurements(refreshedMeasurements);
        
        // Update the current line with measurement IDs from the server
        // Find measurements that match this line's distance
        const matchingMeasurements = refreshedMeasurements.filter((m: any) => 
          Math.abs(m.measurement_mm - response.computed.distance_mm) < 0.01
        );
        
        if (matchingMeasurements.length > 0) {
          const measurementIds = matchingMeasurements.map((m: any) => m.id);
          console.log(`Found ${measurementIds.length} measurement IDs for line ${line.id}:`, measurementIds);
          
          // Update the line with measurement IDs
          setLines((prev) => prev.map((l) => 
            l.id === line.id ? { ...l, measurementIds } : l
          ));
        }
      } catch (refreshError) {
        console.error('Failed to refresh measurements after POST:', refreshError);
        // Don't fail the whole operation if refresh fails
      }
    } catch (error: any) {
      console.error('Measurement error:', error);
      console.error('Error response:', error?.response);
      console.error('Error response data:', error?.response?.data);
      console.error('Error response status:', error?.response?.status);
      console.error('Error message:', error?.message);
      
      // Extract error message from API response
      let errorMessage = "Measurement failed";
      if (error?.response?.data?.detail) {
        errorMessage = Array.isArray(error.response.data.detail) 
          ? error.response.data.detail.map((d: any) => d.msg || d).join(', ')
          : error.response.data.detail;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
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
    // TODO: Replace with correct keyframe image endpoint
    // setActiveImageSrc(getMeasurementRunImageApi("video1", newImageName));
    
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

  const clearCurrentImage = async () => {
    // Find lines that were created on the current image
    const linesToDelete = lines.filter((line) => line.sourceImageName === activeImageName);
    
    // Collect measurement IDs from lines to be deleted
    const measurementIds: number[] = [];
    linesToDelete.forEach(line => {
      if (line?.measurementIds && line.measurementIds.length > 0) {
        measurementIds.push(...line.measurementIds);
      }
    });

    if (measurementIds.length > 0) {
      try {
        console.log(`Deleting ${measurementIds.length} measurements for current image:`, measurementIds);
        setResult(`Deleting ${measurementIds.length} measurements...`);
        
        // Delete measurements from server
        await Promise.all(
          measurementIds.map(id => deleteMeasurementApi(id))
        );
        
        console.log('Measurements deleted successfully from server');
      } catch (error) {
        console.error('Failed to delete measurements:', error);
        setResult('Failed to delete measurements from server');
        return; // Don't clear UI if server deletion failed
      }
    }

    // Clear lines from UI
    setLines(lines.filter((line) => line.sourceImageName !== activeImageName));
    setDraft(null);
    setResult(measurementIds.length > 0 
      ? `Cleared ${linesToDelete.length} lines (${measurementIds.length} measurements) from ${activeImageName}` 
      : `Cleared lines created in ${activeImageName}`);
  };

  const clearAll = async () => {
    // Collect all measurement IDs from all lines
    const allMeasurementIds: number[] = [];
    lines.forEach(line => {
      if (line?.measurementIds && line.measurementIds.length > 0) {
        allMeasurementIds.push(...line.measurementIds);
      }
    });

    if (allMeasurementIds.length > 0) {
      try {
        console.log(`Deleting ${allMeasurementIds.length} measurements from server:`, allMeasurementIds);
        setResult(`Deleting ${allMeasurementIds.length} measurements...`);
        
        // Delete all measurements from server
        await Promise.all(
          allMeasurementIds.map(id => deleteMeasurementApi(id))
        );
        
        console.log('All measurements deleted successfully from server');
        setResult(`Deleted ${allMeasurementIds.length} measurements from server`);
      } catch (error) {
        console.error('Failed to delete measurements:', error);
        setResult('Failed to delete some measurements from server');
        return; // Don't clear UI if server deletion failed
      }
    }

    // Clear UI state
    setLines([]);
    setDraft(null);
    setDrag(null);
    setResult(allMeasurementIds.length > 0 
      ? `Cleared all ${allMeasurementIds.length} measurements` 
      : "Cleared all measurement lines");
  };

  return (
    <div className="h-screen bg-white flex flex-col">
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
      <main className="flex-1 max-w-full mx-auto px-5 md:px-8 py-4 overflow-auto">
        <div className="grid grid-cols-1  lg:grid-cols-[350px_1fr] gap-12">
          {/* Left Panel */}
          <aside className="space-y-8">
            <div>
              <h2
                className="text-[28px] tracking-[-0.022em] text-[#1d1d1f] mb-6"
                style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
              >
                Instructions
              </h2>
              <div className="space-y-3">
                <p className="text-[15px] text-[#86868b] leading-relaxed" style={{ fontFamily: "var(--font-text)" }}>
                  1. Click twice on the active image to mark two points (creates a line).
                </p>
                <p className="text-[15px] text-[#86868b] leading-relaxed" style={{ fontFamily: "var(--font-text)" }}>
                  2. Switch to another keyframe and mark the SAME two points.
                </p>
                <p className="text-[15px] text-[#86868b] leading-relaxed" style={{ fontFamily: "var(--font-text)" }}>
                  3. Repeat for at least 2 views total. The measurement will calculate automatically.
                </p>
                <p className="text-[15px] text-[#86868b] leading-relaxed" style={{ fontFamily: "var(--font-text)" }}>
                  Drag endpoints to adjust positions.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={clearCurrentImage}
                className="w-full px-6 py-2.5 bg-[#f5f5f7] rounded-full text-[14px] text-[#1d1d1f] hover:bg-[#e8e8ed] transition-colors font-medium"
                style={{ fontFamily: "var(--font-text)" }}
              >
                Clear Current Image
              </button>
              <button
                onClick={clearAll}
                className="w-full px-6 py-2.5 bg-[#f5f5f7] rounded-full text-[14px] text-[#1d1d1f] hover:bg-[#e8e8ed] transition-colors font-medium flex items-center justify-center gap-2"
                style={{ fontFamily: "var(--font-text)" }}
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </button>
            </div>

            <div className="p-6 bg-[#f5f5f7] rounded-[20px]">
              <p className="text-[14px] text-[#1d1d1f] leading-relaxed" style={{ fontFamily: "var(--font-text)" }}>
                {result}
              </p>
            </div>

            
          </aside>

          {/* Right Panel - Viewer */}
          <div className="flex flex-col items-center gap-0 scale-90">
            {/* Outer Container - Full width with flex center */}
            <div className="w-full flex justify-center">
              {/* Scrollable Container - Fixed size with overflow */}
              <div
                ref={containerRef}
                className="relative rounded-[20px] h-fit  border border-black/5 shadow-sm overflow-hidden"
                style={{ width: '1050px', height: '550px' }}
              >
                <TransformWrapper
                  initialScale={1}
                  minScale={1}
                  maxScale={3}
                  wheel={{ step: 0.1 }}
                  pinch={{ step: 5 }}
                  doubleClick={{ disabled: true }}
                  panning={{ disabled: false }}
                >
                  {({ zoomIn, zoomOut, resetTransform }) => (
                    <>
                      <TransformComponent
                        wrapperClass="w-full h-full flex items-center justify-center"
                        contentClass="flex items-center justify-center"
                      >
                        {selectedFrameImage ? (
                          <div className="relative inline-block ">
                            <img
                              ref={imageRef}
                              src={selectedFrameImage.url}
                              alt={`Frame ${selectedFrameImage.frameNumber}`}
                              className="block"
                              style={{ maxWidth: '350px', width: '500px', height: 'auto' }}
                              onLoad={() => {
                                console.log('Frame image loaded:', selectedFrameImage.frameKey);
                                setImageLoaded(true);
                                redraw();
                              }}
                              onError={() => {
                                console.error('Frame image failed to load:', selectedFrameImage.url);
                                setImageLoaded(false);
                              }}
                            />
                            <canvas
                              ref={canvasRef}
                              className="absolute cursor-crosshair"
                              style={{
                                left: 0,
                                top: 0,
                                touchAction: 'none'
                              }}
                              onClick={handleCanvasClick}
                              onPointerDown={handlePointerDown}
                              onPointerMove={handlePointerMove}
                              onPointerUp={handlePointerUp}
                              onPointerCancel={handlePointerUp}
                            />
                          </div>
                        ) : activeImageSrc ? (
                          <div className="relative inline-block">
                            <img
                              ref={imageRef}
                              src={activeImageSrc}
                              alt={activeImageName}
                              className="block"
                              style={{ maxWidth: '350px', width: '500px', height: 'auto' }}
                              onLoad={() => {
                                console.log('Image loaded:', activeImageName);
                                setImageLoaded(true);
                                redraw();
                              }}
                              onError={() => {
                                console.error('Image failed to load:', activeImageSrc);
                                setImageLoaded(false);
                              }}
                            />
                            <canvas
                              ref={canvasRef}
                              className="absolute cursor-crosshair"
                              style={{
                                left: 0,
                                top: 0,
                                touchAction: 'none'
                              }}
                              onClick={handleCanvasClick}
                              onPointerDown={handlePointerDown}
                              onPointerMove={handlePointerMove}
                              onPointerUp={handlePointerUp}
                              onPointerCancel={handlePointerUp}
                            />
                          </div>
                        ) : (
                          <div className="flex items-center justify-center p-20 ">
                            <p className="text-[#86868b] text-[15px]" style={{ fontFamily: "var(--font-text)" }}>
                              Loading images...
                            </p>
                          </div>
                        )}
                      </TransformComponent>
                      
                      {/* Zoom Controls */}
                      <div className="absolute bottom-3 right-3 flex gap-1.5 z-10 pointer-events-auto">
                        <button
                          onClick={() => zoomOut()}
                          className="w-8 h-8 rounded-full bg-white border border-black/10 flex items-center justify-center hover:bg-[#f5f5f7] transition-colors shadow-sm"
                        >
                          <Minus className="w-4 h-4 text-[#1d1d1f]" />
                        </button>
                        <button
                          onClick={() => zoomIn()}
                          className="w-8 h-8 rounded-full bg-white border border-black/10 flex items-center justify-center hover:bg-[#f5f5f7] transition-colors shadow-sm"
                        >
                          <Plus className="w-4 h-4 text-[#1d1d1f]" />
                        </button>
                        <button
                          onClick={() => resetTransform()}
                          className="w-8 h-8 rounded-full bg-white border border-black/10 flex items-center justify-center hover:bg-[#f5f5f7] transition-colors shadow-sm"
                          title="Reset zoom"
                        >
                          <span className="text-[10px] font-bold text-[#1d1d1f]">1:1</span>
                        </button>
                      </div>
                    </>
                  )}
                </TransformWrapper>
              </div>
            </div>

            {/* Thumbnail Strip */}
            <div className="flex gap-3 pb-2 overflow-x-auto">
              {keyframes.map((frame) => (
                <button
                  key={frame}
                  onClick={() => handleImageSwitch(frame)}
                  className={`flex-shrink-0 w-[120px] p-2 relative rounded-[16px] transition-all ${
                    activeImageName === frame
                      ? "bg-[#0066cc]/10 ring-2 ring-[#0066cc]"
                      : "bg-[#f5f5f7] hover:bg-[#e8e8ed]"
                  }`}
                >
                  <div className="w-full h-[80px] rounded-[12px] overflow-hidden mb-2 bg-white">
                    <img
                      src={""} // TODO: Replace with correct keyframe image endpoint
                      alt={frame}
                      className="w-full h-full object-cover"
                      onError={() => {
                        console.error('Thumbnail failed to load:', frame);
                      }}
                    />
                  </div>
                  <span className="text-[12px] text-[#1d1d1f] truncate block text-center px-1" style={{ fontFamily: "var(--font-text)" }}>
                    {frame}
                  </span>
                </button> 
              ))}
            </div>

            {/* Media Images Section */}
            {elementMedia.length > 0 && (
              <div className="w-full mt-0 ">
                {/* <h3 className="text-[20px] tracking-[-0.022em] text-[#1d1d1f] mb-4" style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}>
                  Element Media
                </h3> */}
                <div className="space-y-6x">
                  {elementMedia.map((media) => (
                    <div key={media.id} className="bg-white rounded-[16px] border border-black/5 shadow-sm overflow-hidden">
                      <div className=" border-b border-black/5">
                        {/* <p className="text-[14px] text-[#1d1d1f] font-medium" style={{ fontFamily: "var(--font-text)" }}>
                          {media.media_type} - ID: {media.id}
                        </p> */}
                      </div>
                      <div className="grid grid-cols-8 gap-2 p-1 ">
                        {mediaFrames[media.id] && mediaFrames[media.id].length > 0 ? (
                          mediaFrames[media.id].map((frame: any) => {
                            const frameKey = `${media.id}-${frame.id}`;
                            const imagePath = frame.storage_path;
                            const frameNumber = frame.frame_number !== null ? frame.frame_number : frame.id;
                            const isSelected = selectedFrameImage?.frameKey === frameKey;
                            return (
                              <button
                                key={frameKey}
                                onClick={() => {
                                  if (frameImageUrls[frameKey]) {
                                    const imageName = extractImageNameFromPath(frame.storage_path);
                                    console.log(`Switching to frame ${frameKey}, imageName: "${imageName}"`);
                                    setActiveImageName(imageName);
                                    setSelectedFrameImage({
                                      frameKey,
                                      url: frameImageUrls[frameKey],
                                      frameNumber,
                                      frameId: frame.id,
                                      imageName,
                                      mediaId: media.id,
                                    });
                                  }
                                }}
                                className={`bg-[#f5f5f7] rounded-[12px] overflow-hidden hover:shadow-md transition-all cursor-pointer ${
                                  isSelected ? 'ring-1 ring-[#0066cc] shadow-md' : ''
                                }`}
                              >
                                <div className="w-full aspect-square flex items-center justify-center bg-[#f5f5f7] overflow-hidden">
                                  {imagePath ? (
                                    <img
                                      src={frameImageUrls[frameKey] || ''}
                                      alt={`Frame ${frameNumber}`}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        console.error('Frame image failed to load:', frameKey, 'URL:', (e.target as HTMLImageElement).src);
                                      }}
                                      onLoad={() => {
                                        console.log('Frame image loaded:', frameKey);
                                      }}
                                    />
                                  ) : (
                                    <p className="text-[#86868b] text-[11px] text-center px-2" style={{ fontFamily: "var(--font-text)" }}>
                                      No path
                                    </p>
                                  )}
                                </div>
                                <div className="p-1 text-center">
                                  <p className="text-[10px] text-[#86868b]" style={{ fontFamily: "var(--font-text)" }}>
                                    #{frameNumber}
                                  </p>
                                </div>
                              </button>
                            );
                          })
                        ) : (
                          <p className="text-[#86868b] text-[12px] text-center py-4 col-span-8" style={{ fontFamily: "var(--font-text)" }}>
                            No frames available
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
