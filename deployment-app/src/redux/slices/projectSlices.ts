import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Project } from "@/types/models/Project.model";
import {
  getProjects,
  createProject,
  deleteProject,
  GetProjectsResponse,
} from "@/redux/api/projectApi";

interface ProjectState {
  projects: Project[] | null;
}

const initialState: ProjectState = {
  projects: null,
};

const projectSlice = createSlice({
  name: "projects",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(
      getProjects.fulfilled,
      (state, action: PayloadAction<GetProjectsResponse>) => {
        state.projects = action.payload.projects;
      }
    );
    builder.addCase(
      createProject.fulfilled,
      (state, action: PayloadAction<Project>) => {
        if (state.projects) {
          state.projects.push(action.payload);
        } else {
          state.projects = [action.payload];
        }
      }
    );
    builder.addCase(
      deleteProject.fulfilled,
      (
        state,
        action: PayloadAction<{ success: boolean }, string, { arg: string }>
      ) => {
        if (action.payload.success && state.projects) {
          const projectId = action.meta.arg;
          state.projects = state.projects.filter(
            (project) => project.id !== projectId
          );
        }
      }
    );
  },
});

export default projectSlice.reducer;
