import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

let fetchcurrentUserVideos = createAsyncThunk(
  "fetchcurrentUserVideos",
  async (_, { getState, rejectWithValue }) => {
    try {
      const { page, limit } = getState().currentUserVideos;
      let res = await axios.get(
        `http://localhost:8000/user/get-current-user-videos?page=${page}&limit=${limit}`,
        {
          withCredentials: true,
        },
      );
      const { videos, total, pages } = res.data.data;
      return { videos, total, pages, page, limit };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch videos",
      );
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
    limit: 6,
    fetched :false
  },
  reducers: {
    clearCurrentUserVideos: (state, action) => {
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
    incrementView: (state, action) => {
      state.data = state.data?.map((video) => {
        if (video._id == action.payload) {
          return { ...video, views: video.views + 1 };
        }
        return video;
      });
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
  incrementView,
  setCurrentUserVideoLimit,
} = currentUserVideosSlice.actions;

export {
  currentUserVideosSlice,
  fetchcurrentUserVideos,
  clearCurrentUserVideos,
  deletOneVideo,
  setCurrentUserVideoLimit,
  incrementView,
};
