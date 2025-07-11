import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import {
  BiLike,
  BiSolidLike,
  BiDotsVertical,
  BiSolidDislike,
  BiDislike,
} from "react-icons/bi";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { useSelector } from "react-redux";
import { formatDistanceToNowStrict } from "date-fns";
import { BsPinAngle } from "react-icons/bs";
import InfiniteScroll from "react-infinite-scroll-component";
import { MdOutlineSort } from "react-icons/md";

const CommentSection = ({ videoId, channelDetails, ownerId }) => {
  const currentUser = useSelector((store) => store.currentUser);
  const [comments, setComments] = useState([]);
  const [loader, setLoader] = useState(false);
  const [loading, setLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [edit, setEdit] = useState("");
  const [hasMore, setHasMore] = useState(true);
  const [limit, setLimit] = useState(3);
  const [totalCount, setTotalCount] = useState(0);
  const [lastCursor, setLastCursor] = useState(null);
  const [sortBy, setSortBy] = useState("newest"); // <-- Add this
  const commentRefs = useRef({});

  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortRef = useRef(null);

  // Optional: close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) {
        setShowSortMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const updateLimit = () => {
      const width = window.innerWidth;
      const newLimit = width >= 1200 ? 3 : width >= 768 ? 7 : 5;
      setLimit(newLimit);
    };
    updateLimit();
    window.addEventListener("resize", updateLimit);
    return () => window.removeEventListener("resize", updateLimit);
  }, []);

  useEffect(() => {
    resetAndFetch();
  }, [limit, videoId, sortBy]);

const resetAndFetch = async () => {
  setComments([]);
  setLastCursor(null);
  setHasMore(true);
  await fetchComments(true); // force isFirstPage
};

