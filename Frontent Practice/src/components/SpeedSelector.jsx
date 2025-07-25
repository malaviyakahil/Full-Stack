// components/SpeedSelector.jsx
import React, { useState, useRef, useEffect } from "react";

const SpeedSelector = ({ currentSpeed, onChange }) => {
  const [open, setOpen] = useState(false);
  const options = [0.25, 0.5, 1, 1.25, 1.5, 2];
  const dropdownRef = useRef();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="w-full">
      <button
        onClick={() => setOpen(!open)}
        className="w-full bg-gray-700 text-xs md:text-md px-2 py-1 md:px-4 md:py-2  rounded-md text-left"
      >
        {currentSpeed}x
      </button>
      {open && (
        <ul className="absolute z-10 bottom-0 w-1/2 md:w-full py-0.5 right-[101%] overflow-hidden bg-gray-800  rounded-md">
          {options.map((option) => (
            <li
              key={option}
              onClick={() => {
                onChange(option);
                setOpen(false);
              }}
              className={`px-3 py-0.5 md:py-2 md:px-5 text-xs md:text-md cursor-pointer hover:bg-gray-600  ${
                option === currentSpeed ? "bg-gray-700" : ""
              }`}
            >
              {option}x
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SpeedSelector;
