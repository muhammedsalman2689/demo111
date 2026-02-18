import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router';
import { Plus, ChevronLeft, Home } from 'lucide-react';
import { useAppStore } from '../store';
import { Room, RoomType } from '../types';

export function ProjectDashboardPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { getProject, getProjectRooms, addRoom } = useAppStore();
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [roomType, setRoomType] = useState<RoomType>('Living Room');

  const project = getProject(projectId!);
  const rooms = getProjectRooms(projectId!);

  if (!project) {
    return <div>Project not found</div>;
  }

  const handleAddRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const newRoom: Room = {
      id: `r${Date.now()}`,
      projectId: projectId!,
      name: roomName,
      roomType,
      createdAt: new Date().toISOString(),
    };
    addRoom(newRoom);
    setShowAddRoomModal(false);
    setRoomName('');
    setRoomType('Living Room');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-black/10">
        <div className="max-w-[980px] mx-auto px-5 md:px-8 h-12 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="text-[#0066cc] hover:text-[#0077ed] transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="text-[17px] tracking-[-0.022em] text-[#1d1d1f]" style={{ fontFamily: 'var(--font-display)' }}>
              {project.name}
            </h1>
          </div>
          <button
            onClick={() => setShowAddRoomModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#0066cc] text-white rounded-full text-[14px] hover:bg-[#0077ed] transition-colors"
            style={{ fontFamily: 'var(--font-text)' }}
          >
            <Plus className="w-4 h-4" />
            Add Room
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[980px] mx-auto px-5 md:px-8 py-20">
        {/* Project Info */}
        <div className="mb-16">
          <h2
            className="text-[48px] md:text-[56px] tracking-[-0.022em] text-[#1d1d1f] mb-4"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}
          >
            {project.name}
          </h2>
          <div className="flex flex-wrap gap-6 text-[17px] text-[#86868b]" style={{ fontFamily: 'var(--font-text)' }}>
            <div>
              <span className="text-[14px] block mb-1">Customer</span>
              <span className="text-[#1d1d1f]">{project.customerName}</span>
            </div>
            <div>
              <span className="text-[14px] block mb-1">Address</span>
              <span className="text-[#1d1d1f]">{project.address}</span>
            </div>
            <div>
              <span className="text-[14px] block mb-1">Property Type</span>
              <span className="text-[#1d1d1f]">{project.propertyType}</span>
            </div>
          </div>
        </div>

        {/* Rooms Section */}
        <div>
          <h3
            className="text-[28px] tracking-[-0.022em] text-[#1d1d1f] mb-8"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}
          >
            Rooms
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {rooms.map((room) => (
              <Link
                key={room.id}
                to={`/project/${projectId}/room/${room.id}`}
                className="group block bg-[#f5f5f7] rounded-[28px] overflow-hidden hover:bg-[#e8e8ed] transition-all duration-300"
              >
                <div className="p-8">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center mb-4">
                    <Home className="w-6 h-6 text-[#1d1d1f]" />
                  </div>
                  <h4
                    className="text-[24px] tracking-[-0.022em] text-[#1d1d1f] mb-2"
                    style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}
                  >
                    {room.name}
                  </h4>
                  <p className="text-[14px] text-[#86868b]" style={{ fontFamily: 'var(--font-text)' }}>
                    {room.roomType}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>

      {/* Add Room Modal */}
      {showAddRoomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-[28px] max-w-[500px] w-full">
            <div className="p-8">
              <h2
                className="text-[32px] tracking-[-0.022em] text-[#1d1d1f] mb-6"
                style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}
              >
                Add Room
              </h2>
              <form onSubmit={handleAddRoom}>
                <div className="space-y-5">
                  <div>
                    <label className="block text-[14px] text-[#1d1d1f] mb-2" style={{ fontFamily: 'var(--font-text)' }}>
                      Room Name
                    </label>
                    <input
                      type="text"
                      required
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      className="w-full px-4 py-3 bg-[#f5f5f7] rounded-2xl border-0 text-[17px] text-[#1d1d1f] focus:bg-white focus:ring-2 focus:ring-[#0066cc] outline-none transition-all"
                      style={{ fontFamily: 'var(--font-text)' }}
                      placeholder="e.g., Living Room"
                    />
                  </div>
                  <div>
                    <label className="block text-[14px] text-[#1d1d1f] mb-2" style={{ fontFamily: 'var(--font-text)' }}>
                      Room Type
                    </label>
                    <select
                      value={roomType}
                      onChange={(e) => setRoomType(e.target.value as RoomType)}
                      className="w-full px-4 py-3 bg-[#f5f5f7] rounded-2xl border-0 text-[17px] text-[#1d1d1f] focus:bg-white focus:ring-2 focus:ring-[#0066cc] outline-none transition-all"
                      style={{ fontFamily: 'var(--font-text)' }}
                    >
                      <option value="Living Room">Living Room</option>
                      <option value="Bedroom">Bedroom</option>
                      <option value="Bathroom">Bathroom</option>
                      <option value="Kitchen">Kitchen</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 mt-8">
                  <button
                    type="button"
                    onClick={() => setShowAddRoomModal(false)}
                    className="flex-1 px-6 py-3 bg-[#f5f5f7] text-[#1d1d1f] rounded-full text-[17px] hover:bg-[#e8e8ed] transition-colors"
                    style={{ fontFamily: 'var(--font-text)' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-[#0066cc] text-white rounded-full text-[17px] hover:bg-[#0077ed] transition-colors"
                    style={{ fontFamily: 'var(--font-text)' }}
                  >
                    Add Room
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
