import { useEffect, useState } from "react";
import useAuth from "../auth/useAuth";
import Loader from "./subComponents/Loader";
import Welcome from "./subComponents/Welcome";
import NewUser from "./subComponents/NewUserWidget";
import NewKYC from "./subComponents/NewKYCWidget";
import NewDeposit from "./subComponents/NewDepositWidget";
import NewWithdrawal from "./subComponents/NewWithdrawalWidget";
import NewInvestment from "./subComponents/NewInvestmentWidget";
import LatestLiveTrade from "./subComponents/NewLiveTradeWidget";

const Dashboard = () => {
  const { admin } = useAuth();
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(!admin);
  }, [admin]);
  return (
    <section className='pb-2'>
      <div className='flex flex-col'>
        <div className='grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-4'>
          <div className='order-1 md:order-1 lg:order-1'>{loading ? <Loader /> : <Welcome />}</div>
          <div className='order-3 md:order-2 lg:order-2'>{loading ? <Loader /> : <NewUser />}</div>
          <div className='order-4 md:order-3 lg:order-3'>{loading ? <Loader /> : <NewKYC />}</div>
          <div className='order-2 md:order-5 lg:order-4 md:col-span-2'>
            {loading ? <Loader /> : <NewDeposit />}
          </div>
          <div className='order-6 md:order-7 lg:order-6'>
            {loading ? <Loader /> : <NewInvestment />}
          </div>
          <div className='order-7 md:order-6 lg:order-5 md:row-span-2'>
            {loading ? <Loader /> : <NewWithdrawal />}
          </div>
          <div className='order-5 md:order-4 lg:order-7'>
            {loading ? <Loader /> : <LatestLiveTrade />}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Dashboard;
