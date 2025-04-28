import { Card, CardBody } from "@material-tailwind/react";
import { useForm } from "react-hook-form";
import FormError from "./subComponents/FormError";
import { useNotification } from "../layout/NotificationHelper";
import { useEffect, useState } from "react";
import FetchWithAuth from "../auth/api";
import { QuestionMarkCircleIcon } from "@heroicons/react/24/solid";
import LiveTradeWidget from "./subComponents/LivetradeWidget";
import CopyTradeTable from "./subComponents/CopyTradeTable";
const CopyTrade = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const { addNotification } = useNotification();
  const [showPrompt, setShowPrompt] = useState(false);
  const [traderDetails, setTraderDetails] = useState("");
  const [Traders, setTraders] = useState([]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      type: "",
      currencyPair: "",
      entryPrice: "",
      stopLoss: "",
      takeProfit: "",
      action: "",
      time: 24,
    },
  });

  const tradeOptions = [
    {
      type: "cryptocurrency",
      pairs: [
        "BTCUSDT",
        "XRPUSDT",
        "SOLUSDT",
        "ETHUSDT",
        "BTCUSD",
        "DOGEUSDT",
        "ADAUSDT",
        "LINKUSDT",
        "SUIUSDT",
        "ETHUSD",
        "ETHBTC",
        "PEPEUSDT",
        "XRPUSD",
        "SOLUSD",
        "AVAXUSDT",
        "BNBUSDT",
        "TRUMPUSDT",
        "AAVEUSDT",
        "DOTUSDT",
        "SHIBUSDT",
      ],
    },
    {
      type: "forex",
      pairs: [
        "EURUSD",
        "GBPUSD",
        "USDJPY",
        "AUDUSD",
        "USDCAD",
        "GBPJPY",
        "USDCHF",
        "EURJPY",
        "NZDUSD",
        "EURGBP",
        "AUDJPY",
        "EURAUD",
        "GBPAUD",
        "GBPCAD",
        "USDMXN",
      ],
    },
    {
      type: "stock",
      pairs: [
        "SPXUSD",
        "NSXUSD",
        "DJI",
        "NKY",
        "DEU40",
        "UKXGBP",
        "TSLA",
        "NVDA",
        "AAPL",
        "MSTR",
        "AMZN",
        "META",
        "AMD",
        "MSFT",
        "COIN",
        "GOOGL",
        "NFLX",
        "INTC",
        "AVGO",
        "RELIANCE",
        "TATAMOTORS",
        "DELL",
      ],
    },
  ];
  const tradeTimeOptions = [
    { text: "Less than One hour", equiv: 0.5 },
    { text: "1 hour", equiv: 1 },
    { text: "2 hours", equiv: 2 },
    { text: "3 hours", equiv: 3 },
    { text: "6 hours", equiv: 6 },
    { text: "9 hours", equiv: 9 },
    { text: "12 hours", equiv: 12 },
    { text: "18 hours", equiv: 18 },
    { text: "1 day", equiv: 24 },
    { text: "2 days", equiv: 48 },
    { text: "3 days", equiv: 72 },
    { text: "1 week", equiv: 168 },
    { text: "2 weeks", equiv: 336 },
    { text: "3 weeks", equiv: 504 },
    { text: "1 month", equiv: 720 }, // approximating 30 days as a month
  ];

  const handleTradeSubmission = async (data) => {
    setIsSubmitting(true);
    try {
      const response = await FetchWithAuth(
        "/copy-trade",
        { method: "POST", body: JSON.stringify({ ...data, trader: traderDetails }) },
        "Failed to create copy trade"
      );

      if (response.failed) {
        addNotification(response.message, "error");
      } else {
        const { message } = response;
        reset();
        message && addNotification(message, "success");
      }
    } catch (error) {
      addNotification("An error occurred during trade creation", "error");
      console.error("Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  // Fetch traders when the component mounts or `sucess` changes
  useEffect(() => {
    const fetchTraders = async () => {
      setIsSubmitting(true);

      try {
        const response = await FetchWithAuth(
          "/traders",
          { method: "GET", credentials: "include" },
          "Failed to fetch traders"
        );

        if (response.failed) {
          addNotification(response.failed, "error");
        } else {
          setTraders(response.traders || []);
          addNotification(response.message);
        }
      } catch (error) {
        addNotification("An error occurred", "error");
        console.error("Fetch error:", error);
      } finally {
        setIsSubmitting(false);
      }
    };
    fetchTraders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <section className='grid md:grid-cols-2 sm:grid-cols-1 gap-4 pb-4'>
      <Card variant='gradient' color='gray' className='w-full md:max-w-md mx-auto md:mx-0'>
        <CardBody className='text-text-light space-y-4'>
          <div className='flex justify-between items-center'>
            <h2 className='text-2xl font-semibold capitalize'>Create A Copy Trade</h2>
            <QuestionMarkCircleIcon
              title='info'
              className='h-7 w-7  hover:scale-110 transition-transform cursor-help'
              onClick={() => setShowPrompt((prev) => !prev)}
            />
          </div>

          {showPrompt && (
            <div className='text-sm text-primary-light'>
              <p>
                Welcome to the Copy trading platform.
                <br />
                Please review the following key points before proceeding:
                <br />
                Market Volatility:Be aware that prices may change rapidly.
                <br />
                Trade Execution: Ensure you confirm all details before placing a trade so as not to
                mislead your followers.
                <br />
                Risk Management:Trading involves risk. Use tools like stop-loss orders to mitigate
                potential losses.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit(handleTradeSubmission)} className='space-y-4'>
            <select
              className='form-input w-full'
              value={traderDetails ? JSON.stringify(traderDetails) : ""} // Default to empty
              onChange={(e) => {
                const selectedValue = e.target.value;
                setTraderDetails(selectedValue ? JSON.parse(selectedValue) : null); // Set null if empty
              }}
              id='trader'
              required>
              <option value='' disabled>
                Select a Trader
              </option>
              {Traders.map((trader) => (
                <option key={trader._id} value={JSON.stringify(trader)}>
                  {/* value={JSON.stringify({ _id: trader._id, name: trader.name })}> */}
                  {trader.name}
                </option>
              ))}
            </select>
            {/* Trade Type */}
            <div>
              <label htmlFor='type' className='block text-sm font-semibold'>
                Trade Type
              </label>
              <select
                className='form-input w-full'
                {...register("type", {
                  required: "Trade type is required",
                  onChange: (e) => setSelectedType(e.target.value),
                })}>
                <option value='' disabled>
                  Select trade type
                </option>
                {tradeOptions.map((opt) => (
                  <option key={opt.type} value={opt.type}>
                    {opt.type.toUpperCase()}
                  </option>
                ))}
              </select>
              {errors.type && <FormError err={errors.type.message} />}
            </div>

            {/* Currency Pair */}
            <div>
              <label htmlFor='currencyPair' className='block text-sm font-semibold'>
                Currency Pair
              </label>
              <select
                className='form-input w-full'
                {...register("currencyPair", {
                  required: "Currency pair is required",
                })}>
                <option value='' disabled>
                  Select currency pair
                </option>
                {selectedType &&
                  tradeOptions
                    .find((opt) => opt.type === selectedType)
                    ?.pairs.map((pair) => (
                      <option key={pair} value={pair}>
                        {pair}
                      </option>
                    ))}
              </select>
              {errors.currencyPair && <FormError err={errors.currencyPair.message} />}
            </div>
            {/* Trade duration */}
            <div>
              <label htmlFor='time' className='block text-sm font-semibold'>
                Timing (Hours)
              </label>
              <select
                id='time'
                className='form-input w-full'
                {...register("time", { required: "Trade timing is required" })}>
                <option value='' disabled>
                  Select trade timing
                </option>
                {tradeTimeOptions.map((opt) => (
                  <option key={opt.text} value={opt.equiv}>
                    {opt.text}
                  </option>
                ))}
              </select>
              {errors.time && <FormError err={errors.time.message} />}
            </div>

            {/* Entry Price */}
            <div>
              <label htmlFor='entryPrice' className='block text-sm font-semibold'>
                Entry Price
              </label>
              <input
                type='number'
                className='form-input w-full'
                placeholder='Enter entry price'
                {...register("entryPrice", {
                  required: "Entry price is required",
                  validate: (value) => {
                    const entryPrice = parseFloat(value);
                    if (entryPrice <= 0) return "Entry price must be greater than zero ($0)";
                    return true;
                  },
                })}
              />
              {errors.entryPrice && <FormError err={errors.entryPrice.message} />}
            </div>

            {/* Stop Loss */}
            <div>
              <label htmlFor='stopLoss' className='block text-sm font-semibold'>
                Stop Loss
              </label>
              <input
                type='number'
                className='form-input w-full'
                placeholder='Enter stop loss'
                {...register("stopLoss", {
                  required: "Stop loss is required",
                  validate: (value) => {
                    const entryPrice = parseFloat(watch("entryPrice"));
                    const stopLoss = parseFloat(value);

                    if (watch("action") === "buy" && stopLoss >= entryPrice) {
                      return "Stop loss must be below entry price for a buy trade.";
                    }
                    if (watch("action") === "sell" && stopLoss <= entryPrice) {
                      return "Stop loss must be above entry price for a sell trade.";
                    }
                    return true;
                  },
                })}
              />
              {errors.stopLoss && <FormError err={errors.stopLoss.message} />}
            </div>

            {/* Take Profit */}
            <div>
              <label htmlFor='takeProfit' className='block text-sm font-semibold'>
                Take Profit
              </label>
              <input
                type='number'
                className='form-input w-full'
                placeholder='Enter take profit'
                {...register("takeProfit", {
                  required: "Take profit is required",
                  validate: (value) => {
                    const entryPrice = parseFloat(watch("entryPrice"));
                    const takeProfit = parseFloat(value);

                    if (watch("action") === "buy" && takeProfit <= entryPrice) {
                      return "Take profit must be above entry price for a buy trade.";
                    }
                    if (watch("action") === "sell" && takeProfit >= entryPrice) {
                      return "Take profit must be below entry price for a sell trade.";
                    }
                    return true;
                  },
                })}
              />
              {errors.takeProfit && <FormError err={errors.takeProfit.message} />}
            </div>

            {/* Action */}
            <div>
              <label htmlFor='action' className='block text-sm font-semibold'>
                Action
              </label>
              <select
                className='form-input w-full'
                {...register("action", {
                  required: "Please select an action",
                })}>
                <option value='' disabled>
                  Select action
                </option>
                <option value='buy'>BUY</option>
                <option value='sell'>SELL</option>
              </select>
              {errors.action && <FormError err={errors.action.message} />}
            </div>

            {/* Submit Button */}
            <button type='submit' className='accent-btn w-full' disabled={isSubmitting}>
              {isSubmitting ? "Processing..." : "Create Trade"}
            </button>
          </form>
        </CardBody>
      </Card>
      <LiveTradeWidget />
      <CopyTradeTable />
    </section>
  );
};

export default CopyTrade;
