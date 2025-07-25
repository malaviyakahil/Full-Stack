import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getLikedVideos } from "../apis/user.apis";

let fetchLikedVideos = createAsyncThunk(
  "fetchLikedVideos",
  async (_, { getState, rejectWithValue }) => {
    try {
      let { page, limit } = getState().likedVideos;
      let res = await getLikedVideos({page,limit})
      let { videos, total, pages } = res.data;
      
      return { videos, total, pages, limit, page };
    } catch (error) {
      return rejectWithValue(
        error?.message
      );
    }
  },
);

let likedVideosSlice = createSlice({
  name: "likedVideos",
  initialState: {
    data: [],
    error: null,
    loading: false,
    hasMore: true,
    page: 1,
    limit: 3,
    fetched : false
  },
  reducers: {
    clearLikedVideos: (state, action) => {
      state.data = [];
      state.loading = false;
      state.fetched = false;
      state.error = null;
      state.hasMore = true;
      state.page = 1;
    },
    deleteFromLikedVideos: (state, action) => {
      state.data = state.data?.filter((item) => item.video._id != action.payload);
    },
    addToLikedVideos: (state, action) => {
      state.data?.unshift(action.payload);
    },
      setLikedVideoLimit: (state, action) => {
      state.limit = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchLikedVideos.pending, (state, action) => {
      state.loading = true;
    });
    builder.addCase(fetchLikedVideos.fulfilled, (state, action) => {
      let { videos, limit, page, pages } = action.payload;
      state.data = [...state.data, ...videos];
      state.loading = false;
      state.fetched = true;
       state.page += 1;
      if (page >= pages && videos.length < limit) {
        state.hasMore = false;
      }
    });
    builder.addCase(fetchLikedVideos.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
  },
});

let { clearLikedVideos, deleteFromLikedVideos,setLikedVideoLimit, addToLikedVideos } =
  likedVideosSlice.actions;

export {
  clearLikedVideos,
  likedVideosSlice,
  fetchLikedVideos,
  addToLikedVideos,
  deleteFromLikedVideos,
  setLikedVideoLimit
  
};
