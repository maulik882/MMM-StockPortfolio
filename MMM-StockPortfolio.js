Module.register("MMM-StockPortfolio", {
    // Default module config.
    defaults: {
        sheetUrl: "", // URL of the published Google Sheet as CSV
        updateInterval: 10 * 60 * 1000, // Every 10 minutes
        retryDelay: 5000,
        currencySymbol: "₹",
        showSummary: true,
        showTable: true,
        maxWidth: "100%",
        tableColumns: ["Symbol", "Avg Price", "Current", "Change %", "P& L"]
    },

    getStyles: function () {
        return ["MMM-StockPortfolio.css"];
    },

    start: function () {
        Log.info("MMM-StockPortfolio: Starting module: " + this.name);
        this.stockData = null;
        this.loaded = false;

        // Delay initial fetch to ensure socket is ready
        setTimeout(() => {
            Log.info("MMM-StockPortfolio: Triggering initial data fetch...");
            this.getStockData();
        }, 2000);
    },

    scheduleUpdate: function (delay) {
        let nextLoad = this.config.updateInterval;
        if (typeof delay !== "undefined" && delay >= 0) {
            nextLoad = delay;
        }

        setTimeout(() => {
            this.getStockData();
        }, nextLoad);
    },

    getStockData: function () {
        this.sendSocketNotification("GET_STOCK_DATA", this.config);
    },

    socketNotificationReceived: function (notification, payload) {
        if (notification === "STOCK_DATA") {
            this.stockData = payload;
            this.loaded = true;
            this.updateDom();
            this.scheduleUpdate();
        } else if (notification === "ERROR") {
            Log.error("MMM-StockPortfolio Error: " + payload);
            this.scheduleUpdate(this.config.retryDelay);
        }
    },

    getDom: function () {
        const wrapper = document.createElement("div");
        wrapper.className = "stock-portfolio-wrapper";
        wrapper.style.maxWidth = this.config.maxWidth;

        if (!this.config.sheetUrl) {
            wrapper.innerHTML = "Please provide a Google Sheet CSV URL in the config.";
            wrapper.className = "dimmed light small";
            return wrapper;
        }

        if (!this.loaded) {
            wrapper.innerHTML = "Loading Stock Data...";
            wrapper.className = "dimmed light small";
            return wrapper;
        }

        if (this.config.showSummary && this.stockData.summary) {
            wrapper.appendChild(this.buildSummaryUI(this.stockData.summary));
        }

        if (this.config.showTable && this.stockData.stocks && this.stockData.stocks.length > 0) {
            wrapper.appendChild(this.buildTableUI(this.stockData.stocks));
        }

        return wrapper;
    },

    buildSummaryUI: function (summary) {
        const container = document.createElement("div");
        container.className = "summary-container";

        const cards = [
            { label: "Initial Investment", value: summary.initialInvestment, class: "investment" },
            { label: "Total Current Value", value: summary.currentTotalValue, class: "current-value" },
            { label: "Total Change", value: summary.changePercent || summary.change, class: "change" }
        ];

        cards.forEach(card => {
            if (card.value) {
                const cardElem = document.createElement("div");
                cardElem.className = "summary-card " + card.class;

                const label = document.createElement("div");
                label.className = "card-label xsmall dimmed";
                label.innerText = card.label;

                const value = document.createElement("div");
                value.className = "card-value bright medium";
                value.innerText = card.value;

                // Color coding for change
                if (card.class === "change") {
                    if (card.value.includes("-")) {
                        value.classList.add("negative");
                    } else if (card.value !== "0" && card.value !== "0%") {
                        value.classList.add("positive");
                    }
                }

                cardElem.appendChild(label);
                cardElem.appendChild(value);
                container.appendChild(cardElem);
            }
        });

        return container;
    },

    // Helper to convert header to the key format used by node_helper
    getHeaderKey: function (header) {
        return header.toLowerCase()
            .replace(/[\(\)%]/g, '')
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '');
    },

    buildTableUI: function (stocks) {
        const table = document.createElement("table");
        table.className = "stock-table small";

        // Header
        const thead = document.createElement("thead");
        const headerRow = document.createElement("tr");

        const columns = this.config.tableColumns || ["Symbol", "Avg Price", "Current", "Change %", "P& L"];

        columns.forEach(col => {
            const th = document.createElement("th");
            th.innerText = col;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        // Body
        const tbody = document.createElement("tbody");
        stocks.forEach(stock => {
            const tr = document.createElement("tr");

            columns.forEach(col => {
                const td = document.createElement("td");
                const key = this.getHeaderKey(col);

                let value = stock[key];

                // Comprehensive fallback mapping for various possible header names
                if (value === undefined || value === "") {
                    const fallbackMap = {
                        "avg_buying_price": ["average_price", "avg_cost", "avg_price", "buy_price", "buying_price"],
                        "current_price": ["price_helper", "last_price", "price", "current_value_per_share", "cmp"],
                        "invest_amount": ["investment", "invested", "initial_investment", "invested_amount"],
                        "current_amount": ["current_value", "market_value", "total_value"],
                        "change": ["change_percent", "change_", "percentage_change", "change_val"],
                        "p_l": ["profit_loss", "profit_or_loss", "net_profit", "pnl", "gain_loss"]
                    };

                    // Try standard variations
                    for (const masterKey in fallbackMap) {
                        if (key.includes(masterKey) || masterKey.includes(key)) {
                            for (const alt of fallbackMap[masterKey]) {
                                if (stock[alt] !== undefined && stock[alt] !== "") {
                                    value = stock[alt];
                                    break;
                                }
                            }
                        }
                        if (value !== undefined && value !== "") break;
                    }
                }

                if (key === "symbol") {
                    td.innerHTML = `<span class="stock-symbol bright">${stock.symbol}</span><br/><span class="stock-name xsmall dimmed">${stock.stock_name || stock.stockname || ""}</span>`;
                } else {
                    td.innerText = value || "-";

                    // Handle P&L and Change coloring
                    const lowerCol = col.toLowerCase();
                    if (lowerCol.includes("change") || lowerCol.includes("p & l") || lowerCol.includes("p&l") || lowerCol.includes("profit")) {
                        if (typeof value === "string") {
                            if (value.includes("-")) {
                                td.classList.add("negative");
                            } else if (value !== "0" && value !== "0%" && value !== "") {
                                td.classList.add("positive");
                            }
                        }
                    }
                }

                tr.appendChild(td);
            });

            tbody.appendChild(tr);
        });
        table.appendChild(tbody);

        return table;
    }
});
