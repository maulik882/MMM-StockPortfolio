'use strict';

const NodeHelper = require('node_helper');
const axios = require('axios');
const { parse } = require('csv-parse/sync');

module.exports = NodeHelper.create({
    start: function () {
        console.log('Starting node helper for: ' + this.name);
    },

    socketNotificationReceived: function (notification, payload) {
        if (notification === 'GET_STOCK_DATA') {
            this.config = payload;
            this.fetchData();
        }
    },

    async fetchData() {
        try {
            console.log('MMM-StockPortfolio: Fetching data from:', this.config.sheetUrl);
            const response = await axios.get(this.config.sheetUrl);
            const csvData = response.data;
            console.log('MMM-StockPortfolio: Data received, length:', csvData.length);

            const records = parse(csvData, {
                columns: false,
                skip_empty_lines: true,
                trim: true
            });
            console.log('MMM-StockPortfolio: Parsed records count:', records.length);

            const processedData = this.processRecords(records);
            console.log('MMM-StockPortfolio: Data processed successfully');
            this.sendSocketNotification('STOCK_DATA', processedData);
        } catch (error) {
            console.error('MMM-StockPortfolio: Error fetching/parsing data:', error.message);
            this.sendSocketNotification('ERROR', error.message);
        }
    },

    processRecords(records) {
        const summary = {
            initialInvestment: null,
            currentTotalValue: null,
            change: null,
            changePercent: null
        };
        const stocks = [];
        let tableStarted = false;
        let headers = [];

        for (let i = 0; i < records.length; i++) {
            const row = records[i];

            // 1. Look for Summary Data
            if (row.includes('Initial Investment')) {
                const idx = row.indexOf('Initial Investment');
                summary.initialInvestment = row.slice(idx + 1).find(v => v !== '') || '';
            }
            if (row.includes('Current Total Value')) {
                const idx = row.indexOf('Current Total Value');
                summary.currentTotalValue = row.slice(idx + 1).find(v => v !== '') || '';
            }
            if (row.includes('Change')) {
                const idx = row.indexOf('Change');
                const values = row.slice(idx + 1).filter(v => v !== '');
                summary.change = values[0] || '';
                summary.changePercent = values[1] || '';
            }

            // 2. Look for Table Data
            if (row.includes('Symbol') && (row.includes('Stock Name') || row.includes('StockName'))) {
                tableStarted = true;
                headers = row;
                continue;
            }

            if (tableStarted) {
                const stock = {};
                let hasSymbol = false;
                headers.forEach((header, index) => {
                    if (!header) return;
                    let key = header.toLowerCase()
                        .replace(/[\(\)%]/g, '')
                        .replace(/[^a-z0-9]+/g, '_')
                        .replace(/^_+|_+$/g, '');

                    stock[key] = row[index] || '';
                    if (key === 'symbol' && stock[key]) {
                        hasSymbol = true;
                    }
                });

                if (hasSymbol) {
                    stocks.push(stock);
                }
            }
        }

        return {
            summary,
            stocks
        };
    }
});
