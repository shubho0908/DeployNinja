import { createAsyncThunk } from "@reduxjs/toolkit";
import { API, handleApiError } from "./util";
import { User } from "@/types/schemas/User";

export interface GetUserResponse {
  user: User;
}

export const getUser = createAsyncThunk<GetUserResponse, void, { rejectValue: string }>(
  "user/getUser",
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get("/login");
      return { user: response.data.user } as GetUserResponse;
    } catch (error) {
      const errorMessage = await handleApiError(error);
      return rejectWithValue(errorMessage);
    }
  }
);
