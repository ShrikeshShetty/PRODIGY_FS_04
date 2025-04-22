const handleLike = async () => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.post(
      `http://localhost:5000/api/posts/${post.id}/like`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.status === 200) {
      setIsLiked(!isLiked);
      setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
    }
  } catch (error) {
    console.error("Error liking/unliking post:", error);
  }
};