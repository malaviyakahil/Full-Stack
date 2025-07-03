import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

let fetchCurrentChannel = createAsyncThunk(
  "fetchCurrentChannel",
  async (id) => {
    let res = await axios.get(`http://localhost:8000/user/get-channel/${id}`, {
      withCredentials: true,
    });
    return res.data;
  },
);

let currentChannelSlice = createSlice({
  name: "currentChannel",
  initialState: {
    data: null,
    error: null,
    loading: false,
    prevId: "12345",
  },
  reducers: {
    changePrevId: (state, action) => {
      state.prevId = action.payload;
    },
    subscribeToggle: (state, action) => {
      let { id, status } = action.payload;
      if (status) {
        state.data.subscribersCount -= 1
        state.data.subStatus =false
        axios.post(`http://localhost:8000/user/unsubscribe-to/${id}`, [], {
          withCredentials: true,
        });
      } else {
        state.data.subscribersCount += 1
        state.data.subStatus =true
        axios.post(`http://localhost:8000/user/subscribe-to/${id}`, [], {
          withCredentials: true,
        });
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchCurrentChannel.pending, (state, action) => {
      state.loading = true;
    });
    builder.addCase(fetchCurrentChannel.fulfilled, (state, action) => {
      state.data = action.payload.data;
      state.loading = false;
    });
    builder.addCase(fetchCurrentChannel.rejected, (state, action) => {
      state.error = false;
    });
  },
});

let { changeCurrentChannel, changePrevId,subscribeToggle } = currentChannelSlice.actions;

export {
  currentChannelSlice,
  changeCurrentChannel,
  fetchCurrentChannel,
  changePrevId,
  subscribeToggle
};
