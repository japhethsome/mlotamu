import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import AdminAnalyticsPage from "./pages/AdminAnalyticsPage.jsx";
import CheckoutPage from "./pages/CheckoutPage.jsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import MenuPage from "./pages/MenuPage.jsx";
import OrdersPage from "./pages/OrdersPage.jsx";
import OrderConfirmationPage from "./pages/OrderConfirmationPage.jsx";
import QRScannerPage from "./pages/QRScannerPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import StaffDashboardPage from "./pages/StaffDashboardPage.jsx";
import StaffOrderSummaryPage from "./pages/StaffOrderSummaryPage.jsx";

function ProtectedRoute({ children, roles }) {
  const { token, user } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (roles && user && !roles.includes(user.role))
    return <Navigate to="/" replace />;
  return children;
}

/** Redirects staff → /staff and admin → /admin; customers see the page as-is. */
function CustomerRoute({ children }) {
  const { token, user } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (user?.role === "admin") return <Navigate to="/admin" replace />;
  if (user?.role === "staff") return <Navigate to="/staff" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      <Route
        path="/"
        element={
          <CustomerRoute>
            <Layout>
              <HomePage />
            </Layout>
          </CustomerRoute>
        }
      />

      <Route
        path="/menu/:category"
        element={
          <ProtectedRoute>
            <Layout>
              <MenuPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/checkout"
        element={
          <ProtectedRoute>
            <Layout>
              <CheckoutPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/orders"
        element={
          <ProtectedRoute>
            <Layout>
              <OrdersPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/confirmation"
        element={
          <ProtectedRoute>
            <Layout>
              <OrderConfirmationPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/staff"
        element={
          <ProtectedRoute roles={["staff", "admin"]}>
            <Layout>
              <StaffDashboardPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={["admin"]}>
            <Layout>
              <AdminAnalyticsPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/scan"
        element={
          <ProtectedRoute roles={["staff", "admin"]}>
            <Layout>
              <QRScannerPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/staff/summary"
        element={
          <ProtectedRoute roles={["staff", "admin"]}>
            <Layout>
              <StaffOrderSummaryPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
