import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  App,
  Card,
  Button,
  Input,
  Modal,
  Space,
  Avatar,
  Typography,
  Tooltip,
  message,
  List,
  Tag,
  Dropdown,
  Menu,
  Image,
  Upload,
  Spin,
  Divider,
  Empty,
  Tabs,
  Alert,
} from "antd";
import {
  LikeOutlined,
  CommentOutlined,
  EyeOutlined,
  SendOutlined,
  FileImageOutlined,
  EllipsisOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  FileOutlined,
  LoadingOutlined,
  UserOutlined,
  PlayCircleOutlined,
  SoundOutlined,
  DownloadOutlined,
  HeartOutlined,
  HeartFilled,
  SmileOutlined,
  SmileFilled,
  LikeFilled,
  DislikeOutlined,
  DislikeFilled,
  BellOutlined,
  CheckCircleFilled,
  UploadOutlined,
} from "@ant-design/icons";
import { useAuth } from "../../../AuthContext";
import {
  getAllPosts,
  createPost,
  moderatePost,
  deletePost,
  updatePost,
  addView,
  getViewers,
} from "../../../api/blog/post";
import firebaseBlogService, {
  REACTION_TYPES,
  REACTION_INFO,
} from "../../../api/firebaseBlog";
import { staticURL } from "../../../api/config";
import {
  createReaction,
  getUserReaction,
} from "../../../api/blog/postReaction";
import {
  getComments,
  createComment,
  updateComment,
  deleteComment,
} from "../../../api/blog/postComment";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;

// Styles
const styles = `
  .attachment-preview-container {
    transition: all 0.3s ease;
  }

  .attachment-preview-container:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }

  .attachment-actions {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .attachment-preview-container:hover .attachment-actions {
    opacity: 1;
  }

  .upload-button:hover {
    background-color: #f5f5f5;
    border-radius: 6px;
  }

  .post-action-button:hover {
    background-color: #f5f5f5;
    border-radius: 50%;
  }

  .reactions-wrapper {
    position: relative;
    display: inline-block;
  }

  .reactions-popup {
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    background: white;
    border-radius: 20px;
    padding: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    display: flex;
    gap: 4px;
    margin-bottom: 8px;
    transition: all 0.3s;
    opacity: 0;
    visibility: hidden;
    z-index: 1000;
  }

  .reactions-wrapper:hover .reactions-popup {
    opacity: 1;
    visibility: visible;
  }

  .reaction-icon {
    padding: 4px;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s;
  }

  .reaction-icon:hover {
    transform: scale(1.3);
  }

  .reaction-button {
    transition: all 0.3s ease;
  }

  .reaction-button:hover {
    transform: scale(1.1);
  }

  .reaction-button.selected {
    transform: scale(1.1);
  }

  .like-icon { color: #2078f4; }
  .love-icon { color: #f33e58; }
  .haha-icon { color: #f7b125; }
  .wow-icon { color: #f7b125; }
  .sad-icon { color: #f7b125; }
  .angry-icon { color: #e9710f; }

.posts-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
    margin-top: 24px;
  }

  @media (max-width: 1200px) {
    .posts-grid {
      grid-template-columns: 1fr;
    }
  }
`;

// Add styles to document
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}

// Utility functions
const getFileType = (fileName) => {
  const extension = fileName.split(".").pop().toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension)) return "image";
  if (["mp4", "webm", "ogg"].includes(extension)) return "video";
  if (["mp3", "wav"].includes(extension)) return "audio";
  return "other";
};

const validateFile = (file) => {
  const isValidType = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "video/mp4",
    "video/webm",
    "audio/mp3",
    "audio/wav",
    "application/pdf",
  ].includes(file.type);

  const isValidSize = file.size / 1024 / 1024 < 5; // 5MB limit

  if (!isValidType) {
    message.error(`${file.name} không phải là định dạng file được hỗ trợ`);
    return false;
  }

  if (!isValidSize) {
    message.error(`${file.name} phải nhỏ hơn 5MB`);
    return false;
  }

  return true;
};

