import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Home from "../pages/home";
import Login from "../pages/login";
import Register from "../pages/register";


const AppRouter = () => {
  return (
    <BrowserRouter>
    <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;