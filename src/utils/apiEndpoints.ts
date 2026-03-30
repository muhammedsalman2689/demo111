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
  const project = projects.find((project) => project.id.toString() === id);
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

export interface ElementDetailResponse extends ElementResponse {
  keyframes?: string[];
  has_reconstruction?: boolean;
}

export const getElementsApi = async (roomId: string): Promise<ElementResponse[]> => {
  const response = await api.get<ElementResponse[]>(`/api/v1/elements/?room_id=${roomId}`);
  return response.data;
};

export const getElementApi = async (elementId: string): Promise<ElementResponse> => {
  const response = await api.get<ElementResponse>(`/api/v1/elements/${elementId}`);
  return response.data;
};

export const getElementDetailApi = async (elementId: string): Promise<ElementDetailResponse> => {
  const response = await api.get<ElementDetailResponse>(`/api/v1/elements/${elementId}`);
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


export interface ElementMediaResponse {
  id: number;
  element_id: number;
  media_type: string;
  media_url: string;
  created_at: string;
  updated_at: string;
}

export interface MediaResponse {
  id: number;
  element_id: number;
  media_type?: string;
  created_at?: string;
  updated_at?: string;
}

export const getElementMediaApi = async (elementId: string): Promise<MediaResponse[]> => {
  try {
    console.log(`Calling getElementMediaApi with elementId: ${elementId}`);
    
    // Step 1: Get media object for element with purpose=1
    const mediaResponse = await api.get<MediaResponse | MediaResponse[]>(
      `/api/v1/media/element/${elementId}?purpose=1`
    );
    
    console.log(`getElementMediaApi response:`, mediaResponse.data);
    
    // Handle both single object and array responses
    const mediaList = Array.isArray(mediaResponse.data) 
      ? mediaResponse.data 
      : [mediaResponse.data];
    
    return mediaList;
  } catch (error: any) {
    console.error(`getElementMediaApi error for elementId ${elementId}:`, error);
    console.error(`Error status: ${error?.response?.status}`);
    console.error(`Error data:`, error?.response?.data);
    return [];
  }
};

export interface FrameMediaResponse {
  id: number;
  media_id: number;
  frame_number?: number;
  storage_path: string;
  created_at: string;
  updated_at: string;
}

// Helper function to extract image name from storage path
export const extractImageNameFromPath = (storagePath: string): string => {
  // Extract filename from path like "data/26/44/47/frames/59/frame_00086.jpg"
  const parts = storagePath.split('/');
  return parts[parts.length - 1] || 'unknown.jpg';
};

export const getFrameMediaApi = async (mediaId: string): Promise<FrameMediaResponse[]> => {
  try {
    console.log(`Calling getFrameMediaApi with mediaId: ${mediaId}`);
    const response = await api.get<FrameMediaResponse[]>(`/api/v1/frames/media/${mediaId}`);
    console.log(`getFrameMediaApi response:`, response.data);
    return response.data;
  } catch (error: any) {
    console.error(`getFrameMediaApi error for mediaId ${mediaId}:`, error);
    console.error(`Error status: ${error?.response?.status}`);
    console.error(`Error data:`, error?.response?.data);
    return [];
  }
};

export const getFrameImageApi = (imgPath: string): string => {
  // URL encode the path properly for the API
  const encodedPath = encodeURIComponent(imgPath);
  return `${api.defaults.baseURL}/api/v1/media/file/${encodedPath}`;
};

export const fetchFrameImageAsDataUrl = async (filePath: string): Promise<string> => {
  try {
    console.log(`fetchFrameImageAsDataUrl called with filePath: ${filePath}`);
    const encodedPath = encodeURIComponent(filePath);
    const fullUrl = `/api/v1/media/file/${encodedPath}`;
    const baseURL = api.defaults.baseURL;
    const completeUrl = `${baseURL}${fullUrl}`;
    console.log(`Full API URL: ${completeUrl}`);
    console.log(`Encoded path: ${encodedPath}`);
    
    const response = await api.get(fullUrl, {
      responseType: 'blob',
    });
    
    console.log(`Response received - blob size: ${response.data.size} bytes`);
    const blob = response.data;
    const blobUrl = URL.createObjectURL(blob);
    console.log(`Created blob URL: ${blobUrl}`);
    return blobUrl;
  } catch (error) {
    console.error('Failed to fetch frame image:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
    }
    throw error;
  }
};

export interface MeasurementPointData {
  image_name: string;
  uv: [number, number];
  enabled: boolean;
}

export interface MeasurementRequest {
  run_id: number | string;
  frame_id: number;
  point_a: MeasurementPointData[];
  point_b: MeasurementPointData[];
}

export interface MeasurementResponse {
  computed: {
    point_a: {
      xyz_mm: [number, number, number];
      rms_reprojection_px: number;
      used_views: string[];
      rejected_views: string[];
      projections: Record<string, [number, number]>;
    };
    point_b: {
      xyz_mm: [number, number, number];
      rms_reprojection_px: number;
      used_views: string[];
      rejected_views: string[];
      projections: Record<string, [number, number]>;
    };
    distance_mm: number;
    distance_in: number;
    rms_reprojection_px: number;
    confidence: string;
  };
  saved: Array<{
    id?: number;
    element_id?: number;
    frame_id?: number;
    point_ax?: number;
    point_ay?: number;
    point_bx?: number;
    point_by?: number;
    measurement_mm?: number;
    created_at?: string;
    updated_at?: string;
  }>;
}

export const measureApi = async (data: MeasurementRequest): Promise<MeasurementResponse> => {
  try {
    console.log('measureApi called with data:', JSON.stringify(data, null, 2));
    console.log('Payload details:');
    console.log('  run_id:', data.run_id, 'type:', typeof data.run_id);
    console.log('  frame_id:', data.frame_id, 'type:', typeof data.frame_id);
    console.log('  point_a length:', data.point_a.length);
    console.log('  point_b length:', data.point_b.length);
    
    const response = await api.post<MeasurementResponse>('/api/v1/measurements/measure', data);
    console.log('measureApi response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('measureApi error:', error);
    console.error('Error status:', error?.response?.status);
    console.error('Error status text:', error?.response?.statusText);
    console.error('Error data:', error?.response?.data);
    console.error('Error message:', error?.message);
    console.error('Full error:', error);
    throw error;
  }
};

export interface ElementMeasurementResponse {
  id: number;
  element_id: number;
  frame_id: number;
  measurement_mm: number;
  point_ax: number;
  point_ay: number;
  point_bx: number;
  point_by: number;
  created_at: string;
  updated_at: string;
}

export const getElementMeasurementsApi = async (elementId: string): Promise<ElementMeasurementResponse[]> => {
  try {
    console.log(`Calling getElementMeasurementsApi with elementId: ${elementId}`);
    const url = `/api/v1/measurements/element/${elementId}`;
    console.log(`Full URL: ${api.defaults.baseURL}${url}`);
    const response = await api.get<ElementMeasurementResponse[]>(url);
    console.log(`getElementMeasurementsApi response:`, response.data);
    console.log(`Response status: ${response.status}`);
    return response.data;
  } catch (error: any) {
    console.error(`getElementMeasurementsApi error for elementId ${elementId}:`, error);
    console.error(`Error status: ${error?.response?.status}`);
    console.error(`Error data:`, error?.response?.data);
    console.error(`Error message: ${error?.message}`);
    return [];
  }
};

export const deleteMeasurementApi = async (measurementId: number): Promise<void> => {
  try {
    console.log(`Calling deleteMeasurementApi with measurementId: ${measurementId}`);
    const url = `/api/v1/measurements/${measurementId}`;
    console.log(`Full URL: ${api.defaults.baseURL}${url}`);
    const response = await api.delete(url);
    console.log(`deleteMeasurementApi response status: ${response.status}`);
  } catch (error: any) {
    console.error(`deleteMeasurementApi error for measurementId ${measurementId}:`, error);
    console.error(`Error status: ${error?.response?.status}`);
    console.error(`Error data:`, error?.response?.data);
    throw error;
  }
};
