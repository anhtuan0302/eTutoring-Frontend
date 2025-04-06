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
  LoadingOutlined,
  EyeOutlined,
  PlayCircleOutlined,
  DownloadOutlined,
  CloseOutlined,
  LeftOutlined,
} from "@ant-design/icons";
import { sendMessage, getMessages } from "../../../api/communication/message";
import { createConversation } from "../../../api/communication/chatConversation";
import firebaseChatService from "../../../api/firebaseChat";
import { staticURL } from "../../../api/config";
import { getAllUsers } from "../../../api/auth/user";
import { useAuth } from "../../../AuthContext";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/en";

dayjs.extend(relativeTime);
dayjs.locale("en");

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
  const [uploading, setUploading] = useState(false);
  const [attachmentContent, setAttachmentContent] = useState("");
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewMedia, setPreviewMedia] = useState(null);
  const sendingMessageRef = useRef(null);
  const sendingContentRef = useRef(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [searchMessageText, setSearchMessageText] = useState("");
  const [searchMessageVisible, setSearchMessageVisible] = useState(false);
  const [searchMessageResults, setSearchMessageResults] = useState([]);
  const [screenSize, setScreenSize] = useState({
    width: window.innerWidth,
    isMobile: window.innerWidth < 768,
    isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
  });

  // Refs
  const messagesEndRef = useRef(null);
  const messageContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const unsubscribeRefs = useRef({});

  // Trong useEffect đầu tiên hoặc trong hàm khởi tạo
  useEffect(() => {
    // Đảm bảo xóa tất cả temp conversations khi component mount
    setConversations((prev) => prev.filter((conv) => !conv.isTemp));

    // Khi component unmount, hủy đăng ký tất cả các listeners
    return () => {
      Object.values(unsubscribeRefs.current).forEach((unsubscribe) => {
        if (typeof unsubscribe === "function") {
          unsubscribe();
        }
      });
    };
  }, []);

  // Handle window resize for responsive design
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setScreenSize({
        width,
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Thêm vào useEffect đầu tiên hoặc useEffect riêng biệt
  useEffect(() => {
    const initFirebase = async () => {
      if (user?._id) {
        try {
          await firebaseChatService.initializeFirebaseStructure();
        } catch (error) {
          console.error("Failed to initialize Firebase structure:", error);
        }
      }
    };

    initFirebase();
  }, [user?._id]);

  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        if (!accessToken) return;

        const response = await getAllUsers();
        const otherUsers = response.users.filter((u) => u._id !== user._id);
        setAllUsers(otherUsers);
      } catch (error) {
        antMessage.error("Failed to fetch users");
      }
    };
    fetchUsers();
  }, [user?._id, accessToken]);

  // Firebase presence subscription
  useEffect(() => {
    if (!user?._id) return;

    const setupPresence = async () => {
      try {
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
        antMessage.error("Failed to update presence status");
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

    console.log("Setting up conversation subscription for user:", user._id);

    const unsubscribe = firebaseChatService.subscribeToAllConversations(
      user._id,
      (conversationsData) => {
        console.log("Firebase conversations received:", conversationsData);

        if (!conversationsData || !Array.isArray(conversationsData)) {
          console.error("Invalid conversations data:", conversationsData);
          return;
        }

        if (conversationsData.length === 0) {
          console.log("No conversations found for user");
          setConversations([]);
          return;
        }

        const validConversations = conversationsData
          .filter((conv) => conv && conv.user1_id && conv.user2_id)
          .filter(
            (conv, index, self) =>
              index === self.findIndex((c) => c._id === conv._id)
          )
          .sort((a, b) => (b.updated_at || 0) - (a.updated_at || 0));

        console.log("Valid conversations count:", validConversations.length);
        setConversations(validConversations);

        // Đăng ký lắng nghe tin nhắn cho mỗi cuộc hội thoại
        validConversations.forEach((conv) => {
          firebaseChatService.subscribeToMessages(conv._id, (messages) => {
            if (messages) {
              const unreadCount = Object.values(messages).filter(
                (msg) => !msg.is_read && msg.sender_id !== user._id
              ).length;

              setUnreadCounts((prev) => ({
                ...prev,
                [conv._id]: unreadCount,
              }));

              if (unreadCount > 0) {
                setUnreadConversations((prev) => new Set([...prev, conv._id]));
              } else {
                setUnreadConversations((prev) => {
                  const newSet = new Set(prev);
                  newSet.delete(conv._id);
                  return newSet;
                });
              }
            }
          });
        });
      }
    );

    return () => {
      console.log("Cleaning up conversation subscription");
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, [user?._id]);

  // Subscribe to current conversation messages
  useEffect(() => {
    if (!currentConversation?._id) return;

    // QUAN TRỌNG: Hủy bỏ các subscription trước đó
    Object.values(unsubscribeRefs.current).forEach((unsubscribe) => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    });

    console.log(
      `Setting up subscription for conversation: ${currentConversation._id}`
    );

    const unsubscribeMessages = firebaseChatService.subscribeToMessages(
      currentConversation._id,
      (newMessages) => {
        if (!newMessages || !Array.isArray(newMessages)) {
          console.log("No messages or invalid data received");
          return;
        }

        console.log(`Received ${newMessages.length} messages from Firebase`);

        // Cập nhật messages state với dữ liệu mới nhất
        setMessages((prevMessages) => {
          const messageMap = new Map();

          // Thêm messages hiện tại vào map
          prevMessages.forEach((msg) => {
            const msgId = msg._id || msg.firebaseKey;
            if (msgId) {
              messageMap.set(msgId, msg);
            }
          });

          // Cập nhật hoặc thêm mới tin nhắn từ Firebase
          newMessages.forEach((newMsg) => {
            const msgId = newMsg._id || newMsg.firebaseKey;
            if (msgId) {
              // Luôn cập nhật tin nhắn với dữ liệu mới nhất từ Firebase
              messageMap.set(msgId, {
                ...newMsg,
                content: newMsg.content,
                created_at: newMsg.created_at || Date.now(),
                is_read: newMsg.is_read || false,
                is_deleted: newMsg.is_deleted || false,
                is_edited: newMsg.is_edited || false,
                deleted_by: newMsg.deleted_by || null,
                deleted_at: newMsg.deleted_at || null,
                attachment: newMsg.attachment || null,
                updated_at: newMsg.updated_at || null,
              });
            }
          });

          // Chuyển map thành array và sắp xếp
          return Array.from(messageMap.values()).sort(
            (a, b) => (a.created_at || 0) - (b.created_at || 0)
          );
        });

        // Đánh dấu tin nhắn đã đọc
        const hasUnreadMessages = newMessages.some(
          (msg) => !msg.is_read && msg.sender_id !== user._id
        );

        if (hasUnreadMessages) {
          firebaseChatService.markMessagesAsRead(
            currentConversation._id,
            user._id
          );
        }

        // Cuộn xuống cuối
        setTimeout(scrollToBottom, 100);
      }
    );

    // Các subscription khác
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

    // Lưu các hàm unsubscribe
    unsubscribeRefs.current = {
      messages: unsubscribeMessages,
      typing: unsubscribeTyping,
      conversation: unsubscribeConversation,
    };

    return () => {
      console.log(
        `Cleaning up subscriptions for conversation: ${currentConversation._id}`
      );
      if (typeof unsubscribeMessages === "function") unsubscribeMessages();
      if (typeof unsubscribeTyping === "function") unsubscribeTyping();
      if (typeof unsubscribeConversation === "function")
        unsubscribeConversation();
    };
  }, [currentConversation?._id, user._id]);

  // Subscribe to all users' presence
  useEffect(() => {
    if (!user?._id) return;

    const unsubscribePresence = firebaseChatService.subscribeToAllUsersPresence(
      (presenceData) => {
        if (presenceData) {
          const onlineUserIds = new Set();

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
      if (typeof unsubscribePresence === "function") {
        unsubscribePresence();
      }
    };
  }, [user?._id]);

  /**
   * Scrolls to the bottom of the message container
   */
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  /**
   * Sends a new message to the current conversation
   * @param {string} content - Message content
   */
  const handleSendMessage = async (content) => {
    // Kiểm tra điều kiện cơ bản
    if (!content || !content.trim() || !currentConversation || sending) return;

    const messageToSend = content.trim();

    // Kiểm tra xem tin nhắn này đã đang được gửi chưa
    if (sendingContentRef.current === messageToSend) {
      console.log("Message is already being sent:", messageToSend);
      return;
    }

    // Đánh dấu tin nhắn đang được gửi
    sendingContentRef.current = messageToSend;
    setMessageContent(""); // Clear input ngay lập tức
    setSending(true);

    try {
      let actualConversation = currentConversation;

      // Xử lý conversation tạm thời
      if (currentConversation.isTemp) {
        console.log(
          "Creating new conversation with:",
          currentConversation.user2_id
        );

        const response = await createConversation({
          user2_id: currentConversation.user2_id._id,
        });

        console.log("Create conversation response:", response);

        if (!response) {
          throw new Error("Failed to create conversation");
        }

        actualConversation = {
          _id: response._id || response.data?._id,
          user1_id: {
            _id: user._id,
            first_name: user.first_name || "",
            last_name: user.last_name || "",
            email: user.email || "",
            avatar_path: user.avatar_path,
          },
          user2_id: {
            _id: currentConversation.user2_id._id,
            first_name: currentConversation.user2_id.first_name || "",
            last_name: currentConversation.user2_id.last_name || "",
            email: currentConversation.user2_id.email || "",
            avatar_path: currentConversation.user2_id.avatar_path,
          },
          created_at: Date.now(),
          updated_at: Date.now(),
        };

        console.log("Structured conversation:", actualConversation);

        // Cập nhật conversation trong Firebase TRƯỚC
        await firebaseChatService.updateConversation(
          actualConversation._id,
          actualConversation
        );

        // Cập nhật UI sau
        setCurrentConversation(actualConversation);
        setConversations((prev) => [
          actualConversation,
          ...prev.filter((c) => !c.isTemp),
        ]);
      }

      // Gửi tin nhắn
      console.log("Sending message:", messageToSend);
      const messageResponse = await sendMessage({
        conversation_id: actualConversation._id,
        content: messageToSend,
      });

      // Kiểm tra response
      if (!messageResponse?.data?._id && !messageResponse?._id) {
        throw new Error("Invalid message response");
      }

      const timestamp = Date.now();
      await firebaseChatService.updateConversation(actualConversation._id, {
        last_message: messageToSend,
        last_message_at: timestamp,
        updated_at: timestamp,
      });
    } catch (error) {
      console.error("Send message error:", error);
      if (
        error.message === "Failed to send message" ||
        error.message === "Failed to create conversation"
      ) {
        setMessageContent(messageToSend);
      }
      antMessage.error(
        "Failed to send message: " + (error.message || "Unknown error")
      );
    } finally {
      setSending(false);
      sendingContentRef.current = null; // Reset ref
    }
  };

  /**
   * Updates the typing status of the current user
   */
  const handleTyping = () => {
    if (!currentConversation) return;

    const typingData = {
      userId: user._id,
      isTyping: true,
      username: user.username || "",
      first_name: user.first_name || "",
      last_name: user.last_name || "",
    };

    // Gửi trạng thái typing đến Firebase
    firebaseChatService.updateTypingStatus(currentConversation._id, typingData);

    // Clear timeout hiện tại nếu có
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout để tắt trạng thái typing sau 2 giây
    typingTimeoutRef.current = setTimeout(() => {
      firebaseChatService.updateTypingStatus(currentConversation._id, {
        ...typingData,
        isTyping: false,
      });
    }, 2000);
  };

  /**
   * Searches users by name, email, or phone number
   * @param {string} value - Search value
   */
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

  /**
   * Searches messages in the current conversation
   * @param {string} searchText - Text to search for
   */
  const handleSearchMessages = (searchText) => {
    if (!searchText.trim() || !messages.length) {
      setSearchMessageResults([]);
      return;
    }

    const results = messages
      .filter(
        (msg) =>
          msg.content &&
          msg.content.toLowerCase().includes(searchText.toLowerCase())
      )
      .map((msg) => {
        // Make sure sender information is complete
        let senderInfo;
        if (msg.sender_id === user._id) {
          senderInfo = {
            _id: user._id,
            first_name: user.first_name || "",
            last_name: user.last_name || "",
            avatar_path: user.avatar_path || null,
          };
        } else {
          // Get other user info from conversation
          const otherUser =
            currentConversation.user1_id._id === user._id
              ? currentConversation.user2_id
              : currentConversation.user1_id;

          senderInfo = {
            _id: otherUser._id,
            first_name: otherUser.first_name || "",
            last_name: otherUser.last_name || "",
            avatar_path: otherUser.avatar_path || null,
          };
        }

        return {
          ...msg,
          sender: msg.sender || senderInfo,
        };
      });

    setSearchMessageResults(results);
  };

  /**
   * Selects a user to start a new conversation with
   * @param {Object} selectedUser - User to start conversation with
   */
  const handleSelectUser = (selectedUser) => {
    // Reset messages state
    setMessages([]);

    // Tìm conversation hiện có với user được chọn
    const existingConversation = conversations.find(
      (conv) =>
        (conv.user1_id._id === selectedUser._id &&
          conv.user2_id._id === user._id) ||
        (conv.user2_id._id === selectedUser._id &&
          conv.user1_id._id === user._id)
    );

    if (existingConversation) {
      // Nếu đã có conversation, load conversation đó
      handleSelectConversation(existingConversation);
      setSearchText("");
      setSearchResults([]);
    } else {
      // Nếu chưa có, tạo conversation tạm thời
      const tempConversation = {
        _id: `temp_${selectedUser._id}`,
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
        isTemp: true,
      };

      setCurrentConversation(tempConversation);
      setSearchText("");
      setSearchResults([]);
    }
  };

  /**
   * Checks if a user is currently typing in a conversation
   * @param {string} userId - User ID
   * @param {string} conversationId - Conversation ID
   * @returns {boolean} - Whether the user is typing
   */
  const isUserTyping = (userId, conversationId) => {
    const typingInfo = typingUsers.get(userId);
    return typingInfo && typingInfo.conversationId === conversationId;
  };

  /**
   * Renders the last active time of a user
   * @param {string} userId - User ID
   * @returns {string} - Last active status
   */
  const renderLastActive = (userId) => {
    const isOnline = onlineUsers.has(userId);
    if (isOnline) {
      return "Active now";
    }

    const userPresence = usersPresence[userId];
    if (userPresence?.lastActive) {
      const lastActiveTime =
        typeof userPresence.lastActive === "number"
          ? userPresence.lastActive
          : userPresence.lastActive?.seconds * 1000;

      if (lastActiveTime) {
        return `Active ${dayjs(lastActiveTime).fromNow()}`;
      }
    }

    return "Inactive";
  };

  /**
   * Renders the typing indicator for a conversation
   * @param {Object} conversation - Conversation object
   * @returns {JSX.Element|null} - Typing indicator component
   */
  const renderTypingIndicator = (conversation) => {
    const otherUserId =
      conversation.user1_id._id === user._id
        ? conversation.user2_id._id
        : conversation.user1_id._id;

    const typingInfo = typingUsers.get(otherUserId);

    if (typingInfo && typingInfo.conversationId === conversation._id) {
      const typingName = typingInfo.first_name
        ? `${typingInfo.first_name} ${typingInfo.last_name || ""}`
        : "Someone";

      return (
        <Text type="secondary" italic style={{ fontSize: "12px" }}>
          {typingName} is typing...
        </Text>
      );
    }
    return null;
  };

  /**
   * Handles typing status changes
   * @param {Object} typingData - Typing status data
   */
  const handleTypingStatus = (typingData) => {
    if (!typingData) return;

    const typingUsers = Array.isArray(typingData)
      ? typingData
      : Object.values(typingData);

    setTypingUsers((prev) => {
      const newMap = new Map();

      typingUsers.forEach((data) => {
        if (data && data.userId && data.isTyping && data.userId !== user._id) {
          newMap.set(data.userId, {
            conversationId: currentConversation._id,
            first_name: data.first_name || "",
            last_name: data.last_name || "",
          });
        }
      });

      return newMap;
    });
  };

  /**
   * Fetches messages for a conversation
   * @param {string} conversationId - Conversation ID
   */
  const fetchMessages = async (conversationId) => {
    try {
      setLoading(true);
      const response = await getMessages(conversationId);

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
      antMessage.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Selects a conversation to view
   * @param {Object} conversation - Conversation object
   */
  const handleSelectConversation = async (conversation) => {
    try {
      // Hủy các subscription cũ
      Object.values(unsubscribeRefs.current).forEach((unsubscribe) => {
        if (typeof unsubscribe === "function") {
          unsubscribe();
        }
      });

      // Reset messages state khi chuyển conversation
      setMessages([]);
      setCurrentConversation(conversation);

      // Đánh dấu tin nhắn đã đọc
      await firebaseChatService.markMessagesAsRead(conversation._id, user._id);

      setUnreadCounts((prev) => ({
        ...prev,
        [conversation._id]: 0,
      }));
      setUnreadConversations((prev) => {
        const newSet = new Set(prev);
        newSet.delete(conversation._id);
        return newSet;
      });

      // Load tin nhắn cũ nếu không phải là conversation tạm thời
      if (!conversation.isTemp) {
        try {
          setLoading(true);
          const response = await getMessages(conversation._id);

          if (response && Array.isArray(response)) {
            const formattedMessages = response.map((msg) => {
              // Xác định sender dựa trên sender_id
              const senderInfo =
                msg.sender_id._id === user._id
                  ? {
                      _id: user._id,
                      first_name: user.first_name,
                      last_name: user.last_name,
                      avatar_path: user.avatar_path,
                    }
                  : {
                      _id:
                        msg.sender_id._id === conversation.user1_id._id
                          ? conversation.user1_id._id
                          : conversation.user2_id._id,
                      first_name:
                        msg.sender_id._id === conversation.user1_id._id
                          ? conversation.user1_id.first_name
                          : conversation.user2_id.first_name,
                      last_name:
                        msg.sender_id._id === conversation.user1_id._id
                          ? conversation.user1_id.last_name
                          : conversation.user2_id.last_name,
                      avatar_path:
                        msg.sender_id._id === conversation.user1_id._id
                          ? conversation.user1_id.avatar_path
                          : conversation.user2_id.avatar_path,
                    };

              return {
                ...msg,
                sender_id: {
                  ...msg.sender_id,
                  avatar_path: senderInfo.avatar_path,
                },
                sender: senderInfo, // Thêm thông tin sender đầy đủ
              };
            });

            setMessages(formattedMessages);
            setTimeout(scrollToBottom, 100);
          }
        } catch (error) {
          console.error("Failed to load old messages:", error);
          antMessage.error("Failed to load old messages");
        } finally {
          setLoading(false);
        }
      }

      // Thiết lập subscription mới cho conversation được chọn
      const unsubscribeMessages = firebaseChatService.subscribeToMessages(
        conversation._id,
        (newMessages) => {
          if (!newMessages || !Array.isArray(newMessages)) {
            console.log("No messages or invalid data received");
            return;
          }

          setMessages((prevMessages) => {
            const messageMap = new Map();

            // Thêm messages hiện tại vào map
            prevMessages.forEach((msg) => {
              const msgId = msg._id || msg.firebaseKey;
              if (msgId) {
                messageMap.set(msgId, msg);
              }
            });

            // Cập nhật hoặc thêm mới tin nhắn từ Firebase
            newMessages
              .filter((msg) => msg && msg.conversation_id === conversation._id)
              .forEach((newMsg) => {
                const msgId = newMsg._id || newMsg.firebaseKey;
                if (msgId) {
                  // Xác định sender cho tin nhắn mới
                  const senderInfo =
                    newMsg.sender_id === user._id
                      ? {
                          _id: user._id,
                          first_name: user.first_name,
                          last_name: user.last_name,
                          avatar_path: user.avatar_path,
                        }
                      : {
                          _id:
                            newMsg.sender_id === conversation.user1_id._id
                              ? conversation.user1_id._id
                              : conversation.user2_id._id,
                          first_name:
                            newMsg.sender_id === conversation.user1_id._id
                              ? conversation.user1_id.first_name
                              : conversation.user2_id.first_name,
                          last_name:
                            newMsg.sender_id === conversation.user1_id._id
                              ? conversation.user1_id.last_name
                              : conversation.user2_id.last_name,
                          avatar_path:
                            newMsg.sender_id === conversation.user1_id._id
                              ? conversation.user1_id.avatar_path
                              : conversation.user2_id.avatar_path,
                        };

                  messageMap.set(msgId, {
                    ...newMsg,
                    sender: senderInfo,
                    content: newMsg.content,
                    created_at: newMsg.created_at || Date.now(),
                    is_read: newMsg.is_read || false,
                    is_deleted: newMsg.is_deleted || false,
                    is_edited: newMsg.is_edited || false,
                    deleted_by: newMsg.deleted_by || null,
                    deleted_at: newMsg.deleted_at || null,
                    attachment: newMsg.attachment || null,
                    updated_at: newMsg.updated_at || null,
                  });
                }
              });

            return Array.from(messageMap.values()).sort(
              (a, b) => (a.created_at || 0) - (b.created_at || 0)
            );
          });

          // Đánh dấu tin nhắn đã đọc
          const hasUnreadMessages = newMessages.some(
            (msg) => !msg.is_read && msg.sender_id !== user._id
          );

          if (hasUnreadMessages) {
            firebaseChatService.markMessagesAsRead(conversation._id, user._id);
          }

          // Cuộn xuống cuối
          setTimeout(scrollToBottom, 100);
        }
      );

      // Thiết lập các subscription khác
      const unsubscribeTyping = firebaseChatService.subscribeToTyping(
        conversation._id,
        (typingData) => {
          if (typingData) {
            handleTypingStatus(typingData);
          }
        }
      );

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

      // Lưu các hàm unsubscribe
      unsubscribeRefs.current = {
        messages: unsubscribeMessages,
        typing: unsubscribeTyping,
        conversation: unsubscribeConversation,
      };
    } catch (error) {
      console.error("Failed to load conversation:", error);
      antMessage.error("Failed to load conversation");
    }
  };

  /**
   * Handles file upload
   * @param {File} file - File to upload
   */
  const handleUpload = async (file) => {
    try {
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        antMessage.error("File cannot exceed 10MB");
        return;
      }

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
      antMessage.error("Failed to process file");
    }
  };

  /**
   * Sends a message with an attachment
   */
  const handleSendMessageWithAttachment = async () => {
    if (!attachmentPreview || !currentConversation) return;

    try {
      setUploading(true);

      let actualConversation = currentConversation;
      if (currentConversation.isTemp) {
        const response = await createConversation({
          user2_id: currentConversation.user2_id._id,
        });

        if (!response) {
          throw new Error("Failed to create conversation");
        }

        actualConversation = {
          _id: response._id || response.data?._id,
          user1_id: {
            _id: user._id,
            first_name: user.first_name || "",
            last_name: user.last_name || "",
            email: user.email || "",
            avatar_path: user.avatar_path,
          },
          user2_id: {
            _id: currentConversation.user2_id._id,
            first_name: currentConversation.user2_id.first_name || "",
            last_name: currentConversation.user2_id.last_name || "",
            email: currentConversation.user2_id.email || "",
            avatar_path: currentConversation.user2_id.avatar_path,
          },
          created_at: Date.now(),
          updated_at: Date.now(),
        };

        setCurrentConversation(actualConversation);
        setConversations((prev) => [
          actualConversation,
          ...prev.filter((c) => !c.isTemp),
        ]);
      }

      const formData = new FormData();
      formData.append("attachment", attachmentPreview.file);
      formData.append("conversation_id", actualConversation._id);

      if (attachmentContent.trim()) {
        formData.append("content", attachmentContent.trim());
      }

      // Gửi tin nhắn qua API
      const messageResponse = await sendMessage(formData);

      if (!messageResponse?.data && !messageResponse?._id) {
        throw new Error("Invalid message response");
      }

      const messageData = messageResponse.data || messageResponse;
      const timestamp = Date.now();

      // Cập nhật conversation trong Firebase
      const fileType = getFileType(attachmentPreview.file_name);
      const fileTypeText =
        fileType === "image"
          ? "an image"
          : fileType === "video"
          ? "a video"
          : fileType === "audio"
          ? "an audio"
          : "a file";

      const lastMessage = attachmentContent.trim() || `Sent ${fileTypeText}`;

      await firebaseChatService.updateConversation(actualConversation._id, {
        last_message: lastMessage,
        last_message_at: timestamp,
        updated_at: timestamp,
      });

      // Reset states
      setAttachmentPreview(null);
      setAttachmentContent("");
    } catch (error) {
      console.error("Send attachment error:", error);
      antMessage.error(
        "Failed to send file: " + (error.response?.data?.error || error.message)
      );
    } finally {
      setUploading(false);
    }
  };

  /**
   * Edits a message
   * @param {string} messageId - Message ID
   * @param {string} newContent - New message content
   */
  const handleEditMessage = async (messageId, newContent) => {
    try {
      if (!currentConversation || !messageId || !newContent.trim()) return;

      // Cập nhật message trong Firebase
      await firebaseChatService.updateMessage(
        currentConversation._id,
        messageId,
        {
          content: newContent.trim(),
          updated_at: Date.now(),
        }
      );

      // Cập nhật messages trong state
      setMessages((prevMessages) => {
        return prevMessages.map((msg) => {
          const msgId = msg._id || msg.firebaseKey;
          if (msgId === messageId) {
            return {
              ...msg,
              content: newContent.trim(),
              is_edited: true,
              updated_at: Date.now(),
            };
          }
          return msg;
        });
      });

      // Cập nhật last_message trong conversation nếu đây là tin nhắn cuối cùng
      const isLastMessage =
        messages[messages.length - 1]?._id === messageId ||
        messages[messages.length - 1]?.firebaseKey === messageId;

      if (isLastMessage) {
        await firebaseChatService.updateConversation(currentConversation._id, {
          last_message: newContent.trim(),
          updated_at: Date.now(),
        });

        // Cập nhật conversations trong state
        setConversations((prevConversations) => {
          return prevConversations.map((conv) => {
            if (conv._id === currentConversation._id) {
              return {
                ...conv,
                last_message: newContent.trim(),
                updated_at: Date.now(),
              };
            }
            return conv;
          });
        });
      }

      antMessage.success("Message updated");
    } catch (error) {
      console.error("Edit message error:", error);
      antMessage.error("Failed to update message");
    }
  };

  /**
   * Deletes a message
   * @param {string} messageId - Message ID
   */
  const handleDeleteMessage = async (messageId) => {
    try {
      if (!currentConversation || !messageId) return;

      const deletedBy = {
        _id: user._id,
        first_name: user.first_name || "",
        last_name: user.last_name || "",
      };

      // Xóa message trong Firebase
      await firebaseChatService.deleteMessage(
        currentConversation._id,
        messageId,
        deletedBy
      );

      // Cập nhật messages trong state
      setMessages((prevMessages) => {
        return prevMessages.map((msg) => {
          const msgId = msg._id || msg.firebaseKey;
          if (msgId === messageId) {
            return {
              ...msg,
              content: null,
              attachment: null,
              is_deleted: true,
              deleted_at: Date.now(),
              deleted_by: deletedBy,
            };
          }
          return msg;
        });
      });

      // Cập nhật last_message trong conversation nếu đây là tin nhắn cuối cùng
      const isLastMessage =
        messages[messages.length - 1]?._id === messageId ||
        messages[messages.length - 1]?.firebaseKey === messageId;

      if (isLastMessage) {
        // Tìm tin nhắn cuối cùng không bị xóa
        const lastValidMessage = [...messages].reverse().find((msg) => {
          const msgId = msg._id || msg.firebaseKey;
          return msgId !== messageId && !msg.is_deleted;
        });

        const lastMessage = lastValidMessage
          ? lastValidMessage.content
          : "Message has been recalled";

        await firebaseChatService.updateConversation(currentConversation._id, {
          last_message: lastMessage,
          updated_at: Date.now(),
        });

        // Cập nhật conversations trong state
        setConversations((prevConversations) => {
          return prevConversations.map((conv) => {
            if (conv._id === currentConversation._id) {
              return {
                ...conv,
                last_message: lastMessage,
                updated_at: Date.now(),
              };
            }
            return conv;
          });
        });
      }

      antMessage.success("Message recalled");
    } catch (error) {
      console.error("Delete message error:", error);
      antMessage.error("Failed to recall message");
    }
  };

  /**
   * Determines file type from filename
   * @param {string} fileName - File name
   * @returns {string} - File type
   */
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

  /**
   * Formats file size for display
   * @param {number} bytes - File size in bytes
   * @returns {string} - Formatted file size
   */
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  /**
   * Handles previewing media files
   * @param {Object} attachment - Attachment object
   */
  const handlePreview = (attachment) => {
    setPreviewMedia(attachment);
    setPreviewVisible(true);
  };

  /**
   * Renders the message search modal
   */
  const SearchMessageModal = () => (
    <Modal
      title="Search Messages"
      open={searchMessageVisible}
      onCancel={() => {
        setSearchMessageVisible(false);
        setSearchMessageText("");
        setSearchMessageResults([]);
      }}
      footer={null}
      width={600}
    >
      <Space direction="vertical" style={{ width: "100%" }} size="large">
        <Input.Search
          placeholder="Enter message content to search..."
          value={searchMessageText}
          onChange={(e) => {
            setSearchMessageText(e.target.value);
            handleSearchMessages(e.target.value);
          }}
          style={{ marginBottom: 16 }}
        />

        <List
          dataSource={searchMessageResults}
          locale={{
            emptyText: searchMessageText
              ? "No messages found"
              : "Enter content to search",
          }}
          renderItem={(msg) => {
            const isOwnMessage = msg.sender_id === user._id;
            const sender = msg.sender || {};
            const senderName = isOwnMessage
              ? "You"
              : sender.first_name && sender.last_name
              ? `${sender.first_name} ${sender.last_name}`
              : "Unknown User";

            return (
              <List.Item>
                <Space>
                  <Avatar
                    size="small"
                    src={
                      sender.avatar_path
                        ? `${staticURL}/${sender.avatar_path}`
                        : null
                    }
                    icon={<UserOutlined />}
                  />
                  <div>
                    <Text strong>{senderName}</Text>
                    <div>{msg.content}</div>
                    <Text type="secondary" style={{ fontSize: "12px" }}>
                      {dayjs(msg.created_at).format("MM/DD/YYYY HH:mm")}
                    </Text>
                  </div>
                </Space>
              </List.Item>
            );
          }}
        />
      </Space>
    </Modal>
  );

  /**
   * Renders preview content for media files
   */
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

  /**
   * Xử lý tin nhắn mới từ Firebase và cập nhật state messages
   * @param {Array} newMessages - Mảng tin nhắn từ Firebase
   */
  const processNewMessages = (newMessages) => {
    if (
      !newMessages ||
      !Array.isArray(newMessages) ||
      newMessages.length === 0
    ) {
      return;
    }

    setMessages((prevMessages) => {
      const messageMap = new Map();

      // Thêm messages hiện tại vào map
      prevMessages.forEach((msg) => {
        const msgId = msg._id || msg.firebaseKey;
        if (msgId) {
          messageMap.set(msgId, msg);
        }
      });

      // Xử lý tin nhắn mới hoặc cập nhật
      newMessages.forEach((newMsg) => {
        const msgId = newMsg._id || newMsg.firebaseKey;
        if (msgId) {
          const existingMsg = messageMap.get(msgId);
          const newVersion = newMsg.updated_at || newMsg.created_at;
          const existingVersion =
            existingMsg?.updated_at || existingMsg?.created_at;

          // Cập nhật nếu là tin nhắn mới hoặc có phiên bản mới hơn
          if (!existingMsg || newVersion > existingVersion) {
            messageMap.set(msgId, {
              ...newMsg,
              content: newMsg.content,
              created_at: newMsg.created_at || Date.now(),
              is_read: newMsg.is_read || false,
              is_deleted: newMsg.is_deleted || false,
              is_edited: newMsg.is_edited || false,
              deleted_by: newMsg.deleted_by || null,
              deleted_at: newMsg.deleted_at || null,
              attachment: newMsg.attachment || null,
              updated_at: newMsg.updated_at || null,
            });
          }
        }
      });

      // Chuyển map thành array và sắp xếp
      return Array.from(messageMap.values()).sort(
        (a, b) => (a.created_at || 0) - (b.created_at || 0)
      );
    });
  };

  // Responsive styles
  const containerStyle = {
    display: "flex",
    height: "100%",
    flexDirection: screenSize.isMobile ? "column" : "row",
  };

  const sidebarStyle = {
    width: screenSize.isMobile ? "100%" : 300,
    borderRight: screenSize.isMobile ? "none" : "1px solid #f0f0f0",
    borderBottom: screenSize.isMobile ? "1px solid #f0f0f0" : "none",
    height: screenSize.isMobile
      ? currentConversation
        ? "60px"
        : "100%"
      : "100%",
    display: "flex",
    flexDirection: "column",
    overflow: screenSize.isMobile && currentConversation ? "hidden" : "visible",
  };

  const chatAreaStyle = {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    height: screenSize.isMobile
      ? currentConversation
        ? "calc(100% - 60px)"
        : "0"
      : "100%",
    visibility:
      screenSize.isMobile && !currentConversation ? "hidden" : "visible",
  };

  return (
    <Card bodyStyle={{ padding: 0, height: "calc(100vh - 250px)" }}>
      <div style={containerStyle}>
        {/* Conversation List */}
        <div style={sidebarStyle}>
          <div
            style={{
              padding: "16px",
              borderBottom: "1px solid #f0f0f0",
              background: "#fafafa",
            }}
          >
            <Title level={5} style={{ margin: "0 0 16px 0" }}>
              Messages
            </Title>
            <AutoComplete
              style={{ width: "100%" }}
              value={searchText}
              onChange={handleSearch}
              placeholder="Search users..."
              allowClear
            >
              {searchResults.map((item) => (
                <AutoComplete.Option key={item._id} value={item.username}>
                  <div onClick={() => handleSelectUser(item)}>
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

          {(!screenSize.isMobile || !currentConversation) && (
            <div style={{ flex: 1, overflowY: "auto" }}>
              <Spin spinning={loading}>
                <List
                  dataSource={conversations}
                  locale={{ emptyText: "No conversations" }}
                  renderItem={(conversation) => {
                    if (
                      !conversation ||
                      !conversation.user1_id ||
                      !conversation.user2_id
                    ) {
                      return null;
                    }

                    const otherUser =
                      conversation.user1_id._id === user._id
                        ? conversation.user2_id
                        : conversation.user1_id;

                    if (!otherUser) {
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
                              ? "#f0f7ff"
                              : "transparent",
                        }}
                      >
                        <List.Item.Meta
                          avatar={
                            <Badge
                              count={unreadCounts[conversation._id] || 0}
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
                                icon={
                                  !otherUser.avatar_path && <UserOutlined />
                                }
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
                                  color: unreadConversations.has(
                                    conversation._id
                                  )
                                    ? "#1890ff"
                                    : "inherit",
                                  fontSize: unreadConversations.has(
                                    conversation._id
                                  )
                                    ? "14px"
                                    : "13px",
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
                                  {dayjs(
                                    conversation.last_message_at
                                  ).fromNow()}
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
                                    color: unreadConversations.has(
                                      conversation._id
                                    )
                                      ? "#1890ff"
                                      : "inherit",
                                  }}
                                >
                                  {conversation.last_message ||
                                    "No messages yet"}
                                </Text>
                              )}
                              <Text
                                type="secondary"
                                style={{ fontSize: "12px" }}
                              >
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
          )}
        </div>

        {/* Chat Area */}
        <div style={chatAreaStyle}>
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
                  {screenSize.isMobile && (
                    <Button
                      icon={<LeftOutlined />}
                      type="text"
                      onClick={() => setCurrentConversation(null)}
                    />
                  )}
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
                        label: "View Profile",
                      },
                      {
                        key: "2",
                        label: "Search Messages",
                        onClick: () => setSearchMessageVisible(true),
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

                      // System message
                      if (msg.is_system) {
                        return (
                          <div
                            key={messageKey}
                            style={{
                              textAlign: "center",
                              margin: "8px 0",
                              padding: "4px 12px",
                            }}
                          >
                            <Text type="secondary" style={{ fontSize: "12px" }}>
                              {msg.content}
                            </Text>
                          </div>
                        );
                      }

                      // Deleted message
                      if (msg.is_deleted) {
                        const deletedByName = msg.deleted_by
                          ? `${msg.deleted_by.first_name} ${msg.deleted_by.last_name}`
                          : "Someone";

                        return (
                          <div
                            key={messageKey}
                            style={{
                              textAlign: "center",
                              margin: "8px 0",
                              color: "#999",
                            }}
                          >
                            <Text italic>
                              Message has been recalled by {deletedByName}
                              {msg.deleted_at && (
                                <Tooltip
                                  title={dayjs(msg.deleted_at).format(
                                    "MM/DD/YYYY HH:mm"
                                  )}
                                >
                                  <Text italic style={{ marginLeft: 4 }}>
                                    • {dayjs(msg.deleted_at).fromNow()}
                                  </Text>
                                </Tooltip>
                              )}
                            </Text>
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
                                      label: "Edit",
                                      onClick: () => {
                                        const newContent = prompt(
                                          "Enter new content:",
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
                                      label: "Recall",
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
                              {msg.content && (
                                <div
                                  style={{
                                    marginBottom: msg.attachment ? 8 : 4,
                                  }}
                                >
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
                                      (edited)
                                    </Text>
                                  )}
                                </div>
                              )}
                              {msg.attachment && (
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
                                        {/* Hiển thị preview ảnh nếu là image */}
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

                                        {/* Thông tin file */}
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

                                        {/* Các nút tương tác với file */}
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
                                            onClick={() => {
                                              if (msg.attachment?.file_path) {
                                                window.open(
                                                  `${staticURL}/${msg.attachment.file_path}`,
                                                  "_blank"
                                                );
                                              }
                                            }}
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
                              )}
                              <Space size={4}>
                                <Tooltip
                                  title={dayjs(msg.created_at).format(
                                    "MM/DD/YYYY HH:mm"
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
                                    • Seen
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
                      </Space>

                      {/* Thêm input cho content */}
                      <Input.TextArea
                        value={attachmentContent}
                        onChange={(e) => setAttachmentContent(e.target.value)}
                        placeholder="Add a message with your file (optional)"
                        autoSize={{ minRows: 1, maxRows: 3 }}
                      />

                      <Space
                        style={{ justifyContent: "flex-end", width: "100%" }}
                      >
                        <Button
                          size="small"
                          onClick={() => {
                            setAttachmentPreview(null);
                            setAttachmentContent("");
                          }}
                          icon={<CloseOutlined />}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="primary"
                          size="small"
                          onClick={handleSendMessageWithAttachment}
                          loading={uploading}
                          icon={<SendOutlined />}
                        >
                          Send File
                        </Button>
                      </Space>
                    </Space>
                  </div>
                ) : null}

                <Space.Compact
                  style={{ width: "100%", display: "flex", height: 40 }}
                >
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
                      style={{
                        height: 40,
                        width: 40,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRight: 0,
                      }}
                    />
                  </Upload>
                  <TextArea
                    value={messageContent}
                    onChange={(e) => {
                      setMessageContent(e.target.value);
                      handleTyping();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        const content = messageContent.trim();
                        if (
                          content &&
                          !sending &&
                          sendingContentRef.current !== content
                        ) {
                          handleSendMessage(content);
                        }
                      }
                    }}
                    placeholder="Type a message..."
                    autoSize={{ minRows: 1, maxRows: 4 }}
                    style={{
                      resize: "none",
                      padding: "8px 11px",
                      height: 40,
                      minHeight: 40,
                      flex: 1,
                    }}
                  />
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={() => {
                      const content = messageContent.trim();
                      if (
                        content &&
                        !sending &&
                        sendingContentRef.current !== content
                      ) {
                        handleSendMessage(content);
                      }
                    }}
                    loading={sending}
                    disabled={uploading || sending || !messageContent.trim()}
                    style={{
                      height: 40,
                      width: 40,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  />
                </Space.Compact>
              </div>
            </>
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="Select a conversation to start"
              style={{ margin: "auto" }}
            />
          )}
        </div>
      </div>
      <SearchMessageModal />
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
