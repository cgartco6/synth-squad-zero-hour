const crypto = require('crypto');

class SecureConfigLoader {
    constructor() {
        this.encryptionKey = process.env.CONFIG_ENCRYPTION_KEY;
        this.ivLength = 16;
    }

    encrypt(text) {
        if (!this.encryptionKey) {
            throw new Error('Encryption key not configured');
        }

        const iv = crypto.randomBytes(this.ivLength);
        const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(this.encryptionKey, 'hex'), iv);
        
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const authTag = cipher.getAuthTag();
        
        return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
    }

    decrypt(encryptedText) {
        if (!this.encryptionKey) {
            throw new Error('Encryption key not configured');
        }

        const parts = encryptedText.split(':');
        const iv = Buffer.from(parts[0], 'hex');
        const authTag = Buffer.from(parts[1], 'hex');
        const encrypted = parts[2];
        
        const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(this.encryptionKey, 'hex'), iv);
        decipher.setAuthTag(authTag);
        
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    }

    loadSecureConfig() {
        // Load and decrypt sensitive configuration
        const secureConfig = {};

        // Example: Decrypt database password
        if (process.env.DB_PASSWORD_ENCRYPTED) {
            secureConfig.DB_PASSWORD = this.decrypt(process.env.DB_PASSWORD_ENCRYPTED);
        }

        // Decrypt API keys
        const encryptedKeys = [
            'FNB_CLIENT_SECRET', 'ABSA_CLIENT_SECRET', 'STANDARDBANK_CLIENT_SECRET',
            'NEDBANK_CLIENT_SECRET', 'CAPITEC_CLIENT_SECRET', 'PAYFAST_PASSPHRASE',
            'OZOW_PRIVATE_KEY', 'SNAPSCAN_API_KEY', 'VALR_API_SECRET', 'LUNO_API_SECRET',
            'FSCA_API_KEY', 'FIC_API_KEY', 'EXCHANGERATE_API_KEY', 'BULKSMS_API_KEY'
        ];

        encryptedKeys.forEach(key => {
            if (process.env[`${key}_ENCRYPTED`]) {
                secureConfig[key] = this.decrypt(process.env[`${key}_ENCRYPTED`]);
            }
        });

        return secureConfig;
    }
}

module.exports = new SecureConfigLoader();
