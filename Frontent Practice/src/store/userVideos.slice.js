import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getCurrentUserVideos } from "../apis/user.apis.js";

let fetchcurrentUserVideos = createAsyncThunk(
  "fetchcurrentUserVideos",
  async (_, { getState, rejectWithValue }) => {
    try {
      const { page, limit } = getState().currentUserVideos;
      let res = await getCurrentUserVideos({ page, limit });

      const { videos, total, pages } = res.data;
      return { videos, total, pages, page, limit };
    } catch (error) {
      return rejectWithValue(error?.message);
    }
  },
);

let currentUserVideosSlice = createSlice({
  name: "currentUserVideos",
  initialState: {
    data: [],
    page: 1,
    hasMore: true,
    loading: false,
    error: null,
    limit: 0,
    fetched: false,
  },
  reducers: {
    clearCurrentUserVideos: (state) => {
      state.data = [];
      state.page = 1;
      state.hasMore = true;
      state.loading = false;
      state.fetched = false;
      state.error = null;
    },
    deletOneVideo: (state, action) => {
      state.data = state.data?.filter((video) => video._id !== action.payload);
    },
    undoDeletOneVideo: (state, action) => {
      const { video, index } = action.payload;
      const alreadyExists = state.data.some((v) => v._id === video._id);

      if (!alreadyExists) {
        if (index >= 0 && index <= state.data.length) {
          state.data.splice(index, 0, video);
        } else {
          state.data.unshift(video); // fallback
        }
      }
    },
    updateCurrentUserVideo: (state, action) => {
      const updatedVideo = action.payload;

      state.data = state.data.map((video) =>
        video._id === updatedVideo._id ? updatedVideo : video,
      );
    },
    setCurrentUserVideoLimit: (state, action) => {
      state.limit = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchcurrentUserVideos.pending, (state, actions) => {
      state.loading = true;
    });
    builder.addCase(fetchcurrentUserVideos.fulfilled, (state, action) => {
      const { videos, page, pages, limit } = action.payload;
      state.data = [...state.data, ...videos];
      state.page += 1;
      state.loading = false;
      state.fetched = true;

      if (page >= pages || videos.length < limit) {
        state.hasMore = false;
      }
    });
    builder.addCase(fetchcurrentUserVideos.rejected, (state, action) => {
      state.error = action.payload.data;
    });
  },
});

let {
  clearCurrentUserVideos,
  deletOneVideo,
  setCurrentUserVideoLimit,
  undoDeletOneVideo,
  updateCurrentUserVideo,
} = currentUserVideosSlice.actions;

export {
  currentUserVideosSlice,
  fetchcurrentUserVideos,
  clearCurrentUserVideos,
  deletOneVideo,
  setCurrentUserVideoLimit,
  undoDeletOneVideo,
  updateCurrentUserVideo,
};
