import React from 'react'
import Refresh from './Refresh'
import Search from './Search'
import { BiLike } from 'react-icons/bi'
import { RiHistoryLine } from 'react-icons/ri'

const Panel = () => {
  return (
    <div className="flex items-center w-fit relative gap-2  sm:gap-5 justify-center flex-wrap xs:flex-nowrap mx-auto">
    <Refresh />
    <Search />
    <button className="flex gap-2 justify-center items-center bg-gray-700 hover:bg-gray-600 p-2 px-4 rounded-lg">
      <BiLike className="text-[18px]" />
    </button>
    <button className="flex gap-2 justify-center items-center bg-gray-700 hover:bg-gray-600 p-2 px-4 rounded-lg">
      <RiHistoryLine className="text-[18px]" />
    </button>
  </div>
  )
}

export default Panel