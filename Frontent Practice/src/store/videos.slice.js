import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

let fetchVideos = createAsyncThunk(
  "fetchVideos",
  async (_, { getState, rejectWithValue }) => {
    try {
      const { page ,limit} = getState().videos;

      const res = await axios.get(
        `http://localhost:8000/video/get-all-videos?page=${page}&limit=${limit}`,
        { withCredentials: true },
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

let videosSlice = createSlice({
  name: "videos",
  initialState: {
    data: [],
    page: 1,
    hasMore: true,
    loading: false,
    error: null,
    limit:6
  },
  reducers: {
    clearVideos: (state) => {
      state.data = [];
      state.page = 1;
      state.hasMore = true;
      state.loading = false;
      state.error = null;
    },
    incrementView: (state, action) => {
      state.data = state.data?.map((video) => {
        if (video._id == action.payload) {
          return { ...video, views: video.views + 1 };
        }
        return video;
      });
    },
    setVideoLimit: (state, action) => {
      state.limit = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVideos.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchVideos.fulfilled, (state, action) => {
        const { videos, page, pages, limit } = action.payload;

        state.data = [...state.data, ...videos];
        state.page += 1;
        state.loading = false;

        if (page >= pages || videos.length < limit) {
          state.hasMore = false;
        }
      })
      .addCase(fetchVideos.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

let { clearVideos, incrementView ,setVideoLimit} = videosSlice.actions;

export { videosSlice, fetchVideos, clearVideos, incrementView,setVideoLimit };
