import axios from "axios";
import React, { useEffect, useState } from "react";
import { BiLike, BiSolidLike, BiSolidDislike, BiDislike } from "react-icons/bi";
import { useSelector } from "react-redux";

const CommentSection = ({ videoId }) => {
  let currentUser = useSelector((store) => store.currentUser);

  const [comments, setComments] = useState([]);
  const [loader, setLoader] = useState(false);
  let [loading, setLoading] = useState(false);
  useEffect(() => {
    setLoading(true);
    (async () => {
      let res = await axios.get(
        `http://localhost:8000/user/get-comments/${videoId}`,
        { withCredentials: true },
      );
      setComments([...res.data?.data]);
      setLoading(false);
    })();
  }, []);

  const [commentText, setCommentText] = useState("");

  const handlePostComment = () => {
    if (!commentText.trim()) return;

    let formData = new FormData();
    formData.append("comment", commentText);

    (async () => {
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
        },
        ...comments,
      ]);
    })();

    setCommentText("");
  };

  return (
    <>
      {loading ? (
        <div className="mb-4 animate-pulse">
          {/* Title */}
          <div className="h-6 w-32 bg-gray-700 rounded-2xl mb-4" />

          {/* Input and Button Skeleton */}
          <div className="flex gap-2">
            <div className="w-full border-gray-300">
              <div className="h-10 bg-gray-700 rounded-2xl w-full" />
            </div>
            <div className="w-28 h-10 bg-gray-700 rounded-2xl" />
          </div>
        </div>
      ) : (
        <div className="mx-auto pt-5">
          <h2 className="text-xl font-semibold mb-4 text-white">
            {comments.length} Comments
          </h2>

          <div className="flex gap-2 mb-4">
            <div className="w-full border-b border-gray-300">
              <input
                type="text"
                className="rounded px-3 py-2 w-full outline-none"
                placeholder="Add a public comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
            </div>
            <button
              className="bg-gray-700 text-nowrap hover:bg-gray-600 text-white px-10 py-2 rounded"
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

          {comments.map((comment) => (
            <div
              key={comment?._id}
              className="mb-4 border-b pb-4 border-gray-300 flex gap-3"
            >
              <img
                src={comment?.user?.avatar}
                alt={`${comment?.user?.name}'s avatar`}
                className="w-8 h-8 rounded-full object-cover"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-200">
                    @{comment?.user?.name}
                  </span>
                </div>
                <p className="mt-1 text-gray-400">{comment?.comment}</p>
                <div className="flex gap-4 mt-2 text-sm text-gray-300">
                  <button
                    className="flex items-center gap-1"
                    onClick={() => {
                      let id = comment._id;

                      if (
                        comments.find((item) => item._id === id).like.status ===
                        true
                      ) {
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
                          `http://localhost:8000/video/delete-comment-review/${comment._id}`,
                          [],
                          { withCredentials: true },
                        );
                      } else {
                        if (
                          comments.find((item) => item._id === id).dislike
                            .status === true
                        ) {
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
                        axios.post(
                          `http://localhost:8000/video/like-comment/${comment._id}`,
                          [],
                          { withCredentials: true },
                        );
                      }
                    }}
                  >
                    {comment?.like?.status ? <BiSolidLike /> : <BiLike />}{" "}
                    {comment?.like?.count}
                  </button>
                  <button
                    className="flex items-center gap-1"
                    onClick={() => {
                      let id = comment._id;

                      if (
                        comments.find((item) => item._id === id).dislike
                          .status === true
                      ) {
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
                          `http://localhost:8000/video/delete-comment-review/${comment._id}`,
                          [],
                          { withCredentials: true },
                        );
                      } else {
                        if (
                          comments.find((item) => item._id === id).like
                            .status === true
                        ) {
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
                        axios.post(
                          `http://localhost:8000/video/dislike-comment/${comment._id}`,
                          [],
                          { withCredentials: true },
                        );
                      }
                    }}
                  >
                    {comment?.dislike?.status ? (
                      <BiSolidDislike />
                    ) : (
                      <BiDislike />
                    )}{" "}
                    {comment?.dislike?.count}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default CommentSection;
