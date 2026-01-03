# MMM-StockPortfolio

A MagicMirror² module to track your Indian Stock Market portfolio directly from a Google Spreadsheet. It provides a polished, Material UI-inspired dashboard instead of a plain sheet view.

## Features
- **Summary Cards**: Real-time overview of Initial Investment, Current Total Value, and Total Change.
- **Modern Table**: Clean list of stocks with symbols, average price, current price, and P&L.
- **Dynamic Styling**: Automatic color coding (Green for profit, Red/Orange for loss).
- **Auto-Update**: Background data fetching every 10 minutes (configurable).

## Screenshot
![Dashboard Preview](https://raw.githubusercontent.com/Maulik882/MMM-StockPortfolio/main/screenshot.png) *(Placeholder if you add one)*

## Setup & Spreadsheet Template

1.  **Copy the Template**: Make a copy of this [Google Sheet Template](https://docs.google.com/spreadsheets/d/1DtRKpHFUizeMbPWjew8Vtis7m3uloAsyYW4U6_vX8co/edit?usp=sharing).
2.  **Data Entry**: Use the **"ledger"** sheet to enter your stock trade details (Symbol, Exchange, Avg Price, etc.).
3.  **Publish to Web**:
    *   In Google Sheets, go to `File > Share > Publish to web`.
    *   Select the **"ledger"** sheet (or the tab containing your data).
    *   Set the format to **Comma-separated values (.csv)**.
    *   Click **Publish** and copy the link.

## Installation

1.  Navigate to your MagicMirror `modules` folder:
    ```bash
    cd ~/MagicMirror/modules
    ```
2.  Clone this repository:
    ```bash
    git clone https://github.com/Maulik882/MMM-StockPortfolio.git
    ```
3.  Enter the module directory and install dependencies:
    ```bash
    cd MMM-StockPortfolio
    npm install --production
    ```

## Configuration

Add the module to your `config/config.js` file:

```javascript
{
    module: "MMM-StockPortfolio",
    position: "top_left",
    header: "My Stock Portfolio",
    config: {
        sheetUrl: "PASTE_YOUR_CSV_LINK_HERE", // Example: https://docs.google.com/spreadsheets/d/.../export?format=csv
        updateInterval: 10 * 60 * 1000, // 10 minutes
        currencySymbol: "₹",
        showSummary: true,
        showTable: true,
        maxWidth: "100%"
    }
},
```

## Dependencies
- [axios](https://www.npmjs.com/package/axios)
- [csv-parse](https://www.npmjs.com/package/csv-parse)

## License
MIT
