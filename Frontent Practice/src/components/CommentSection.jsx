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
import { formatDistanceToNow, formatDistanceToNowStrict } from "date-fns";
import { BsPinAngle } from "react-icons/bs";
import InfiniteScroll from "react-infinite-scroll-component";

const CommentSection = ({ videoId, channelDetails, ownerId }) => {
  const currentUser = useSelector((store) => store.currentUser);
  const [comments, setComments] = useState([]);
  const [loader, setLoader] = useState(false);
  const [loading, setLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [edit, setEdit] = useState("");
  const commentRefs = useRef({});
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [limit, setLimit] = useState(7);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const updateLimit = () => {
      const width = window.innerWidth;
      const newLimit = width >= 1200 ? 7 : 4;
      setLimit(newLimit);
    };
    updateLimit();
    window.addEventListener("resize", updateLimit);
    return () => window.removeEventListener("resize", updateLimit);
  }, []);

  const fetchComments = async () => {
    if (!hasMore || loading) return;
    if (page == 1) {
      setLoading(true);
    }

    const res = await axios.get(
      `http://localhost:8000/user/get-comments/${videoId}?page=${page}&limit=${limit}`,
      { withCredentials: true },
    );

    const newComments = res.data.data.comments;
    const total = res.data.data.total;

    setTotalCount(total); // <-- Add this line

    setComments((prev) => [
      ...prev,
      ...newComments.map((c) => ({
        ...c,
        showDropdown: false,
        readMore: false,
        hasOverflow: false,
      })),
    ]);

    setPage((prev) => prev + 1);
    setHasMore(comments.length + newComments.length < total);
    setLoading(false);
  };

  useEffect(() => {
    fetchComments();
  }, [limit]); 

  useEffect(() => {
    comments.forEach((comment) => {
      const el = commentRefs.current[comment._id];
      if (el) {
        const textBlock = el.querySelector(".comment-text");
        if (textBlock) {
          const hasOverflow = textBlock.scrollHeight > textBlock.clientHeight;
          if (comment.hasOverflow !== hasOverflow) {
            setComments((prev) =>
              prev.map((c) =>
                c._id === comment._id ? { ...c, hasOverflow } : c,
              ),
            );
          }
        }
      }
    });
  }, [comments]);

  const handlePostComment = async () => {
    if (!commentText.trim()) return;

    let formData = new FormData();
    formData.append("comment", commentText);

    if (edit) {
      let prevComments = [...comments];
      let prevEdit = edit;
      setComments(
        comments.map((item) => {
          if (item._id == edit) {
            return {
              ...item,
              comment: commentText,
              showDropdown: false,
              edited: true,
            };
          }
          return item;
        }),
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
      let prevComments = [...comments];
      let prevTotal = totalCount;

      try {
        setLoader(true);
        let res = await axios.post(
          `http://localhost:8000/video/add-comment/${videoId}`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
            withCredentials: true,
          },
        );
        setLoader(false);
        setComments([
          {
            ...res.data?.data,
            user: { ...currentUser.data },
            like: { count: 0, status: false },
            dislike: { count: 0, status: false },
            showDropdown: false,
            readMore: false,
            hasOverflow: false,
          },
          ...comments,
        ]);
        setTotalCount((prev) => prev + 1);
      } catch (error) {
        setComments(prevComments);
        setTotalCount(prevTotal);
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
      {loading ? (
        <div className="mb-4 animate-pulse">
          <div className="h-6 w-32 bg-gray-700 rounded-2xl mb-4" />
          <div className="flex gap-2">
            <div className="w-full border-gray-300">
              <div className="h-10 bg-gray-700 rounded-2xl w-full" />
            </div>
            <div className="w-28 h-10 bg-gray-700 rounded-2xl" />
          </div>
        </div>
      ) : (
        <div className="mx-auto">
          <h2 className="text-xl font-semibold mb-4 text-white">
            {totalCount} Comments
          </h2>

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
            dataLength={comments.length}
            next={fetchComments}
            hasMore={hasMore}
            loader={
              <div className="h-[100px] w-full justify-center flex items-center">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            }
            endMessage={
              totalCount != 0 && (
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
                        })} {" "}
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
                                  togglePin(
                                    comment?.pinByChannel,
                                    comment?._id,
                                  );
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
                                    togglePin(
                                      comment?.pinByChannel,
                                      comment?._id,
                                    );
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
        </div>
      )}
    </>
  );
};

export default CommentSection;
