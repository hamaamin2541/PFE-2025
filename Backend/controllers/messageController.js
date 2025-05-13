import Message from '../models/Message.js';
import User from '../models/User.js';

// Send a new message
export const sendMessage = async (req, res) => {
  try {
    const { recipientId, subject, content } = req.body;

    if (!recipientId || !subject || !content) {
      return res.status(400).json({
        success: false,
        message: 'Please provide recipient, subject and content'
      });
    }

    // Check if sender is trying to message themselves
    if (recipientId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot send a message to yourself'
      });
    }

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Recipient not found'
      });
    }

    // Create message for recipient's inbox
    const inboxMessage = new Message({
      sender: req.user._id,
      recipient: recipientId,
      subject,
      content,
      folder: 'inbox'
    });

    // Create a copy in sender's sent folder
    const sentMessage = new Message({
      sender: req.user._id,
      recipient: recipientId,
      subject,
      content,
      folder: 'sent',
      read: true // Automatically mark as read for the sender
    });

    await Promise.all([inboxMessage.save(), sentMessage.save()]);

    // Populate sender info for the response
    await inboxMessage.populate('sender', 'fullName email profileImage');

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: inboxMessage
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending message',
      error: error.message
    });
  }
};

// Get messages for the current user
export const getMessages = async (req, res) => {
  try {
    const { folder = 'inbox' } = req.query;

    let query;
    if (folder === 'inbox') {
      query = { recipient: req.user._id, folder: 'inbox' };
    } else if (folder === 'sent') {
      query = { sender: req.user._id, folder: 'sent' };
    } else if (folder === 'trash') {
      query = {
        $or: [
          { recipient: req.user._id, folder: 'trash' },
          { sender: req.user._id, folder: 'trash' }
        ]
      };
    } else if (folder === 'starred') {
      query = {
        $or: [
          { recipient: req.user._id, starred: true },
          { sender: req.user._id, starred: true }
        ]
      };
    }

    const messages = await Message.find(query)
      .populate('sender', 'fullName email profileImage')
      .populate('recipient', 'fullName email profileImage')
      .sort('-createdAt')
      .lean();

    res.status(200).json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching messages',
      error: error.message
    });
  }
};

// Mark message as read
export const markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if the user is the recipient
    if (message.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this message'
      });
    }

    message.read = true;
    await message.save();

    res.status(200).json({
      success: true,
      message: 'Message marked as read'
    });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating message',
      error: error.message
    });
  }
};

// Move message to trash
export const moveToTrash = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if the user is the sender or recipient
    if (message.recipient.toString() !== req.user._id.toString() &&
        message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this message'
      });
    }

    message.folder = 'trash';
    await message.save();

    res.status(200).json({
      success: true,
      message: 'Message moved to trash'
    });
  } catch (error) {
    console.error('Error moving message to trash:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating message',
      error: error.message
    });
  }
};

// Toggle starred status
export const toggleStarred = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if the user is the sender or recipient
    if (message.recipient.toString() !== req.user._id.toString() &&
        message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this message'
      });
    }

    message.starred = !message.starred;
    await message.save();

    res.status(200).json({
      success: true,
      message: `Message ${message.starred ? 'starred' : 'unstarred'}`
    });
  } catch (error) {
    console.error('Error toggling starred status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating message',
      error: error.message
    });
  }
};

// Get count of unread messages
export const getUnreadCount = async (req, res) => {
  try {
    // Count unread messages in the user's inbox
    const count = await Message.countDocuments({
      recipient: req.user._id,
      folder: 'inbox',
      read: false
    });

    res.status(200).json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Error counting unread messages:', error);
    res.status(500).json({
      success: false,
      message: 'Error counting unread messages',
      error: error.message
    });
  }
};
