// script.js

import { ribbonSizes, productMetadata } from './data.js';

const materialSelect = document.getElementById('material-select');
const widthSelect = document.getElementById('width-select');
const lengthSelect = document.getElementById('length-select');
const substrateFilterSelect = document.getElementById('substrate-filter');
const performanceFilterSelect = document.getElementById('performance-filter');
const priceOutput = document.getElementById('price-output');
const m2Output = document.getElementById('m2-output');
const qtyOutput = document.getElementById('qty-output');
const resultBox = document.getElementById('result-box');
const resetButton = document.getElementById('reset-button');
const printerTypeOutput = document.getElementById('printer-type-output');
const substrateTable = document.getElementById('substrate-table').getElementsByTagName('tbody')[0];
const performanceTable = document.getElementById('performance-table').getElementsByTagName('tbody')[0];
const performanceDetails = document.getElementById('performance-details');

function populateSelect(selectElement, options, placeholder) {
    selectElement.innerHTML = `<option value="">-- ${placeholder} --</option>`;
    options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option;
        optionElement.textContent = option;
        selectElement.appendChild(optionElement);
    });
    selectElement.disabled = false;
}

function resetSelect(selectElement, placeholder) {
    selectElement.innerHTML = `<option value="">-- ${placeholder} --</option>`;
    selectElement.disabled = true;
    selectElement.value = "";
}

function hideResult() {
    resultBox.classList.add('opacity-0', 'scale-95');
}

function getRatingClass(rating) {
    if (!rating) return 'rating-none';
    if (rating.startsWith('+++++')) return 'rating-plus-3';
    if (rating.startsWith('++++')) return 'rating-plus-3';
    if (rating.startsWith('+++')) return 'rating-plus-3';
    if (rating.startsWith('++')) return 'rating-plus-2';
    if (rating.startsWith('+/-')) return 'rating-plus-minus';
    if (rating.startsWith('+')) return 'rating-plus-1';
    if (rating.startsWith('---')) return 'rating-minus-3';
    if (rating.startsWith('--')) return 'rating-minus-2';
    if (rating.startsWith('-')) return 'rating-minus-1';
    return 'rating-none';
}

function populateTable(tableBody, data) {
    tableBody.innerHTML = '';
    for (const [key, value] of Object.entries(data)) {
        const row = tableBody.insertRow();
        const cell1 = row.insertCell();
        const cell2 = row.insertCell();
        cell1.textContent = key;
        cell1.className = 'py-1 pr-2 text-gray-600';
        
        if (key === 'Особливий') {
            cell2.textContent = value;
            cell2.className = 'py-1 text-gray-800 font-medium';
            cell2.colSpan = 2;
        } else {
            cell2.textContent = value;
            cell2.className = `py-1 font-bold text-right ${getRatingClass(value)}`;
        }
    }
}

function applyFilters() {
    const substrateFilter = substrateFilterSelect.value;
    const performanceFilter = performanceFilterSelect.value;

    let filteredMetaKeys = Object.keys(productMetadata);

    if (substrateFilter) {
        filteredMetaKeys = filteredMetaKeys.filter(key => {
            const item = productMetadata[key];
            return item.substrates[substrateFilter] && !item.substrates[substrateFilter].includes('-');
        });
    }

    if (performanceFilter) {
        filteredMetaKeys = filteredMetaKeys.filter(key => {
            const item = productMetadata[key];
            return item.performance[performanceFilter] && !item.performance[performanceFilter].includes('-');
        });
    }
    
    const filteredMaterialNames = [...new Set(
        ribbonSizes
            .filter(item => filteredMetaKeys.some(key => item.material.includes(key)))
            .map(item => item.material)
    )].sort((a,b) => a.localeCompare(b));

    populateSelect(materialSelect, filteredMaterialNames, 'Оберіть матеріал');
    resetSelect(widthSelect, 'Спочатку оберіть матеріал');
    resetSelect(lengthSelect, 'Спочатку оберіть ширину');
    hideResult();
}

