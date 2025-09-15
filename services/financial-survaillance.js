const axios = require('axios');

class FinancialSurveillanceService {
    constructor() {
        this.fscaApiUrl = process.env.FSCA_API_URL;
        this.fscaApiKey = process.env.FSCA_API_KEY;
    }

    async checkCompliance(userData, transactionData) {
        // Check if user or transaction is flagged for financial surveillance
        try {
            const response = await axios.post(`${this.fscaApiUrl}/compliance/check`, {
                user_data: userData,
                transaction_data: transactionData
            }, {
                headers: {
                    'Authorization': `Bearer ${this.fscaApiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            return response.data;
        } catch (error) {
            console.error('FSCA compliance check failed:', error.message);
            
            // Fallback to basic compliance check
            return this.basicComplianceCheck(userData, transactionData);
        }
    }

    basicComplianceCheck(userData, transactionData) {
        // Basic compliance rules for South Africa
        const complianceResult = {
            compliant: true,
            warnings: [],
            restrictions: []
        };

        // Check for large transactions (FICA requirements)
        if (transactionData.amount > 25000) { // ZAR 25,000 threshold
            complianceResult.warnings.push('Large transaction amount requires additional verification');
        }

        // Check if user is a Politically Exposed Person (PEP)
        if (userData.is_pep) {
            complianceResult.warnings.push('User is a Politically Exposed Person (PEP)');
            complianceResult.restrictions.push('Enhanced due diligence required');
        }

        // Check for suspicious transaction patterns
        if (this.detectSuspiciousPattern(transactionData)) {
            complianceResult.warnings.push('Suspicious transaction pattern detected');
            complianceResult.restrictions.push('Transaction pending review');
        }

        if (complianceResult.warnings.length > 0 || complianceResult.restrictions.length > 0) {
            complianceResult.compliant = false;
        }

        return complianceResult;
    }

    detectSuspiciousPattern(transactionData) {
        // Basic pattern detection for suspicious activities
        const patterns = [
            // Multiple rapid transactions
            (data) => data.frequency > 10, // More than 10 transactions in short period
            
            // Just below reporting threshold
            (data) => data.amount > 24000 && data.amount < 25000, // Just below FICA threshold
            
            // Unusual time patterns
            (data) => {
                const hour = new Date(data.timestamp).getHours();
                return hour < 6 || hour > 22; // Transactions during unusual hours
            }
        ];

        return patterns.some(pattern => pattern(transactionData));
    }

    async reportSuspiciousActivity(activityData) {
        // Report to Financial Intelligence Centre (FIC)
        try {
            const response = await axios.post(`${this.fscaApiUrl}/report/suspicious`, {
                activity_data: activityData,
                reporter_id: process.env.MERCHANT_ID,
                timestamp: new Date().toISOString()
            }, {
                headers: {
                    'Authorization': `Bearer ${this.fscaApiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            return response.data;
        } catch (error) {
            console.error('Failed to report suspicious activity:', error.message);
            throw new Error('Suspicious activity reporting failed');
        }
    }
}

module.exports = new FinancialSurveillanceService();
