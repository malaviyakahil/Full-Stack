import axiosInstance from "./axiosInstance";

const searchAll = async (query) => {
  return await axiosInstance.get("/search/search-all", {
    params: { query },
  });
};

const searchChannelAndVideo = async (name) => {
  return await axiosInstance.get(
    `/search/search-channel-and-video/${name}`,
    {},
  );
};

export { searchAll, searchChannelAndVideo };
