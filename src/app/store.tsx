import React, { createContext, useContext, useState, ReactNode } from "react";
import { Project, Room, Element, Frame, Measurement } from "./types";

interface AppState {
  projects: Project[];
  rooms: Room[];
  elements: Element[];
  frames: Frame[];
  measurements: Measurement[];
}

interface AppContextType extends AppState {
  addProject: (project: Project) => void;
  addRoom: (room: Room) => void;
  addElement: (element: Element) => void;
  addFrame: (frame: Frame) => void;
  addMeasurement: (measurement: Measurement) => void;
  getProject: (id: string) => Project | undefined;
  getProjectRooms: (projectId: string) => Room[];
  getRoomElements: (roomId: string) => Element[];
  getElement: (id: string) => Element | undefined;
  getElementFrames: (elementId: string) => Frame[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Mock data
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

  const addProject = (project: Project) => {
    setProjects([...projects, project]);
  };

  const addRoom = (room: Room) => {
    setRooms([...rooms, room]);
  };

  const addElement = (element: Element) => {
    setElements([...elements, element]);
  };

  const addFrame = (frame: Frame) => {
    setFrames([...frames, frame]);
  };

  const addMeasurement = (measurement: Measurement) => {
    setMeasurements([...measurements, measurement]);
  };

  const getProject = (id: string) => projects.find((p) => p.id === id);

  const getProjectRooms = (projectId: string) =>
    rooms.filter((r) => r.projectId === projectId);

  const getRoomElements = (roomId: string) =>
    elements.filter((e) => e.roomId === roomId);

  const getElement = (id: string) => elements.find((e) => e.id === id);

  const getElementFrames = (elementId: string) => frames;

  return (
    <AppContext.Provider
      value={{
        projects,
        rooms,
        elements,
        frames,
        measurements,
        addProject,
        addRoom,
        addElement,
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
