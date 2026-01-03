Module.register("MMM-StockPortfolio", {
    // Default module config.
    defaults: {
        sheetUrl: "", // URL of the published Google Sheet as CSV
        updateInterval: 10 * 60 * 1000, // Every 10 minutes
        retryDelay: 5000,
        currencySymbol: "₹",
        showSummary: true,
        showTable: true,
        maxWidth: "100%"
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

    buildTableUI: function (stocks) {
        const table = document.createElement("table");
        table.className = "stock-table small";

        // Header
        const thead = document.createElement("thead");
        const headerRow = document.createElement("tr");
        const headers = ["Symbol", "Avg Price", "Current", "Change %", "P& L"];

        headers.forEach(h => {
            const th = document.createElement("th");
            th.innerText = h;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        // Body
        const tbody = document.createElement("tbody");
        stocks.forEach(stock => {
            const tr = document.createElement("tr");

            // Symbol & Name (Combined for a cleaner UI)
            const tdSymbol = document.createElement("td");
            tdSymbol.innerHTML = `<span class="stock-symbol bright">${stock.symbol}</span><br/><span class="stock-name xsmall dimmed">${stock.stock_name || ""}</span>`;
            tr.appendChild(tdSymbol);

            // Avg Price
            const tdAvg = document.createElement("td");
            tdAvg.innerText = stock.average_price || "-";
            tr.appendChild(tdAvg);

            // Current Price
            const tdCurrent = document.createElement("td");
            tdCurrent.innerText = stock.current_value_per_share || stock.current_value || "-";
            tr.appendChild(tdCurrent);

            // Change %
            const tdChange = document.createElement("td");
            const changeVal = stock.change || stock.change_percent || "";
            tdChange.innerText = changeVal;
            if (changeVal.includes("-")) {
                tdChange.classList.add("negative");
            } else if (changeVal && changeVal !== "0%") {
                tdChange.classList.add("positive");
            }
            tr.appendChild(tdChange);

            // Profit & Loss
            const tdPL = document.createElement("td");
            const plVal = stock.profit_loss || "";
            tdPL.innerText = plVal;
            if (plVal.includes("-")) {
                tdPL.classList.add("negative");
            } else if (plVal && plVal !== "0") {
                tdPL.classList.add("positive");
            }
            tr.appendChild(tdPL);

            tbody.appendChild(tr);
        });
        table.appendChild(tbody);

        return table;
    }
});
