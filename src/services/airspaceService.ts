const API_BASE_URL = 'http://localhost:3001/api';

export interface AirspaceShape {
  id: string;
  name: string;
  type: 'circle' | 'oval' | 'rectangle' | 'track';
  center: {
    latitude: number;
    longitude: number;
    altitude: number;
  };
  dimensions: {
    radius?: number;
    semiMajorAxis?: number;
    semiMinorAxis?: number;
    rotation?: number;
    width?: number;
    height?: number;
    length?: number;
  };
  color: string;
  opacity: number;
  outline: boolean;
  outlineColor: string;
  description: string;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface AirspaceResponse {
  success: boolean;
  data: AirspaceShape[];
  count: number;
  bounds?: MapBounds;
  timestamp: string;
}

export class AirspaceService {
  static async getAirspaces(count?: number, bounds?: MapBounds): Promise<AirspaceShape[]> {
    try {
      let url = `${API_BASE_URL}/airspaces`;
      
      if (bounds) {
        url += `?north=${bounds.north}&south=${bounds.south}&east=${bounds.east}&west=${bounds.west}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result: AirspaceResponse = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching airspaces:', error);
      throw error;
    }
  }

  static async getAirspaceById(id: string): Promise<AirspaceShape> {
    try {
      const response = await fetch(`${API_BASE_URL}/airspaces/${id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error(`Error fetching airspace ${id}:`, error);
      throw error;
    }
  }

  static async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return response.ok;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
}
