import { useState, useEffect } from "react";

const UtcTime = () => {
  const [time, setTime] = useState(
    new Date().toLocaleString("en-US", { timeZone: "America/New_York" })
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return <>{time}</>;
};

export default UtcTime;
