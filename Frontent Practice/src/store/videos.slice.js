import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

let fetchVideos = createAsyncThunk("fetchVideos",async () => {
  let res = await axios.get("http://localhost:8000/video/get-all-videos", {
    withCredentials: true,
  });
  return res.data;
});

let videosSlice = createSlice({
  name: "videos",
  initialState: { data: null, loading: false, error: null },
  reducers:{
    clearVideos: (state, action) => {
      state.data = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchVideos.pending, (state, actions) => {
      state.loading = true;
    });
    builder.addCase(fetchVideos.fulfilled, (state, actions) => {
      state.data = actions.payload.data;
      state.loading = false;
    });
    builder.addCase(fetchVideos.rejected, (state, actions) => {
      state.loading = false;
      state.error = actions.payload.data;      
    });
  },
});

let {clearVideos}=videosSlice.actions

export { videosSlice, fetchVideos ,clearVideos};
