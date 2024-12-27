import axios from "axios";

// Base URL for API requests
const BASE_URL = process.env.NEXT_PUBLIC_URL;

export const API = axios.create({
  baseURL: `${BASE_URL}/api`,
});

// Handle ApiError
export const handleApiError = async (error: unknown) => {
  try {
    const errorMessage =
      error instanceof Error ? error.message : String(error);

    return errorMessage;
  } catch {
    // Fallback in case of unexpected error structures
    return "An unexpected error occurred while processing the error.";
  }
};
