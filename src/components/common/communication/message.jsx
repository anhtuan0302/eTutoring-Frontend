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
} from "antd";
import {
  SendOutlined,
  UserOutlined,
  EllipsisOutlined,
  PaperClipOutlined,
  SmileOutlined,
  LoadingOutlined,
  PlusCircleOutlined,
} from "@ant-design/icons";
import { sendMessage, getMessages } from "../../../api/communication/message";
import {
  createConversation,
  getConversations,
} from "../../../api/communication/chatConversation";
import { getAllUsers } from "../../../api/auth/user";
import { useAuth } from "../../../AuthContext";
import { initSocket, getSocket, disconnectSocket, staticURL } from "../../../api/config";
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
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [searchText, setSearchText] = useState("");
  const [allUsers, setAllUsers] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const messagesEndRef = useRef(null);
  const messageContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const socketRef = useRef(null);

  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await getAllUsers();
        const otherUsers = response.users.filter((u) => u._id !== user._id);
        setAllUsers(otherUsers);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchUsers();
  }, [user._id]);

  // Socket connection and event handlers
  useEffect(() => {
    socketRef.current = initSocket(accessToken);
    
    const handleNewMessage = (newMessage) => {
      console.log("Received new message:", newMessage); // Để debug
    
      setMessages(prev => {
        if (prev.some(msg => msg._id === newMessage._id)) {
          return prev;
        }
        return [...prev, newMessage];
      });
    
      setConversations(prev => {
        const updatedConversations = prev.map(conv => {
          // Sửa lại phần này vì conversation_id có thể là string hoặc object
          const conversationId = typeof newMessage.conversation_id === 'object' 
            ? newMessage.conversation_id._id 
            : newMessage.conversation_id;
    
          if (conv._id === conversationId) {
            return {
              ...conv,
              last_message: newMessage.content || "Đã gửi một file đính kèm",
              last_message_at: newMessage.createdAt,
            };
          }
          return conv;
        });
    
        return updatedConversations.sort((a, b) => 
          new Date(b.last_message_at || 0) - new Date(a.last_message_at || 0)
        );
      });
    
      // Sửa lại check conversation hiện tại
      const currentConvId = typeof newMessage.conversation_id === 'object'
        ? newMessage.conversation_id._id
        : newMessage.conversation_id;
    
      if (currentConversation?._id === currentConvId) {
        scrollToBottom();
      }
    };

    const handleUserStatus = ({ userId, status, lastActive }) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        if (status === "online") {
          newSet.add(userId);
        } else {
          newSet.delete(userId);
        }
        return newSet;
      });

      // Cập nhật lastActive trong conversations nếu user offline
      if (status === "offline") {
        setConversations(prev => 
          prev.map(conv => {
            if (conv.user1_id._id === userId) {
              return { ...conv, user1_id: { ...conv.user1_id, lastActive } };
            }
            if (conv.user2_id._id === userId) {
              return { ...conv, user2_id: { ...conv.user2_id, lastActive } };
            }
            return conv;
          })
        );
      }
    };

    const handleNewConversation = (conversation) => {
      setConversations(prev => [conversation, ...prev]);
    };

    const handleUpdateConversation = (updatedConversation) => {
      setConversations(prev => 
        prev.map(conv => 
          conv._id === updatedConversation._id ? updatedConversation : conv
        )
      );
    };

    if (!accessToken) return; // Thêm check này

    socketRef.current = initSocket(accessToken);
    const socket = socketRef.current;
  
    socket.on("connect", () => {
      console.log("Connected to socket server");
      if (currentConversation) {
        socket.emit("join:conversation", currentConversation._id);
      }
    });
  
    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      antMessage.error("Mất kết nối với server, đang thử kết nối lại...");
    });
  
    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      if (reason === "io server disconnect") {
        socket.connect(); // Tự động reconnect
      }
    });

    socket.on("message:new", handleNewMessage);
    socket.on("user:status", handleUserStatus);
    socket.on("user:typing", handleTyping);
    socket.on("conversation:new", handleNewConversation);
    socket.on("conversation:update", handleUpdateConversation);

    // Fetch initial data
    fetchConversations();

    return () => {
      if (socket) {
        socket.off("connect");
        socket.off("connect_error");
        socket.off("disconnect");
        socket.off("message:new", handleNewMessage);
        socket.off("user:status", handleUserStatus);
        socket.off("user:typing", handleTyping);
        socket.off("conversation:new", handleNewConversation);
        socket.off("conversation:update", handleUpdateConversation);
        socket.disconnect();
      }
    };
  }, [accessToken, currentConversation?._id]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await getConversations();
      setConversations(response);
    } catch (error) {
      antMessage.error("Không thể tải danh sách cuộc trò chuyện");
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      setLoading(true);
      const response = await getMessages(conversationId);
      setMessages(response.reverse());
      scrollToBottom();
    } catch (error) {
      antMessage.error("Không thể tải tin nhắn");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConversation = async (conversation) => {
    if (currentConversation) {
      socketRef.current.emit("leave:conversation", currentConversation._id);
    }

    setCurrentConversation(conversation);
    await fetchMessages(conversation._id);
    socketRef.current.emit("join:conversation", conversation._id);
  };

  const handleSendMessage = async () => {
    if (!messageContent.trim() || !currentConversation) return;
  
    const tempMessage = {
      _id: Date.now(), // temporary ID
      conversation_id: currentConversation._id,
      sender_id: user,
      content: messageContent.trim(),
      createdAt: new Date(),
    };
  
    try {
      setSending(true);
      setMessageContent(""); // Clear input ngay lập tức
      
      // Cập nhật UI ngay lập tức
      setMessages(prev => [...prev, tempMessage]);
      scrollToBottom();
  
      // Gửi tin nhắn lên server
      const response = await sendMessage({
        conversation_id: currentConversation._id,
        content: messageContent.trim(),
      });
  
      // Cập nhật lại message với data từ server
      setMessages(prev => 
        prev.map(msg => 
          msg._id === tempMessage._id ? response : msg
        )
      );
    } catch (error) {
      // Nếu gửi thất bại, xóa tin nhắn tạm
      setMessages(prev => prev.filter(msg => msg._id !== tempMessage._id));
      antMessage.error("Không thể gửi tin nhắn");
      setMessageContent(tempMessage.content); // Khôi phục nội dung
    } finally {
      setSending(false);
    }
  };

  const handleTyping = () => {
    if (!currentConversation) return;

    socketRef.current.emit("typing:start", { 
      conversation_id: currentConversation._id 
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current.emit("typing:end", { 
        conversation_id: currentConversation._id 
      });
    }, 2000);
  };

  const renderLastActive = (userId) => {
    const isOnline = onlineUsers.has(userId);
    if (isOnline) {
      return "Đang hoạt động";
    }

    const user = currentConversation?.user1_id._id === userId 
      ? currentConversation?.user1_id 
      : currentConversation?.user2_id;

    if (user?.lastActive) {
      return `Hoạt động ${dayjs(user.lastActive).fromNow()}`;
    }

    return "Không hoạt động";
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
      
      setConversations(prev => {
        const exists = prev.some(conv => conv._id === response._id);
        if (!exists) {
          return [response, ...prev];
        }
        return prev;
      });
      
      setCurrentConversation(response);
      await fetchMessages(response._id);
      setSearchText("");
      setSearchResults([]);
    } catch (error) {
      antMessage.error("Không thể tạo cuộc trò chuyện mới");
    } finally {
      setLoading(false);
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
                      src={`${staticURL}/${item.avatar_path}`}
                      icon={<UserOutlined />}
                      style={{ marginRight: 8 }}
                    />
                    <span>{item.username}</span>
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
              {searchText && searchResults.length > 0 ? (
                <List
                  itemLayout="horizontal"
                  dataSource={searchResults}
                  renderItem={(item) => (
                    <List.Item
                      style={{ padding: "8px 16px", cursor: "pointer" }}
                      onClick={() => handleStartConversation(item)}
                    >
                      <List.Item.Meta
                        avatar={
                          <Avatar
                            src={`${staticURL}/${item.avatar_path}`}
                            icon={<UserOutlined />}
                          />
                        }
                        title={`${item.first_name} ${item.last_name}`}
                        description={
                          <Space direction="vertical" size={0}>
                            <Text type="secondary">{item.username}</Text>
                            <Text type="secondary">{item.email}</Text>
                          </Space>
                        }
                      />
                      <Button type="link" icon={<PlusCircleOutlined />}>
                        Nhắn tin
                      </Button>
                    </List.Item>
                  )}
                />
              ) : (
                <List
                  dataSource={conversations}
                  renderItem={(conversation) => {
                    const otherUser =
                      conversation.user1_id._id === user._id
                        ? conversation.user2_id
                        : conversation.user1_id;

                    return (
                      <List.Item
                        onClick={() => handleSelectConversation(conversation)}
                        style={{
                          padding: "12px 16px",
                          cursor: "pointer",
                          background:
                            currentConversation?._id === conversation._id
                              ? "#e6f7ff"
                              : "transparent",
                        }}
                      >
                        <List.Item.Meta
                          avatar={
                            <Badge
                              dot
                              status={
                                onlineUsers.has(otherUser._id)
                                  ? "success"
                                  : "default"
                              }
                              offset={[-5, 32]}
                            >
                              <Avatar
                                size={40}
                                src={`${staticURL}/${otherUser.avatar_path}`}
                                icon={<UserOutlined />}
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
                              >{`${otherUser.first_name} ${otherUser.last_name}`}</Text>
                              {conversation.last_message_at && (
                                <Text
                                  type="secondary"
                                  style={{ fontSize: "12px" }}
                                >
                                  {dayjs(conversation.last_message_at).fromNow()}
                                </Text>
                              )}
                            </Space>
                          }
                          description={
                            <Space direction="vertical" size={0}>
                              <Text
                                type="secondary"
                                ellipsis
                                style={{ width: 200 }}
                              >
                                {conversation.last_message || "Chưa có tin nhắn"}
                              </Text>
                            </Space>
                          }
                        />
                      </List.Item>
                    );
                  }}
                />
              )}
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
                          ? `${staticURL}/${currentConversation.user2_id.avatar_path}`
                          : `${staticURL}/${currentConversation.user1_id.avatar_path}`
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
                    {messages.map((msg) => (
                      <div
                        key={msg._id}
                        style={{
                          marginBottom: "16px",
                          display: "flex",
                          justifyContent:
                            msg.sender_id._id === user._id
                              ? "flex-end"
                              : "flex-start",
                        }}
                      >
                        {msg.sender_id._id !== user._id && (
                          <Avatar
                            size={32}
                            style={{ marginRight: 8, marginTop: 4 }}
                            src={`${staticURL}/${msg.sender_id.avatar_path}`}
                            icon={<UserOutlined />}
                          />
                        )}
                        <div
                          style={{
                            maxWidth: "70%",
                            padding: "8px 12px",
                            borderRadius: "16px",
                            background:
                              msg.sender_id._id === user._id
                                ? "#1890ff"
                                : "#fff",
                            color:
                              msg.sender_id._id === user._id
                                ? "#fff"
                                : "inherit",
                            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
                          }}
                        >
                          <div style={{ marginBottom: 4 }}>{msg.content}</div>
                          <Tooltip
                            title={dayjs(msg.createdAt).format(
                              "DD/MM/YYYY HH:mm"
                            )}
                          >
                            <Text
                              type={
                                msg.sender_id._id === user._id
                                  ? "white"
                                  : "secondary"
                              }
                              style={{ fontSize: "12px" }}
                            >
                              {dayjs(msg.createdAt).fromNow()}
                            </Text>
                          </Tooltip>
                        </div>
                      </div>
                    ))}
                    {typingUsers.size > 0 && (
                      <div style={{ padding: "8px 0" }}>
                        <Text type="secondary" italic>
                          Đang nhập tin nhắn...
                        </Text>
                      </div>
                    )}
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
                <Space.Compact style={{ width: "100%" }}>
                  <Button
                    icon={<PaperClipOutlined />}
                    style={{ borderRight: 0 }}
                  />
                  <Button icon={<SmileOutlined />} style={{ borderRight: 0 }} />
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
                    style={{
                      resize: "none",
                      padding: "8px 11px",
                    }}
                  />
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={handleSendMessage}
                    loading={sending}
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
    </Card>
  );
};

export default Message;