import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

let fetchcurrentUserVideos = createAsyncThunk(
  "fetchcurrentUserVideos",
  async () => {
    let res = await axios.get(
      "http://localhost:8000/user/get-current-user-videos",
      {
        withCredentials: true,
      },
    );
    return res.data;
  },
);

let currentUserVideosSlice = createSlice({
  name: "currentUserVideos",
  initialState: { data: null, loading: false, error: null },
  reducers: {
    clearCurrentUserVideos: (state, action) => {
      state.data = null;
      state.loading = false;
      state.error = null;
    },
    deletOneVideo: (state, action) => {
      const id = action.payload;
      state.data = state.data?.filter((video) => video._id !== id);
    },
    incrementView: (state, action) => {
      state.data = state.data?.map((video) => {
        if(video._id == action.payload){
            return {...video,views:video.views+1}
        };
        return video
      });
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchcurrentUserVideos.pending, (state, actions) => {
      state.loading = true;
    });
    builder.addCase(fetchcurrentUserVideos.fulfilled, (state, actions) => {
      state.data = actions.payload.data;
      state.loading = false;
    });
    builder.addCase(fetchcurrentUserVideos.rejected, (state, actions) => {
      state.loading = false;
      state.error = actions.payload.data;
    });
  },
});

let {clearCurrentUserVideos,deletOneVideo,incrementView} = currentUserVideosSlice.actions

export { currentUserVideosSlice, fetchcurrentUserVideos,clearCurrentUserVideos,deletOneVideo,incrementView };
