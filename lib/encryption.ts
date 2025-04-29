import CryptoJS from "crypto-js"

interface EncryptOptions {
  highSecurity?: boolean;
}

export function encryptMessage(message: string, key: string, options: EncryptOptions = {}) {
  try {
    const salt = CryptoJS.lib.WordArray.random(128 / 8)
    
    const iterations = options.highSecurity ? 10000 : 1000;
    
    const derivedKey = CryptoJS.PBKDF2(key, salt, {
      keySize: 256 / 32,
      iterations: iterations,
    })

    const iv = CryptoJS.lib.WordArray.random(128 / 8)

    const messageObj = {
      content: message,
      created: new Date().toISOString(),
      highSecurity: options.highSecurity || false,
    }

    // Añadir firma para verificación de integridad
    const messageStr = JSON.stringify(messageObj)
    const hmac = CryptoJS.HmacSHA256(messageStr, derivedKey).toString()

    const encrypted = CryptoJS.AES.encrypt(messageStr, derivedKey, {
      iv: iv,
      padding: CryptoJS.pad.Pkcs7,
      mode: CryptoJS.mode.CBC,
    })

    const metaInfo = {
      v: 2, 
      hs: options.highSecurity ? 1 : 0, 
      it: iterations, 
    }
    const metaInfoStr = JSON.stringify(metaInfo)
    const encodedMeta = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(metaInfoStr))

    const result = salt.toString() + iv.toString() + encodedMeta + ":" + hmac + ":" + encrypted.toString()
    return result
  } catch (error) {
    console.error("Encryption error:", error)
    throw new Error("Failed to encrypt message")
  }
}

export function decryptMessage(encryptedMessage: string, key: string) {
  try {
    let salt, iv, encrypted, iterations = 1000, hmac, isHighSecurity = false;
    let tampered = false;
    
    if (encryptedMessage.includes(':')) {
      const saltEnd = 32;
      const ivEnd = saltEnd + 32;
      
      salt = CryptoJS.enc.Hex.parse(encryptedMessage.substr(0, saltEnd));
      iv = CryptoJS.enc.Hex.parse(encryptedMessage.substr(saltEnd, 32));
      
      const parts = encryptedMessage.substring(ivEnd).split(':');
      if (parts.length !== 3) {
        throw new Error("Invalid encrypted message format");
      }
      
      const metaInfoBase64 = parts[0];
      hmac = parts[1];
      encrypted = parts[2];
      
      try {
        const metaInfoStr = CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Base64.parse(metaInfoBase64));
        const metaInfo = JSON.parse(metaInfoStr);
        iterations = metaInfo.it || 1000;
        isHighSecurity = metaInfo.hs === 1;
      } catch (e) {
        console.error("Error parsing meta info", e);
      }
    } else {
      salt = CryptoJS.enc.Hex.parse(encryptedMessage.substr(0, 32));
      iv = CryptoJS.enc.Hex.parse(encryptedMessage.substr(32, 32));
      encrypted = encryptedMessage.substring(64);
    }

    const derivedKey = CryptoJS.PBKDF2(key, salt, {
      keySize: 256 / 32,
      iterations: iterations,
    })

    const decrypted = CryptoJS.AES.decrypt(encrypted, derivedKey, {
      iv: iv,
      padding: CryptoJS.pad.Pkcs7,
      mode: CryptoJS.mode.CBC,
    })

    let decryptedText;
    try {
      decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
      
      if (!decryptedText) {
        throw new Error("Decryption failed - likely incorrect key");
      }
    } catch (utf8Error) {
      console.error("UTF-8 decoding error:", utf8Error);
      throw new Error("The file contains invalid characters or is corrupted. It might not be an encrypted file or the key is incorrect.");
    }

    const messageObj = JSON.parse(decryptedText);
    
    if (hmac) {
      const calculatedHmac = CryptoJS.HmacSHA256(decryptedText, derivedKey).toString();
      if (calculatedHmac !== hmac) {
        tampered = true;
      }
    }
    
    return {
      message: messageObj.content,
      isHighSecurity,
      tampered,
      created: messageObj.created,
    }
  } catch (error) {
    console.error("Decryption error:", error);
    throw error;
  }
}

export function generateSecureKey(length = 16): string {
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+[]{}|;:,.<>?"
  const charsetLength = charset.length
  let result = ''
  
  const randomBytes = CryptoJS.lib.WordArray.random(length)
  const hexString = randomBytes.toString()
  
  for (let i = 0; i < length; i++) {
    const randomIndex = parseInt(hexString.substr(i * 2, 2), 16) % charsetLength
    result += charset[randomIndex]
  }
  
  return result
}

export function calculatePasswordStrength(password: string): number {
  if (!password) return 0
  
  let strength = 0
  
  if (password.length >= 8) strength += 25
  else return Math.min(25, password.length * 3)
  
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25
  if (/[0-9]/.test(password)) strength += 25
  if (/[^A-Za-z0-9]/.test(password)) strength += 25
  
  return strength
}

export function createShareableLink(encryptedContent: string, includePassword?: string): string {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const encodedContent = encodeURIComponent(encryptedContent)
  
  if (includePassword) {
    const encodedPassword = encodeURIComponent(
      Buffer.from(includePassword).toString('base64')
    )
    return `${baseUrl}/?share=${encodedContent}&key=${encodedPassword}`
  }
  
  return `${baseUrl}/?share=${encodedContent}`
}

export function extractSharedContent(url: string): { content: string | null, key: string | null } {
  if (typeof window === 'undefined') return { content: null, key: null }
  
  try {
    const urlParams = new URLSearchParams(window.location.search)
    const sharedContent = urlParams.get('share')
    const encodedKey = urlParams.get('key')
    
    let key = null
    if (encodedKey) {
      try {
        key = Buffer.from(decodeURIComponent(encodedKey), 'base64').toString()
      } catch (e) {
        console.error("Error decoding key:", e)
      }
    }
    
    return { 
      content: sharedContent ? decodeURIComponent(sharedContent) : null,
      key
    }
  } catch (error) {
    console.error("Error extracting shared content:", error)
    return { content: null, key: null }
  }
}

