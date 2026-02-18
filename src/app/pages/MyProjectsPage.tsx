import { useState } from "react";
import { Link } from "react-router";
import { Plus, Home, Check, RefreshCw, LogOut } from "lucide-react";
import { useAppStore } from "../store";
import { Project, PropertyType } from "../types";
import { useAuth } from "../context/AuthContext";

export function MyProjectsPage() {
  const { projects, addProject } = useAppStore();
  const { logout } = useAuth(); // Destructure logout from AuthContext
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    customerName: "",
    address: "",
    propertyType: "Villa" as PropertyType,
    notes: "",
  });

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
              <div className="p-8">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center">
                    <Home className="w-6 h-6 text-[#1d1d1f]" />
                  </div>
                  <div className="flex items-center gap-2">
                    {project.synced ? (
                      <div className="flex items-center gap-1.5 text-[#34c759]">
                        <Check className="w-4 h-4" />
                        <span
                          className="text-[14px]"
                          style={{ fontFamily: "var(--font-text)" }}
                        >
                          Synced
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-[#86868b]">
                        <RefreshCw className="w-4 h-4" />
                        <span
                          className="text-[14px]"
                          style={{ fontFamily: "var(--font-text)" }}
                        >
                          Pending
                        </span>
                      </div>
                    )}
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
                <div className="mt-4 inline-block px-3 py-1 bg-white rounded-full text-[12px] text-[#1d1d1f]">
                  {project.propertyType}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
