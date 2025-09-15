const axios = require('axios');

class SouthAfricanCurrencyService {
    constructor() {
        this.baseCurrency = 'ZAR';
        this.supportedCurrencies = ['USD', 'EUR', 'GBP', 'ZAR'];
        this.exchangeRates = {};
        this.lastUpdated = null;
    }

    async initialize() {
        await this.updateExchangeRates();
        // Update rates every hour
        setInterval(() => this.updateExchangeRates(), 3600000);
    }

    async updateExchangeRates() {
        try {
            // Use South African Reserve Bank API or other reliable source
            const response = await axios.get('https://api.resbank.co.za/LatestRates');
            
            this.exchangeRates = {
                USD: response.data.rates.USD,
                EUR: response.data.rates.EUR,
                GBP: response.data.rates.GBP,
                ZAR: 1 // Base currency
            };
            
            this.lastUpdated = new Date();
            console.log('Exchange rates updated successfully');
        } catch (error) {
            console.error('Failed to update exchange rates:', error.message);
            // Fallback to fixed rates if API fails
            this.exchangeRates = {
                USD: 18.50, // Example rate: 1 USD = 18.50 ZAR
                EUR: 20.25, // Example rate: 1 EUR = 20.25 ZAR
                GBP: 23.10, // Example rate: 1 GBP = 23.10 ZAR
                ZAR: 1
            };
        }
    }

    convertToZAR(amount, fromCurrency) {
        if (!this.exchangeRates[fromCurrency]) {
            throw new Error(`Unsupported currency: ${fromCurrency}`);
        }
        
        return amount * this.exchangeRates[fromCurrency];
    }

    convertFromZAR(amount, toCurrency) {
        if (!this.exchangeRates[toCurrency]) {
            throw new Error(`Unsupported currency: ${toCurrency}`);
        }
        
        return amount / this.exchangeRates[toCurrency];
    }

    formatZAR(amount) {
        return new Intl.NumberFormat('en-ZA', {
            style: 'currency',
            currency: 'ZAR'
        }).format(amount);
    }
}

module.exports = new SouthAfricanCurrencyService();
