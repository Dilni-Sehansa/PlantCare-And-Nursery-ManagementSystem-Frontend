import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Home from "../pages/home";
import Login from "../pages/login";
import Register from "../pages/register";
import Plant from "../pages/plants";
import PlantType from "../pages/plantType";
import Products from "../pages/product";
import SuperAdmin from "../pages/superAdmin";
import Admin from "../pages/admin";
import Orders from "../pages/orders";
import MyOrders from "../pages/myOrders";
import AdminOrders from "../pages/adminOrders";
import Suppliers from "../pages/suppliers";
import Stock from "../pages/stock";
import ManagementCenter from "../pages/managementCenter";

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/plants" element={<Plant />} />
        <Route path="/plantType" element={<PlantType />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/my-orders" element={<MyOrders />} />
        <Route path="/admin/products" element={<Products />} />
        <Route path="/admin/orders" element={<AdminOrders />} />
        <Route path="/admin/suppliers" element={<Suppliers />} />
        <Route path="/admin/stock" element={<Stock />} />
        <Route path="/admin/management-center" element={<ManagementCenter />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/super-admin" element={<SuperAdmin />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;