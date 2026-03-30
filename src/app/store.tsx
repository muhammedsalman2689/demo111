import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { Project, Room, Element, Frame, Measurement } from "./types";

interface AppState {
  projects: Project[];
  rooms: Room[];
  elements: Element[];
  frames: Frame[];
  measurements: Measurement[];
}

interface AppContextType extends AppState {
  setProjects: (projects: Project[]) => void;
  setRooms: (rooms: Room[]) => void;
  addProject: (project: Project) => void;
  removeProject: (projectId: string) => void;
  addRoom: (room: Room) => void;
  removeRoom: (roomId: string) => void;
  addElement: (element: Element) => void;
  removeElement: (elementId: string) => void;
  addFrame: (frame: Frame) => void;
  addMeasurement: (measurement: Measurement) => void;
  getProject: (id: string) => Project | undefined;
  getProjectRooms: (projectId: string) => Room[];
  getRoomElements: (roomId: string) => Element[];
  getElement: (id: string) => Element | undefined;
  getElementFrames: (elementId: string) => Frame[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Mock data (kept same as before)
const mockProjects: Project[] = [
  {
    id: "1",
    name: "Villa – Whitefield",
    customerName: "John Doe",
    address: "Whitefield, Bangalore",
    propertyType: "Villa",
    notes: "Luxury villa renovation project",
    createdAt: "2026-02-01T10:00:00Z",
    synced: true,
  },
  {
    id: "2",
    name: "Apartment – Indiranagar",
    customerName: "Jane Smith",
    address: "Indiranagar, Bangalore",
    propertyType: "Apartment",
    createdAt: "2026-02-10T14:00:00Z",
    synced: false,
  },
];

const mockRooms: Room[] = [
  {
    id: "r1",
    projectId: "1",
    name: "Living Room",
    roomType: "Living Room",
    createdAt: "2026-02-01T10:30:00Z",
    image:
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&auto=format&fit=crop&q=60",
  },
  {
    id: "r2",
    projectId: "1",
    name: "Bedroom 1",
    roomType: "Bedroom",
    createdAt: "2026-02-01T11:00:00Z",
    image:
      "https://images.unsplash.com/photo-1616594039964-40891a909d93?w=800&auto=format&fit=crop&q=60",
  },
  {
    id: "r3",
    projectId: "1",
    name: "Bathroom",
    roomType: "Bathroom",
    createdAt: "2026-02-01T11:30:00Z",
    image:
      "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&auto=format&fit=crop&q=60",
  },
  {
    id: "r4",
    projectId: "1",
    name: "Balcony",
    roomType: "Custom",
    createdAt: "2026-02-01T12:00:00Z",
    image:
      "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=800&auto=format&fit=crop&q=60",
  },
];

const mockElements: Element[] = [
  {
    id: "e1",
    roomId: "r3",
    name: "Window",
    elementType: "Window",
    images: [
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800",
      "https://images.unsplash.com/photo-1452022449339-24b05e829fca?w=800",
    ],
    createdAt: "2026-02-01T13:00:00Z",
  },
  {
    id: "e2",
    roomId: "r3",
    name: "Door",
    elementType: "Door",
    images: [
      "https://images.unsplash.com/photo-1544641724-73f0d1bee38b?q=80&w=735&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    ],
    createdAt: "2026-02-01T13:30:00Z",
  },
  {
    id: "e3",
    roomId: "r3",
    name: "Bathtub",
    elementType: "Bathtub",
    images: ["https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800"],
    createdAt: "2026-02-01T14:00:00Z",
  },
  {
    id: "e4",
    roomId: "r3",
    name: "Window #2",
    elementType: "Window",
    images: [
      "https://images.unsplash.com/photo-1509644851169-2acc08aa25b5?q=80&w=996&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    ],
    createdAt: "2026-02-01T14:30:00Z",
  },
  {
    id: "e5",
    roomId: "r3",
    name: "Shower Area",
    elementType: "Bathtub",
    images: [
      "https://images.unsplash.com/photo-1620626011761-996317b8d101?w=800",
    ],
    createdAt: "2026-02-01T15:00:00Z",
  },
];

const mockFrames: Frame[] = [
  {
    id: "f1",
    url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800",
    timestamp: 0,
    measurements: [],
  },
  {
    id: "f2",
    url: "https://images.unsplash.com/photo-1452022449339-24b05e829fca?w=800",
    timestamp: 2,
    measurements: [],
  },
  {
    id: "f3",
    url: "https://images.unsplash.com/photo-1534172228730-31adb885b2e3?w=800",
    timestamp: 4,
    measurements: [],
  },
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [rooms, setRooms] = useState<Room[]>(mockRooms);
  const [elements, setElements] = useState<Element[]>(mockElements);
  const [frames, setFrames] = useState<Frame[]>(mockFrames);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);

  // Using useCallback and functional updates to ensuring stable identity
  const addProject = useCallback((project: Project) => {
    setProjects((prev) => {
      const index = prev.findIndex((p) => p.id === project.id);
      if (index >= 0) {
        const newProjects = [...prev];
        newProjects[index] = project;
        return newProjects;
      }
      return [...prev, project];
    });
  }, []);

  const removeProject = useCallback((projectId: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
  }, []);

  const addRoom = useCallback((room: Room) => {
    setRooms((prev) => {
      const index = prev.findIndex((r) => r.id === room.id);
      if (index >= 0) {
        const newRooms = [...prev];
        newRooms[index] = room;
        return newRooms;
      }
      return [...prev, room];
    });
  }, []);

  const removeRoom = useCallback((roomId: string) => {
    setRooms((prev) => prev.filter((r) => r.id !== roomId));
  }, []);

  const addElement = useCallback((element: Element) => {
    setElements((prev) => {
      const index = prev.findIndex((e) => e.id === element.id);
      if (index >= 0) {
        const newElements = [...prev];
        newElements[index] = element;
        return newElements;
      }
      return [...prev, element];
    });
  }, []);

  const removeElement = useCallback((elementId: string) => {
    setElements((prev) => prev.filter((e) => e.id !== elementId));
  }, []);

  const addFrame = useCallback((frame: Frame) => {
    setFrames((prev) => {
      const index = prev.findIndex((f) => f.id === frame.id);
      if (index >= 0) {
        const newFrames = [...prev];
        newFrames[index] = frame;
        return newFrames;
      }
      return [...prev, frame];
    });
  }, []);

  const addMeasurement = useCallback((measurement: Measurement) => {
    setMeasurements((prev) => {
      const index = prev.findIndex((m) => m.id === measurement.id);
      if (index >= 0) {
        const newMeasurements = [...prev];
        newMeasurements[index] = measurement;
        return newMeasurements;
      }
      return [...prev, measurement];
    });
  }, []);

  // Getters depend on state so they still change when state changes.
  // We can useCallback here too but they rely on state variables.
  const getProject = useCallback(
    (id: string) => projects.find((p) => p.id === id),
    [projects],
  );

  const getProjectRooms = useCallback(
    (projectId: string) => rooms.filter((r) => r.projectId === projectId),
    [rooms],
  );

  const getRoomElements = useCallback(
    (roomId: string) => elements.filter((e) => e.roomId === roomId),
    [elements],
  );

  const getElement = useCallback(
    (id: string) => elements.find((e) => e.id === id),
    [elements],
  );

  const getElementFrames = useCallback((elementId: string) => frames, [frames]);

  return (
    <AppContext.Provider
      value={{
        projects,
        rooms,
        elements,
        frames,
        measurements,
        setProjects,
        setRooms,
        addProject,
        removeProject,
        addRoom,
        removeRoom,
        addElement,
        removeElement,
        addFrame,
        addMeasurement,
        getProject,
        getProjectRooms,
        getRoomElements,
        getElement,
        getElementFrames,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppStore() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppStore must be used within AppProvider");
  }
  return context;
}
