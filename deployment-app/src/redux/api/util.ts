import axios from "axios";

// Base URL for API requests
const BASE_URL = process.env.NEXT_PUBLIC_URL;

export const API = axios.create({
  baseURL: `${BASE_URL}/api`,
});

// // Interceptor to add authentication token
// const authInterceptor = async (config: InternalAxiosRequestConfig) => {
//   if (process.browser) {
//     // Ensure it's running in the client-side environment
//     const session = await auth();
//     if (session) {
//       config.headers.Authorization = `Bearer ${session.accessToken}`;
//     }
//   }
//   return config;
// };

// // Add the interceptor to the API instance
// API.interceptors.request.use(authInterceptor, (error) => Promise.reject(error));

// Handle ApiError
export const handleApiError = async (error: unknown) => {
  try {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    // Ensure that the return type matches the expected structure for rejectWithValue
    return errorMessage;
  } catch {
    // Fallback in case of unexpected error structures
    return "An unexpected error occurred while processing the error.";
  }
};
