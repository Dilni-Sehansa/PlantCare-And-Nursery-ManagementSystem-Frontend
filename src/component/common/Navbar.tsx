import { Link } from "react-router-dom";
import logo from "../../assets/img/logo.png"

const Navbar = () => {
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
            <Link to="/" className="hover:text-green-500 transition">
              Home
            </Link>
            <Link to="/plants" className="hover:text-green-500 transition">
              Plants
            </Link>
            <Link to="/products" className="hover:text-green-500 transition">
              Product
            </Link>
            <Link to="/login" className="hover:text-green-500 transition">
              Login
            </Link>
            <Link
              to="/register"
              className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg font-medium transition"
            >
              Register
            </Link>
          </div>

          <div className="md:hidden">
            <button className="text-white text-2xl">☰</button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;