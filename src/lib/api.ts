const API_BASE_URL = import.meta.env.VITE_API_URL || '';

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    return this.request('/api/health');
  }

  // Files
  async getFiles(params?: {
    vendor?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.vendor) searchParams.append('vendor', params.vendor);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());

    const query = searchParams.toString();
    return this.request(`/api/files${query ? `?${query}` : ''}`);
  }

  async getFile(id: number) {
    return this.request(`/api/files/${id}`);
  }

  async getFileData(id: number) {
    return this.request(`/api/files/${id}/data`);
  }

  async uploadManual(data: {
    vendor: string;
    fileName: string;
    dataCount: number;
    status?: 'Correct';
  }) {
    return this.request('/api/upload', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async uploadExcel(file: File, vendor: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('vendor', vendor);

    const response = await fetch(`${this.baseURL}/api/upload-excel`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    return response.json();
  }

  async updateFile(id: number, data: {
    status?: 'Correct';
    vendor?: string;
    fileName?: string;
    dataCount?: number;
  }) {
    return this.request(`/api/files/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteFile(id: number) {
    return this.request(`/api/files/${id}`, {
      method: 'DELETE',
    });
  }

  async deleteFiles(ids: number[]) {
    return this.request('/api/files', {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
    });
  }

  // Stats and Analytics
  async getStats() {
    return this.request('/api/stats');
  }

  async getVendors() {
    return this.request('/api/vendors');
  }

  async exportVendor(vendor: string, format: 'json' | 'csv' = 'json') {
    const url = `/api/export/${vendor}${format !== 'json' ? `?format=${format}` : ''}`;
    
    if (format === 'csv') {
      const response = await fetch(`${this.baseURL}${url}`);
      if (!response.ok) {
        throw new Error(`Export failed: ${response.status}`);
      }
      return response.blob();
    }
    
    return this.request(url);
  }
}

export const api = new ApiClient();
export default api;
