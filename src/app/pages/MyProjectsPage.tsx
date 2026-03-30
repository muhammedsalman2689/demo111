import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Home, LogOut, Trash2 } from "lucide-react";
import { useAppStore } from "../store";
import { Project, PropertyType } from "../types";
import { useAuth } from "../context/AuthContext";
import { getProjectsApi, deleteProjectApi } from "../../utils/apiEndpoints";

export function MyProjectsPage() {
  const { projects, addProject, setProjects, removeProject } = useAppStore();
  const { logout } = useAuth(); // Destructure logout from AuthContext
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    customerName: "",
    address: "",
    propertyType: "Villa" as PropertyType,
    notes: "",
  });

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await getProjectsApi();
        // Map API response to Project interface
        const mappedProjects: Project[] = data.map((p) => ({
          id: p.id.toString(),
          name: p.name,
          customerName: p.customer_name,
          address: p.customer_address,
          propertyType: "Apartment", // Default or map if available
          notes: "",
          createdAt: p.created_at,
          synced: true,
        }));
        setProjects(mappedProjects);
      } catch (error) {
        console.error("Failed to fetch projects:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [setProjects]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newProject: Project = {
      id: Date.now().toString(),
      ...formData,
      createdAt: new Date().toISOString(),
      synced: false,
    };
    addProject(newProject);
    setShowCreateModal(false);
    setFormData({
      name: "",
      customerName: "",
      address: "",
      propertyType: "Villa",
      notes: "",
    });
  };

  const handleDelete = async (e: React.MouseEvent, projectId: string) => {
    e.preventDefault(); // Prevent navigation to project page
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this project?")) {
      try {
        await deleteProjectApi(projectId);
        removeProject(projectId);
      } catch (error) {
        console.error("Failed to delete project:", error);
        alert("Failed to delete project. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-black/10">
        <div className="max-w-[980px] mx-auto px-5 md:px-8 h-12 flex items-center justify-between">
          <h1
            className="text-[17px] tracking-[-0.022em] text-[#1d1d1f]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            My Projects
          </h1>
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
          <div className="flex items-center gap-2">
            <Home className="w-4 h-4" />
            <span>Home</span>
          </div>
          <span>/</span>
          <span className="text-[#1d1d1f]">Projects</span>
        </div>

        <div className="mb-12">
          <h2
            className="text-[48px] md:text-[56px] tracking-[-0.022em] text-[#1d1d1f] mb-3"
            style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
          >
            Projects
          </h2>
          <p
            className="text-[19px] text-[#86868b] leading-[1.47]"
            style={{ fontFamily: "var(--font-text)" }}
          >
            Manage and track all your measurement projects
          </p>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((project) => (
            <Link
              key={project.id}
              to={`/project/${project.id}`}
              className="group block bg-[#f5f5f7] rounded-[28px] overflow-hidden hover:bg-[#e8e8ed] transition-all duration-300"
            >
              <div className="p-8 relative">
                <button
                  onClick={(e) => handleDelete(e, project.id)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white hover:bg-red-50 flex items-center justify-center transition-colors group/delete"
                  aria-label="Delete project"
                >
                  <Trash2 className="w-4 h-4 text-[#86868b] group-hover/delete:text-red-500" />
                </button>
                <div className="flex items-start mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center">
                    <Home className="w-6 h-6 text-[#1d1d1f]" />
                  </div>
                </div>
                <h3
                  className="text-[28px] tracking-[-0.022em] text-[#1d1d1f] mb-2"
                  style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
                >
                  {project.name}
                </h3>
                <p
                  className="text-[17px] text-[#86868b] mb-1"
                  style={{ fontFamily: "var(--font-text)" }}
                >
                  {project.customerName}
                </p>
                <p
                  className="text-[14px] text-[#86868b]"
                  style={{ fontFamily: "var(--font-text)" }}
                >
                  {project.address}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <div className="inline-block px-3 py-1 bg-white rounded-full text-[12px] text-[#1d1d1f]">
                    {project.propertyType}
                  </div>
                  <span
                    className="text-[14px] text-[#86868b]"
                    style={{ fontFamily: "var(--font-text)" }}
                  >
                    {new Date(project.createdAt).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
