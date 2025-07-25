import React from "react";
import { useSelector } from "react-redux";
import formatNumber from "../utils/formatNumber";

const MyProfile = () => {

  let {data} = useSelector((store) => store.currentUser);
  
  return (
    <div className="flex justify-center py-5 h-full">
      <div className=" w-full">
        <div className="w-60 h-60 md:w-48 md:h-48 sm:w-36 sm:h-36 rounded-full overflow-hidden flex items-center justify-center mx-auto border-5 p-2 border-gray-600">
          <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
            <img
              className="h-full w-full object-cover"
              alt="avatar"
              src={data?.avatar}
            />
          </div>
        </div>
        <p className="text-center mt-3 text-lg md:text-lg">Name</p>
        <h1 className="text-[30px] text-gray-400 md:text-[40px] text-center break-words">
          {data?.name}
        </h1>
        <p className="text-center mt-3 text-lg md:text-lg">Full Name</p>
        <h1 className="text-[30px] text-gray-400 md:text-[40px] text-center break-words">
          {data?.fullName}
        </h1>
        <p className="text-center mt-3 text-lg md:text-lg">Email</p>
        <h1 className="text-[30px] text-gray-400 md:text-[40px] text-center break-words">
          {data?.email}
        </h1>
        <p className="text-center mt-3 text-lg md:text-lg">Subscribers</p>
        <h1 className="text-[30px] text-gray-400 md:text-[40px] text-center break-words">
          {formatNumber(data?.subs)}
        </h1>
        <p className="text-center mt-3 text-lg md:text-lg">Total views</p>
        <h1 className="text-[30px] text-gray-400 md:text-[40px] text-center break-words">
          {formatNumber(data?.totalViews)}
        </h1>
      </div>
    </div>
  );
};

export default MyProfile;
