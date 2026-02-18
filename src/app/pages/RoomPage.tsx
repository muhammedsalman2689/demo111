import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router";
import { Plus, ChevronLeft, Square, Camera, LogOut } from "lucide-react";
import { useAppStore } from "../store";
import { Element, ElementType } from "../types";
import { useAuth } from "../context/AuthContext";

export function RoomPage() {
  const { projectId, roomId } = useParams();
  const navigate = useNavigate();
  const { getProject, rooms, getRoomElements, addElement } = useAppStore();
  const { logout } = useAuth();
  const [showAddElementModal, setShowAddElementModal] = useState(false);
  const [elementName, setElementName] = useState("");
  const [elementType, setElementType] = useState<ElementType>("Window");

  const project = getProject(projectId!);
  const room = rooms.find((r) => r.id === roomId);
  const elements = getRoomElements(roomId!);

  if (!project || !room) {
    return <div>Room not found</div>;
  }

  const handleAddElement = (e: React.FormEvent) => {
    e.preventDefault();
    const newElement: Element = {
      id: `e${Date.now()}`,
      roomId: roomId!,
      name: elementName,
      elementType,
      images: [],
      createdAt: new Date().toISOString(),
    };
    addElement(newElement);
    setShowAddElementModal(false);
    setElementName("");
    setElementType("Window");
  };

  // Count elements by type
  const elementCounts = elements.reduce(
    (acc, el) => {
      acc[el.elementType] = (acc[el.elementType] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-black/10">
        <div className="max-w-[980px] mx-auto px-5 md:px-8 h-12 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/project/${projectId}`)}
              className="text-[#0066cc] hover:text-[#0077ed] transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1
              className="text-[17px] tracking-[-0.022em] text-[#1d1d1f]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {room.name}
            </h1>
          </div>
          <button
            onClick={logout}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#f5f5f7] text-[#1d1d1f] rounded-full text-[14px] hover:bg-[#e8e8ed] transition-colors"
            style={{ fontFamily: "var(--font-text)" }}
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
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
            {project.name}
          </Link>
          <span>/</span>
          <span className="text-[#1d1d1f]">{room.name}</span>
        </div>
        {/* Room Info */}
        <div className="mb-16">
          <div className="inline-block px-3 py-1 bg-[#f5f5f7] rounded-full text-[12px] text-[#86868b] mb-4">
            {project.name}
          </div>
          <h2
            className="text-[48px] md:text-[56px] tracking-[-0.022em] text-[#1d1d1f] mb-4"
            style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
          >
            {room.name}
          </h2>
          <p
            className="text-[19px] text-[#86868b]"
            style={{ fontFamily: "var(--font-text)" }}
          >
            {room.roomType}
          </p>
        </div>

        {/* Elements Section */}
        <div>
          <h3
            className="text-[28px] tracking-[-0.022em] text-[#1d1d1f] mb-8"
            style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
          >
            Elements
          </h3>
          <div className="space-y-4">
            {Object.entries(elementCounts).map(([type, count]) => {
              const typeElements = elements.filter(
                (el) => el.elementType === type,
              );
              return (
                <div
                  key={type}
                  className="bg-[#f5f5f7] rounded-[28px] overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4
                        className="text-[21px] tracking-[-0.022em] text-[#1d1d1f]"
                        style={{
                          fontFamily: "var(--font-display)",
                          fontWeight: 600,
                        }}
                      >
                        {type} ({count})
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {typeElements.map((element) => (
                        <Link
                          key={element.id}
                          to={`/project/${projectId}/room/${roomId}/element/${element.id}`}
                          className="block bg-white rounded-2xl p-3 hover:bg-[#fafafa] transition-colors group"
                        >
                          <div className="flex items-center gap-4">
                            {/* Element Thumbnail */}
                            <div className="w-16 h-16 rounded-xl bg-[#f5f5f7] overflow-hidden flex-shrink-0 relative">
                              {element.images && element.images.length > 0 ? (
                                <img
                                  src={element.images[0]}
                                  alt={element.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Square className="w-6 h-6 text-black/20" />
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <p
                                className="text-[17px] text-[#1d1d1f] font-medium truncate"
                                style={{ fontFamily: "var(--font-text)" }}
                              >
                                {element.name}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {element.images.length > 0 && (
                                  <span className="inline-flex items-center gap-1 text-[13px] text-[#86868b]">
                                    <Camera className="w-3 h-3" />
                                    {element.images.length}
                                  </span>
                                )}
                                <span className="text-[13px] text-[#86868b]">
                                  {/* Add measurement count if valid, placeholder for now */}
                                  {/* 0 measurements */}
                                </span>
                              </div>
                            </div>

                            <ChevronLeft className="w-5 h-5 text-[#86868b] rotate-180 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Add Element Modal */}
      {showAddElementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-[28px] max-w-[500px] w-full">
            <div className="p-8">
              <h2
                className="text-[32px] tracking-[-0.022em] text-[#1d1d1f] mb-6"
                style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
              >
                Add Element
              </h2>
              <form onSubmit={handleAddElement}>
                <div className="space-y-5">
                  <div>
                    <label
                      className="block text-[14px] text-[#1d1d1f] mb-2"
                      style={{ fontFamily: "var(--font-text)" }}
                    >
                      Element Name
                    </label>
                    <input
                      type="text"
                      required
                      value={elementName}
                      onChange={(e) => setElementName(e.target.value)}
                      className="w-full px-4 py-3 bg-[#f5f5f7] rounded-2xl border-0 text-[17px] text-[#1d1d1f] focus:bg-white focus:ring-2 focus:ring-[#0066cc] outline-none transition-all"
                      style={{ fontFamily: "var(--font-text)" }}
                      placeholder="e.g., Window"
                    />
                  </div>
                  <div>
                    <label
                      className="block text-[14px] text-[#1d1d1f] mb-2"
                      style={{ fontFamily: "var(--font-text)" }}
                    >
                      Element Type
                    </label>
                    <select
                      value={elementType}
                      onChange={(e) =>
                        setElementType(e.target.value as ElementType)
                      }
                      className="w-full px-4 py-3 bg-[#f5f5f7] rounded-2xl border-0 text-[17px] text-[#1d1d1f] focus:bg-white focus:ring-2 focus:ring-[#0066cc] outline-none transition-all"
                      style={{ fontFamily: "var(--font-text)" }}
                    >
                      <option value="Window">Window</option>
                      <option value="Door">Door</option>
                      <option value="Bathtub">Bathtub</option>
                      <option value="Wall">Wall</option>
                      <option value="Floor">Floor</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 mt-8">
                  <button
                    type="button"
                    onClick={() => setShowAddElementModal(false)}
                    className="flex-1 px-6 py-3 bg-[#f5f5f7] text-[#1d1d1f] rounded-full text-[17px] hover:bg-[#e8e8ed] transition-colors"
                    style={{ fontFamily: "var(--font-text)" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-[#0066cc] text-white rounded-full text-[17px] hover:bg-[#0077ed] transition-colors"
                    style={{ fontFamily: "var(--font-text)" }}
                  >
                    Add Element
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
