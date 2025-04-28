import { createBrowserRouter, RouterProvider, Outlet, Navigate } from "react-router-dom";
import NotificationDisplay from "./layout/NotificationDisplay";
import Dashboard from "./app/Dashboard";
import Admins from "./app/Admins";
import Sidebar from "./layout/Sidebar";
import FooterAuth from "./layout/FooterAuth";
import Login from "./auth/login";
import NotFound from "./auth/NotFound";
import ProtectedRoute from "./auth/ProtectedRoutes";
import CheckAuth from "./auth/checkAuth";
import DepositsTable from "./app/DepositsTable";
import WithdrawalRequestsTable from "./app/WithdrawalRequestsTable";
import Plans from "./app/Plans";
import LiveTradeTable from "./app/LiveTradeTable";
import Kyc from "./app/KYC";
import Whatsapp from "./app/Whatsapp";
import Users from "./app/Users";
import Topup from "./app/Topup";
import Mailing from "./app/Mailing";
import SendNotification from "./app/SendNotification";
import SingleDeposit from "./app/subComponents/SingleDeposit";
import GoogleTransalte from "./app/subComponents/GoogletTranslate";
import Billing from "./app/Billing";
import SingleUser from "./app/subComponents/SingleUser";
import ViewKYC from "./app/subComponents/ViewKYC";
import SingleTrade from "./app/subComponents/SingleTrade";
import Signal from "./app/Signal";
import CopyTrading from "./app/CopyTrading";
import Traders from "./app/Traders";
export default function Router() {
  const Layout = () => {
    return (
      <div className='h-screen flex'>
        {/* Sidebar */}
        <div className='sidebar'>
          <Sidebar />
        </div>

        {/* Main Content */}
        <div className='main'>
          <GoogleTransalte />
          <Outlet />
        </div>

        {/* Notifications */}
        <NotificationDisplay />
      </div>
    );
  };

  const Auth = () => {
    return (
      <>
        <Outlet />
        <NotificationDisplay />
        <FooterAuth />
      </>
    );
  };
  const BrowserRouter = createBrowserRouter([
    {
      path: "/app",
      element: (
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      ),
      children: [
        { path: "dashboard", element: <Dashboard /> },
        { path: "admins", element: <Admins /> },
        { path: "traders", element: <Traders /> },
        { path: "deposits", element: <DepositsTable /> },
        { path: "withdrawals", element: <WithdrawalRequestsTable /> },
        { path: "plans", element: <Plans /> },
        { path: "trade", element: <LiveTradeTable /> },
        { path: "copy-trade", element: <CopyTrading /> },
        { path: "kyc", element: <Kyc /> },
        { path: "whatsapp", element: <Whatsapp /> },
        { path: "users", element: <Users /> },
        { path: "top-up", element: <Topup /> },
        { path: "signals", element: <Signal /> },
        { path: "mailing", element: <Mailing /> },
        { path: "send-notification", element: <SendNotification /> },
        { path: "billing", element: <Billing /> },
        { path: "transactions/deposit/:transaction", element: <SingleDeposit /> },
        { path: "transactions/livetrade/:trade", element: <SingleTrade /> },
        { path: "manage-users/users/:userDetails", element: <SingleUser /> },
        { path: "manage-users/kyc/:kycDetails", element: <ViewKYC /> },
      ],
    },
    {
      path: "/",
      element: (
        <CheckAuth>
          <Auth />
        </CheckAuth>
      ),
      children: [
        { path: "", element: <Navigate to='login' replace /> },
        { path: "login", element: <Login /> },
      ],
    },
    {
      path: "*",
      element: <NotFound />,
    },
  ]);

  return <RouterProvider router={BrowserRouter} />;
}
