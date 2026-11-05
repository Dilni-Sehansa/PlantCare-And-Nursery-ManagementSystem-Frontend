import Navbar from "../component/common/Navbar";

const Home = () => {
  return (
    <div>
        <Navbar />
    <main className="min-h-screen bg-green-50 flex items-center justify-center p-6">

      <div className="text-center">

        <h1 className="text-4xl font-bold text-green-800">
          Welcome to Plant Care
        </h1>

        <p className="mt-4 text-gray-600">
          Grow your plants with love and care.
        </p>

      </div>

    </main>
    </div>
  );
};

export default Home;