// AttachmentPreview Component
const AttachmentPreview = ({ attachments, onPreview, onRemove }) => {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: "16px",
        marginTop: 16,
      }}
    >
      {attachments.map((attachment, index) => {
        const fileType = getFileType(attachment.name || attachment.file_name);
        const isPreviewable = ["image", "video", "audio"].includes(fileType);
        const thumbnailUrl =
          fileType === "image"
            ? attachment.url || `${staticURL}/${attachment.file_path}`
            : null;

        return (
          <div
            key={index}
            style={{
              position: "relative",
              aspectRatio: "1",
              borderRadius: "8px",
              overflow: "hidden",
              backgroundColor: "#f0f2f5",
              border: "1px solid #e8e8e8",
            }}
            className="attachment-preview-container"
          >
            {fileType === "image" ? (
              <img
                src={thumbnailUrl}
                alt={attachment.name || attachment.file_name}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                  padding: "16px",
                }}
              >
                {fileType === "video" ? (
                  <PlayCircleOutlined
                    style={{ fontSize: "32px", color: "#1890ff" }}
                  />
                ) : fileType === "audio" ? (
                  <SoundOutlined
                    style={{ fontSize: "32px", color: "#1890ff" }}
                  />
                ) : (
                  <FileOutlined
                    style={{ fontSize: "32px", color: "#1890ff" }}
                  />
                )}
                <Typography.Text
                  ellipsis
                  style={{
                    marginTop: 8,
                    maxWidth: "100%",
                    textAlign: "center",
                  }}
                >
                  {attachment.name || attachment.file_name}
                </Typography.Text>
              </div>
            )}

            <div className="attachment-actions">
              {isPreviewable && (
                <Button
                  type="primary"
                  icon={
                    fileType === "video" ? (
                      <PlayCircleOutlined />
                    ) : (
                      <EyeOutlined />
                    )
                  }
                  onClick={() => onPreview(attachment)}
                  ghost
                />
              )}
              {onRemove && (
                <Button
                  type="primary"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => onRemove(index)}
                  ghost
                />
              )}
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                href={attachment.url || `${staticURL}/${attachment.file_path}`}
                target="_blank"
                ghost
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// PreviewContent Component
const PreviewContent = ({ media }) => {
  const fileType = getFileType(media.name || media.file_name);
  const fileUrl = media.url || `${staticURL}/${media.file_path}`;

  switch (fileType) {
    case "image":
      return (
        <div style={{ textAlign: "center" }}>
          <Image
            src={fileUrl}
            style={{ maxWidth: "100%", maxHeight: "80vh" }}
            preview={false}
          />
        </div>
      );
    case "video":
      return (
        <div style={{ textAlign: "center" }}>
          <video
            controls
            style={{ maxWidth: "100%", maxHeight: "80vh" }}
            preload="metadata"
          >
            <source
              src={fileUrl}
              type={`video/${media.name?.split(".").pop()}`}
            />
            Your browser does not support the video tag.
          </video>
        </div>
      );
    case "audio":
      return (
        <div
          style={{
            width: "100%",
            padding: "20px",
            backgroundColor: "#f5f5f5",
            borderRadius: "8px",
          }}
        >
          <audio controls style={{ width: "100%" }}>
            <source
              src={fileUrl}
              type={`audio/${media.name?.split(".").pop()}`}
            />
            Your browser does not support the audio tag.
          </audio>
        </div>
      );
    default:
      return null;
  }
};

// ReactionButtons Component
const ReactionButtons = ({ post }) => {
  const [reactionCounts, setReactionCounts] = useState({});
  const [userReaction, setUserReaction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isReactionModalVisible, setIsReactionModalVisible] = useState(false);
  const { user } = useAuth();

  const reactionIcons = {
    like: {
      icon: (
        <span role="img" aria-label="like" style={{ fontSize: "24px" }}>
          👍
        </span>
      ),
      label: "Like",
      color: "#2078f4",
      inactiveIcon: <LikeOutlined style={{ fontSize: "14px" }} />,
    },
    love: {
      icon: (
        <span role="img" aria-label="love" style={{ fontSize: "24px" }}>
          ❤️
        </span>
      ),
      label: "Love",
      color: "#f33e58",
      inactiveIcon: (
        <span
          role="img"
          aria-label="love"
          style={{ fontSize: "24px", opacity: 0.5 }}
        >
          ❤️
        </span>
      ),
    },
    haha: {
      icon: (
        <span role="img" aria-label="haha" style={{ fontSize: "24px" }}>
          😆
        </span>
      ),
      label: "Haha",
      color: "#f7b125",
      inactiveIcon: (
        <span
          role="img"
          aria-label="haha"
          style={{ fontSize: "24px", opacity: 0.5 }}
        >
          😆
        </span>
      ),
    },
    wow: {
      icon: (
        <span role="img" aria-label="wow" style={{ fontSize: "24px" }}>
          😮
        </span>
      ),
      label: "Wow",
      color: "#f7b125",
      inactiveIcon: (
        <span
          role="img"
          aria-label="wow"
          style={{ fontSize: "24px", opacity: 0.5 }}
        >
          😮
        </span>
      ),
    },
    sad: {
      icon: (
        <span role="img" aria-label="sad" style={{ fontSize: "24px" }}>
          😢
        </span>
      ),
      label: "Sad",
      color: "#f7b125",
      inactiveIcon: (
        <span
          role="img"
          aria-label="sad"
          style={{ fontSize: "24px", opacity: 0.5 }}
        >
          😢
        </span>
      ),
    },
    angry: {
      icon: (
        <span role="img" aria-label="angry" style={{ fontSize: "24px" }}>
          😡
        </span>
      ),
      label: "Angry",
      color: "#e9710f",
      inactiveIcon: (
        <span
          role="img"
          aria-label="angry"
          style={{ fontSize: "24px", opacity: 0.5 }}
        >
          😡
        </span>
      ),
    },
  };

  useEffect(() => {
    if (!user || !post?.reactions) return;

    // Tìm reaction của current user trong danh sách reactions
    const currentUserReaction = Object.values(post.reactions).find(
      (reaction) => reaction.user._id === user._id
    );

    if (currentUserReaction) {
      setUserReaction(currentUserReaction.reaction_type);
    } else {
      setUserReaction(null);
    }

    // Tính toán số lượng reaction
    if (post.reactions) {
      const counts = Object.values(REACTION_TYPES).reduce((acc, type) => {
        acc[type] = Object.values(post.reactions).filter(
          (r) => r.reaction_type === type
        ).length;
        return acc;
      }, {});
      setReactionCounts(counts);
    }
  }, [post.reactions, user]);

  const handleReaction = async (type) => {
    if (loading || !user) {
      if (!user) {
        message.warning("Please login to react to posts");
      }
      return;
    }

    try {
      setLoading(true);

      // Nếu user click vào reaction hiện tại, xóa reaction
      if (userReaction === type) {
        await firebaseBlogService.removeReaction(post._id, user._id);
        setUserReaction(null);
      } else {
        // Nếu chưa có reaction hoặc đổi loại reaction khác
        await firebaseBlogService.createReaction(post._id, user._id, type, {
          _id: user._id,
          first_name: user.first_name,
          last_name: user.last_name,
          avatar_path: user.avatar_path,
          role: user.role,
        });
        setUserReaction(type);
      }
    } catch (error) {
      console.error("Error handling reaction:", error);
      message.error("Failed to handle reaction");
    } finally {
      setLoading(false);
    }
  };

  const totalReactions = Object.values(reactionCounts).reduce(
    (a, b) => a + b,
    0
  );
  const currentReaction = reactionIcons[userReaction];

  return (
    <div className="reactions-wrapper">
      <div className="reactions-popup">
        {Object.entries(reactionIcons).map(([type, { icon, label, color }]) => (
          <Tooltip key={type} title={label}>
            <div
              className="reaction-icon"
              onClick={() => handleReaction(type)}
              style={{ padding: "8px" }}
            >
              <span style={{ fontSize: "24px" }}>{icon}</span>
            </div>
          </Tooltip>
        ))}
      </div>
      <Space>
        <Button
          type="text"
          icon={
            currentReaction
              ? currentReaction.icon
              : reactionIcons.like.inactiveIcon
          }
          style={{
            color: currentReaction ? currentReaction.color : undefined,
            fontSize: "14px",
          }}
          className={`reaction-button ${userReaction ? "selected" : ""}`}
          onClick={() => setIsReactionModalVisible(true)}
        >
          {userReaction
            ? userReaction.charAt(0).toUpperCase() + userReaction.slice(1)
            : "Like"}

          {totalReactions > 0 && (
            <span
              onClick={() => setIsReactionModalVisible(true)}
              style={{
                fontSize: "14px",
                cursor: "pointer",
                backgroundColor: "#f0f2f5",
                padding: "2px 8px",
                borderRadius: "10px",
              }}
            >
              ({totalReactions})
            </span>
          )}
        </Button>
      </Space>

      <ReactionListModal
        visible={isReactionModalVisible}
        onClose={() => setIsReactionModalVisible(false)}
        post={post}
        reactionIcons={reactionIcons}
      />
    </div>
  );
};

const ReactionListModal = ({ visible, onClose, post, reactionIcons }) => {
  const [selectedType, setSelectedType] = useState("all");
  const [reactions, setReactions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let unsubscribe;
    if (visible && post?._id) {
      setLoading(true);
      unsubscribe = firebaseBlogService.subscribeToReactions(
        post._id,
        (data) => {
          setReactions(data || []);
          setLoading(false);
        }
      );
    }
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [visible, post?._id]);

  const filteredReactions = useMemo(() => {
    if (selectedType === "all") return reactions;
    return reactions.filter((r) => r.reaction_type === selectedType);
  }, [reactions, selectedType]);

  const reactionStats = useMemo(() => {
    return reactions.reduce((acc, reaction) => {
      acc[reaction.reaction_type] = (acc[reaction.reaction_type] || 0) + 1;
      return acc;
    }, {});
  }, [reactions]);

  return (
    <Modal
      open={visible}
      title="Reactions"
      footer={null}
      onCancel={onClose}
      width={600}
    >
      <Space direction="vertical" style={{ width: "100%" }} size="large">
        {/* Reaction Type Filter */}
        <Space wrap>
          <Button
            type={selectedType === "all" ? "primary" : "default"}
            onClick={() => setSelectedType("all")}
          >
            All ({reactions.length})
          </Button>
          {Object.entries(reactionIcons).map(([type, { icon, label }]) => (
            <Button
              key={type}
              type={selectedType === type ? "primary" : "default"}
              icon={icon}
              onClick={() => setSelectedType(type)}
            >
              {reactionStats[type] || 0}
            </Button>
          ))}
        </Space>

        {/* Reactions List */}
        <List
          loading={loading}
          dataSource={filteredReactions}
          renderItem={(reaction) => (
            <List.Item>
              <List.Item.Meta
                avatar={
                  <Avatar
                    src={
                      reaction.user.avatar_path
                        ? `${staticURL}/${reaction.user.avatar_path}`
                        : null
                    }
                    icon={!reaction.user.avatar_path && <UserOutlined />}
                  />
                }
                title={
                  <Space>
                    <Text strong>
                      {reaction.user.first_name} {reaction.user.last_name}
                    </Text>
                    <Tag
                      color={
                        reaction.user.role === "admin"
                          ? "red"
                          : reaction.user.role === "staff"
                          ? "blue"
                          : reaction.user.role === "tutor"
                          ? "green"
                          : "default"
                      }
                    >
                      {reaction.user.role.toUpperCase()}
                    </Tag>
                  </Space>
                }
                description={
                  <Space>
                    {reactionIcons[reaction.reaction_type].icon}
                    <Text type="secondary">
                      {dayjs(reaction.created_at).fromNow()}
                    </Text>
                  </Space>
                }
              />
            </List.Item>
          )}
          locale={{
            emptyText: <Empty description="No reactions yet" />,
          }}
        />
      </Space>
    </Modal>
  );
};

const CommentModal = ({ post, visible, onClose, onCommentSubmit }) => {
  const [commentContent, setCommentContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewMedia, setPreviewMedia] = useState(null);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingContent, setEditingContent] = useState("");
  const [localComments, setLocalComments] = useState([]);
  const { user } = useAuth();
  const { modal } = App.useApp();

  useEffect(() => {
    let unsubscribe;
    if (visible && post?._id) {
      unsubscribe = firebaseBlogService.subscribeToComments(
        post._id,
        (comments) => {
          const sortedComments = comments
            ? [...comments].sort((a, b) => b.created_at - a.created_at)
            : [];
          setLocalComments(sortedComments);

          if (post && comments) {
            post.comments_count = comments.length;
          }
        }
      );
    }
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [visible, post]);

  const handleSubmit = async () => {
    if (!commentContent.trim() || submitting) return;

    try {
      setSubmitting(true);
      const success = await onCommentSubmit(commentContent);
      if (success) {
        setCommentContent("");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditComment = async (commentId, newContent) => {
    if (!newContent.trim()) return;

    try {
      const updatedComment = {
        content: newContent.trim(),
        updated_at: Date.now(),
      };

      await firebaseBlogService.updateComment(
        post._id,
        commentId,
        updatedComment
      );
      setEditingCommentId(null);
      setEditingContent("");
      message.success("Comment updated successfully");
    } catch (error) {
      console.error("Edit comment error:", error);
      message.error("Failed to update comment");
    }
  };

  const handleDeleteComment = (commentId) => {
    modal.confirm({
      title: "Delete Comment",
      content: "Are you sure you want to delete this comment?",
      okText: "Yes",
      okType: "danger",
      cancelText: "No",
      onOk: async () => {
        try {
          await firebaseBlogService.deleteComment(post._id, commentId);
          message.success("Comment deleted successfully");
        } catch (error) {
          console.error("Delete comment error:", error);
          message.error("Failed to delete comment");
        }
      },
    });
  };

  const handlePreviewAttachment = (attachment) => {
    setPreviewMedia(attachment);
    setPreviewVisible(true);
  };

  const hasAttachments =
    Array.isArray(post.attachments) && post.attachments.length > 0;

  const calculateModalHeight = () => {
    if (!hasAttachments) {
      return "calc(100vh - 200px)";
    }
    return "calc(100vh - 200px)";
  };

  return (
    <Modal
      open={visible}
      title={`Comments (${localComments.length})`}
      footer={null}
      onCancel={onClose}
      width={800}
      centered
      bodyStyle={{
        padding: 0,
        maxHeight: "70vh",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "16px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            marginBottom: 16,
            overflowY: hasAttachments ? "auto" : "visible",
            maxHeight: hasAttachments ? "30vh" : "auto",
            paddingRight: 8,
          }}
        >
          <Space align="start">
            <Avatar
              size={48}
              src={
                post.author?.avatar_path
                  ? `${staticURL}/${post.author.avatar_path}`
                  : null
              }
              icon={!post.author?.avatar_path && <UserOutlined />}
            />
            <Space direction="vertical" size={0}>
              <Space>
                <Text strong style={{ fontSize: 16 }}>
                  {post.author?.first_name} {post.author?.last_name}
                </Text>
                <Tag
                  color={
                    post.author?.role === "admin"
                      ? "red"
                      : post.author?.role === "staff"
                      ? "blue"
                      : post.author?.role === "tutor"
                      ? "green"
                      : "default"
                  }
                >
                  {post.author?.role?.toUpperCase()}
                </Tag>
              </Space>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {dayjs(post.created_at).format("MMM D, YYYY [at] h:mm A")}
              </Text>
            </Space>
          </Space>

          <div style={{ marginTop: 16 }}>
            <Paragraph style={{ fontSize: 15, whiteSpace: "pre-wrap" }}>
              {post.content}
            </Paragraph>

            {Array.isArray(post.attachments) && post.attachments.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <AttachmentPreview
                  attachments={post.attachments}
                  onPreview={handlePreviewAttachment}
                />
              </div>
            )}
          </div>
        </div>

        <Divider style={{ margin: "8px 0" }} />

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            marginBottom: 8,
            display: "flex",
            flexDirection: "column",
            paddingRight: 8,
            minHeight: "20vh",
            maxHeight: "30vh",
          }}
        >
          <List
            itemLayout="horizontal"
            dataSource={localComments}
            style={{
              flex: 1,
              minHeight: "100%",
            }}
            locale={{
              emptyText: (
                <Empty
                  description="No comments yet"
                  style={{ margin: "auto" }}
                />
              ),
            }}
            renderItem={(comment) => {
              if (!comment || !comment.author) return null;

              return (
                <List.Item
                  actions={
                    comment.author._id === user?._id
                      ? [
                          <Button
                            type="link"
                            key="edit"
                            onClick={() => {
                              setEditingCommentId(comment._id);
                              setEditingContent(comment.content);
                            }}
                          >
                            Edit
                          </Button>,
                          <Button
                            type="link"
                            danger
                            key="delete"
                            onClick={() => handleDeleteComment(comment._id)}
                          >
                            Delete
                          </Button>,
                        ]
                      : []
                  }
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        src={
                          comment.author.avatar_path
                            ? `${staticURL}/${comment.author.avatar_path}`
                            : null
                        }
                        icon={!comment.author.avatar_path && <UserOutlined />}
                      />
                    }
                    title={
                      <Space>
                        <Text strong>
                          {comment.author.first_name} {comment.author.last_name}
                        </Text>
                        <Tag
                          color={
                            comment.author.role === "admin"
                              ? "red"
                              : comment.author.role === "staff"
                              ? "blue"
                              : comment.author.role === "tutor"
                              ? "green"
                              : "default"
                          }
                        >
                          {comment.author.role.toUpperCase()}
                        </Tag>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {dayjs(comment.created_at).fromNow()}
                          {comment.updated_at !== comment.created_at &&
                            " (edited)"}
                        </Text>
                      </Space>
                    }
                    description={
                      editingCommentId === comment._id ? (
                        <Space.Compact style={{ width: "100%", marginTop: 8 }}>
                          <Input.TextArea
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            autoSize={{ minRows: 1, maxRows: 4 }}
                            style={{ borderRadius: "8px 0 0 8px" }}
                          />
                          <Button
                            type="primary"
                            onClick={() =>
                              handleEditComment(comment._id, editingContent)
                            }
                            style={{ borderRadius: "0 8px 8px 0" }}
                          >
                            Save
                          </Button>
                          <Button
                            onClick={() => {
                              setEditingCommentId(null);
                              setEditingContent("");
                            }}
                          >
                            Cancel
                          </Button>
                        </Space.Compact>
                      ) : (
                        <div style={{ whiteSpace: "pre-wrap", marginTop: 8 }}>
                          {comment.content}
                        </div>
                      )
                    }
                  />
                </List.Item>
              );
            }}
          />
        </div>

        <div
          style={{
            flexShrink: 0,
            backgroundColor: "#fff",
            paddingTop: 8,
            boxShadow: "0 -2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <Space.Compact style={{ width: "100%" }}>
            <Input.TextArea
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              placeholder="Write a comment..."
              autoSize={{ minRows: 1, maxRows: 4 }}
              style={{ borderRadius: "8px 0 0 8px" }}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSubmit}
              loading={submitting}
              style={{ borderRadius: "0 8px 8px 0" }}
            >
              Comment
            </Button>
          </Space.Compact>
        </div>
      </div>

      <Modal
        open={previewVisible}
        title={previewMedia?.name || previewMedia?.file_name || "Preview"}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        width={800}
        centered
      >
        {previewMedia && <PreviewContent media={previewMedia} />}
      </Modal>
    </Modal>
  );
};

// Post Component
const Post = ({ basePath }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pendingPosts, setPendingPosts] = useState([]);
  const [newPostContent, setNewPostContent] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [editingPost, setEditingPost] = useState(null);
  const [isPendingModalVisible, setIsPendingModalVisible] = useState(false);
  const [expandedComments, setExpandedComments] = useState({});
  const [commentValues, setCommentValues] = useState({});
  const [editingComments, setEditingComments] = useState({});
  const [submittingComments, setSubmittingComments] = useState({});
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewMedia, setPreviewMedia] = useState(null);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [viewersList, setViewersList] = useState([]);
  const [viewedPosts, setViewedPosts] = useState(new Set());

  const { user } = useAuth();
  const { modal } = App.useApp();

  const permissions = useMemo(() => {
    if (!user)
      return {
        canCreate: false,
        canModerate: false,
        canDelete: false,
        canEdit: false,
      };

    if (user.role === "admin") {
      return {
        canCreate: true,
        canModerate: true,
        canDelete: true,
        canEdit: true,
      };
    } else if (["staff", "tutor"].includes(user.role)) {
      return {
        canCreate: true,
        canModerate: false,
        canDelete: "student",
        canEdit: true,
      };
    } else {
      return {
        canCreate: true,
        canModerate: false,
        canDelete: false,
        canEdit: true,
      };
    }
  }, [user]);

  const fetchPosts = useCallback(() => {
    setLoading(true);

    const unsubscribers = [];

    try {
      const unsubscribePosts = firebaseBlogService.subscribeToAllPosts(
        (allPosts) => {
          if (Array.isArray(allPosts)) {
            const approved = [];
            const pending = [];

            allPosts.forEach((post) => {
              if (post._id) {
                // Subscribe to comments
                const unsubscribeComments =
                  firebaseBlogService.subscribeToComments(
                    post._id,
                    (comments) => {
                      post.comments_count = comments ? comments.length : 0;

                      setPosts((prev) =>
                        prev.map((p) =>
                          p._id === post._id
                            ? { ...p, comments_count: post.comments_count }
                            : p
                        )
                      );
                    }
                  );

                // Subscribe to reactions
                const unsubscribeReactions =
                  firebaseBlogService.subscribeToReactions(
                    post._id,
                    (reactions) => {
                      if (post._id) {
                        setPosts((prev) =>
                          prev.map((p) =>
                            p._id === post._id
                              ? { ...p, reactions: reactions }
                              : p
                          )
                        );
                      }
                    }
                  );

                unsubscribers.push(unsubscribeComments);
                unsubscribers.push(unsubscribeReactions);
              }

              if (post.is_approved) {
                approved.push(post);
              } else {
                pending.push(post);
              }
            });

            approved.sort((a, b) => b.created_at - a.created_at);
            pending.sort((a, b) => b.created_at - a.created_at);

            setPosts(approved);
            setPendingPosts(pending);
            setLoading(false);
          }
        }
      );

      unsubscribers.push(unsubscribePosts);

      return () => {
        unsubscribers.forEach((unsub) => unsub && unsub());
      };
    } catch (error) {
      console.error("Error in fetchPosts:", error);
      setLoading(false);
      message.error("Failed to fetch posts");
    }
  }, []);

  useEffect(() => {
    if (!user || !posts.length) return;

    posts.forEach(async (post) => {
      if (!viewedPosts.has(post._id)) {
        try {
          await firebaseBlogService.addView(post._id, {
            _id: user._id,
            first_name: user.first_name,
            last_name: user.last_name,
            avatar_path: user.avatar_path,
            role: user.role,
          });

          setViewedPosts((prev) => new Set([...prev, post._id]));

          console.log(`Added view for post: ${post._id}`);
        } catch (error) {
          console.error("Error adding view:", error);
        }
      }
    });
  }, [posts, user]);

  useEffect(() => {
    const cleanup = fetchPosts();
    return () => {
      if (cleanup) cleanup();
    };
  }, [fetchPosts]);

  useEffect(() => {
    return () => {
      attachments.forEach((file) => {
        if (file.preview?.url) {
          URL.revokeObjectURL(file.preview.url);
        }
        if (file.preview?.file_path) {
          URL.revokeObjectURL(file.preview.file_path);
        }
      });
    };
  }, [attachments]);

  useEffect(() => {
    if (selectedPost && commentModalVisible) {
      const unsubscribe = firebaseBlogService.subscribeToComments(
        selectedPost._id,
        (comments) => {
          setSelectedPost((prev) => ({
            ...prev,
            comments: comments || [],
          }));
        }
      );

      return () => {
        unsubscribe();
      };
    }
  }, [selectedPost?._id, commentModalVisible]);

  const createTempFileURL = (file) => {
    if (!file) return null;
    return {
      name: file.name,
      url: URL.createObjectURL(file.originFileObj || file),
      file_path: file.originFileObj
        ? URL.createObjectURL(file.originFileObj)
        : file.url,
    };
  };

  const renderCreatePost = () => (
    <Card
      style={{
        marginBottom: 24,
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
        borderRadius: 8,
      }}
      bodyStyle={{ padding: "16px" }}
    >
      <Space direction="vertical" style={{ width: "100%" }} size="large">
        <div style={{ display: "flex", width: "100%", gap: "12px" }}>
          <Avatar
            size={48}
            src={user?.avatar_path ? `${staticURL}/${user.avatar_path}` : null}
            icon={!user?.avatar_path && <UserOutlined />}
            style={{ flexShrink: 0 }}
          />
          <TextArea
            placeholder="What's on your mind?"
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            autoSize={{ minRows: 3, maxRows: 6 }}
            style={{
              borderRadius: 8,
              backgroundColor: "#f5f5f5",
              padding: "12px 24px",
              width: "100%",
              resize: "none",
            }}
            disabled={loading}
          />
        </div>

        {attachments.length > 0 && (
          <AttachmentPreview
            attachments={attachments.map((file) => file.preview)}
            onPreview={(media) => {
              setPreviewMedia(media);
              setPreviewVisible(true);
            }}
            onRemove={(index) => {
              const newAttachments = [...attachments];
              if (newAttachments[index].preview?.url) {
                URL.revokeObjectURL(newAttachments[index].preview.url);
              }
              if (newAttachments[index].preview?.file_path) {
                URL.revokeObjectURL(newAttachments[index].preview.file_path);
              }
              newAttachments.splice(index, 1);
              setAttachments(newAttachments);
            }}
          />
        )}

        <Divider style={{ margin: "12px 0" }} />

        <Space style={{ justifyContent: "space-between", width: "100%" }}>
          <Upload
            beforeUpload={(file) => {
              if (!validateFile(file)) {
                return Upload.LIST_IGNORE;
              }
              return false;
            }}
            fileList={attachments}
            multiple
            maxCount={5}
            accept="image/*,video/*,audio/*,.pdf"
            onChange={({ fileList }) => {
              const validFiles = fileList
                .filter((file) => {
                  if (file.originFileObj) {
                    return validateFile(file.originFileObj);
                  }
                  return true;
                })
                .map((file) => ({
                  ...file,
                  preview: createTempFileURL(file),
                }));
              setAttachments(validFiles);
            }}
            showUploadList={false}
            disabled={loading}
          >
            <Button
              icon={<FileImageOutlined />}
              type="text"
              className="upload-button"
            >
              Add Media
            </Button>
          </Upload>

          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleCreatePost}
            loading={loading}
            style={{
              height: 40,
              borderRadius: 20,
              paddingLeft: 24,
              paddingRight: 24,
            }}
          >
            {loading ? "Posting..." : "Post"}
          </Button>
        </Space>
      </Space>
    </Card>
  );

  const renderHeader = () => (
    <Space
      style={{
        marginBottom: 24,
        width: "100%",
        justifyContent: "space-between",
      }}
    >
      {permissions.canModerate && pendingPosts.length > 0 && (
        <Button
          type="primary"
          icon={<ClockCircleOutlined />}
          onClick={() => setIsPendingModalVisible(true)}
          style={{
            backgroundColor: "#ff4d4f",
            borderColor: "#ff4d4f",
          }}
        >
          Pending Posts ({pendingPosts.length})
        </Button>
      )}
    </Space>
  );

  const handleCreatePost = async () => {
    if (!newPostContent.trim() && attachments.length === 0) {
      message.warning("Please add some content or attachments");
      return;
    }

    try {
      setLoading(true);
      message.loading({ content: "Creating post...", key: "post-create" });

      const contentToPost = newPostContent.trim();
      const attachmentsToPost = [...attachments];

      setNewPostContent("");
      setAttachments([]);

      const formData = new FormData();
      formData.append("content", contentToPost);
      formData.append(
        "is_approved",
        ["admin", "staff", "tutor"].includes(user.role)
      );

      attachmentsToPost.forEach((file) => {
        if (file.originFileObj) {
          formData.append("attachments", file.originFileObj);
        }
      });

      const response = await createPost(formData);

      if (response?.data) {
        attachmentsToPost.forEach((file) => {
          if (file.preview?.url) URL.revokeObjectURL(file.preview.url);
          if (file.preview?.file_path)
            URL.revokeObjectURL(file.preview.file_path);
        });

        const postData = {
          _id: response.data._id,
          content: contentToPost,
          is_approved: ["admin", "staff", "tutor"].includes(user.role),
          author: {
            _id: user._id,
            first_name: user.first_name || "",
            last_name: user.last_name || "",
            avatar_path: user.avatar_path || null,
            role: user.role || "",
          },
          created_at: Date.now(),
          updated_at: Date.now(),
          attachments: response.data.attachments || [],
          comments: [],
          reactions: {},
          view_count: 0,
          status: ["admin", "staff", "tutor"].includes(user.role)
            ? "approved"
            : "pending",
        };

        await firebaseBlogService.createPost(postData);

        message.success({
          content:
            user.role === "student"
              ? "Post created successfully and waiting for approval"
              : "Post created successfully",
          key: "post-create",
          duration: 3,
        });
      }
    } catch (error) {
      console.error("Create post error:", error);
      message.error({
        content: "Failed to create post",
        key: "post-create",
        duration: 3,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePost = async (postId) => {
    if (!editingPost.content.trim()) {
      message.warning("Post content cannot be empty");
      return;
    }

    try {
      const updates = {
        content: editingPost.content.trim(),
        updated_at: Date.now(),
      };

      if (user.role === "student") {
        updates.is_approved = false;
      }

      await firebaseBlogService.updatePost(postId, updates);

      if (user.role === "student") {
        message.success("Post updated and waiting for re-approval");
      } else {
        message.success("Post updated successfully");
      }

      setEditingPost(null);
    } catch (error) {
      console.error("Update post error:", error);
      message.error("Failed to update post");
    }
  };

  const handleDeletePost = async (postId, authorId, authorRole) => {
    const canDeletePost = () => {
      if (!user) return false;

      if (user._id === authorId) return true;
      if (user.role === "admin") return true;
      if (["staff", "tutor"].includes(user.role) && authorRole === "student")
        return true;

      return false;
    };

    if (!canDeletePost()) {
      message.error("You don't have permission to delete this post");
      return;
    }

    modal.confirm({
      title: "Delete Post",
      content: "Are you sure you want to delete this post?",
      okText: "Yes",
      okType: "danger",
      cancelText: "No",
      async onOk() {
        try {
          await firebaseBlogService.deletePost(postId);
          setPosts((prevPosts) =>
            prevPosts.filter((post) => post._id !== postId)
          );
          setPendingPosts((prevPosts) =>
            prevPosts.filter((post) => post._id !== postId)
          );
          message.success("Post deleted successfully");
        } catch (error) {
          console.error("Delete post error:", error);
          message.error("Failed to delete post");
        }
      },
    });
  };

  const handleModeratePost = async (postId, status, reason = "") => {
    try {
      const moderatorInfo = {
        is_approved: status,
        updated_at: Date.now(),
        moderator: {
          _id: user._id,
          first_name: user.first_name,
          last_name: user.last_name,
          avatar_path: user.avatar_path,
          role: user.role,
          moderated_at: Date.now(),
        },
        rejection_reason: status ? null : reason,
        status: status ? "approved" : "rejected",
      };

      await firebaseBlogService.updatePost(postId, moderatorInfo);

      message.success({
        content: `Post ${status ? "approved" : "rejected"} successfully`,
        duration: 3,
      });

      setIsPendingModalVisible(false);
    } catch (error) {
      console.error("Moderate post error:", error);
      message.error("Failed to moderate post");
    }
  };

  const handleViewPost = async (postId) => {
    try {
      if (!user) {
        message.warning("Please login to view details");
        return;
      }

      const viewers = await firebaseBlogService.getViewers(postId);
      setViewersList(viewers);
      setViewModalVisible(true);
    } catch (error) {
      console.error("Get viewers error:", error);
      message.error("Failed to get viewers list");
    }
  };

  const handleModalCommentSubmit = async (content) => {
    if (!content.trim()) return;

    try {
      const commentData = {
        content: content.trim(),
        user_id: user._id,
        post_id: selectedPost._id,
        created_at: Date.now(),
        updated_at: Date.now(),
        author: {
          _id: user._id,
          first_name: user.first_name || "",
          last_name: user.last_name || "",
          avatar_path: user.avatar_path || null,
          role: user.role || "user",
        },
        is_deleted: false,
      };

      await firebaseBlogService.createComment(selectedPost._id, commentData);

      message.success("Comment added successfully");
      return true;
    } catch (error) {
      console.error("Comment submit error:", error);
      message.error("Failed to add comment");
      return false;
    }
  };

  const handlePreviewAttachment = (attachment) => {
    setPreviewMedia(attachment);
    setPreviewVisible(true);
  };

  const renderPost = (post) => (
    <Card
      key={post._id}
      style={{
        height: "100%",
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
        borderRadius: 8,
        display: "flex",
        flexDirection: "column",
      }}
      bodyStyle={{
        padding: "24px",
        flex: 1,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <Space align="start">
          <Avatar
            size={48}
            src={
              post.author?.avatar_path
                ? `${staticURL}/${post.author.avatar_path}`
                : null
            }
            icon={!post.author?.avatar_path && <UserOutlined />}
          />

          <Space direction="vertical" size={0}>
            <Space align="center">
              <Text strong style={{ fontSize: 16 }}>
                {post.author?.first_name} {post.author?.last_name}
              </Text>
              <Tag
                color={
                  post.author?.role === "admin"
                    ? "red"
                    : post.author?.role === "staff"
                    ? "blue"
                    : post.author?.role === "tutor"
                    ? "green"
                    : "default"
                }
              >
                {post.author?.role?.toUpperCase()}
              </Tag>
              {post.author?.role === "student" &&
                post.is_approved &&
                post.moderator && (
                  <Tooltip
                    title={
                      <div style={{ padding: "8px" }}>
                        <Space align="center" style={{ marginBottom: "8px" }}>
                          <Avatar
                            size={24}
                            src={
                              post.moderator?.avatar_path
                                ? `${staticURL}/${post.moderator.avatar_path}`
                                : null
                            }
                            icon={
                              !post.moderator?.avatar_path && <UserOutlined />
                            }
                          />
                          <Text style={{ color: "white" }}>
                            Verified by {post.moderator.first_name}{" "}
                            {post.moderator.last_name}
                          </Text>
                        </Space>
                        <div>
                          <Tag
                            color={
                              post.moderator.role === "admin"
                                ? "red"
                                : post.moderator.role === "staff"
                                ? "blue"
                                : "green"
                            }
                          >
                            {post.moderator.role.toUpperCase()}
                          </Tag>
                        </div>
                        <Text
                          style={{
                            fontSize: "12px",
                            color: "rgba(255, 255, 255, 0.85)",
                            display: "block",
                            marginTop: "4px",
                          }}
                        >
                          {dayjs(post.moderator.moderated_at).format(
                            "MMM D, YYYY [at] h:mm A"
                          )}
                        </Text>
                      </div>
                    }
                    color="#52c41a"
                    placement="right"
                  >
                    <CheckCircleFilled
                      style={{
                        color: "#52c41a",
                        fontSize: "16px",
                        marginLeft: "4px",
                        cursor: "pointer",
                      }}
                    />
                  </Tooltip>
                )}
            </Space>

            <Text type="secondary" style={{ fontSize: 12, marginTop: 4 }}>
              {dayjs(post.created_at).format("MMM D, YYYY [at] h:mm A")}
              {post.updated_at !== post.created_at && !post.moderator && (
                <Text type="secondary" style={{ marginLeft: 8 }}>
                  (edited)
                </Text>
              )}
            </Text>
          </Space>
        </Space>

        {((permissions.canEdit && post.author._id === user?._id) ||
          user?.role === "admin" ||
          (["staff", "tutor"].includes(user?.role) &&
            post.author.role === "student")) && (
          <Dropdown
            menu={{
              items: [
                {
                  key: "edit",
                  icon: <EditOutlined />,
                  label: "Edit Post",
                  onClick: () => setEditingPost(post),
                  disabled: !(
                    permissions.canEdit && post.author._id === user?._id
                  ),
                },
                {
                  key: "delete",
                  icon: <DeleteOutlined />,
                  label: "Delete Post",
                  danger: true,
                  onClick: () =>
                    handleDeletePost(
                      post._id,
                      post.author._id,
                      post.author.role
                    ),
                },
              ],
            }}
          >
            <Button
              type="text"
              icon={<EllipsisOutlined />}
              className="post-action-button"
            />
          </Dropdown>
        )}
      </div>

      <div style={{ marginTop: 16 }}>
        {editingPost?._id === post._id ? (
          <Space direction="vertical" style={{ width: "100%" }}>
            <TextArea
              value={editingPost.content}
              onChange={(e) =>
                setEditingPost((prev) => ({
                  ...prev,
                  content: e.target.value,
                }))
              }
              autoSize={{ minRows: 3, maxRows: 6 }}
              style={{ borderRadius: 8 }}
            />
            <Space>
              <Button type="primary" onClick={() => handleUpdatePost(post._id)}>
                Save
              </Button>
              <Button onClick={() => setEditingPost(null)}>Cancel</Button>
            </Space>
          </Space>
        ) : (
          <>
            <Paragraph style={{ fontSize: 15, whiteSpace: "pre-wrap" }}>
              {post.content}
            </Paragraph>
            {post.attachments?.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <AttachmentPreview
                  attachments={post.attachments}
                  onPreview={handlePreviewAttachment}
                />
              </div>
            )}
          </>
        )}
      </div>

      <Divider style={{ margin: "16px 0" }} />
      <div
        style={{
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
        }}
      >
        <ReactionButtons post={post} />
        <Button
          type="text"
          icon={<CommentOutlined style={{ fontSize: "14px" }} />}
          onClick={() => {
            setSelectedPost(post);
            setCommentModalVisible(true);
          }}
        >
          {post.comments_count || 0} Comments
        </Button>
        <Button
          type="text"
          icon={<EyeOutlined style={{ fontSize: "14px" }} />}
          onClick={() => {
            handleViewPost(post._id);
            setViewModalVisible(true);
          }}
        >
          {post.view_count || 0} Views
        </Button>
      </div>
    </Card>
  );

  const RejectPostModal = ({ visible, onCancel, onReject }) => {
    const [reason, setReason] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
      if (!reason.trim()) {
        message.warning("Please provide a reason for rejection");
        return;
      }

      setSubmitting(true);
      try {
        await onReject(reason.trim());
        setReason("");
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <Modal
        title="Reject Post"
        open={visible}
        onCancel={onCancel}
        footer={[
          <Button key="cancel" onClick={onCancel}>
            Cancel
          </Button>,
          <Button
            key="reject"
            type="primary"
            danger
            loading={submitting}
            onClick={handleSubmit}
          >
            Reject
          </Button>,
        ]}
      >
        <TextArea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Please provide a reason for rejection..."
          rows={4}
          style={{ marginBottom: 16 }}
        />
      </Modal>
    );
  };

  const PendingPostsModal = ({ visible, onClose }) => {
    const [activeTab, setActiveTab] = useState("pending");
    const [rejectModalVisible, setRejectModalVisible] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);
    const [editingPost, setEditingPost] = useState(null);
    const { user } = useAuth();

    const handleReject = async (reason) => {
      if (selectedPost) {
        await handleModeratePost(selectedPost._id, false, reason);
        setRejectModalVisible(false);
        setSelectedPost(null);
      }
    };

    const handleResubmit = async (post) => {
      try {
        const formData = new FormData();
        formData.append("content", editingPost.content || "");

        const cleanAttachments = [];

        const newFiles =
          editingPost.attachments?.filter((att) => att.originFileObj) || [];
        newFiles.forEach((file) => {
          formData.append("attachments", file.originFileObj);
        });

        const oldFiles =
          editingPost.attachments?.filter((att) => !att.originFileObj) || [];
        cleanAttachments.push(
          ...oldFiles.map((file) => ({
            name: file.name || file.file_name || "",
            file_name: file.file_name || file.name || "",
            file_path: file.file_path || "",
            url: file.url || `${staticURL}/${file.file_path}` || "",
            type: file.type || "",
          }))
        );

        let newAttachments = [];
        if (newFiles.length > 0) {
          const response = await createPost(formData);
          if (response?.data?.attachments) {
            newAttachments = response.data.attachments;
          }
        }

        const updates = {
          content: editingPost.content || "",
          attachments: [...cleanAttachments, ...newAttachments],
          updated_at: Date.now(),
          status: "pending",
          is_approved: false,
          rejection_reason: null,
        };

        await firebaseBlogService.updatePost(post._id, updates);
        message.success("Post resubmitted successfully");
        setEditingPost(null);
      } catch (error) {
        console.error("Resubmit error:", error);
        message.error("Failed to resubmit post");
      }
    };

    const items = [
      {
        key: "pending",
        label: "Pending Approval",
        children: (
          <List
            dataSource={
              ["admin", "staff", "tutor"].includes(user?.role)
                ? pendingPosts.filter((post) => post.status !== "rejected")
                : pendingPosts.filter(
                    (post) =>
                      post.author._id === user?._id &&
                      post.status !== "rejected"
                  )
            }
            renderItem={(post) => (
              <List.Item
                actions={
                  ["admin", "staff", "tutor"].includes(user?.role)
                    ? [
                        <Button
                          type="primary"
                          onClick={() => handleModeratePost(post._id, true)}
                        >
                          Approve
                        </Button>,
                        <Button
                          danger
                          onClick={() => {
                            setSelectedPost(post);
                            setRejectModalVisible(true);
                          }}
                        >
                          Reject
                        </Button>,
                      ]
                    : [
                        <Button
                          type="link"
                          danger
                          onClick={() =>
                            handleDeletePost(
                              post._id,
                              post.author._id,
                              post.author.role
                            )
                          }
                        >
                          Delete
                        </Button>,
                      ]
                }
              >
                <List.Item.Meta
                  avatar={
                    <Avatar
                      size={48}
                      src={
                        post.author?.avatar_path
                          ? `${staticURL}/${post.author.avatar_path}`
                          : null
                      }
                      icon={!post.author?.avatar_path && <UserOutlined />}
                    />
                  }
                  title={
                    <Space>
                      <Text strong>
                        {post.author?.first_name} {post.author?.last_name}
                      </Text>
                      <Tag
                        color={
                          post.author?.role === "admin"
                            ? "red"
                            : post.author?.role === "staff"
                            ? "blue"
                            : post.author?.role === "tutor"
                            ? "green"
                            : "default"
                        }
                      >
                        {post.author?.role?.toUpperCase()}
                      </Tag>
                    </Space>
                  }
                  description={
                    <>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {dayjs(post.created_at).format(
                          "MMM D, YYYY [at] h:mm A"
                        )}
                      </Text>
                      <div style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>
                        {post.content}
                      </div>
                      {post.attachments?.length > 0 && (
                        <AttachmentPreview
                          attachments={post.attachments}
                          onPreview={(media) => {
                            setPreviewMedia(media);
                            setPreviewVisible(true);
                          }}
                        />
                      )}
                    </>
                  }
                />
              </List.Item>
            )}
          />
        ),
      },
      {
        key: "rejected",
        label: "Rejected",
        children: (
          <List
            dataSource={
              ["admin", "staff", "tutor"].includes(user?.role)
                ? pendingPosts.filter((post) => post.status === "rejected")
                : pendingPosts.filter(
                    (post) =>
                      post.author._id === user?._id &&
                      post.status === "rejected"
                  )
            }
            renderItem={(post) => (
              <List.Item>
                <List.Item.Meta
                  avatar={
                    <Avatar
                      size={48}
                      src={
                        post.author?.avatar_path
                          ? `${staticURL}/${post.author.avatar_path}`
                          : null
                      }
                      icon={!post.author?.avatar_path && <UserOutlined />}
                    />
                  }
                  title={
                    <Space>
                      <Text strong>
                        {post.author?.first_name} {post.author?.last_name}
                      </Text>
                      <Tag color="red">Rejected</Tag>
                    </Space>
                  }
                  description={
                    <div>
                      <Space>
                        <Avatar
                          size="small"
                          src={
                            post.moderator?.avatar_path
                              ? `${staticURL}/${post.moderator.avatar_path}`
                              : null
                          }
                          icon={
                            !post.moderator?.avatar_path && <UserOutlined />
                          }
                        />
                        <Text type="secondary">
                          Rejected by {post.moderator?.first_name}{" "}
                          {post.moderator?.last_name} ({post.moderator?.role})
                        </Text>
                      </Space>
                      <Alert
                        message="Rejection Reason"
                        description={post.rejection_reason}
                        type="error"
                        style={{ marginTop: 8, marginBottom: 8 }}
                      />
                      {editingPost?._id === post._id ? (
                        <Space direction="vertical" style={{ width: "100%" }}>
                          <TextArea
                            value={editingPost.content}
                            onChange={(e) =>
                              setEditingPost({
                                ...editingPost,
                                content: e.target.value,
                              })
                            }
                            rows={4}
                          />
                          <Upload
                            beforeUpload={validateFile}
                            fileList={editingPost.attachments || []}
                            onChange={({ fileList }) =>
                              setEditingPost({
                                ...editingPost,
                                attachments: fileList,
                              })
                            }
                            multiple
                            maxCount={5}
                          >
                            <Button icon={<UploadOutlined />}>
                              Update Attachments
                            </Button>
                          </Upload>
                          <Space>
                            <Button
                              type="primary"
                              onClick={() => handleResubmit(post)}
                            >
                              Resubmit
                            </Button>
                            <Button onClick={() => setEditingPost(null)}>
                              Cancel
                            </Button>
                          </Space>
                        </Space>
                      ) : (
                        <>
                          <div style={{ whiteSpace: "pre-wrap" }}>
                            {post.content}
                          </div>
                          {post.attachments?.length > 0 && (
                            <AttachmentPreview
                              attachments={post.attachments}
                              onPreview={(media) => {
                                setPreviewMedia(media);
                                setPreviewVisible(true);
                              }}
                            />
                          )}
                          {post.author._id === user?._id && (
                            <Button
                              type="primary"
                              onClick={() => setEditingPost(post)}
                              style={{ marginTop: 8 }}
                            >
                              Edit & Resubmit
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        ),
      },
    ];

    return (
      <>
        <Modal
          open={visible}
          title={
            <Space>
              <ClockCircleOutlined style={{ color: "#ffc107" }} />
              <span>Posts Management</span>
            </Space>
          }
          footer={null}
          onCancel={onClose}
          width={800}
        >
          <Tabs activeKey={activeTab} onChange={setActiveTab} items={items} />
        </Modal>

        <RejectPostModal
          visible={rejectModalVisible}
          onCancel={() => {
            setRejectModalVisible(false);
            setSelectedPost(null);
          }}
          onReject={handleReject}
        />
      </>
    );
  };

  return (
    <App>
      <div className="post-container">
        {permissions.canCreate && (
          <div style={{ display: "flex", gap: "24px", marginBottom: 24 }}>
            <div style={{ flex: "0 0 80%" }}> {renderCreatePost()}</div>

            <div style={{ flex: "0 0 20%" }}>
              {" "}
              {user && (
                <Button
                  type="primary"
                  icon={<ClockCircleOutlined />}
                  onClick={() => setIsPendingModalVisible(true)}
                  style={{
                    width: "80%",
                    backgroundColor: "#ffc107",
                    borderColor: "#ffc107",
                  }}
                >
                  {["admin", "staff", "tutor"].includes(user.role)
                    ? "Posts Awaiting"
                    : "Pending Posts"}{" "}
                  ({pendingPosts.length})
                </Button>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <Spin
              indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}
            />
          </div>
        ) : posts.length > 0 ? (
          <div className="posts-grid">{posts.map(renderPost)}</div>
        ) : (
          <Empty
            description="No posts yet"
            style={{
              background: "#fff",
              padding: 24,
              borderRadius: 8,
              marginTop: 24,
            }}
          />
        )}

        <PendingPostsModal
          visible={isPendingModalVisible}
          onClose={() => setIsPendingModalVisible(false)}
          pendingPosts={pendingPosts}
          handleModeratePost={handleModeratePost}
          handleDeletePost={handleDeletePost}
          setPreviewMedia={setPreviewMedia}
          setPreviewVisible={setPreviewVisible}
        />

        {selectedPost && (
          <CommentModal
            post={selectedPost}
            visible={commentModalVisible}
            onClose={() => {
              setCommentModalVisible(false);
              setSelectedPost(null);
            }}
            onCommentSubmit={(content) => handleModalCommentSubmit(content)}
          />
        )}

        <Modal
          open={previewVisible}
          title={previewMedia?.name || previewMedia?.file_name}
          footer={null}
          onCancel={() => setPreviewVisible(false)}
          width={800}
          centered
          destroyOnClose
        >
          {previewMedia && <PreviewContent media={previewMedia} />}
        </Modal>

        <Modal
          open={viewModalVisible}
          title={`Viewers (${viewersList.length})`}
          footer={null}
          onCancel={() => setViewModalVisible(false)}
          width={600}
        >
          <List
            dataSource={viewersList}
            renderItem={(viewer) => (
              <List.Item>
                <List.Item.Meta
                  avatar={
                    <Avatar
                      src={
                        viewer.avatar_path
                          ? `${staticURL}/${viewer.avatar_path}`
                          : null
                      }
                      icon={!viewer.avatar_path && <UserOutlined />}
                    />
                  }
                  title={
                    <Space>
                      <Text
                        strong
                      >{`${viewer.first_name} ${viewer.last_name}`}</Text>
                      <Tag
                        color={
                          viewer.role === "admin"
                            ? "red"
                            : viewer.role === "staff"
                            ? "blue"
                            : viewer.role === "tutor"
                            ? "green"
                            : "default"
                        }
                      >
                        {viewer.role.toUpperCase()}
                      </Tag>
                    </Space>
                  }
                  description={
                    <Text type="secondary">
                      Viewed {dayjs(viewer.viewed_at).fromNow()}
                    </Text>
                  }
                />
              </List.Item>
            )}
            locale={{
              emptyText: <Empty description="No viewers yet" />,
            }}
          />
        </Modal>
      </div>
    </App>
  );
};

export default Post;
