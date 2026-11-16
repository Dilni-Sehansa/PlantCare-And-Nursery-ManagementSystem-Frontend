import { Link, useNavigate } from "react-router-dom";
import logo from "../../assets/img/logo.png"
import { getUserRole } from "../../hooks/useAuth";
import { useState } from "react";

const Navbar = () => {
  const navigate = useNavigate();
  const role = getUserRole();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  const handleLogout = () => {
    localStorage.removeItem("ACCESS_TOKEN");
    localStorage.removeItem("REFRESH_TOKEN");

    setIsMobileMenuOpen(false);
    navigate("/login", { replace: true });
  };

   const navigationLinks = (
    <>
      <Link
        to="/"
        onClick={closeMobileMenu}
        className="hover:text-green-500 transition"
      >
        Home
      </Link>

      <Link
        to="/plants"
        onClick={closeMobileMenu}
        className="hover:text-green-500 transition"
      >
        Plants
      </Link>

      {role === "ADMIN" && (
        <Link
          to="/products"
          onClick={closeMobileMenu}
          className="hover:text-green-500 transition"
        >
          Product
        </Link>
      )}

      {role === "USER" && (
        <>
          <Link
            to="/orders"
            onClick={closeMobileMenu}
            className="hover:text-green-500 transition"
          >
            Shop
          </Link>

          <Link
            to="/my-orders"
            onClick={closeMobileMenu}
            className="hover:text-green-500 transition"
          >
            My Orders
          </Link>
        </>
      )}

      {(role === "ADMIN" || role === "SUPER_ADMIN") && (
        <>
          <Link
            to="/admin"
            onClick={closeMobileMenu}
            className="hover:text-green-500 transition"
          >
            Admin
          </Link>

          <Link
            to="/admin/orders"
            onClick={closeMobileMenu}
            className="hover:text-green-500 transition"
          >
            Orders
          </Link>
        </>
      )}

      {role === "SUPER_ADMIN" && (
        <Link
          to="/super-admin"
          onClick={closeMobileMenu}
          className="hover:text-green-500 transition"
        >
          Super Admin
        </Link>
      )}

      {role ? (
        <button
          type="button"
          onClick={handleLogout}
          className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-medium transition"
        >
          Logout
        </button>
      ) : (
        <>
          <Link
            to="/login"
            onClick={closeMobileMenu}
            className="hover:text-green-500 transition"
          >
            Login
          </Link>

          <Link
            to="/register"
            onClick={closeMobileMenu}
            className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-medium transition text-center"
          >
            Register
          </Link>
        </>
      )}
    </>
  );

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/20 backdrop-blur-xl border-b border-green-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          <Link to="/" className="flex items-center gap-2">
            <img 
              src={logo} 
              alt="NURIX Logo" 
              className="h-12 w-auto object-contain"
            />
            {/* <span className="font-bold text-xl tracking-wide">N  U  R  I  X</span> */}
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {navigationLinks}
          </div>

          <div className="md:hidden">
            <button
              type="button"
              onClick={toggleMobileMenu}
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileMenuOpen}
              className="text-green-800 text-2xl p-2 hover:text-green-500 transition"
            >
              {isMobileMenuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-green-200 py-4">
            <div className="flex flex-col items-center gap-4 text-gray-800 font-medium">
              {navigationLinks}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;