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
import TextareaAutosize from "react-textarea-autosize";
import {
  addComment,
  deleteCommentReview,
  disLikeComment,
  getComments,
  giveHeart,
  likeComment,
  takeHeart,
  unPin,
  pin,
  editComment,
  deleteComment
} from "../apis/comment.apis";

const CommentSection = ({ videoId, channelDetails, ownerId }) => {
  const currentUser = useSelector((store) => store.currentUser);
  const [comments, setComments] = useState([]);
  const [loader, setLoader] = useState(false);
  const [loading, setLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [editCommentText, setEditCommentText] = useState("");
  const [hasMore, setHasMore] = useState(true);
  const limit = 5;
  const [totalCount, setTotalCount] = useState(0);
  const [lastCursor, setLastCursor] = useState(null);
  const [sortBy, setSortBy] = useState("newest"); // <-- Add this
  const commentRefs = useRef({});
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortRef = useRef(null);
  let [error, setError] = useState("");

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
    resetAndFetch();
  }, [videoId, sortBy]);

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
      const res = await getComments(videoId);
      const newComments = res?.data?.comments;
      const nextCursor = res?.data?.nextCursor;
      const hasMoreRes = res?.data?.hasMore;
      const total = res?.data?.total || 0;
      setTotalCount(total);
      setComments((prev) => [
        ...prev,
        ...newComments.map((c) => ({
          ...c,
          showDropdown: false,
          readMore: false,
          hasOverflow: false,
          editing: false,
        })),
      ]);

      setLastCursor(nextCursor);
      setHasMore(hasMoreRes);
    } catch (error) {
      setError(error?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const updateOverflowFlags = () => {
      setComments((prevComments) =>
        prevComments.map((comment) => {
          const el = commentRefs.current[comment._id];
          if (!el) return comment;

          const textElement = el.querySelector(".comment-text p");
          if (!textElement) return comment;

          const isOverflowing =
            textElement.scrollHeight > textElement.clientHeight;
          return { ...comment, hasOverflow: isOverflowing };
        }),
      );
    };

    // Delay to ensure DOM has rendered
    setTimeout(updateOverflowFlags, 0);
  }, [comments]);

  const handlePostComment = async () => {
    if (!commentText.trim()) return;

    const formData = new FormData();
    formData.append("comment", commentText);

    try {
      setLoader(true);
      const res = await addComment(videoId, formData);
      const newComment = {
        ...res.data,
        showDropdown: false,
        readMore: false,
        hasOverflow: false,
      };
      setComments((prev) => [newComment, ...prev]);
      setTotalCount((prev) => prev + 1);
    } catch (error) {
      setError(error?.message);
    } finally {
      setLoader(false);
    }

    setCommentText("");
  };

  const toggleLike = async (id) => {
    const prevComments = [...comments];
    const target = comments.find((item) => item._id === id);

    if (!target) return;

    try {
      if (target.like.status) {
        // 🔽 UNLIKE
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
        await deleteCommentReview(id);
      } else {
        // 👍 LIKE (could remove dislike if present)
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
                  dislike: item.dislike.status
                    ? {
                        ...item.dislike,
                        status: false,
                        count: item.dislike.count - 1,
                      }
                    : item.dislike,
                }
              : item,
          ),
        );
        await likeComment(id);
      }
    } catch (error) {
      setError(error?.message);
      setComments(prevComments);
    }
  };

  const toggleDislike = async (id) => {
    const prevComments = [...comments];
    const target = comments.find((item) => item._id === id);

    if (!target) return;

    try {
      if (target.dislike.status) {
        // 👎 REMOVE DISLIKE
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
        await deleteCommentReview(id);
      } else {
        // 👎 ADD DISLIKE, REMOVE LIKE IF NEEDED
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
                  like: item.like.status
                    ? {
                        ...item.like,
                        status: false,
                        count: item.like.count - 1,
                      }
                    : item.like,
                }
              : item,
          ),
        );
        await disLikeComment(id);
      }
    } catch (error) {
      setError(error?.message);
      setComments(prevComments);
    }
  };

  const toggleDropdown = (id) => {
    setComments((prevData) =>
      prevData.map((item) =>
        item._id === id
          ? { ...item, showDropdown: !item.showDropdown, editing: false }
          : { ...item, showDropdown: false, editing: false },
      ),
    );
    setCommentText("");
  };

  const toggleReadMore = (id) => {
    setComments((prevData) =>
      prevData.map((item) =>
        item._id === id ? { ...item, readMore: !item.readMore } : item,
      ),
    );
  };

  const toggleHeart = async (heart, id) => {
    const prevComments = [...comments]; // ✅ shallow copy is enough here

    try {
      // Optimistic UI update
      setComments((prevData) =>
        prevData.map((item) =>
          item._id === id ? { ...item, heartByChannel: !heart } : item,
        ),
      );

      // Await the API call
      if (heart) {
        await takeHeart(id);
      } else {
        await giveHeart(id);
      }
    } catch (error) {
      // Rollback on failure
      setComments(prevComments);
      setError(error?.message);
    }
  };

  const countPinnedComments = () => {
    return comments.filter((comment) => comment.pinByChannel === true).length;
  };

  const togglePin = async (pinIt, id) => {
    const prevComments = [...comments];

    // Close all dropdowns
    setComments((prevData) =>
      prevData.map((item) => ({ ...item, showDropdown: false })),
    );

    try {
      if (pinIt) {
        // Optimistically unpin
        setComments((prevData) =>
          prevData.map((item) =>
            item._id === id ? { ...item, pinByChannel: false } : item,
          ),
        );
        await unPin(id); // ✅ correct for unpin
      } else {
        // Only allow pinning if no other comment is pinned
        if (countPinnedComments() < 1) {
          setComments((prevData) =>
            prevData.map((item) =>
              item._id === id ? { ...item, pinByChannel: true } : item,
            ),
          );
          await pin(id); // ✅ correct for pin
        }
      }
    } catch (error) {
      setError(error?.message);
      setComments(prevComments); // Rollback on failure
    }
  };

  const handleDeleteComment = async (id) => {
    let prevData = [...comments];

    let prevTotalCount = totalCount;
    try {
      setComments((prev) =>
        prev.map((c) => ({
          ...c,
          showDropdown: false,
          editing: false,
        })),
      );
      setEditCommentText("");
      setComments(comments.filter((item) => item._id != id));
      setTotalCount((prev) => prev - 1);
      await deleteComment(id);
    } catch (error) {
      setComments(prevData);
      setTotalCount(prevTotalCount);
    }
  };

  const handleEditComment = async (id) => {
    if (!editCommentText.trim()) return;

    const formData = new FormData();
    formData.append("comment", editCommentText);

    const prevComments = [...comments];
    let prevComment = editCommentText;
    try {
      setComments((prev) =>
        prev.map((item) =>
          item._id === id
            ? {
                ...item,
                comment: editCommentText,
                showDropdown: false,
                edited: true,
                editing: false,
              }
            : item,
        ),
      );
      setEditCommentText("");
      await editComment(id, formData);
    } catch (error) {
      setError(error?.message);
      setComments(prevComments);
      setEditCommentText(prevComment);
    }
  };

  const cancelEdit = (id) => {
    setComments((prevData) =>
      prevData.map((item) =>
        item._id === id ? { ...item, editing: false } : { ...item },
      ),
    );
    setEditCommentText("");
  };

  const toggleEditing = (id, text) => {
    setEditCommentText(text != null ? String(text) : "");
    setComments((prevData) =>
      prevData.map((item) =>
        item._id === id
          ? { ...item, editing: true, showDropdown: false }
          : { ...item, editing: false, showDropdown: false },
      ),
    );
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
            <ul className="absolute overflow-hidden right-0 z-50 mt-1 w-40 bg-gray-700 rounded-md">
              <li
                onClick={() => {
                  setSortBy("newest");
                  setShowSortMenu(false);
                }}
                className="px-4 py-2 text-sm text-white hover:bg-gray-600 cursor-pointer"
              >
                Newest
              </li>
              <li
                onClick={() => {
                  setSortBy("top");
                  setShowSortMenu(false);
                }}
                className="px-4 py-2 text-sm text-white hover:bg-gray-600 cursor-pointer"
              >
                Top comments
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
            value={
              typeof commentText === "string"
                ? commentText
                : String(commentText ?? "")
            }
            onFocus={() => {
              setComments((prev) =>
                prev.map((c) => ({
                  ...c,
                  showDropdown: false,
                  editing: false,
                })),
              );
            }}
            onChange={(e) => setCommentText(e.target.value)}
          />
        </div>
        <button
          className="bg-gray-700 hover:bg-gray-600 text-white min-w-[7rem] px-6 py-2 rounded-md text-center"
          onClick={handlePostComment}
        >
          Comment
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
                className={`comment-text text-sm text-gray-100 whitespace-pre-line transition-all duration-300 break-words`}
              >
                {comment?.editing ? (
                  <TextareaAutosize
                    value={
                      typeof editCommentText === "string"
                        ? editCommentText
                        : String(editCommentText ?? "")
                    }
                    onChange={(e) => setEditCommentText(e.target.value)}
                    minRows={1}
                    maxRows={10}
                    autoFocus
                    className="w-full p-1 mb-0 resize-none outline-1 outline-gray-700 text-white text-sm rounded-md"
                  />
                ) : (
                  <p
                    className={`p-1 mb-[13px] text-sm ${comment.readMore ? "" : "line-clamp-3"}`}
                    ref={(el) => (commentRefs.current[comment._id] = el)}
                  >
                    {comment.comment}
                  </p>
                )}
              </div>
              {comment?.hasOverflow && !comment.editing && (
                <button
                  onClick={() => toggleReadMore(comment._id)}
                  className="text-white text-sm font-medium"
                >
                  {comment.readMore ? "Show less" : "Show more"}
                </button>
              )}
              <div className="flex mt-2 justify-between">
                <div className="flex gap-4 text-sm text-gray-300 items-center">
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
                {comment?.editing && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        cancelEdit(comment?._id);
                      }}
                      className={`text-white px-2 py-0.25 rounded-md text-[13px] bg-gray-700 hover:bg-gray-600
                    `}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        handleEditComment(comment?._id);
                      }}
                      className={`text-white px-2 py-0.25 rounded-md text-[13px] bg-gray-700 hover:bg-gray-600
                    `}
                    >
                      Save
                    </button>
                  </div>
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
                              toggleEditing(comment?._id, comment?.comment);
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
                            handleDeleteComment(comment?._id);
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
                            toggleEditing(comment?._id, comment?.comment);
                          }}
                        >
                          Edit
                        </button>
                      </li>
                      <li>
                        <button
                          className="block w-full px-4 py-2 text-left hover:bg-gray-600"
                          onClick={() => {
                            handleDeleteComment(comment?._id);
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
