import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Generic API response structure
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  details?: any[];
}

// API request configuration
interface ApiConfig {
  baseURL: string;
  timeout: number;
  enableLogging: boolean;
}

class ApiService {
  private static instance: ApiService;
  private axiosInstance: AxiosInstance;
  private config: ApiConfig;

  private constructor() {
    this.config = {
      baseURL: 'https://api.prayerapp.com/v1', // Replace with your actual API URL
      timeout: 10000, // 10 seconds
      enableLogging: __DEV__, // Enable logging in development only
    };

    this.axiosInstance = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    this.setupInterceptors();
  }

  static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }
  private setupInterceptors(): void {
    // Request interceptor - automatically add auth token
    this.axiosInstance.interceptors.request.use(
      async config => {
        try {
          // Use UnifiedUserService for auth token (lazy import to avoid circular dependency)
          const UnifiedUserService = require('./UnifiedUserService').default;
          const userService = UnifiedUserService.getInstance();
          const token = await userService.getAuthToken();
          
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log('🔑 ApiService: Auth token added to request header');
          }

          if (this.config.enableLogging) {
            console.log(
              `🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`,
            );
            if (config.data) {
              console.log('📤 Request Data:', config.data);
            }
          }

          return config;
        } catch (error) {
          console.error('❌ Error in request interceptor:', error);
          return config;
        }
      },
      error => {
        console.error('❌ Request interceptor error:', error);
        return Promise.reject(error);
      },
    );

    // Response interceptor - handle responses and errors consistently
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        if (this.config.enableLogging) {
          console.log(
            `✅ API Response: ${response.status} ${response.config.url}`,
          );
          console.log('📥 Response Data:', response.data);
        }
        return response;
      },
      (error: AxiosError) => {
        if (this.config.enableLogging) {
          console.error(
            `❌ API Error: ${error.response?.status} ${error.config?.url}`,
          );
          if (error.response?.data) {
            console.error('📥 Error Data:', error.response.data);
          }
        }

        // Handle token expiration
        if (error.response?.status === 401) {
          this.handleAuthError();
        }

        return Promise.reject(error);
      },
    );
  }  private async handleAuthError(): Promise<void> {
    try {
      // Use UnifiedUserService for auth token cleanup
      const UnifiedUserService = require('./UnifiedUserService').default;
      const userService = UnifiedUserService.getInstance();
      await userService.clearAuthToken();
      console.log('🔒 Auth token removed due to 401 error via UnifiedUserService');
    } catch (error) {
      console.error('❌ Error handling auth error:', error);
    }
  }

  // Generic GET request
  async get<T = any>(
    endpoint: string,
    params?: Record<string, any>,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.get(endpoint, {
        params,
        ...config,
      });
      return this.formatResponse<T>(response);
    } catch (error) {
      return this.handleError<T>(error as AxiosError);
    }
  }

  // Generic POST request
  async post<T = any>(
    endpoint: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.post(endpoint, data, config);
      return this.formatResponse<T>(response);
    } catch (error) {
      return this.handleError<T>(error as AxiosError);
    }
  }

  // Generic PUT request
  async put<T = any>(
    endpoint: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.put(endpoint, data, config);
      return this.formatResponse<T>(response);
    } catch (error) {
      return this.handleError<T>(error as AxiosError);
    }
  }

  // Generic DELETE request
  async delete<T = any>(
    endpoint: string,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.delete(endpoint, config);
      return this.formatResponse<T>(response);
    } catch (error) {
      return this.handleError<T>(error as AxiosError);
    }
  }

  // Generic PATCH request
  async patch<T = any>(
    endpoint: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.patch(endpoint, data, config);
      return this.formatResponse<T>(response);
    } catch (error) {
      return this.handleError<T>(error as AxiosError);
    }
  }

  // Upload file with multipart/form-data
  async upload<T = any>(
    endpoint: string,
    formData: FormData,
    onUploadProgress?: (progressEvent: any) => void,
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress,
      });
      return this.formatResponse<T>(response);
    } catch (error) {
      return this.handleError<T>(error as AxiosError);
    }
  }

  // Format successful response consistently
  private formatResponse<T>(response: AxiosResponse): ApiResponse<T> {
    // If the response already follows our format, return it as is
    if (
      response.data &&
      typeof response.data === 'object' &&
      'success' in response.data
    ) {
      return response.data as ApiResponse<T>;
    }

    // Otherwise, wrap it in our format
    return {
      success: true,
      data: response.data as T,
      message: response.statusText || 'Request successful',
    };
  }

  // Handle errors consistently
  private handleError<T>(error: AxiosError): ApiResponse<T> {
    const response = error.response;

    // If the error response follows our format, return it
    if (
      response?.data &&
      typeof response.data === 'object' &&
      'success' in response.data
    ) {
      return response.data as ApiResponse<T>;
    }

    // Create a consistent error response
    const errorMessage = this.getErrorMessage(error);

    return {
      success: false,
      error: errorMessage,
      message: errorMessage,
      details: response?.data ? [response.data] : undefined,
    };
  }

  // Extract meaningful error messages
  private getErrorMessage(error: AxiosError): string {
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const data = error.response.data as any;

      // Try to extract message from various response formats
      if (data?.message) return data.message;
      if (data?.error) return data.error;
      if (typeof data === 'string') return data;

      // Default status messages
      switch (status) {
        case 400:
          return 'Bad request. Please check your data.';
        case 401:
          return 'Authentication required. Please login again.';
        case 403:
          return "Access denied. You don't have permission.";
        case 404:
          return 'Resource not found.';
        case 422:
          return 'Validation failed. Please check your input.';
        case 429:
          return 'Too many requests. Please try again later.';
        case 500:
          return 'Server error. Please try again later.';
        default:
          return `Request failed with status ${status}`;
      }
    } else if (error.request) {
      // Network error
      return 'Network error. Please check your internet connection.';
    } else {
      // Other error
      return error.message || 'An unexpected error occurred.';
    }
  }  // Set auth token manually
  async setAuthToken(token: string): Promise<void> {
    try {
      // Use UnifiedUserService for auth token storage
      const UnifiedUserService = require('./UnifiedUserService').default;
      const userService = UnifiedUserService.getInstance();
      await userService.setAuthToken(token);
      console.log('🔑 Auth token set via UnifiedUserService');
    } catch (error) {
      console.error('❌ Error setting auth token:', error);
    }
  }

  // Clear auth token
  async clearAuthToken(): Promise<void> {
    try {
      // Use UnifiedUserService for auth token cleanup
      const UnifiedUserService = require('./UnifiedUserService').default;
      const userService = UnifiedUserService.getInstance();
      await userService.clearAuthToken();
      console.log('🔓 Auth token cleared via UnifiedUserService');
    } catch (error) {
      console.error('❌ Error clearing auth token:', error);
    }
  }

  // Update base URL if needed
  updateBaseURL(baseURL: string): void {
    this.config.baseURL = baseURL;
    this.axiosInstance.defaults.baseURL = baseURL;
    console.log(`🔄 Base URL updated to: ${baseURL}`);
  }

  // Enable/disable logging
  setLogging(enabled: boolean): void {
    this.config.enableLogging = enabled;
    console.log(`📝 API logging ${enabled ? 'enabled' : 'disabled'}`);
  }

  // Get current config
  getConfig(): ApiConfig {
    return {...this.config};
  }
}

export default ApiService;
