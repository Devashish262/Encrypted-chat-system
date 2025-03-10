const Message = require('../models/Message');
const User = require('../models/User');
const { encrypt, decrypt } = require('../utils/encryption');

// Send a message
exports.sendMessage = async (req, res) => {
  try {
    const { recipientId, content, priority = 0 } = req.body;
    const senderId = req.userId;

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    // Get recipient's public key for encryption
    const recipientPublicKey = Buffer.from(recipient.publicKey, 'hex');

    // Encrypt the message content
    const { encryptedMessage, iv } = encrypt(content, recipientPublicKey);

    // Create a new message
    const newMessage = new Message({
      sender: senderId,
      recipient: recipientId,
      content: encryptedMessage,
      iv,
      priority
    });

    await newMessage.save();

    res.status(201).json({
      id: newMessage._id,
      sender: senderId,
      recipient: recipientId,
      priority,
      createdAt: newMessage.createdAt
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error while sending message' });
  }
};

// Get conversation with a user
exports.getConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.userId;

    // Validate the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get messages between current user and the other user
    const messages = await Message.find({
      $or: [
        { sender: currentUserId, recipient: userId },
        { sender: userId, recipient: currentUserId }
      ]
    })
    .sort({ createdAt: 1 })
    .select('sender recipient content iv priority read createdAt');

    // Get current user's private key for decryption
    const currentUser = await User.findById(currentUserId);
    const privateKey = Buffer.from(currentUser.publicKey, 'hex'); // In a real app, private key would be separate from public key

    // Decrypt messages sent to the current user
    const decryptedMessages = messages.map(message => {
      // Clone the message to a plain object
      const msg = message.toObject();
      
      // If current user is the recipient, decrypt the message
      if (msg.recipient.toString() === currentUserId) {
        try {
          msg.content = decrypt(msg.content, msg.iv, privateKey);
        } catch (error) {
          console.error('Error decrypting message:', error);
          msg.content = 'Message could not be decrypted';
        }
      }
      
      return msg;
    });

    // Mark messages as read
    await Message.updateMany(
      { sender: userId, recipient: currentUserId, read: false },
      { read: true }
    );

    res.json(decryptedMessages);
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ message: 'Server error while fetching conversation' });
  }
};

// Socket.io message handler
exports.handleMessage = async (io, message) => {
  try {
    const { senderId, recipientId, content, priority = 0 } = message;

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      throw new Error('Recipient not found');
    }

    // Get recipient's public key for encryption
    const recipientPublicKey = Buffer.from(recipient.publicKey, 'hex');

    // Encrypt the message content
    const { encryptedMessage, iv } = encrypt(content, recipientPublicKey);

    // Create a new message
    const newMessage = new Message({
      sender: senderId,
      recipient: recipientId,
      content: encryptedMessage,
      iv,
      priority
    });

    await newMessage.save();

    // Emit to recipient if they are online
    io.to(recipientId).emit('message', {
      id: newMessage._id,
      sender: senderId,
      content: encryptedMessage, // Client will decrypt
      iv,
      priority,
      createdAt: newMessage.createdAt
    });

    // Emit confirmation to the sender
    io.to(senderId).emit('message-sent', {
      id: newMessage._id,
      recipient: recipientId,
      timestamp: newMessage.createdAt
    });

    return newMessage;
  } catch (error) {
    console.error('Socket message handling error:', error);
    throw error;
  }
};

// Get all conversations for the current user
exports.getAllConversations = async (req, res) => {
  try {
    const userId = req.userId;

    // Find all unique users the current user has exchanged messages with
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: mongoose.Types.ObjectId(userId) }, { recipient: mongoose.Types.ObjectId(userId) }]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', mongoose.Types.ObjectId(userId)] },
              '$recipient',
              '$sender'
            ]
          },
          lastMessage: { $first: '$$ROOT' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      {
        $unwind: '$userDetails'
      },
      {
        $project: {
          _id: 1,
          username: '$userDetails.username',
          avatar: '$userDetails.avatar',
          status: '$userDetails.status',
          lastMessage: {
            _id: '$lastMessage._id',
            content: '$lastMessage.content',
            iv: '$lastMessage.iv',
            sender: '$lastMessage.sender',
            recipient: '$lastMessage.recipient',
            createdAt: '$lastMessage.createdAt',
            read: '$lastMessage.read'
          }
        }
      }
    ]);

    // Count unread messages for each conversation
    const conversationsWithUnreadCount = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          sender: conv._id,
          recipient: userId,
          read: false
        });
        
        return {
          ...conv,
          unreadCount
        };
      })
    );

    res.json(conversationsWithUnreadCount);
  } catch (error) {
    console.error('Get all conversations error:', error);
    res.status(500).json({ message: 'Server error while fetching conversations' });
  }
}; 