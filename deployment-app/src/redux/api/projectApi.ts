import { createAsyncThunk } from "@reduxjs/toolkit";
import { Project } from "@/types/schemas/Project";
import { API, handleApiError } from "./util";

export interface GetProjectsResponse {
  projects: Project[];
}

export interface DeleteProjectResponse {
  status: number;
  message: string;
}

export interface UpdateProjectPayload {
  projectId: string;
  deploymentId: string;
  newSubDomain: string;
}

export const getProjects = createAsyncThunk<
  GetProjectsResponse,
  string,
  { rejectValue: string }
>("project/getProjects", async (userId, { rejectWithValue }) => {
  try {
    const response = await API.get(`/project?userId=${userId}`);
    return { projects: response.data.project } as GetProjectsResponse;
  } catch (error) {
    const errorMessage = await handleApiError(error);
    return rejectWithValue(errorMessage);
  }
});

export const createProject = createAsyncThunk<
  Project,
  Project,
  { rejectValue: string }
>("project/createProject", async (project, { rejectWithValue }) => {
  try {
    const response = await API.post("/project", project);
    return response.data.project as Project;
  } catch (error) {
    const errorMessage = await handleApiError(error);
    return rejectWithValue(errorMessage);
  }
});

export const updateProject = createAsyncThunk<
  Project,
  UpdateProjectPayload,
  { rejectValue: string }
>("project/updateProject", async (payload, { rejectWithValue }) => {
  try {
    const response = await API.patch(
      `/project?projectId=${payload.projectId}&deploymentId=${payload.deploymentId}`,
      { newSubDomain: payload.newSubDomain }
    );
    return response.data.project as Project;
  } catch (error) {
    const errorMessage = await handleApiError(error);
    return rejectWithValue(errorMessage);
  }
});

export const deleteProject = createAsyncThunk<
  DeleteProjectResponse,
  string,
  { rejectValue: string }
>("project/deleteProject", async (projectId, { rejectWithValue }) => {
  try {
    const response = await API.delete(`/project?projectId=${projectId}`);
    return response.data as DeleteProjectResponse;
  } catch (error) {
    const errorMessage = await handleApiError(error);
    return rejectWithValue(errorMessage);
  }
});