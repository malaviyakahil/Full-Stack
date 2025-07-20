import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getAllVideos } from "../apis/video.apis.js";

let fetchVideos = createAsyncThunk(
  "fetchVideos",
  async (_, { getState, rejectWithValue }) => {
    try {
      const { page, limit } = getState().videos;

      const res = await getAllVideos({ page, limit });
      const { videos, total, pages } = res.data;

      return { videos, total, pages, page, limit };
    } catch (error) {
      return rejectWithValue(error?.message);
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
    limit: 0,
    fetched: false,
  },
  reducers: {
    clearVideos: (state) => {
      state.data = [];
      state.page = 1;
      state.hasMore = true;
      state.loading = false;
      state.fetched = false;
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
        state.fetched = true;

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

let { clearVideos, incrementView, setVideoLimit } = videosSlice.actions;

export { videosSlice, fetchVideos, clearVideos, incrementView, setVideoLimit };
