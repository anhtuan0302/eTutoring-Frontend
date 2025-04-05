import React, { useState, useEffect, useRef } from "react";
import {
  Input,
  Button,
  List,
  Avatar,
  Typography,
  Card,
  Space,
  message as antMessage,
  Empty,
  Badge,
  Tooltip,
  Spin,
  Dropdown,
  AutoComplete,
  Upload,
  Modal,
  Image,
} from "antd";
import {
  SendOutlined,
  UserOutlined,
  EllipsisOutlined,
  PaperClipOutlined,
  SmileOutlined,
  LoadingOutlined,
  EyeOutlined,
  PlayCircleOutlined,
  DownloadOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { sendMessage, getMessages } from "../../../api/communication/message";
import {
  createConversation,
  getConversations,
  deleteConversation,
} from "../../../api/communication/chatConversation";
import firebaseChatService from "../../../api/firebaseChat";
import { staticURL } from "../../../api/config";
import { getAllUsers } from "../../../api/auth/user";
import { useAuth } from "../../../AuthContext";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";

dayjs.extend(relativeTime);
dayjs.locale("vi");

const { Text, Title } = Typography;
const { TextArea } = Input;

const Message = () => {
  const { user, accessToken } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [messageContent, setMessageContent] = useState("");
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState(new Map());
  const [searchText, setSearchText] = useState("");
  const [allUsers, setAllUsers] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [unreadConversations, setUnreadConversations] = useState(new Set());
  const [usersPresence, setUsersPresence] = useState({});
  const messagesEndRef = useRef(null);
  const messageContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const unsubscribeRefs = useRef({});
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewMedia, setPreviewMedia] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);

  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Đợi cho đến khi có accessToken
        if (!accessToken) return;

        const response = await getAllUsers();
        const otherUsers = response.users.filter((u) => u._id !== user._id);
        setAllUsers(otherUsers);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchUsers();
  }, [user?._id, accessToken]);

  // Firebase subscriptions
  useEffect(() => {
    if (!user?._id) return;

    const setupPresence = async () => {
      try {
        // Đợi một chút để đảm bảo Firebase đã được xác thực
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const presenceData = {
          email: user.email || "",
          username: user.username || "",
          first_name: user.first_name || "",
          last_name: user.last_name || "",
          ...(user.avatar_path && { avatar_path: user.avatar_path }),
        };

        await firebaseChatService.updateUserPresence(user._id, presenceData);
      } catch (error) {
        console.error("Error setting up presence:", error);
      }
    };

    setupPresence();

    return () => {
      Object.values(unsubscribeRefs.current).forEach((unsubscribe) => {
        if (typeof unsubscribe === "function") {
          unsubscribe();
        }
      });
    };
  }, [user?._id]);

  // Subscribe to all conversations
  useEffect(() => {
    if (!user?._id) return;

    console.log(
      "Setting up Firebase conversation subscription for user:",
      user._id
    );

    const unsubscribe = firebaseChatService.subscribeToAllConversations(
      user._id,
      (conversationsData) => {
        console.log("Received conversations from Firebase:", conversationsData);

        if (Array.isArray(conversationsData)) {
          // Lọc ra các conversation có đầy đủ thông tin
          const validConversations = conversationsData.filter(
            (conv) => conv && conv.user1_id && conv.user2_id
          );

          // Sắp xếp theo thời gian cập nhật mới nhất
          validConversations.sort(
            (a, b) => (b.updated_at || 0) - (a.updated_at || 0)
          );

          console.log("Setting conversations:", validConversations);
          setConversations(validConversations);
        }
      }
    );

    return () => {
      console.log("Cleaning up Firebase conversation subscription");
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, [user?._id]);

  // Subscribe to current conversation messages
  useEffect(() => {
    if (!currentConversation?._id) return;

    const unsubscribeMessages = firebaseChatService.subscribeToMessages(
      currentConversation._id,
      (newMessages) => {
        if (newMessages) {
          // Convert object to array if needed
          const messagesArray = Array.isArray(newMessages)
            ? newMessages
            : Object.values(newMessages);

          // Sort and filter out undefined/null messages
          const validMessages = messagesArray
            .filter((msg) => msg && msg.created_at)
            .sort((a, b) => a.created_at - b.created_at);

          setMessages(validMessages);

          const hasUnreadMessages = validMessages.some(
            (msg) => !msg.is_read && msg.sender_id !== user._id
          );

          if (hasUnreadMessages) {
            firebaseChatService.markMessagesAsRead(
              currentConversation._id,
              user._id
            );
          }
          setTimeout(scrollToBottom, 100);
        }
      }
    );

    const unsubscribeTyping = firebaseChatService.subscribeToTyping(
      currentConversation._id,
      (typingData) => {
        if (typingData) {
          handleTypingStatus(typingData);
        }
      }
    );

    const unsubscribeConversation = firebaseChatService.subscribeToConversation(
      currentConversation._id,
      (conversationData) => {
        if (conversationData) {
          setConversations((prev) =>
            prev.map((conv) =>
              conv._id === currentConversation._id
                ? { ...conv, ...conversationData }
                : conv
            )
          );
        }
      }
    );

    unsubscribeRefs.current = {
      messages: unsubscribeMessages,
      typing: unsubscribeTyping,
      conversation: unsubscribeConversation,
    };

    return () => {
      unsubscribeMessages();
      unsubscribeTyping();
      unsubscribeConversation();
    };
  }, [currentConversation?._id, user._id]);

  // Subscribe to all users' presence
  useEffect(() => {
    if (!user?._id) return;

    console.log("Setting up presence subscription");

    const unsubscribePresence = firebaseChatService.subscribeToAllUsersPresence(
      (presenceData) => {
        console.log("Received presence data:", presenceData);

        if (presenceData) {
          // Cập nhật trạng thái online và presence data
          const onlineUserIds = new Set();

          // Lưu toàn bộ presence data
          setUsersPresence(presenceData);

          Object.entries(presenceData).forEach(([userId, data]) => {
            if (data.status === "online") {
              onlineUserIds.add(userId);
            }
          });

          setOnlineUsers(onlineUserIds);
        }
      }
    );

    return () => {
      console.log("Cleaning up presence subscription");
      if (typeof unsubscribePresence === "function") {
        unsubscribePresence();
      }
    };
  }, [user?._id]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSendMessage = async () => {
    if (!messageContent.trim() || !currentConversation) return;

    const timestamp = Date.now();
    const currentContent = messageContent.trim();

    try {
      setSending(true);
      setMessageContent("");

      const messageData = {
        _id: `msg_${timestamp}`,
        conversation_id: currentConversation._id,
        sender_id: user._id,
        content: currentContent,
        is_read: false,
        is_edited: false,
        is_deleted: false,
        created_at: timestamp,
        sender: {
          _id: user._id,
          username: user.username || "",
          email: user.email || "",
          first_name: user.first_name || "",
          last_name: user.last_name || "",
          avatar_path: user.avatar_path || null,
        },
      };

      // Gửi message
      await firebaseChatService.sendMessage(
        currentConversation._id,
        messageData
      );

      // Cập nhật conversation
      const conversationUpdate = {
        ...currentConversation,
        last_message: currentContent,
        last_message_at: timestamp,
        updated_at: timestamp,
      };

      await firebaseChatService.updateConversation(
        currentConversation._id,
        conversationUpdate
      );
    } catch (error) {
      console.error("Error sending message:", error);
      antMessage.error("Không thể gửi tin nhắn");
      setMessageContent(currentContent);
    } finally {
      setSending(false);
    }
  };

  const handleTyping = () => {
    if (!currentConversation) return;

    const typingData = {
      conversation_id: currentConversation._id,
      userId: user._id,
      isTyping: true,
    };

    firebaseChatService.updateTypingStatus(currentConversation._id, typingData);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      firebaseChatService.updateTypingStatus(currentConversation._id, {
        ...typingData,
        isTyping: false,
      });
    }, 2000);
  };

  const handleSearch = (value) => {
    setSearchText(value);
    if (!value) {
      setSearchResults([]);
      return;
    }

    const searchValue = value.toLowerCase();
    const results = allUsers.filter(
      (user) =>
        user.username.toLowerCase().includes(searchValue) ||
        user.email.toLowerCase().includes(searchValue) ||
        (user.phone_number && user.phone_number.includes(searchValue))
    );
    setSearchResults(results);
  };

  const handleStartConversation = async (selectedUser) => {
    try {
      setLoading(true);
      const response = await createConversation({ user2_id: selectedUser._id });
      console.log("Created conversation:", response);

      // Format conversation data
      const conversationData = {
        _id: response._id,
        user1_id: {
          _id: user._id,
          first_name: user.first_name || "",
          last_name: user.last_name || "",
          avatar_path: user.avatar_path || null,
          email: user.email || "",
        },
        user2_id: {
          _id: selectedUser._id,
          first_name: selectedUser.first_name || "",
          last_name: selectedUser.last_name || "",
          avatar_path: selectedUser.avatar_path || null,
          email: selectedUser.email || "",
        },
        created_at: Date.now(),
        updated_at: Date.now(),
        last_message: "",
        last_message_at: null,
      };

      // Lưu vào Firebase
      await firebaseChatService.updateConversation(
        response._id,
        conversationData
      );

      // Cập nhật state
      setConversations((prev) => [conversationData, ...prev]);
      setCurrentConversation(conversationData);
      setSearchText("");
      setSearchResults([]);
    } catch (error) {
      console.error("Error creating conversation:", error);
      antMessage.error("Không thể tạo cuộc trò chuyện mới");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConversation = async () => {
    if (!currentConversation) return;

    try {
      await deleteConversation(currentConversation._id);
      setConversations((prev) =>
        prev.filter((conv) => conv._id !== currentConversation._id)
      );
      setCurrentConversation(null);
      setMessages([]);
      antMessage.success("Đã xóa cuộc trò chuyện");
    } catch (error) {
      antMessage.error("Không thể xóa cuộc trò chuyện");
    }
  };

  const isUserTyping = (userId, conversationId) => {
    return typingUsers.get(userId) === conversationId;
  };

  const renderLastActive = (userId) => {
    const isOnline = onlineUsers.has(userId);
    if (isOnline) {
      return "Đang hoạt động";
    }

    // Lấy thông tin presence từ state
    const userPresence = usersPresence[userId];
    if (userPresence?.lastActive) {
      const lastActiveTime =
        typeof userPresence.lastActive === "number"
          ? userPresence.lastActive
          : userPresence.lastActive?.seconds * 1000;

      if (lastActiveTime) {
        return `Hoạt động ${dayjs(lastActiveTime).fromNow()}`;
      }
    }

    return "Không hoạt động";
  };

  const renderTypingIndicator = (conversation) => {
    const otherUserId =
      conversation.user1_id._id === user._id
        ? conversation.user2_id._id
        : conversation.user1_id._id;

    if (isUserTyping(otherUserId, conversation._id)) {
      return (
        <Text type="secondary" italic style={{ fontSize: "12px" }}>
          Đang nhập...
        </Text>
      );
    }
    return null;
  };

  const handleTypingStatus = ({ conversation_id, userId, isTyping }) => {
    setTypingUsers((prev) => {
      const newMap = new Map(prev);
      if (isTyping) {
        newMap.set(userId, conversation_id);
      } else {
        newMap.delete(userId);
      }
      return newMap;
    });
  };

  const fetchMessages = async (conversationId) => {
    try {
      setLoading(true);
      const response = await getMessages(conversationId);

      // Format lại dữ liệu tin nhắn với đầy đủ thông tin
      const formattedMessages = response.map((msg) => {
        const senderInfo =
          msg.sender_id._id === currentConversation.user1_id._id
            ? currentConversation.user1_id
            : currentConversation.user2_id;

        return {
          ...msg,
          sender_id: {
            ...msg.sender_id,
            avatar_path: senderInfo.avatar_path,
          },
          sender: {
            _id: senderInfo._id,
            first_name: senderInfo.first_name,
            last_name: senderInfo.last_name,
            avatar_path: senderInfo.avatar_path,
          },
        };
      });

      setMessages(formattedMessages);
      scrollToBottom();
      await firebaseChatService.markMessagesAsRead(conversationId, user._id);
    } catch (error) {
      console.error("Error fetching messages:", error);
      antMessage.error("Không thể tải tin nhắn");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConversation = async (conversation) => {
    try {
      // Hủy các subscription cũ
      Object.values(unsubscribeRefs.current).forEach((unsubscribe) => {
        if (typeof unsubscribe === "function") {
          unsubscribe();
        }
      });

      setCurrentConversation(conversation);

      // Đánh dấu đã đọc
      await firebaseChatService.markMessagesAsRead(conversation._id, user._id);

      // Subscribe to messages
      const unsubscribeMessages = firebaseChatService.subscribeToMessages(
        conversation._id,
        (newMessages) => {
          setMessages(newMessages.sort((a, b) => a.created_at - b.created_at));
          setTimeout(scrollToBottom, 100);
        }
      );

      // Subscribe to typing status
      const unsubscribeTyping = firebaseChatService.subscribeToTyping(
        conversation._id,
        (typingData) => {
          if (typingData) {
            handleTypingStatus(typingData);
          }
        }
      );

      // Subscribe to conversation changes
      const unsubscribeConversation =
        firebaseChatService.subscribeToConversation(
          conversation._id,
          (conversationData) => {
            if (conversationData) {
              setConversations((prev) =>
                prev.map((conv) =>
                  conv._id === conversation._id
                    ? { ...conv, ...conversationData }
                    : conv
                )
              );
            }
          }
        );

      unsubscribeRefs.current = {
        messages: unsubscribeMessages,
        typing: unsubscribeTyping,
        conversation: unsubscribeConversation,
      };
    } catch (error) {
      console.error("Error selecting conversation:", error);
      antMessage.error("Không thể tải cuộc trò chuyện");
    }
  };

  const handleUpload = async (file) => {
    try {
      // Kiểm tra kích thước file (ví dụ: giới hạn 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        antMessage.error("File không được vượt quá 10MB");
        return;
      }

      // Tạo preview cho file
      const fileType = getFileType(file.name);
      const preview = {
        file,
        file_name: file.name,
        file_type: fileType,
        file_size: file.size,
        previewUrl: fileType === "image" ? URL.createObjectURL(file) : null,
      };

      setAttachmentPreview(preview);
    } catch (error) {
      console.error("Error handling file:", error);
      antMessage.error("Không thể xử lý file");
    }
  };

  const handleSendMessageWithAttachment = async () => {
    if (!attachmentPreview || !currentConversation) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", attachmentPreview.file);

      // Gọi API upload file
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      const timestamp = Date.now();

      // Tạo message data với file đính kèm
      const messageData = {
        _id: `msg_${timestamp}`,
        conversation_id: currentConversation._id,
        sender_id: user._id,
        content: attachmentPreview.file_name,
        attachment: {
          url: data.url,
          file_path: data.file_path,
          file_name: attachmentPreview.file_name,
          file_type: attachmentPreview.file_type,
          file_size: attachmentPreview.file_size,
        },
        is_read: false,
        is_edited: false,
        is_deleted: false,
        created_at: timestamp,
        sender: {
          _id: user._id,
          username: user.username || "",
          email: user.email || "",
          first_name: user.first_name || "",
          last_name: user.last_name || "",
          avatar_path: user.avatar_path || null,
        },
      };

      await firebaseChatService.sendMessage(
        currentConversation._id,
        messageData
      );

      // Cập nhật conversation
      const conversationUpdate = {
        ...currentConversation,
        last_message: `Đã gửi ${
          attachmentPreview.file_type === "image" ? "hình ảnh" : "tệp đính kèm"
        }`,
        last_message_at: timestamp,
        updated_at: timestamp,
      };

      await firebaseChatService.updateConversation(
        currentConversation._id,
        conversationUpdate
      );

      // Reset preview
      setAttachmentPreview(null);
      antMessage.success("Gửi file thành công");
    } catch (error) {
      console.error("Error sending file:", error);
      antMessage.error("Không thể gửi file");
    } finally {
      setUploading(false);
    }
  };

  const handleEditMessage = async (messageId, newContent) => {
    try {
      if (!currentConversation || !messageId || !newContent.trim()) return;

      await firebaseChatService.updateMessage(
        currentConversation._id,
        messageId,
        {
          content: newContent.trim(),
        }
      );

      antMessage.success("Đã cập nhật tin nhắn");
    } catch (error) {
      console.error("Error editing message:", error);
      antMessage.error("Không thể cập nhật tin nhắn");
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      if (!currentConversation || !messageId) return;

      await firebaseChatService.deleteMessage(
        currentConversation._id,
        messageId
      );
      antMessage.success("Đã thu hồi tin nhắn");
    } catch (error) {
      console.error("Error deleting message:", error);
      antMessage.error("Không thể thu hồi tin nhắn");
    }
  };

  const getFileType = (fileName) => {
    const extension = fileName.split(".").pop().toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension))
      return "image";
    if (["mp4", "webm", "ogg"].includes(extension)) return "video";
    if (["mp3", "wav"].includes(extension)) return "audio";
    if (["pdf", "doc", "docx", "xls", "xlsx", "txt"].includes(extension))
      return "document";
    return "other";
  };

  // Hàm format dung lượng file
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Hàm xử lý preview
  const handlePreview = (attachment) => {
    setPreviewMedia(attachment);
    setPreviewVisible(true);
  };

  // Component render preview content
  const PreviewContent = ({ media }) => {
    const fileType = getFileType(media.file_name);
    const fileUrl = `${staticURL}/${media.file_path}`;

    switch (fileType) {
      case "image":
        return <Image src={fileUrl} style={{ maxWidth: "100%" }} />;
      case "video":
        return (
          <video controls style={{ maxWidth: "100%" }}>
            <source
              src={fileUrl}
              type={`video/${media.file_name.split(".").pop()}`}
            />
            Your browser does not support the video tag.
          </video>
        );
      case "audio":
        return (
          <audio controls style={{ width: "100%" }}>
            <source
              src={fileUrl}
              type={`audio/${media.file_name.split(".").pop()}`}
            />
            Your browser does not support the audio tag.
          </audio>
        );
      default:
        return null;
    }
  };

  return (
    <Card bodyStyle={{ padding: 0, height: "calc(100vh - 250px)" }}>
      <div style={{ display: "flex", height: "100%" }}>
        {/* Conversation List */}
        <div
          style={{
            width: 300,
            borderRight: "1px solid #f0f0f0",
            height: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: "16px",
              borderBottom: "1px solid #f0f0f0",
              background: "#fafafa",
            }}
          >
            <Title level={5} style={{ margin: "0 0 16px 0" }}>
              Tin nhắn
            </Title>
            <AutoComplete
              style={{ width: "100%" }}
              value={searchText}
              onChange={handleSearch}
              placeholder="Tìm kiếm người dùng..."
              allowClear
            >
              {searchResults.map((item) => (
                <AutoComplete.Option key={item._id} value={item.username}>
                  <div onClick={() => handleStartConversation(item)}>
                    <Avatar
                      size="small"
                      src={
                        item.avatar_path
                          ? `${staticURL}/${item.avatar_path}`
                          : null
                      }
                      icon={!item.avatar_path && <UserOutlined />}
                      style={{ marginRight: 8 }}
                    />
                    <span>{`${item.first_name} ${item.last_name}`}</span>
                    <span style={{ color: "#999", marginLeft: 8 }}>
                      ({item.email})
                    </span>
                  </div>
                </AutoComplete.Option>
              ))}
            </AutoComplete>
          </div>

          <div style={{ flex: 1, overflowY: "auto" }}>
            <Spin spinning={loading}>
              <List
                dataSource={conversations}
                locale={{ emptyText: "Không có cuộc trò chuyện nào" }}
                renderItem={(conversation) => {
                  if (
                    !conversation ||
                    !conversation.user1_id ||
                    !conversation.user2_id
                  ) {
                    console.warn("Invalid conversation data:", conversation);
                    return null;
                  }

                  const otherUser =
                    conversation.user1_id._id === user._id
                      ? conversation.user2_id
                      : conversation.user1_id;

                  if (!otherUser) {
                    console.warn("Cannot determine other user:", conversation);
                    return null;
                  }

                  return (
                    <List.Item
                      onClick={() => handleSelectConversation(conversation)}
                      style={{
                        padding: "12px 16px",
                        cursor: "pointer",
                        background:
                          currentConversation?._id === conversation._id
                            ? "#e6f7ff"
                            : unreadConversations.has(conversation._id)
                            ? "#f0f0f0" // Màu nền cho conversation có tin nhắn mới
                            : "transparent",
                      }}
                    >
                      <List.Item.Meta
                        avatar={
                          <Badge
                            count={
                              unreadConversations.has(conversation._id)
                                ? "!"
                                : 0
                            }
                            dot={onlineUsers.has(otherUser._id)}
                            status={
                              onlineUsers.has(otherUser._id)
                                ? "success"
                                : "default"
                            }
                            offset={[-5, 32]}
                          >
                            <Avatar
                              size={40}
                              src={
                                otherUser.avatar_path
                                  ? `${staticURL}/${otherUser.avatar_path}`
                                  : null
                              }
                              icon={!otherUser.avatar_path && <UserOutlined />}
                            />
                          </Badge>
                        }
                        title={
                          <Space
                            style={{
                              width: "100%",
                              justifyContent: "space-between",
                            }}
                          >
                            <Text
                              strong
                              style={{
                                color: unreadConversations.has(conversation._id)
                                  ? "#1890ff"
                                  : "inherit",
                              }}
                            >
                              {`${otherUser.first_name} ${otherUser.last_name}`}
                            </Text>
                            {conversation.last_message_at && (
                              <Text
                                type="secondary"
                                style={{
                                  fontSize: "12px",
                                  fontWeight: unreadConversations.has(
                                    conversation._id
                                  )
                                    ? "bold"
                                    : "normal",
                                }}
                              >
                                {dayjs(conversation.last_message_at).fromNow()}
                              </Text>
                            )}
                          </Space>
                        }
                        description={
                          <Space
                            direction="vertical"
                            size={0}
                            style={{ width: "100%" }}
                          >
                            {renderTypingIndicator(conversation) || (
                              <Text
                                type="secondary"
                                ellipsis
                                style={{
                                  width: 200,
                                  fontWeight: unreadConversations.has(
                                    conversation._id
                                  )
                                    ? "bold"
                                    : "normal",
                                }}
                              >
                                {conversation.last_message ||
                                  "Chưa có tin nhắn"}
                              </Text>
                            )}
                            <Text type="secondary" style={{ fontSize: "12px" }}>
                              {renderLastActive(otherUser._id)}
                            </Text>
                          </Space>
                        }
                      />
                    </List.Item>
                  );
                }}
              />
            </Spin>
          </div>
        </div>

        {/* Chat Area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {currentConversation ? (
            <>
              {/* Chat Header */}
              <div
                style={{
                  padding: "16px",
                  borderBottom: "1px solid #f0f0f0",
                  background: "#fafafa",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Space>
                  <Badge
                    dot
                    status={
                      onlineUsers.has(
                        currentConversation.user1_id._id === user._id
                          ? currentConversation.user2_id._id
                          : currentConversation.user1_id._id
                      )
                        ? "success"
                        : "default"
                    }
                  >
                    <Avatar
                      size={40}
                      src={
                        currentConversation.user1_id._id === user._id
                          ? currentConversation.user2_id.avatar_path &&
                            `${staticURL}/${currentConversation.user2_id.avatar_path}`
                          : currentConversation.user1_id.avatar_path &&
                            `${staticURL}/${currentConversation.user1_id.avatar_path}`
                      }
                      icon={<UserOutlined />}
                    />
                  </Badge>
                  <div>
                    <Text strong>
                      {currentConversation.user1_id._id === user._id
                        ? `${currentConversation.user2_id.first_name} ${currentConversation.user2_id.last_name}`
                        : `${currentConversation.user1_id.first_name} ${currentConversation.user1_id.last_name}`}
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: "12px" }}>
                      {renderLastActive(
                        currentConversation.user1_id._id === user._id
                          ? currentConversation.user2_id._id
                          : currentConversation.user1_id._id
                      )}
                    </Text>
                  </div>
                </Space>
                <Dropdown
                  menu={{
                    items: [
                      {
                        key: "1",
                        label: "Xem thông tin",
                      },
                      {
                        key: "2",
                        label: "Tìm kiếm tin nhắn",
                      },
                      {
                        key: "3",
                        label: "Xóa cuộc trò chuyện",
                        danger: true,
                        onClick: handleDeleteConversation,
                      },
                    ],
                  }}
                  trigger={["click"]}
                >
                  <Button type="text" icon={<EllipsisOutlined />} />
                </Dropdown>
              </div>

              {/* Messages */}
              <div
                ref={messageContainerRef}
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "16px",
                  background: "#f5f5f5",
                }}
              >
                {loading ? (
                  <div style={{ textAlign: "center", marginTop: "20px" }}>
                    <Spin
                      indicator={<LoadingOutlined style={{ fontSize: 24 }} />}
                    />
                  </div>
                ) : (
                  <>
                    {messages.map((msg) => {
                      if (!msg) return null;

                      const messageKey =
                        msg.firebaseKey ||
                        msg._id ||
                        `${msg.sender_id}-${msg.created_at}`;
                      const isOwnMessage = msg.sender_id === user._id;

                      if (msg.is_deleted) {
                        return (
                          <div
                            key={messageKey}
                            style={{
                              textAlign: "center",
                              margin: "8px 0",
                              color: "#999",
                            }}
                          >
                            <Text italic>Tin nhắn đã được thu hồi</Text>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={messageKey}
                          style={{
                            marginBottom: "16px",
                            display: "flex",
                            justifyContent: isOwnMessage
                              ? "flex-end"
                              : "flex-start",
                          }}
                        >
                          {!isOwnMessage && (
                            <Avatar
                              size={32}
                              style={{ marginRight: 8, marginTop: 4 }}
                              src={
                                msg.sender?.avatar_path
                                  ? `${staticURL}/${msg.sender.avatar_path}`
                                  : null
                              }
                              icon={
                                !msg.sender?.avatar_path && <UserOutlined />
                              }
                            />
                          )}
                          <Dropdown
                            menu={{
                              items: isOwnMessage
                                ? [
                                    {
                                      key: "1",
                                      label: "Chỉnh sửa",
                                      onClick: () => {
                                        const newContent = prompt(
                                          "Nhập nội dung mới:",
                                          msg.content
                                        );
                                        if (
                                          newContent &&
                                          newContent !== msg.content
                                        ) {
                                          handleEditMessage(
                                            msg.firebaseKey || msg._id,
                                            newContent
                                          );
                                        }
                                      },
                                    },
                                    {
                                      key: "2",
                                      label: "Thu hồi",
                                      danger: true,
                                      onClick: () =>
                                        handleDeleteMessage(
                                          msg.firebaseKey || msg._id
                                        ),
                                    },
                                  ]
                                : [],
                            }}
                            trigger={["contextMenu"]}
                          >
                            <div
                              style={{
                                maxWidth: "70%",
                                padding: "8px 12px",
                                borderRadius: "16px",
                                background: isOwnMessage ? "#1890ff" : "#fff",
                                color: isOwnMessage ? "#fff" : "inherit",
                                boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
                              }}
                            >
                              {msg.attachment ? (
                                <div style={{ marginBottom: 4 }}>
                                  {(() => {
                                    const fileType = getFileType(
                                      msg.attachment.file_name
                                    );
                                    const isPreviewable = [
                                      "image",
                                      "video",
                                      "audio",
                                    ].includes(fileType);
                                    const fileUrl = `${staticURL}/${msg.attachment.file_path}`;

                                    return (
                                      <Space direction="vertical" size={4}>
                                        {fileType === "image" && (
                                          <Image
                                            src={fileUrl}
                                            width={200}
                                            style={{ cursor: "pointer" }}
                                            preview={false}
                                            onClick={() =>
                                              handlePreview(msg.attachment)
                                            }
                                          />
                                        )}
                                        <Space>
                                          <PaperClipOutlined />
                                          <Text
                                            style={{
                                              color: isOwnMessage
                                                ? "#fff"
                                                : "inherit",
                                            }}
                                          >
                                            {msg.attachment.file_name}
                                          </Text>
                                          <Text
                                            type={
                                              isOwnMessage
                                                ? "white"
                                                : "secondary"
                                            }
                                            style={{ fontSize: "12px" }}
                                          >
                                            (
                                            {formatFileSize(
                                              msg.attachment.file_size
                                            )}
                                            )
                                          </Text>
                                        </Space>
                                        <Space>
                                          {isPreviewable && (
                                            <Button
                                              type="link"
                                              size="small"
                                              icon={
                                                fileType === "video" ? (
                                                  <PlayCircleOutlined />
                                                ) : (
                                                  <EyeOutlined />
                                                )
                                              }
                                              onClick={() =>
                                                handlePreview(msg.attachment)
                                              }
                                              style={{
                                                color: isOwnMessage
                                                  ? "#fff"
                                                  : "#1890ff",
                                                padding: 0,
                                              }}
                                            >
                                              Preview
                                            </Button>
                                          )}
                                          <Button
                                            type="link"
                                            size="small"
                                            icon={<DownloadOutlined />}
                                            href={fileUrl}
                                            target="_blank"
                                            style={{
                                              color: isOwnMessage
                                                ? "#fff"
                                                : "#1890ff",
                                              padding: 0,
                                            }}
                                          >
                                            Download
                                          </Button>
                                        </Space>
                                      </Space>
                                    );
                                  })()}
                                </div>
                              ) : (
                                <div style={{ marginBottom: 4 }}>
                                  {msg.content}
                                  {msg.is_edited && (
                                    <Text
                                      type={
                                        isOwnMessage ? "white" : "secondary"
                                      }
                                      style={{
                                        fontSize: "12px",
                                        marginLeft: 4,
                                      }}
                                    >
                                      (đã chỉnh sửa)
                                    </Text>
                                  )}
                                </div>
                              )}
                              <Space size={4}>
                                <Tooltip
                                  title={dayjs(msg.created_at).format(
                                    "DD/MM/YYYY HH:mm"
                                  )}
                                >
                                  <Text
                                    type={isOwnMessage ? "white" : "secondary"}
                                    style={{ fontSize: "12px" }}
                                  >
                                    {dayjs(msg.created_at).fromNow()}
                                  </Text>
                                </Tooltip>
                                {msg.is_read && isOwnMessage && (
                                  <Text
                                    type="white"
                                    style={{ fontSize: "12px" }}
                                  >
                                    • Đã xem
                                  </Text>
                                )}
                              </Space>
                            </div>
                          </Dropdown>
                        </div>
                      );
                    })}
                    {currentConversation &&
                      renderTypingIndicator(currentConversation)}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input Area */}
              <div
                style={{
                  padding: "16px",
                  background: "#fff",
                  borderTop: "1px solid #f0f0f0",
                }}
              >
                {attachmentPreview ? (
                  <div
                    style={{
                      marginBottom: 16,
                      padding: 8,
                      background: "#f5f5f5",
                      borderRadius: 4,
                    }}
                  >
                    <Space
                      direction="vertical"
                      size={8}
                      style={{ width: "100%" }}
                    >
                      {/* Preview content */}
                      {attachmentPreview.file_type === "image" && (
                        <Image
                          src={attachmentPreview.previewUrl}
                          width={200}
                          style={{ objectFit: "cover" }}
                        />
                      )}
                      <Space justify="space-between" style={{ width: "100%" }}>
                        <Space>
                          <PaperClipOutlined />
                          <Text>{attachmentPreview.file_name}</Text>
                          <Text type="secondary">
                            ({formatFileSize(attachmentPreview.file_size)})
                          </Text>
                        </Space>
                        <Space>
                          <Button
                            size="small"
                            onClick={() => setAttachmentPreview(null)}
                            icon={<CloseOutlined />}
                          >
                            Hủy
                          </Button>
                          <Button
                            type="primary"
                            size="small"
                            onClick={handleSendMessageWithAttachment}
                            loading={uploading}
                            icon={<SendOutlined />}
                          >
                            Gửi file
                          </Button>
                        </Space>
                      </Space>
                    </Space>
                  </div>
                ) : null}

                <Space.Compact style={{ width: "100%" }}>
                  <Upload
                    beforeUpload={(file) => {
                      handleUpload(file);
                      return false;
                    }}
                    showUploadList={false}
                    disabled={uploading}
                  >
                    <Button
                      icon={<PaperClipOutlined />}
                      style={{ borderRight: 0 }}
                    />
                  </Upload>
                  <TextArea
                    value={messageContent}
                    onChange={(e) => {
                      setMessageContent(e.target.value);
                      handleTyping();
                    }}
                    onPressEnter={(e) => {
                      if (!e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Nhập tin nhắn..."
                    autoSize={{ minRows: 1, maxRows: 4 }}
                    style={{ resize: "none", padding: "8px 11px" }}
                  />
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={handleSendMessage}
                    loading={sending}
                    disabled={uploading}
                  />
                </Space.Compact>
              </div>
            </>
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="Chọn một cuộc trò chuyện để bắt đầu"
              style={{ margin: "auto" }}
            />
          )}
        </div>
      </div>
      <Modal
        open={previewVisible}
        title={previewMedia?.file_name}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        width={800}
        centered
      >
        {previewMedia && <PreviewContent media={previewMedia} />}
      </Modal>
    </Card>
  );
};

export default Message;
