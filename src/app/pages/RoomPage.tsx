import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router";
import {
  ChevronLeft,
  Square,
  LogOut,
  Loader2,
  Trash2,
} from "lucide-react";
import { useAppStore } from "../store";
import { Element, ElementType, Room, Project } from "../types";
import { useAuth } from "../context/AuthContext";
import {
  getProjectApi,
  getRoomApi,
  getRoomTypesApi,
  deleteElementApi,
  getElementsApi,
  getElementTypesApi,
  ElementResponse,
  ElementTypeResponse,
} from "../../utils/apiEndpoints";

export function RoomPage() {
  const { projectId, roomId } = useParams();
  const navigate = useNavigate();
  const {
    getProject,
    rooms,
    getRoomElements,
    addElement,
    removeElement,
    addProject,
    addRoom,
  } = useAppStore();
  const { logout } = useAuth();
  const [showAddElementModal, setShowAddElementModal] = useState(false);
  const [elementName, setElementName] = useState("");
  const [elementType, setElementType] = useState<ElementType>("Window");
  const [loading, setLoading] = useState(true);
  const [apiElements, setApiElements] = useState<ElementResponse[]>([]);
  const [elementTypes, setElementTypes] = useState<ElementTypeResponse[]>([]);

  const project = getProject(projectId!);
  const room = rooms.find((r) => r.id === roomId);
  const elements = getRoomElements(roomId!);

  useEffect(() => {
    const fetchData = async () => {
      if (!projectId || !roomId) return;

      try {
        setLoading(true);
        // 1. Fetch Project if missing
        if (!project) {
          const projectData = await getProjectApi(projectId);
          const mappedProject: Project = {
            id: projectData.id.toString(),
            name: projectData.name,
            customerName: projectData.customer_name,
            address: projectData.customer_address,
            propertyType: "Apartment",
            notes: "",
            createdAt: projectData.created_at,
            synced: true,
          };
          addProject(mappedProject);
        }

        // 2. Fetch Room and Types to ensure we have latest data and mapping
        // Even if room exists in store, we might want to refresh it, or fetch if missing (page refresh)
        const [roomData, roomTypesData, elementsData, elementTypesData] = await Promise.all([
          getRoomApi(roomId),
          getRoomTypesApi(),
          getElementsApi(roomId),
          getElementTypesApi(),
        ]);

        const roomTypeMap = new Map(roomTypesData.map((t) => [t.id, t.name]));

        const mappedRoom: Room = {
          id: roomData.id.toString(),
          projectId: roomData.project_id.toString(),
          name: roomData.name,
          roomType: (roomTypeMap.get(roomData.room_type_id) || "Custom") as any, // Cast to any/RoomType as needed
          createdAt: roomData.created_at,
          image: "",
        };

        // Update store - addRoom typically adds or updates (check store impl if needed, but safe to call)
        addRoom(mappedRoom);
        
        // Create element type map for mapping element_type_id to type name
        const elementTypeMap = new Map(elementTypesData.map((t) => [t.id, t.name]));
        
        // Map and add elements to store
        elementsData.forEach((el) => {
          const mappedElement: Element = {
            id: el.id.toString(),
            roomId: el.room_id.toString(),
            name: el.name,
            elementType: (elementTypeMap.get(el.element_type_id) || "Custom") as any,
            images: [],
            createdAt: el.created_at,
          };
          addElement(mappedElement);
        });
        
        // Store elements and element types
        setApiElements(elementsData);
        setElementTypes(elementTypesData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId, roomId, addProject, addRoom, addElement]);

  if (loading && !room) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0066cc]" />
      </div>
    );
  }

  if (!project || !room) {
    return <div>Room or Project not found</div>;
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

  const handleDeleteElement = async (e: React.MouseEvent, elementId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this element?")) {
      try {
        await deleteElementApi(elementId);
        removeElement(elementId);
        // Refresh elements list
        const elementsData = await getElementsApi(roomId!);
        setApiElements(elementsData);
      } catch (error) {
        console.error("Failed to delete element:", error);
        alert("Failed to delete element. Please try again.");
      }
    }
  };

  // Create element type map for quick lookup
  const elementTypeMap = new Map(elementTypes.map((t) => [t.id, t.name]));

  // Group elements by element type using element_type_id
  const elementsByType = apiElements.reduce(
    (acc, el) => {
      const typeName = elementTypeMap.get(el.element_type_id) || "Unknown";
      if (!acc[typeName]) {
        acc[typeName] = [];
      }
      acc[typeName].push(el);
      return acc;
    },
    {} as Record<string, ElementResponse[]>,
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
          {Object.keys(elementsByType).length === 0 ? (
            <div className="text-center py-12 text-[#86868b]">
              <p className="text-[17px]" style={{ fontFamily: "var(--font-text)" }}>
                No elements found. Add your first element to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(elementsByType).map(([type, typeElements]) => (
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
                        {type} ({typeElements.length})
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {typeElements.map((element) => (
                        <Link
                          key={element.id}
                          to={`/project/${projectId}/room/${roomId}/element/${element.id}`}
                          className="block bg-white rounded-2xl p-3 hover:bg-[#fafafa] transition-colors group relative"
                        >
                          <button
                            onClick={(e) => handleDeleteElement(e, element.id.toString())}
                            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-[#f5f5f7] hover:bg-red-50 flex items-center justify-center transition-colors group/delete z-10"
                            aria-label="Delete element"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-[#86868b] group-hover/delete:text-red-500" />
                          </button>
                          <div className="flex items-center gap-4">
                            {/* Element Thumbnail */}
                            <div className="w-16 h-16 rounded-xl bg-[#f5f5f7] overflow-hidden flex-shrink-0 relative">
                              <div className="w-full h-full flex items-center justify-center">
                                <Square className="w-6 h-6 text-black/20" />
                              </div>
                            </div>

                            <div className="flex-1 min-w-0 pr-8">
                              <p
                                className="text-[17px] text-[#1d1d1f] font-medium truncate"
                                style={{ fontFamily: "var(--font-text)" }}
                              >
                                {element.name}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[13px] text-[#86868b]">
                                  {new Date(element.created_at).toLocaleDateString()}
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
              ))}
            </div>
          )}
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
