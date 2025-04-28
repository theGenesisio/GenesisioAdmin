import { useEffect, useRef } from "react";

const TradingViewWidget = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      colorTheme: "dark",
      dateRange: "1D",
      showChart: true,
      locale: "en",
      width: "100%",
      height: "100%",
      largeChartUrl: "",
      isTransparent: true,
      showSymbolLogo: true,
      showFloatingTooltip: true,
      plotLineColorGrowing: "rgba(53, 28, 117, 1)",
      plotLineColorFalling: "rgba(153, 0, 0, 1)",
      gridLineColor: "rgba(42, 46, 57, 0)",
      scaleFontColor: "rgba(209, 212, 220, 1)",
      belowLineFillColorGrowing: "rgba(142, 124, 195, 0.12)",
      belowLineFillColorFalling: "rgba(53, 28, 117, 0.12)",
      belowLineFillColorGrowingBottom: "rgba(41, 98, 255, 0)",
      belowLineFillColorFallingBottom: "rgba(41, 98, 255, 0)",
      symbolActiveColor: "rgba(180, 167, 214, 0.12)",
      tabs: [
        {
          title: "Indices & Stocks",
          symbols: [
            { s: "FOREXCOM:SPXUSD", d: "S&P 500 Index" },
            { s: "FOREXCOM:NSXUSD", d: "US 100 Cash CFD" },
            { s: "FOREXCOM:DJI", d: "Dow Jones Industrial Average Index" },
            { s: "INDEX:NKY", d: "Japan 225" },
            { s: "INDEX:DEU40", d: "DAX Index" },
            { s: "FOREXCOM:UKXGBP", d: "FTSE 100 Index" },
            { s: "NASDAQ:TSLA" },
            { s: "NASDAQ:NVDA" },
            { s: "NASDAQ:AAPL" },
            { s: "NASDAQ:MSTR" },
            { s: "NASDAQ:AMZN" },
            { s: "NASDAQ:AMD" },
            { s: "NASDAQ:META" },
            { s: "NASDAQ:MSFT" },
            { s: "NASDAQ:NFLX" },
            { s: "NASDAQ:PLTR" },
            { s: "NASDAQ:COIN" },
            { s: "NASDAQ:GOOGL" },
            { s: "NASDAQ:AVGO" },
            { s: "NASDAQ:RGTI" },
            { s: "NASDAQ:INTC" },
            { s: "NASDAQ:SOFI" },
            { s: "NSE:RELIANCE" },
            { s: "NSE:TATAMOTORS" },
            { s: "NYSE:NKE" },
          ],
          originalTitle: "Indices",
        },
        {
          title: "Forex",
          symbols: [
            { s: "FX:EURUSD", d: "EUR to USD" },
            { s: "FX:GBPUSD", d: "GBP to USD" },
            { s: "FX:USDJPY", d: "USD to JPY" },
            { s: "FX:USDCHF", d: "USD to CHF" },
            { s: "FX:AUDUSD", d: "AUD to USD" },
            { s: "FX:USDCAD", d: "USD to CAD" },
          ],
          originalTitle: "Forex",
        },
        {
          title: "Cryptocurrency",
          symbols: [
            { s: "BINANCE:BTCUSDT" },
            { s: "BINANCE:SOLUSDT" },
            { s: "BINANCE:XRPUSDT" },
            { s: "BINANCE:ETHUSDT" },
            { s: "BINANCE:DOGEUSDT" },
          ],
        },
      ],
    });

    containerRef.current.appendChild(script);
  }, []);

  return (
    <div className='tradingview-widget-container' ref={containerRef}>
      <div className='tradingview-widget-container__widget'></div>
      <div className='tradingview-widget-copyright invisible'>
        <a href='https://www.tradingview.com/' rel='noopener nofollow' target='_blank'>
          <span className='blue-text'>Track all markets on TradingView</span>
        </a>
      </div>
    </div>
  );
};

export default TradingViewWidget;
