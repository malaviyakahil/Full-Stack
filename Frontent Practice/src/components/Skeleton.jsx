import React from "react";

const Skeleton = () => {
  return (
    <div className="flex flex-wrap justify-center gap-6 p-4">
      {["", "", "", "", "", ""].map((e,i) => {
        return (
          <div key={i} className="flex flex-col w-full sm:w-[320px] md:w-[336px] lg:w-[360px] xl:w-[380px] animate-pulse">
            <div className="relative w-full aspect-video bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
            <div className="flex flex-row mt-3 gap-3">
              <div className="w-10 h-10 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
              <div className="flex flex-col flex-1 overflow-hidden">
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mt-2"></div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Skeleton;
