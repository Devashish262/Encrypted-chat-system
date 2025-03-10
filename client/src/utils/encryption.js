import CryptoJS from 'crypto-js';

/**
 * Generate a random encryption key
 * @returns {string} The generated key in hex format
 */
export const generateKey = () => {
  const randomWordArray = CryptoJS.lib.WordArray.random(32); // 256 bits
  return randomWordArray.toString(CryptoJS.enc.Hex);
};

/**
 * Encrypt a message using AES-256
 * @param {string} message - The message to encrypt
 * @param {string} key - The encryption key in hex format
 * @returns {Object} - Object containing iv and encrypted message
 */
export const encrypt = (message, key) => {
  // Generate a random IV
  const iv = CryptoJS.lib.WordArray.random(16); // 128 bits
  
  // Convert key from hex to WordArray
  const keyWordArray = CryptoJS.enc.Hex.parse(key);
  
  // Encrypt the message
  const encrypted = CryptoJS.AES.encrypt(message, keyWordArray, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });
  
  return {
    iv: iv.toString(CryptoJS.enc.Hex),
    encryptedMessage: encrypted.toString()
  };
};

/**
 * Decrypt a message using AES-256
 * @param {string} encryptedMessage - The encrypted message
 * @param {string} iv - The initialization vector in hex
 * @param {string} key - The encryption key in hex format
 * @returns {string} - The decrypted message
 */
export const decrypt = (encryptedMessage, iv, key) => {
  // Convert key and IV from hex to WordArray
  const keyWordArray = CryptoJS.enc.Hex.parse(key);
  const ivWordArray = CryptoJS.enc.Hex.parse(iv);
  
  // Decrypt the message
  const decrypted = CryptoJS.AES.decrypt(encryptedMessage, keyWordArray, {
    iv: ivWordArray,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });
  
  return decrypted.toString(CryptoJS.enc.Utf8);
}; 