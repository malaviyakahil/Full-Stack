import React from "react";
import { useSelector } from "react-redux";

const MyProfile = () => {
  let currentUser = useSelector((store) => store.currentUser);
  return (
    <div className="flex justify-center items-center h-full overflow-y-auto">
      <div className="w-full max-w-md justify-center p-10">
        <div className="w-60 h-60 rounded-full overflow-hidden flex items-center justify-center mx-auto border-5 p-2 border-white">
         
        <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
        <img className="h-full w-full object-cover" alt="avatar" src={currentUser?.data?.avatar} />
        </div>
        </div>
        <p>Name </p>
        <h1 className=" text-[40px]">{currentUser.data?.name}</h1>
        <p>Full name </p>
        <h1 className="text-[40px]">{currentUser.data?.fullName}</h1>
        <p>Email </p>
        <h1 className="text-[40px]">{currentUser.data?.email}</h1>
      </div>
    </div>
  );
};

export default MyProfile;
