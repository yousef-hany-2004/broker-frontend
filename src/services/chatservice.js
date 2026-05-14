import axiosInstance from "./axiosInstance";

/**
 * Get total unread message count across ALL conversations (for Home badge)
 */
export const getChatUnreadCount = async () => {
  const res = await axiosInstance.get("/api/v1/Chat/unread-count");
  return res.data;
};

/**
 * Get unread count for a specific booking conversation
 */
export const getConversationUnreadCount = async (bookingId) => {
  const res = await axiosInstance.get(
    `/api/v1/Chat/conversations/${bookingId}/unread-count`
  );
  return res.data;
};

/**
 * Get messages for a booking conversation
 * @param {string} bookingId
 * @param {object} params - { PageNumber, PageSize }
 */
export const getMessages = async (bookingId, params = {}) => {
  const res = await axiosInstance.get(
    `/api/v1/Chat/conversations/${bookingId}/messages`,
    { params }
  );
  return res.data;
};

/**
 * Send a message in a booking conversation
 * @param {string} bookingId
 * @param {string} content
 */
export const sendMessage = async (bookingId, content) => {
  const res = await axiosInstance.post(
    `/api/v1/Chat/conversations/${bookingId}/messages`,
    { content }
  );
  return res.data;
};

/**
 * Mark all messages in a conversation as read
 */
export const markConversationAsRead = async (bookingId) => {
  const res = await axiosInstance.patch(
    `/api/v1/Chat/conversations/${bookingId}/messages/read`
  );
  return res.data;
};

/**
 * Delete a specific message
 */
export const deleteMessage = async (bookingId, messageId) => {
  const res = await axiosInstance.delete(
    `/api/v1/Chat/conversations/${bookingId}/messages/${messageId}`
  );
  return res.data;
};
