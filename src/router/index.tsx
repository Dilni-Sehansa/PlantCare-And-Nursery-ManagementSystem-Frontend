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

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/plants" element={<Plant />} />
        <Route path="/plantType" element={<PlantType />} />
        <Route path="/admin/products" element={<Products />} />
        <Route path="/super-admin" element={<SuperAdmin />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;