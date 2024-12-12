import "./App.css";
import React from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import {
  ProtectedRoute,
  SellerRoute,
  BuyerRoute,
  AdminRoute,
} from "./components/ProtectedRoute";
import "bootstrap/dist/css/bootstrap.min.css";

// Import components
import Register from "./pages/register";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Login from "./pages/login";
import ForgotResetPassword from "./pages/forgotPassword";
import SellerRegister from "./pages/sellerRegister";
import AdminRegister from "./pages/adminRegister";
import UploadProducts from "./pages/uploadProduct";
import Home from "./pages/home";
import UnapprovedProductsPage from "./pages/unapprovedProducts";
import ManageProducts from "./pages/manageProducts";
import Cart from "./pages/cart";
import AdminHome from "./pages/adminHome";
import Payments from "./pages/payments";
import ManagePaymentMethods from "./pages/managepaymentMethods";
import ManageCategories from "./pages/manageCategories";
import ViewOrders from "./pages/viewOrders";
import SellerHome from "./pages/sellerHome";
import BuyerProductDetail from "./pages/buyerProductDetail";
import EditProduct from "./pages/editProduct";
import ProductReview from "./pages/productReview";
import ManageProfile from "./pages/manageProfile";
import OrderDetails from "./pages/orderDetails";
import TrackingDetails from "./pages/trackingDetails";
import ComplaintsPage from "./pages/complaintsPage";
import RaiseComplaint from "./pages/raiseComplaint";
import ReviewComplaints from "./pages/reviewComplaints";
import ComplaintDetails from "./pages/complaintDetails";
import ContactUs from "./pages/contactUs";
import CouponManagement from "./pages/couponManagement";
import ReviewProduct from "./pages/reviewProduct";

// Role-specific home component wrapper
const RoleBasedHome = () => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" />;

  switch (user.role) {
    case "seller":
      return <SellerHome />;
    case "admin":
      return <AdminHome />;
    case "buyer":
    default:
      return <Home />;
  }
};

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <div className="d-flex flex-column min-vh-100">
            <Header />
            <main className="flex-grow-1">
              <Routes>
                {/* Your existing routes remain the same */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route
                  path="/forgot-password"
                  element={<ForgotResetPassword />}
                />
                <Route path="/seller-register" element={<SellerRegister />} />
                <Route path="/admin-register" element={<AdminRegister />} />
                <Route path="/contactus" element={<ContactUs />} />
                {/* Seller Only Routes */}
                <Route
                  path="/uploadProducts"
                  element={
                    <SellerRoute>
                      <UploadProducts />
                    </SellerRoute>
                  }
                />
                <Route
                  path="/manage-products"
                  element={
                    <SellerRoute>
                      <ManageProducts />
                    </SellerRoute>
                  }
                />
                <Route
                  path="/edit-product/:productId"
                  element={
                    <SellerRoute>
                      <EditProduct />
                    </SellerRoute>
                  }
                />
                <Route
                  path="/manage-coupons"
                  element={
                    <SellerRoute>
                      <CouponManagement />
                    </SellerRoute>
                  }
                />
                <Route 
                   path="/seller-dashboard" 
                   element={
                  <SellerRoute>
                  <SellerHome />
                  </SellerRoute>
                } 
                />
                {/* Admin Only Routes */}
                <Route
                  path="/unapproved-products"
                  element={
                    <AdminRoute>
                      <UnapprovedProductsPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/review-product/:productId"
                  element={
                    <AdminRoute>
                      <ProductReview />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/manage-categories"
                  element={
                    <AdminRoute>
                      <ManageCategories />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/review-complaints"
                  element={
                    <AdminRoute>
                      <ReviewComplaints />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/complaint/:complaintId"
                  element={
                    <AdminRoute>
                      <ComplaintDetails />
                    </AdminRoute>
                  }
                />
                {/* Buyer Only Routes */}
                <Route
                  path="/cart"
                  element={
                    <BuyerRoute>
                      <Cart />
                    </BuyerRoute>
                  }
                />
                <Route
                  path="/payments"
                  element={
                    <BuyerRoute>
                      <Payments />
                    </BuyerRoute>
                  }
                />
                <Route
                  path="/manage-payments"
                  element={
                    <BuyerRoute>
                      <ManagePaymentMethods />
                    </BuyerRoute>
                  }
                />
                <Route
                  path="/order/:orderId/tracking"
                  element={
                    <BuyerRoute>
                      <TrackingDetails />
                    </BuyerRoute>
                  }
                />
                <Route
                  path="/vieworders"
                  element={
                    <BuyerRoute>
                      <ViewOrders />
                    </BuyerRoute>
                  }
                />
                <Route
                  path="/product/:productId"
                  element={
                    <ProtectedRoute>
                      <BuyerProductDetail />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/order/:orderId"
                  element={
                    <BuyerRoute>
                      <OrderDetails />
                    </BuyerRoute>
                  }
                />
                <Route
                  path="/complaints"
                  element={
                    <BuyerRoute>
                      <ComplaintsPage />
                    </BuyerRoute>
                  }
                />
                <Route
                  path="/raisecomplaint"
                  element={
                    <BuyerRoute>
                      <RaiseComplaint />
                    </BuyerRoute>
                  }
                />
                <Route
                  path="/review-product/:orderId"
                  element={
                    <BuyerRoute>
                      <ReviewProduct />
                    </BuyerRoute>
                  }
                />
                {/* Protected Home Route with Role-Based Content */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <RoleBasedHome />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/manage-profile"
                  element={
                    <ProtectedRoute>
                      <ManageProfile />
                    </ProtectedRoute>
                  }
                />

                {/* 404 Route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
