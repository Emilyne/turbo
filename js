let jsonData = [];

document.addEventListener('DOMContentLoaded', function() {
    const jsonFilePath = 'pnl.json';

    fetch(jsonFilePath)
        .then(response => response.json())
        .then(data => {
            jsonData = data;
            populateTokenOptions(jsonData);
        })
        .catch(error => {
            console.error('Error fetching JSON data:', error);
        });

    const simulateProfitButton = document.getElementById('simulateProfit');
    simulateProfitButton.addEventListener('click', (event) => {
        event.preventDefault();
        handleSimulation();
    });
});

function populateTokenOptions(data) {
    const tokenSelection = document.getElementById('tokenSelection');
    tokenSelection.innerHTML = '';

    if (data && Array.isArray(data)) {
        data.forEach(token => {
            const option = document.createElement('option');
            option.value = token.address;
            option.textContent = token.token;
            tokenSelection.appendChild(option);
        });

        if (tokenSelection.options.length === 0) {
            tokenSelection.innerHTML = '<option disabled selected value="">No valid tokens available</option>';
        }
    } else {
        console.error('Invalid or missing JSON data.');
    }
}

function getTokenData(selectedTokenAddress) {
    return jsonData.find(token => token.address === selectedTokenAddress);
}

function handleSimulation() {
    const selectedTokenAddress = document.getElementById('tokenSelection').value;
    const initialInvestmentInput = document.getElementById('initialInvestment');
    const exclusionCriteriaCheckboxes = document.querySelectorAll('input[name="exclusionCriteria"]');
    const profitResultElement = document.getElementById('profitResult');
    
    // Checks
    const initialInvestment = parseFloat(initialInvestmentInput.value);
    if (isNaN(initialInvestment) || initialInvestment <= 0) {
        profitResultElement.innerHTML = 'Enter a valid investment amount.';
        return;
    }

    if (!selectedTokenAddress) {
        profitResultElement.innerHTML = 'Select a token.';
        return;
    }

    const selectedTokenData = getTokenData(selectedTokenAddress);
    if (!selectedTokenData) {
        profitResultElement.innerHTML = 'Invalid token selected.';
        return;
    }

    const exclusionReasons = [];
    exclusionCriteriaCheckboxes.forEach(checkbox => {
        if (checkbox.checked) {
            switch (checkbox.value) {
                case 'zeroNegativeMarketCap':
                    if (selectedTokenData.mc_now <= 0 || selectedTokenData.mc <= 0) {
                        exclusionReasons.push('Negative or zero market cap.');
                    }
                    break;
                case 'incompleteMissingData':
                    if (!selectedTokenData.mc || !selectedTokenData.mc_now || !selectedTokenData.x_now) {
                        exclusionReasons.push('Incomplete or missing data.');
                    }
                    break;
                case 'monitoringDisabled':
                    if (!selectedTokenData.monitor) {
                        exclusionReasons.push('Monitoring disabled.');
                    }
                    break;
            }
        }
    });

    // Calculate result
    if (exclusionReasons.length === 0) {
        const growthFactor = selectedTokenData.mc_now / selectedTokenData.mc;
        const profit = initialInvestment * growthFactor - initialInvestment;
        profitResultElement.innerHTML = `Result: $${profit.toFixed(2)}`;
    } else {
        profitResultElement.innerHTML = `Cannot estimate profit due to exclusion criteria: ${exclusionReasons.join(', ')}`;
    }
}

