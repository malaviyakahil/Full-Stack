import axiosInstance from "./axiosInstance";

const getChannel = async (ownerId) => {
  return axiosInstance.get(`/channel/get-channel/${ownerId}`);
};

const getChannelVideos = async ({ ownerId, page, limit, filter }) => {
  return await axiosInstance.get(`/channel/get-channel-videos/${ownerId}`, {
    params: { page, limit, filter },
  });
};

const subscribeTo = async (ownerId) => {
  return axiosInstance.post(`/channel/subscribe-to/${ownerId}`);
};

const unSubscribeTo = async (ownerId) => {
  return axiosInstance.post(`/channel/unsubscribe-to/${ownerId}`);
};

const getSubStatus = async (ownerId) => {
  return axiosInstance.post(`/channel/get-sub-status/${ownerId}`);
};

const getChannelDetails = async (ownerId) => {
  return axiosInstance.get(`/channel/get-channel-details/${ownerId}`);
};

export {
  getChannel,
  getChannelVideos,
  subscribeTo,
  unSubscribeTo,
  getSubStatus,
  getChannelDetails,
};
