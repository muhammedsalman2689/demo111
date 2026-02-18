import { useParams, useNavigate, Link } from 'react-router';
import { ChevronLeft, Camera, Video, FileText, Ruler } from 'lucide-react';
import { useAppStore } from '../store';

export function ElementPage() {
  const { projectId, roomId, elementId } = useParams();
  const navigate = useNavigate();
  const { getElement, rooms, getProject } = useAppStore();

  const element = getElement(elementId!);
  const room = rooms.find((r) => r.id === roomId);
  const project = getProject(projectId!);

  if (!element || !room || !project) {
    return <div>Element not found</div>;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-black/10">
        <div className="max-w-[980px] mx-auto px-5 md:px-8 h-12 flex items-center">
          <button
            onClick={() => navigate(`/project/${projectId}/room/${roomId}`)}
            className="text-[#0066cc] hover:text-[#0077ed] transition-colors mr-4"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-[17px] tracking-[-0.022em] text-[#1d1d1f]" style={{ fontFamily: 'var(--font-display)' }}>
            {element.name}
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[980px] mx-auto px-5 md:px-8 py-20">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-8 text-[14px] text-[#86868b]" style={{ fontFamily: 'var(--font-text)' }}>
          <span>{project.name}</span>
          <span>/</span>
          <span>{room.name}</span>
          <span>/</span>
          <span className="text-[#1d1d1f]">{element.name}</span>
        </div>

        {/* Element Info */}
        <div className="mb-16">
          <h2
            className="text-[48px] md:text-[56px] tracking-[-0.022em] text-[#1d1d1f] mb-4"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}
          >
            {element.name}
          </h2>
          <p className="text-[19px] text-[#86868b] mb-8" style={{ fontFamily: 'var(--font-text)' }}>
            {element.elementType}
          </p>
          <div className="inline-block px-4 py-2 bg-[#f5f5f7] rounded-2xl">
            <span className="text-[14px] text-[#86868b]">Status: </span>
            <span className="text-[14px] text-[#1d1d1f]">
              {element.images.length > 0 ? 'Media Captured' : 'No Media'}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div>
          <h3
            className="text-[28px] tracking-[-0.022em] text-[#1d1d1f] mb-8"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}
          >
            Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Capture & Review - Primary Action */}
            <Link
              to={`/project/${projectId}/room/${roomId}/element/${elementId}/capture`}
              className="block bg-[#0066cc] rounded-[28px] p-8 hover:bg-[#0077ed] transition-all duration-300 group"
            >
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4">
                <Ruler className="w-7 h-7 text-white" />
              </div>
              <h4
                className="text-[24px] tracking-[-0.022em] text-white mb-2"
                style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}
              >
                Capture & Review
              </h4>
              <p className="text-[17px] text-white/80 leading-[1.47]" style={{ fontFamily: 'var(--font-text)' }}>
                View frames and perform precise measurements
              </p>
            </Link>

            {/* Other Actions */}
            <button className="block bg-[#f5f5f7] rounded-[28px] p-8 hover:bg-[#e8e8ed] transition-all duration-300 text-left">
              <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center mb-4">
                <Video className="w-7 h-7 text-[#1d1d1f]" />
              </div>
              <h4
                className="text-[24px] tracking-[-0.022em] text-[#1d1d1f] mb-2"
                style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}
              >
                Capture Video
              </h4>
              <p className="text-[17px] text-[#86868b] leading-[1.47]" style={{ fontFamily: 'var(--font-text)' }}>
                Record video for measurement
              </p>
            </button>

            <button className="block bg-[#f5f5f7] rounded-[28px] p-8 hover:bg-[#e8e8ed] transition-all duration-300 text-left">
              <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center mb-4">
                <Camera className="w-7 h-7 text-[#1d1d1f]" />
              </div>
              <h4
                className="text-[24px] tracking-[-0.022em] text-[#1d1d1f] mb-2"
                style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}
              >
                Capture Images
              </h4>
              <p className="text-[17px] text-[#86868b] leading-[1.47]" style={{ fontFamily: 'var(--font-text)' }}>
                Take reference photos
              </p>
            </button>

            <button className="block bg-[#f5f5f7] rounded-[28px] p-8 hover:bg-[#e8e8ed] transition-all duration-300 text-left">
              <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center mb-4">
                <FileText className="w-7 h-7 text-[#1d1d1f]" />
              </div>
              <h4
                className="text-[24px] tracking-[-0.022em] text-[#1d1d1f] mb-2"
                style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}
              >
                Add Notes
              </h4>
              <p className="text-[17px] text-[#86868b] leading-[1.47]" style={{ fontFamily: 'var(--font-text)' }}>
                Document observations
              </p>
            </button>
          </div>
        </div>

        {/* Media Gallery */}
        {element.images.length > 0 && (
          <div className="mt-20">
            <h3
              className="text-[28px] tracking-[-0.022em] text-[#1d1d1f] mb-8"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}
            >
              Captured Media
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {element.images.map((img, index) => (
                <div key={index} className="aspect-square rounded-2xl overflow-hidden bg-[#f5f5f7]">
                  <img src={img} alt={`${element.name} ${index + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
