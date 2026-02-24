import api from './api';

interface LoginResponse {
  access_token: string;
  token_type: string;
}

export const loginApi = async (username: string, password: string): Promise<LoginResponse> => {
  // 1. Use URLSearchParams to force application/x-www-form-urlencoded
  const params = new URLSearchParams();
  params.append('grant_type', 'password'); // Required by your API spec
  params.append('username', username);
  params.append('password', password);

  const response = await api.post<LoginResponse>('/api/v1/login', params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  
  return response.data;
};

export interface ProjectResponse {
  name: string;
  customer_name: string;
  customer_address: string;
  customer_phone: string;
  organization_id: number;
  id: number;
  created_by_id: number;
  created_at: string;
  updated_at: string;
}

export const getProjectsApi = async () => {
  const response = await api.get('/api/v1/projects/');
  return response.data;
};

// Workaround for now if the specific project endpoint doesn't allow GET
export const getProjectApi = async (id: string): Promise<ProjectResponse> => {
  const projects = await getProjectsApi();
  const project = projects.find((p) => p.id.toString() === id);
  if (!project) throw new Error("Project not found");
  return project;
};

export interface RoomResponse {
  id: number;
  project_id: number;
  room_type_id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export const getRoomsApi = async (projectId: string): Promise<RoomResponse[]> => {
  const response = await api.get<RoomResponse[]>(`/api/v1/rooms/?project_id=${projectId}`);
  return response.data;
};

export interface RoomTypeResponse {
  id: number;
  name: string;
}

export const getRoomTypesApi = async (): Promise<RoomTypeResponse[]> => {
  const response = await api.get<RoomTypeResponse[]>('/api/v1/rooms/room-types');
  return response.data;
};

export const getRoomApi = async (roomId: string): Promise<RoomResponse> => {
  const response = await api.get<RoomResponse>(`/api/v1/rooms/${roomId}`);
  return response.data;
};

export interface ElementResponse {
  id: number;
  room_id: number;
  name: string;
  element_type_id: number;
  created_at: string;
  updated_at: string;
}

export const getElementsApi = async (roomId: string): Promise<ElementResponse[]> => {
  const response = await api.get<ElementResponse[]>(`/api/v1/elements/?room_id=${roomId}`);
  return response.data;
};

export const getElementApi = async (elementId: string): Promise<ElementResponse> => {
  const response = await api.get<ElementResponse>(`/api/v1/elements/${elementId}`);
  return response.data;
};

export interface ElementTypeResponse {
  id: number;
  name: string;
}

export const getElementTypesApi = async (): Promise<ElementTypeResponse[]> => {
  const response = await api.get<ElementTypeResponse[]>('/api/v1/elements/element-types');
  return response.data;
};
    //project delete api call//
export const deleteProjectApi = async (projectId: string): Promise<void> => {
  await api.delete(`/api/v1/projects/${projectId}`);
};

export const deleteRoomApi = async (roomId: string): Promise<void> => {
  await api.delete(`/api/v1/rooms/${roomId}`);
};

export const deleteElementApi = async (elementId: string): Promise<void> => {
  await api.delete(`/api/v1/elements/${elementId}`);
};

