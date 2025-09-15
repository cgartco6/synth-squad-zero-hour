const axios = require('axios');
const crypto = require('crypto');

class FNBIntegration {
    constructor() {
        this.apiUrl = process.env.FNB_API_URL || 'https://api.fnb.co.za';
        this.clientId = process.env.FNB_CLIENT_ID;
        this.clientSecret = process.env.FNB_CLIENT_SECRET;
        this.merchantId = process.env.FNB_MERCHANT_ID;
    }

    async authenticate() {
        try {
            const response = await axios.post(`${this.apiUrl}/auth/token`, {
                grant_type: 'client_credentials',
                client_id: this.clientId,
                client_secret: this.clientSecret
            });

            this.accessToken = response.data.access_token;
            this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);
            
            return this.accessToken;
        } catch (error) {
            console.error('FNB authentication failed:', error.message);
            throw new Error('Failed to authenticate with FNB');
        }
    }

    async ensureAuthenticated() {
        if (!this.accessToken || Date.now() >= this.tokenExpiry) {
            await this.authenticate();
        }
    }

    async makePayment(recipientAccount, amount, reference) {
        await this.ensureAuthenticated();

        try {
            const paymentData = {
                merchant_id: this.merchantId,
                recipient_account: recipientAccount,
                amount: amount,
                currency: 'ZAR',
                reference: reference,
                timestamp: new Date().toISOString()
            };

            // Generate signature for security
            const signature = this.generateSignature(paymentData);
            paymentData.signature = signature;

            const response = await axios.post(`${this.apiUrl}/payments/transfer`, paymentData, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            return {
                success: true,
                transactionId: response.data.transaction_id,
                status: response.data.status
            };
        } catch (error) {
            console.error('FNB payment failed:', error.message);
            return {
                success: false,
                error: error.response?.data?.message || 'Payment failed'
            };
        }
    }

    generateSignature(data) {
        const payload = `${data.merchant_id}${data.recipient_account}${data.amount}${data.reference}${data.timestamp}`;
        return crypto
            .createHmac('sha256', this.clientSecret)
            .update(payload)
            .digest('hex');
    }

    async validateAccount(accountNumber) {
        await this.ensureAuthenticated();

        try {
            const response = await axios.get(`${this.apiUrl}/accounts/validate/${accountNumber}`, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            return {
                valid: response.data.valid,
                accountName: response.data.account_name,
                accountType: response.data.account_type
            };
        } catch (error) {
            console.error('FNB account validation failed:', error.message);
            return {
                valid: false,
                error: error.response?.data?.message || 'Validation failed'
            };
        }
    }
}

module.exports = new FNBIntegration();