function resetAll() {
    substrateFilterSelect.value = "";
    performanceFilterSelect.value = "";
    materialSelect.value = "";
    
    const allMaterials = [...new Set(ribbonSizes.map(item => item.material))].sort((a, b) => a.localeCompare(b));
    populateSelect(materialSelect, allMaterials, 'Оберіть матеріал');

    resetSelect(widthSelect, 'Спочатку оберіть матеріал');
    resetSelect(lengthSelect, 'Спочатку оберіть ширину');
    hideResult();
}

function initialize() {
    const allSubstrates = new Set();
    const allPerformances = new Set();
    Object.values(productMetadata).forEach(meta => {
        Object.keys(meta.substrates).forEach(s => s !== 'Особливий' && allSubstrates.add(s));
        Object.keys(meta.performance).forEach(p => allPerformances.add(p));
    });
    
    populateSelect(substrateFilterSelect, [...allSubstrates].sort((a,b) => a.localeCompare(b)), 'Будь-який');
    populateSelect(performanceFilterSelect, [...allPerformances].sort((a,b) => a.localeCompare(b)), 'Будь-яка');

    const allMaterials = [...new Set(ribbonSizes.map(item => item.material))].sort((a, b) => a.localeCompare(b));
    populateSelect(materialSelect, allMaterials, 'Оберіть матеріал');
    
    resetAll();
}

substrateFilterSelect.addEventListener('change', applyFilters);
performanceFilterSelect.addEventListener('change', applyFilters);

materialSelect.addEventListener('change', () => {
    const selectedMaterial = materialSelect.value;
    resetSelect(lengthSelect, 'Спочатку оберіть ширину');
    hideResult();

    if (selectedMaterial) {
        const availableWidths = [...new Set(
            ribbonSizes
                .filter(item => item.material === selectedMaterial)
                .map(item => item.width)
        )].sort((a, b) => a - b);
        populateSelect(widthSelect, availableWidths, 'Оберіть ширину');
    } else {
        resetSelect(widthSelect, 'Спочатку оберіть матеріал');
    }
});

widthSelect.addEventListener('change', () => {
    const selectedMaterial = materialSelect.value;
    const selectedWidth = parseInt(widthSelect.value);
    hideResult();

    if (selectedMaterial && selectedWidth) {
        const availableLengths = [...new Set(
            ribbonSizes
                .filter(item => item.material === selectedMaterial && item.width === selectedWidth)
                .map(item => item.length)
        )].sort((a, b) => a - b);
        populateSelect(lengthSelect, availableLengths, 'Оберіть довжину');
    } else {
        resetSelect(lengthSelect, 'Спочатку оберіть ширину');
    }
});

lengthSelect.addEventListener('change', () => {
    const selectedMaterial = materialSelect.value;
    const selectedWidth = parseInt(widthSelect.value);
    const selectedLength = parseInt(lengthSelect.value);

    if (selectedMaterial && selectedWidth && selectedLength) {
        const selectedProduct = ribbonSizes.find(item => 
            item.material === selectedMaterial && 
            item.width === selectedWidth && 
            item.length === selectedLength
        );

        const metaKey = Object.keys(productMetadata).find(key => selectedMaterial.includes(key));
        const metadata = metaKey ? productMetadata[metaKey] : null;

        if (selectedProduct) {
            priceOutput.textContent = 'Запитайте у менеджера';
            m2Output.textContent = selectedProduct.m2.toLocaleString('uk-UA');
            qtyOutput.textContent = selectedProduct.qty;

            if (metadata) {
                printerTypeOutput.textContent = metadata.printerType;
                populateTable(substrateTable, metadata.substrates);
                populateTable(performanceTable, metadata.performance);
                performanceDetails.style.display = 'block';
            } else {
                performanceDetails.style.display = 'none';
            }

            resultBox.classList.remove('opacity-0', 'scale-95');
        }
    } else {
        hideResult();
    }
});

resetButton.addEventListener('click', resetAll);

document.addEventListener('DOMContentLoaded', initialize);
