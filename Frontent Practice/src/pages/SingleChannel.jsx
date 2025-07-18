import React from "react";
import { useParams } from "react-router-dom";
import SingleChannelDetails from "../components/SingleChannelDetails";
import SingleChannelVideos from "../components/SingleChannelVideos";


const SingleChannel = () => {
  let { ownerId } = useParams();
  return (
    <div className="mx-auto flex flex-col items-center text-white max-w-6xl">
      <SingleChannelDetails ownerId={ownerId} />
      <SingleChannelVideos ownerId={ownerId} />
    </div>
  );
};

export default SingleChannel;



