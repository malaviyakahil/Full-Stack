// components/QualitySelector.jsx
import React, { useState, useRef, useEffect } from "react";

const QualitySelector = ({ selectedQuality, availableQualities = [], onChange }) => {
  const [open, setOpen] = useState(false);
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
        onClick={() => setOpen((prev) => !prev)}
        className="w-full bg-gray-700  text-xs md:text-md px-2 py-1 md:px-4 md:py-2 rounded-md text-left"
      >
        {selectedQuality}
      </button>
      {open && (
        <ul className="absolute z-10 bottom-[0%] w-1/2 md:w-full py-0.5 right-[101%] overflow-hidden bg-gray-800  rounded-md">
          {availableQualities.map((quality, idx) => (
            <li
              key={idx}
              onClick={() => {
                onChange(quality);
                setOpen(false);
              }}
              className={`px-3 py-0.5 md:py-2 md:px-5 text-xs md:text-md cursor-pointer hover:bg-gray-600  ${
                quality === selectedQuality ? "bg-gray-700" : ""
              }`}
            >
              {quality}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default QualitySelector;
