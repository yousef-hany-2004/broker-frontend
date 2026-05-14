import { Routes, Route } from "react-router-dom";
import Register from "../pages/auth/Register";
import Login from "../pages/auth/Login";
import ForgetPassword from "../pages/auth/ForgetPassword";
import ResetPassword from "../pages/auth/ResetPassword";
import ConfirmEmail from "../pages/auth/ConfirmEmail";
import ResendConfirmation from "../pages/auth/ResendConfirmation";
import MyProfile from "../pages/profile/MyProfile";
import UserProfile from "../pages/profile/UserProfile";
import ProtectedRoute from "../components/common/ProtectedRoute";
import UnauthorizedPage from "../pages/UnauthorizedPage";
import Home from "../pages/home/Home";
import CreateListing from "../pages/landlord/CreateListing";
import Dashboard from "../pages/dashboard/Dashboard";
import PropertyDetails from "../pages/property/PropertyDetails";
import PayoutMethods from "../pages/landlord/PayoutMethods";
import PaymentMethods from "../pages/payment/PaymentMethods";
import CheckoutResult from "../pages/payment/CheckoutResult";
import ManageListing from "../pages/landlord/ManageListing";
import UpdateListing from "../pages/landlord/UpdateListing";
import BookingPage from "../pages/booking/BookingPage";
import BookingConfirmPage from "../pages/booking/BookingConfirmPage";
import BookingSuccessPage from "../pages/booking/BookingSuccessPage";
import NotificationsPage from "../pages/notifications/NotificationPage";
import KycResultPage from "../pages/kyc/KycResultPage";
import HostListings from "../pages/landlord/HostListings";
import TripsPage from "../pages/booking/TripsPage";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forget-password" element={<ForgetPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/confirm-email" element={<ConfirmEmail />} />
      <Route path="/resend-confirmation" element={<ResendConfirmation />} />
      <Route path="/profile" element={<MyProfile />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route
        path="/user/:userId"
        element={
          <ProtectedRoute>
            <UserProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/create-listing"
        element={
          <ProtectedRoute requiredRole="Landlord">
            <CreateListing />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route path="/property/:id" element={<PropertyDetails />} />
      <Route
        path="/payout-methods"
        element={
          <ProtectedRoute requiredRole="Landlord">
            <PayoutMethods />
          </ProtectedRoute>
        }
      />
      <Route
        path="/payment-methods"
        element={
          <ProtectedRoute>
            <PaymentMethods />
          </ProtectedRoute>
        }
      />
      <Route path="/checkout/result" element={<CheckoutResult />} />
      <Route
        path="/manage-listing/:id"
        element={
          <ProtectedRoute requiredRole="Landlord">
            <ManageListing />
          </ProtectedRoute>
        }
      />
      <Route
        path="/update-listing/:id"
        element={
          <ProtectedRoute requiredRole="Landlord">
            <UpdateListing />
          </ProtectedRoute>
        }
      />
      <Route
        path="/book/:propertyId"
        element={
          <ProtectedRoute>
            <BookingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/booking/confirm/:bookingId"
        element={
          <ProtectedRoute>
            <BookingConfirmPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/booking/success"
        element={
          <ProtectedRoute>
            <BookingSuccessPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/kyc/result"
        element={
          <ProtectedRoute>
            <KycResultPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/host/listings"
        element={
          <ProtectedRoute requiredRole="Landlord">
            <HostListings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/trips"
        element={
          <ProtectedRoute>
            <TripsPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default AppRoutes;
