import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router";
import {
  ChevronLeft,
  Ruler,
  Video,
  Trash2,
  Edit2,
  LogOut,
  Loader2,
} from "lucide-react";

import { useAppStore } from "../store";
import { useAuth } from "../context/AuthContext";
import { getElementApi, ElementResponse, getRoomApi, RoomResponse, getProjectApi, ProjectResponse } from "../../utils/apiEndpoints";

export function ElementPage() {
  const { projectId, roomId, elementId } = useParams();
  const navigate = useNavigate();
  const { getElement, rooms, getProject } = useAppStore();
  const { logout } = useAuth();

  const [isSold, setIsSold] = useState(false);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [apiElement, setApiElement] = useState<ElementResponse | null>(null);
  const [apiRoom, setApiRoom] = useState<RoomResponse | null>(null);
  const [apiProject, setApiProject] = useState<ProjectResponse | null>(null);

  const element = getElement(elementId!);
  const room = rooms.find((r) => r.id === roomId);
  const project = getProject(projectId!);

  useEffect(() => {
    const fetchData = async () => {
      if (!elementId || !roomId || !projectId) return;

      try {
        setLoading(true);
        const [elementData, roomData, projectData] = await Promise.all([
          getElementApi(elementId),
          getRoomApi(roomId),
          getProjectApi(projectId),
        ]);
        setApiElement(elementData);
        setApiRoom(roomData);
        setApiProject(projectData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [elementId, roomId, projectId]);

  if (loading || !apiElement || !apiRoom || !apiProject) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0066cc]" />
      </div>
    );
  }

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this element?")) {
      console.log("Delete element");
      navigate(`/project/${projectId}/room/${roomId}`);
    }
  };

  const handleInsideScan = () => {
    navigate(
      `/project/${projectId}/room/${roomId}/element/${elementId}/measure`
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-black/10">
        <div className="max-w-[980px] mx-auto px-5 md:px-8 h-12 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/project/${projectId}/room/${roomId}`)}
              className="text-[#0066cc] hover:text-[#0077ed] transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1
              className="text-[17px] tracking-[-0.022em] text-[#1d1d1f]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {apiElement.name}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#f5f5f7] text-[#1d1d1f] rounded-full text-[14px] hover:bg-red-50 hover:text-red-500 transition-colors"
              style={{ fontFamily: "var(--font-text)" }}
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#f5f5f7] text-[#1d1d1f] rounded-full text-[14px] hover:bg-[#e8e8ed] transition-colors"
              style={{ fontFamily: "var(--font-text)" }}
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[980px] mx-auto px-5 md:px-8 py-20">
        {/* Breadcrumb */}
        <div
          className="flex items-center gap-2 mb-8 text-[14px] text-[#86868b]"
          style={{ fontFamily: "var(--font-text)" }}
        >
          <Link
            to="/projects"
            className="hover:text-[#0066cc] transition-colors"
          >
            Projects
          </Link>
          <span>/</span>
          <Link
            to={`/project/${projectId}`}
            className="hover:text-[#0066cc] transition-colors"
          >
            {apiProject.name}
          </Link>
          <span>/</span>
          <Link
            to={`/project/${projectId}/room/${roomId}`}
            className="hover:text-[#0066cc] transition-colors"
          >
            {apiRoom.name}
          </Link>
          <span>/</span>
          <span className="text-[#1d1d1f]">{apiElement.name}</span>
        </div>

        {/* Element Title Section */}
        <div className="mb-16">
          <div className="inline-block px-3 py-1 bg-[#34C759] rounded-full text-[12px] text-white mb-4">
            Open
          </div>
          <div className="flex items-center gap-3 mb-6">
            <h2
              className="text-[48px] md:text-[56px] tracking-[-0.022em] text-[#1d1d1f]"
              style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
            >
              {apiElement.name}
            </h2>
            <button className="w-10 h-10 rounded-full bg-[#f5f5f7] hover:bg-[#e8e8ed] flex items-center justify-center transition-colors">
              <Edit2 className="w-5 h-5 text-[#1d1d1f]" />
            </button>
          </div>

          {/* Toggle Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => setIsSold(false)}
              className={`px-6 py-2.5 rounded-xl text-[14px] font-semibold transition-colors ${
                !isSold
                  ? "bg-[#86868b] text-white"
                  : "bg-[#f5f5f7] text-[#86868b]"
              }`}
              style={{ fontFamily: "var(--font-text)" }}
            >
              NOT
            </button>
            <button
              onClick={() => setIsSold(true)}
              className={`px-6 py-2.5 rounded-xl text-[14px] font-semibold transition-colors ${
                isSold
                  ? "bg-[#86868b] text-white"
                  : "bg-[#f5f5f7] text-[#86868b]"
              }`}
              style={{ fontFamily: "var(--font-text)" }}
            >
              SOLD
            </button>
          </div>
        </div>

        {/* Scans Section */}
        <div className="mb-16">
          <h3
            className="text-[28px] tracking-[-0.022em] text-[#1d1d1f] mb-8"
            style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
          >
            Scans
          </h3>
          <button
            // onClick={handleInsideScan}
            className="w-full bg-white rounded-[28px] p-12 hover:bg-[#fafafa] transition-colors border border-black/5 shadow-sm"
          >
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-[#f5f5f7] flex items-center justify-center mb-4">
                <Video className="w-8 h-8 text-[#1d1d1f]" />
              </div>
              <p
                className="text-[17px] text-[#1d1d1f] font-semibold"
                style={{ fontFamily: "var(--font-text)" }}
              >
                {/* Show video */}
              </p>
            </div>
          </button>
        </div>

        {/* Photos Section */}
        <div className="mb-16">
          <h3
            className="text-[28px] tracking-[-0.022em] text-[#1d1d1f] mb-8"
            style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
          >
            Measurement images
          </h3>
          <button
            onClick={() => navigate(`/project/${projectId}/room/${roomId}/element/${elementId}/measure`)}
            className="w-full bg-white rounded-[28px] p-12 hover:bg-[#fafafa] transition-colors border border-black/5 shadow-sm"
          >
            <div className="flex flex-col items-center">
              <div className="relative w-16 h-16 rounded-full bg-[#f5f5f7] flex items-center justify-center mb-4">
                <Ruler className="w-8 h-8 text-[#1d1d1f]" />
              </div>
              <p
                className="text-[17px] text-[#1d1d1f] font-semibold"
                style={{ fontFamily: "var(--font-text)" }}
              >
                {/* Start Measurement */}
              </p>
            </div>
          </button>
        </div>

        {/* Comments Section */}
        <div>
          <h3
            className="text-[28px] tracking-[-0.022em] text-[#1d1d1f] mb-8"
            style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
          >
            Comments
          </h3>
          <div className="bg-white rounded-[28px] border border-black/5 shadow-sm overflow-hidden">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add comments..."
              className="w-full p-6 text-[17px] text-[#1d1d1f] placeholder:text-[#86868b] resize-none focus:outline-none min-h-[150px]"
              style={{ fontFamily: "var(--font-text)" }}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
