import React from "react";
import { useSelector } from "react-redux";

const MyProfile = () => {

  let {data} = useSelector((store) => store.currentUser);
  
  return (
    <div className="flex justify-center items-center h-full">
      <div className="w-full max-w-md justify-center p-10">
        <div className="w-60 h-60 md:w-48 md:h-48 sm:w-36 sm:h-36 rounded-full overflow-hidden flex items-center justify-center mx-auto border-5 p-2 border-white">
          <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
            <img
              className="h-full w-full object-cover"
              alt="avatar"
              src={data?.avatar}
            />
          </div>
        </div>
        <p className="text-center mt-6">Name</p>
        <h1 className="text-[40px] text-center break-words">
          {data?.name}
        </h1>
        <p className="text-center mt-6">Full Name</p>
        <h1 className="text-[40px] text-center break-words">
          {data?.fullName}
        </h1>
        <p className="text-center mt-6">Email</p>
        <h1 className="text-[40px] text-center break-words">
          {data?.email}
        </h1>
      </div>
    </div>
  );
};

export default MyProfile;
