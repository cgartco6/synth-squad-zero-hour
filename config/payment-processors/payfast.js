const axios = require('axios');
const crypto = require('crypto');

class PayFastIntegration {
    constructor() {
        this.merchantId = process.env.PAYFAST_MERCHANT_ID;
        this.merchantKey = process.env.PAYFAST_MERCHANT_KEY;
        this.passphrase = process.env.PAYFAST_PASSPHRASE;
        this.env = process.env.PAYFAST_ENV || 'sandbox';
        this.baseUrl = this.env === 'production' 
            ? 'https://www.payfast.co.za' 
            : 'https://sandbox.payfast.co.za';
    }

    generateSignature(data) {
        // Sort the data alphabetically by key
        const sortedData = {};
        Object.keys(data).sort().forEach(key => {
            sortedData[key] = data[key];
        });

        // Create parameter string
        let paramString = '';
        for (const [key, value] of Object.entries(sortedData)) {
            if (value !== '' && value !== null && key !== 'signature') {
                paramString += `${key}=${encodeURIComponent(value).replace(/%20/g, '+')}&`;
            }
        }
        
        // Remove last ampersand
        paramString = paramString.slice(0, -1);
        
        if (this.passphrase) {
            paramString += `&passphrase=${encodeURIComponent(this.passphrase)}`;
        }

        return crypto.createHash('md5').update(paramString).digest('hex');
    }

    createPaymentUrl(paymentData) {
        const requiredFields = {
            merchant_id: this.merchantId,
            merchant_key: this.merchantKey,
            return_url: paymentData.return_url || `${process.env.FRONTEND_URL}/payment/success`,
            cancel_url: paymentData.cancel_url || `${process.env.FRONTEND_URL}/payment/cancel`,
            notify_url: paymentData.notify_url || `${process.env.BACKEND_URL}/api/payment/payfast/notify`,
            name_first: paymentData.name_first,
            name_last: paymentData.name_last,
            email_address: paymentData.email_address,
            m_payment_id: paymentData.m_payment_id,
            amount: paymentData.amount.toFixed(2),
            item_name: paymentData.item_name,
            item_description: paymentData.item_description,
            custom_int1: paymentData.custom_int1 || '',
            custom_str1: paymentData.custom_str1 || ''
        };

        // Generate signature
        requiredFields.signature = this.generateSignature(requiredFields);

        // Build URL
        const urlParams = new URLSearchParams(requiredFields);
        return `${this.baseUrl}/eng/process?${urlParams.toString()}`;
    }

    async verifyPayment(paymentId) {
        try {
            const response = await axios.post(`${this.baseUrl}/eng/query/validate`, {
                merchant_id: this.merchantId,
                merchant_key: this.merchantKey,
                passphrase: this.passphrase,
                query_type: 'VALIDATE',
                payment_id: paymentId
            });

            return response.data;
        } catch (error) {
            console.error('PayFast verification failed:', error.message);
            throw new Error('Payment verification failed');
        }
    }

    handleITN(data) {
        // Verify ITN (Instant Transaction Notification)
        const signature = data.signature;
        const calculatedSignature = this.generateSignature(data);

        if (signature !== calculatedSignature) {
            throw new Error('Invalid ITN signature');
        }

        return {
            valid: true,
            paymentStatus: data.payment_status,
            amount: parseFloat(data.amount_gross),
            paymentId: data.pf_payment_id,
            merchantId: data.merchant_id
        };
    }
}

module.exports = new PayFastIntegration();
