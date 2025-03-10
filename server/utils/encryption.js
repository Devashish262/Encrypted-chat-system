const crypto = require('crypto');

// Algorithm and length constants
const ALGORITHM = 'aes-256-cbc';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits

/**
 * Generate a secure encryption key
 * @returns {Buffer} The generated key
 */
const generateKey = () => {
  return crypto.randomBytes(KEY_LENGTH);
};

/**
 * Encrypt a message using AES-256-CBC
 * @param {string} message - The message to encrypt
 * @param {Buffer} key - The encryption key
 * @returns {Object} - Object containing iv and encrypted message
 */
const encrypt = (message, key) => {
  // Generate a random initialization vector
  const iv = crypto.randomBytes(IV_LENGTH);
  
  // Create cipher with key and iv
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  // Encrypt the message
  let encrypted = cipher.update(message, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return {
    iv: iv.toString('hex'),
    encryptedMessage: encrypted
  };
};

/**
 * Decrypt a message using AES-256-CBC
 * @param {string} encryptedMessage - The encrypted message
 * @param {string} iv - The initialization vector in hex
 * @param {Buffer} key - The encryption key
 * @returns {string} - The decrypted message
 */
const decrypt = (encryptedMessage, iv, key) => {
  // Convert hex iv to buffer
  const ivBuffer = Buffer.from(iv, 'hex');
  
  // Create decipher with key and iv
  const decipher = crypto.createDecipheriv(ALGORITHM, key, ivBuffer);
  
  // Decrypt the message
  let decrypted = decipher.update(encryptedMessage, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};

module.exports = {
  generateKey,
  encrypt,
  decrypt
}; 