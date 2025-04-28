import AuthProvider from "./components/auth/Context";
import Router from "./components/Router";
import NotificationProvider from "./components/layout/NotificationContext";
const App = () => {
  return (
    <NotificationProvider>
      <AuthProvider>
        <Router />
      </AuthProvider>
    </NotificationProvider>
  );
};

export default App;
