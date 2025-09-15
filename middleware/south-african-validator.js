const validator = require('validator');

class SouthAfricaValidator {
    validateIDNumber(idNumber) {
        if (!idNumber || idNumber.length !== 13) {
            return false;
        }

        // Basic validation for South African ID number
        const year = parseInt(idNumber.substring(0, 2));
        const month = parseInt(idNumber.substring(2, 4));
        const day = parseInt(idNumber.substring(4, 6));
        
        if (month < 1 || month > 12 || day < 1 || day > 31) {
            return false;
        }

        // Luhn algorithm check for South African ID
        return this.validateLuhn(idNumber);
    }

    validateLuhn(number) {
        let sum = 0;
        let shouldDouble = false;
        
        for (let i = number.length - 1; i >= 0; i--) {
            let digit = parseInt(number.charAt(i));
            
            if (shouldDouble) {
                if ((digit *= 2) > 9) digit -= 9;
            }
            
            sum += digit;
            shouldDouble = !shouldDouble;
        }
        
        return (sum % 10) === 0;
    }

    validateBankAccount(bankName, accountNumber) {
        const bankValidators = {
            fnb: (num) => num.length === 10 || num.length === 11,
            absa: (num) => num.length === 10,
            standardbank: (num) => num.length === 10 || num.length === 11,
            nedbank: (num) => num.length === 9 || num.length === 10,
            capitec: (num) => num.length === 10
        };

        if (!bankValidators[bankName]) {
            return false;
        }

        return bankValidators[bankName](accountNumber.replace(/\s/g, ''));
    }

    validateMobileNumber(phoneNumber) {
        // South African mobile numbers start with +27 or 0 followed by 6, 7, or 8
        const regex = /^(\+27|0)[6-8][0-9]{8}$/;
        return regex.test(phoneNumber.replace(/\s/g, ''));
    }
}

module.exports = new SouthAfricaValidator();