const fetchComments = async (isFirstPage = false) => {
  if (!hasMore && !isFirstPage) return;
  if (loading) return;

  setLoading(true);

  const params = { limit, sortBy };

  if (!isFirstPage && lastCursor) {
    if (sortBy === "top") {
      params.likeCount = lastCursor.likeCount;
      params.id = lastCursor.id;
    } else {
      params.cursor = lastCursor.createdAt;
      params.id = lastCursor.id;
    }
  }

  try {
    const res = await axios.get(
      `http://localhost:8000/user/get-comments/${videoId}`,
      { params, withCredentials: true }
    );

    const newComments = res.data.data.comments;
    const nextCursor = res.data.data.nextCursor;
    const hasMoreRes = res.data.data.hasMore;
    const total = res.data.data.total || 0;

    setTotalCount(total);
    setComments((prev) => [
      ...prev,
      ...newComments.map((c) => ({
        ...c,
        showDropdown: false,
        readMore: false,
        hasOverflow: false,
      })),
    ]);
    setLastCursor(nextCursor);
    setHasMore(hasMoreRes);
  } catch (err) {
    console.error("Failed to fetch comments", err);
  } finally {
    setLoading(false);
  }
};


  const handlePostComment = async () => {
    if (!commentText.trim()) return;
    const formData = new FormData();
    formData.append("comment", commentText);

    if (edit) {
      const prevComments = [...comments];
      const prevEdit = edit;
      setComments((prev) =>
        prev.map((item) =>
          item._id === edit
            ? {
                ...item,
                comment: commentText,
                showDropdown: false,
                edited: true,
              }
            : item,
        ),
      );
      setEdit("");
      try {
        await axios.post(
          `http://localhost:8000/video/edit-comment/${edit}`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
            withCredentials: true,
          },
        );
      } catch (error) {
        setComments(prevComments);
        setEdit(prevEdit);
      }
    } else {
      try {
        setLoader(true);
        const res = await axios.post(
          `http://localhost:8000/video/add-comment/${videoId}`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
            withCredentials: true,
          },
        );
        const newComment = {
          ...res.data.data,
          showDropdown: false,
          readMore: false,
          hasOverflow: false,
        };
        setComments((prev) => [newComment, ...prev]);
        setTotalCount((prev) => prev + 1);
      } catch (error) {
        console.error("Failed to post comment:", error);
      } finally {
        setLoader(false);
      }
    }
    setCommentText("");
  };

  const toggleLike = (id) => {
    if (comments.find((item) => item._id === id).like.status === true) {
      setComments((prevData) =>
        prevData.map((item) =>
          item._id === id
            ? {
                ...item,
                like: {
                  ...item.like,
                  status: false,
                  count: item.like.count - 1,
                },
              }
            : item,
        ),
      );
      axios.post(
        `http://localhost:8000/video/delete-comment-review/${id}`,
        [],
        { withCredentials: true },
      );
    } else {
      if (comments.find((item) => item._id === id).dislike.status === true) {
        setComments((prevData) =>
          prevData.map((item) =>
            item._id === id
              ? {
                  ...item,
                  like: {
                    ...item.like,
                    status: true,
                    count: item.like.count + 1,
                  },
                  dislike: {
                    ...item.dislike,
                    status: false,
                    count: item.dislike.count - 1,
                  },
                }
              : item,
          ),
        );
      } else {
        setComments((prevData) =>
          prevData.map((item) =>
            item._id === id
              ? {
                  ...item,
                  like: {
                    ...item.like,
                    status: true,
                    count: item.like.count + 1,
                  },
                }
              : item,
          ),
        );
      }
      axios.post(`http://localhost:8000/video/like-comment/${id}`, [], {
        withCredentials: true,
      });
    }
  };

  const toggleDislike = (id) => {
    if (comments.find((item) => item._id === id).dislike.status === true) {
      setComments((prevData) =>
        prevData.map((item) =>
          item._id === id
            ? {
                ...item,
                dislike: {
                  ...item.dislike,
                  status: false,
                  count: item.dislike.count - 1,
                },
              }
            : item,
        ),
      );
      axios.post(
        `http://localhost:8000/video/delete-comment-review/${id}`,
        [],
        { withCredentials: true },
      );
    } else {
      if (comments.find((item) => item._id === id).like.status === true) {
        setComments((prevData) =>
          prevData.map((item) =>
            item._id === id
              ? {
                  ...item,
                  dislike: {
                    ...item.dislike,
                    status: true,
                    count: item.dislike.count + 1,
                  },
                  like: {
                    ...item.like,
                    status: false,
                    count: item.like.count - 1,
                  },
                }
              : item,
          ),
        );
      } else {
        setComments((prevData) =>
          prevData.map((item) =>
            item._id === id
              ? {
                  ...item,
                  dislike: {
                    ...item.dislike,
                    status: true,
                    count: item.dislike.count + 1,
                  },
                }
              : item,
          ),
        );
      }
      axios.post(`http://localhost:8000/video/dislike-comment/${id}`, [], {
        withCredentials: true,
      });
    }
  };

  const toggleDropdown = (id) => {
    setComments((prevData) =>
      prevData.map((item) =>
        item._id === id
          ? { ...item, showDropdown: !item.showDropdown }
          : { ...item, showDropdown: false },
      ),
    );
    setEdit(false);
    setCommentText("");
  };

  const toggleReadMore = (id) => {
    setComments((prevData) =>
      prevData.map((item) =>
        item._id === id ? { ...item, readMore: !item.readMore } : item,
      ),
    );
  };

  const toggleHeart = (heart, id) => {
    if (heart) {
      setComments((prevData) =>
        prevData.map((item) =>
          item._id === id ? { ...item, heartByChannel: false } : item,
        ),
      );
      axios.post(`http://localhost:8000/video/take-heart/${id}`, [], {
        withCredentials: true,
      });
    } else {
      setComments((prevData) =>
        prevData.map((item) =>
          item._id === id ? { ...item, heartByChannel: true } : item,
        ),
      );
      axios.post(`http://localhost:8000/video/give-heart/${id}`, [], {
        withCredentials: true,
      });
    }
  };

  const countPinnedComments = () => {
    return comments.filter((comment) => comment.pinByChannel === true).length;
  };

  const togglePin = (pin, id) => {
    setComments((prevData) =>
      prevData.map((item) => {
        return { ...item, showDropdown: false };
      }),
    );
    if (pin) {
      setComments((prevData) =>
        prevData.map((item) =>
          item._id === id ? { ...item, pinByChannel: false } : item,
        ),
      );
      axios.post(`http://localhost:8000/video/un-pin/${id}`, [], {
        withCredentials: true,
      });
    } else {
      if (countPinnedComments() < 1) {
        setComments((prevData) =>
          prevData.map((item) =>
            item._id === id ? { ...item, pinByChannel: true } : item,
          ),
        );
        axios.post(`http://localhost:8000/video/pin/${id}`, [], {
          withCredentials: true,
        });
      }
    }
  };

  const deleteComment = async (id) => {
    let prevData = [...comments];
    let prevTotalCount = totalCount;
    setCommentText("");
    setEdit(false);
    setComments(comments.filter((item) => item._id != id));
    setTotalCount((prev) => prev - 1);
    try {
      await axios.post(`http://localhost:8000/video/delete-comment/${id}`, [], {
        withCredentials: true,
      });
    } catch (error) {
      setComments(prevData);
      setTotalCount(prevTotalCount);
    }
  };

  const editComment = (id, text) => {
    setCommentText(text);
    setEdit(id);
  };

  return (
    <>
      <div className="flex  gap-5 items-center mb-2 relative" ref={sortRef}>
        <h2 className="text-xl font-semibold text-white">
          {totalCount} Comments
        </h2>
        <div className="relative">
          <button
            onClick={() => setShowSortMenu(!showSortMenu)}
            className="text-sm  hover:text-white transition flex gap-1.5"
          >
            <MdOutlineSort className="text-xl" /> Sort by
          </button>
          {showSortMenu && (
            <ul className="absolute right-0 z-50 mt-1 w-40 bg-gray-800 border border-gray-600 rounded shadow-lg">
              <li
                onClick={() => {
                  setSortBy("newest");
                  setShowSortMenu(false);
                }}
                className="px-4 py-2 text-sm text-white hover:bg-gray-700 cursor-pointer"
              >
                Newest
              </li>
              <li
                onClick={() => {
                  setSortBy("top");
                  setShowSortMenu(false);
                }}
                className="px-4 py-2 text-sm text-white hover:bg-gray-700 cursor-pointer"
              >
                Top Comments
              </li>
            </ul>
          )}
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <div className="w-full border-b border-gray-700">
          <input
            type="text"
            className="rounded px-3 py-2 w-full outline-none"
            placeholder="Add a public comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
          />
        </div>
        <button
          className="bg-gray-700 hover:bg-gray-600 text-white min-w-[7rem] px-6 py-2 rounded-lg text-center"
          onClick={handlePostComment}
        >
          {edit ? "Save" : "Comment"}
        </button>
      </div>
      {loader && (
        <div className="h-[100px] w-full justify-center flex items-center">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      )}
      <InfiniteScroll
        scrollableTarget="scrollableDiv"
        scrollThreshold={0.9}
        dataLength={comments.length}
        next={fetchComments}
        hasMore={hasMore}
        loader={
          <div className="h-[100px] w-full justify-center flex items-center">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        }
        endMessage={
          totalCount > 0 && (
            <p className="text-center text-sm py-1 text-gray-400">
              No more comments to load.
            </p>
          )
        }
      >
        {comments.map((comment) => (
          <div
            key={comment._id}
            className="mb-4 border-b pb-4 border-gray-700 flex gap-3"
            ref={(el) => (commentRefs.current[comment._id] = el)}
          >
            <img
              src={comment?.user?.avatar}
              alt={`${comment?.user?.name}'s avatar`}
              className={`w-8 h-8 rounded-full object-cover ${comment.pinByChannel ? "mt-5" : ""}`}
            />

            <div className="flex-1">
              {comment.pinByChannel && (
                <div className="flex items-center gap-1">
                  <BsPinAngle className="text-[13px]" />
                  <span className="text-gray-300 text-[13px]">
                    Pinned by @{channelDetails?.name}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-200">
                  @{comment?.user?.name}{" "}
                  <span className="text-gray-400 font-normal text-[13px]">
                    {formatDistanceToNowStrict(new Date(comment?.createdAt), {
                      addSuffix: true,
                    })}{" "}
                    {comment?.edited && "(edited)"}
                  </span>
                </span>
              </div>
              <div
                className={`comment-text text-sm text-gray-100 whitespace-pre-line transition-all duration-300 break-all ${
                  comment.readMore ? "" : "line-clamp-3"
                }`}
              >
                {comment?.comment}
              </div>
              {comment?.hasOverflow && (
                <button
                  onClick={() => toggleReadMore(comment?._id)}
                  className="mt-2 text-white text-sm font-medium"
                >
                  {comment.readMore ? "Show less" : "Show more"}
                </button>
              )}
              <div className="flex gap-4 mt-2 text-sm text-gray-300 items-center">
                <button
                  className="flex items-center gap-1"
                  onClick={() => toggleLike(comment?._id)}
                >
                  {comment?.like?.status ? <BiSolidLike /> : <BiLike />}{" "}
                  {comment?.like?.count}
                </button>
                <button
                  className="flex items-center gap-1"
                  onClick={() => toggleDislike(comment?._id)}
                >
                  {comment?.dislike?.status ? (
                    <BiSolidDislike />
                  ) : (
                    <BiDislike />
                  )}{" "}
                  {comment?.dislike?.count}
                </button>

                {ownerId == currentUser.data._id ? (
                  <button
                    onClick={() => {
                      toggleHeart(comment?.heartByChannel, comment?._id);
                    }}
                  >
                    {comment?.heartByChannel ? (
                      <div className="w-4 h-4 rounded-full relative">
                        <img
                          src={channelDetails?.avatar}
                          alt="Avatar"
                          className="object-cover h-full w-full rounded-full"
                        />
                        <FaHeart className="absolute top-[60%] left-[60%] text-red-700 text-[10px]" />
                      </div>
                    ) : (
                      <FaRegHeart className="text-[15px]" />
                    )}
                  </button>
                ) : (
                  comment?.heartByChannel && (
                    <div className="w-4 h-4 rounded-full  relative">
                      <img
                        src={channelDetails?.avatar}
                        alt="Avatar"
                        className="object-cover h-full w-full rounded-full"
                      />
                      <FaHeart className="absolute top-[60%] left-[60%] text-red-700 text-[10px]" />
                    </div>
                  )
                )}
              </div>
            </div>

            {ownerId == currentUser?.data?._id ? (
              <div className="relative ml-3">
                <button
                  className="text-gray-200"
                  onClick={() => toggleDropdown(comment?._id)}
                >
                  <BiDotsVertical size={20} />
                </button>
                {comment?.showDropdown && (
                  <div className="absolute right-0 w-32 mt-2 bg-gray-700 rounded-md shadow-lg overflow-hidden z-50">
                    <ul className="text-sm text-gray-100">
                      {currentUser?.data?._id == comment.user._id && (
                        <li>
                          <button
                            className="block w-full px-4 py-2 text-left hover:bg-gray-600"
                            onClick={() => {
                              editComment(comment?._id, comment?.comment);
                            }}
                          >
                            Edit
                          </button>
                        </li>
                      )}
                      <li>
                        <button
                          className="block w-full px-4 py-2 text-left hover:bg-gray-600"
                          onClick={() => {
                            deleteComment(comment?._id);
                          }}
                        >
                          Delete
                        </button>
                      </li>
                      {countPinnedComments() < 1 ? (
                        <li>
                          <button
                            className="block w-full px-4 py-2 text-left hover:bg-gray-600"
                            onClick={() => {
                              togglePin(comment?.pinByChannel, comment?._id);
                            }}
                          >
                            Pin
                          </button>
                        </li>
                      ) : (
                        comment?.pinByChannel && (
                          <li>
                            <button
                              className="block w-full px-4 py-2 text-left hover:bg-gray-600"
                              onClick={() => {
                                togglePin(comment?.pinByChannel, comment?._id);
                              }}
                            >
                              Unpin
                            </button>
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}
              </div>
            ) : comment.user._id == currentUser.data._id ? (
              <div className="relative ml-3">
                <button
                  className="text-gray-200"
                  onClick={() => toggleDropdown(comment?._id)}
                >
                  <BiDotsVertical size={20} />
                </button>
                {comment?.showDropdown && (
                  <div className="absolute right-0 w-32 mt-2 bg-gray-700 rounded-md shadow-lg overflow-hidden">
                    <ul className="text-sm text-gray-100">
                      <li>
                        <button
                          className="block w-full px-4 py-2 text-left hover:bg-gray-600"
                          onClick={() => {
                            editComment(comment?._id, comment?.comment);
                          }}
                        >
                          Edit
                        </button>
                      </li>
                      <li>
                        <button
                          className="block w-full px-4 py-2 text-left hover:bg-gray-600"
                          onClick={() => {
                            deleteComment(comment?._id);
                          }}
                        >
                          Delete
                        </button>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              ""
            )}
          </div>
        ))}
      </InfiniteScroll>
    </>
  );
};

export default CommentSection;
