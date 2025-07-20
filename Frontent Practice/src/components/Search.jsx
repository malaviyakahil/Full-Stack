import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { searchAll } from "../apis/search.apis";

const Search = () => {
  let [text, setText] = useState("");
  let [data, setData] = useState([]);
  let input = useRef();

  useEffect(() => {
    let timer = setTimeout(() => {
      (async () => {
        let res = await searchAll(encodeURIComponent(text));
        setData(res?.data);
      })();
    }, 500);
    return () => {
      clearInterval(timer);
    };
  }, [text]);

  return (
    <div className="w-full order-4 xs:order-0">
      <div className="h-[100%] md:w-[350px] w-full relative">
        <label
          style={{ outlineColor: "transparent" }}
          className="input rounded-md w-full"
        >
          <svg
            className="h-[1em] opacity-50"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
          >
            <g
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeWidth="2.5"
              fill="none"
              stroke="currentColor"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.3-4.3"></path>
            </g>
          </svg>
          <input
            type="search"
            ref={input}
            onChange={(e) => {
              setText(e.target.value);
            }}
            className="grow xs:w-full"
            placeholder="Search"
          />
        </label>
      </div>
      {data.length > 0 && (
        <div className="absolute z-50 top-[100%] mt-4 left-[50%] translate-x-[-50%] w-full bg-[linear-gradient(to_right,_#374151_0%,_#374151_2%,_#6B7280_2%,_#6B7280_98%,_#374151_98%,_#374151_100%)] rounded-md overflow-hidden">
          <ul className="w-full flex flex-col gap-[1px]">
            {data.map((e) => {
              return (
                <Link
                  to={`/app/dashboard/search-channel-and-video/${e?.value}`}
                  onClick={() => {
                    input.current.value = "";
                    setData([]);
                  }}
                  key={e?._id}
                >
                  <li className="w-full bg-gray-700 py-2 rounded-md  px-4 hover:bg-gray-600">
                    {e?.value}
                  </li>
                </Link>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Search;
