import Navbar from "../component/common/Navbar";
import Plant from "../assets/img/heroPlant.png"
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div>
        <Navbar />
    <main className="min-h-screen bg-green-50 flex items-center justify-center p-6">

      <div className="text-center">

        {/* <h1 className="text-4xl font-bold text-green-800">
          Welcome to Plant Care
        </h1>

        <p className="mt-4 text-gray-600">
          Grow your plants with love and care.
        </p> */}

        <section className="min-h-[85vh] flex flex-col lg:flex-row pt-20">

        <div className="lg:w-1/2 bg-[#e8f5e9] flex items-center">
          <div className="px-8 sm:px-12 lg:px-16 py-16 lg:py-0">

            <div className="inline-flex items-center gap-2 bg-white/70 text-green-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6 shadow-sm">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Your Green Journey
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold text-gray-800 leading-tight mb-5">
              Take care of your plants
              <br />
              <span className="text-green-700">with love</span>
            </h1>

            <p className="text-gray-600 text-lg leading-relaxed mb-8 max-w-md">
              Find the right plants, get care tips and bring nature’s beauty into your home.
            </p>

            <button className="bg-green-700 hover:bg-green-800 text-white font-semibold px-8 py-3.5 rounded-full shadow-md transition hover:scale-105">
              Explore Plants →
            </button>

          </div>
        </div>

        <div className="lg:w-1/2 bg-white flex items-center justify-center relative">
          <div className="absolute w-72 h-72 bg-green-100 rounded-full blur-3xl opacity-60"></div>

          <img
            src={Plant}
            alt="Beautiful Plant"
            className="relative z-10 w-[280px] sm:w-[340px] lg:w-[400px] object-contain drop-shadow-lg"
          />
        </div>

        </section>

        <section className="py-16 px-6 max-w-7xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Plant Categories</h2>
              <p className="text-gray-600">Choose plants according to your space and needs</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
              {[
                { name: "Indoor Plants", desc: "Home & Office", icon: "🪴" },
                { name: "Outdoor Plants", desc: "Garden & Balcony", icon: "🌳" },
                { name: "Succulents", desc: "Low Maintenance", icon: "🌵" },
                { name: "Flowering Plants", desc: "Colorful Blooms", icon: "🌸" },
                { name: "Herbs", desc: "Kitchen Garden", icon: "🌿" },
                { name: "Air Purifying", desc: "Clean Air", icon: "🍃" },
              ].map((item) => (
                <div
                  key={item.name}
                  className="bg-white border border-green-100 rounded-xl p-5 text-center shadow-sm hover:shadow-md hover:border-green-300 transition cursor-pointer"
                >
                  <div className="text-4xl mb-3">{item.icon}</div>
                  <h3 className="font-semibold text-gray-800 mb-1">{item.name}</h3>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
              ))}
            </div>
        </section>

        
        <section className="py-16 px-6 bg-white">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Why Choose Our Nursery</h2>
                <p className="text-gray-600">Complete plant care and nursery management solution</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    title: "Healthy Plants",
                    desc: "All plants are carefully grown and quality checked before delivery.",
                    icon: "🌱",
                  },
                  {
                    title: "Expert Care Tips",
                    desc: "Get detailed watering, light and fertilizer guidance for every plant.",
                    icon: "📖",
                  },
                  {
                    title: "Nursery Management",
                    desc: "Track stock, sales, suppliers and plant care records in one place.",
                    icon: "📋",
                  },
                  {
                    title: "Reliable Support",
                    desc: "Our team helps you with plant selection and ongoing care advice.",
                    icon: "🤝",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="bg-green-50 rounded-xl p-6 border border-green-100 text-left"
                  >
                    <div className="text-3xl mb-3">{item.icon}</div>
                    <h3 className="font-bold text-gray-800 mb-2">{item.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
        </section>

         
        <section className="py-16 px-6 max-w-7xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Plant Care Tips</h2>
              <p className="text-gray-600">Simple practices to keep your plants healthy</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  title: "Watering",
                  desc: "Check the soil moisture before watering. Most indoor plants prefer the top soil to dry slightly between waterings.",
                  icon: "💧",
                },
                {
                  title: "Sunlight",
                  desc: "Place plants according to their light requirement. Bright indirect light is ideal for most indoor varieties.",
                  icon: "☀️",
                },
                {
                  title: "Soil & Fertilizer",
                  desc: "Use well-draining soil and feed plants with suitable fertilizer during the growing season for better growth.",
                  icon: "🪴",
                },
              ].map((tip) => (
                <div
                  key={tip.title}
                  className="bg-white rounded-xl p-6 border border-green-100 shadow-sm text-left"
                >
                  <div className="text-3xl mb-3">{tip.icon}</div>
                  <h3 className="font-bold text-green-700 mb-2">{tip.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{tip.desc}</p>
                </div>
              ))}
            </div>
        </section>

          
        <section className="py-16 px-6">
            <div className="max-w-4xl mx-auto bg-green-700 rounded-2xl p-10 text-center text-white">
              <h2 className="text-3xl font-bold mb-3">Start Managing Your Plants Today</h2>
              <p className="text-green-100 mb-6 max-w-xl mx-auto">
                Join our plant care and nursery management system to track plants, get care guidance and grow healthier greenery.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  to="/plants"
                  className="bg-white text-green-700 font-semibold px-7 py-3 rounded-full hover:bg-green-50 transition"
                >
                  Explore Plants
                </Link>
                <Link
                  to="/register"
                  className="border-2 border-white text-white font-semibold px-7 py-3 rounded-full hover:bg-white/10 transition"
                >
                  Create Account
                </Link>
              </div>
            </div>
        </section>

      </div>

    </main>
    </div>
  );
};

export default Home;