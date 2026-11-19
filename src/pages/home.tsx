import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Navbar from "../component/common/Navbar";
import heroPlant from "../assets/img/heroPlant.png";
import logo from "../assets/img/logo.png";
import { getUserRole } from "../hooks/useAuth";
import { getPlants, getImageUrl } from "../data/plants";
import type { PlantItem } from "../data/plants";
import { getProducts } from "../data/product";
import type { ProductItem } from "../data/product";

const DISPLAY_LIMIT = 4;

const getErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message;
  }
  return error instanceof Error ? error.message : "Could not load this section.";
};

const getUpcomingPlants = async () => {
  const plants: PlantItem[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const result = await getPlants({
      page,
      limit: 100,
      upcomingOnly: true,
    });

    plants.push(...result.plants);
    totalPages = result.meta.totalPages;
    page += 1;
  }

  return plants;
};

const getAvailableUpcomingPlants = (plants: PlantItem[]) =>
  plants
    .filter(
      (plant) =>
        plant.isUpcoming &&
        plant.availableAt &&
        Number.isFinite(new Date(plant.availableAt).getTime()) &&
        new Date(plant.availableAt).getTime() > Date.now()
    )
    .sort(
      (first, second) =>
        new Date(first.availableAt || "").getTime() -
        new Date(second.availableAt || "").getTime()
    )
    .slice(0, DISPLAY_LIMIT);

const getCountdown = (availableAt: string, now: number) => {
  const target = new Date(availableAt).getTime();

  if (!Number.isFinite(target) || target <= now) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      finished: true,
    };
  }

  let remaining = target - now;

  const days = Math.floor(remaining / 86400000);
  remaining %= 86400000;

  const hours = Math.floor(remaining / 3600000);
  remaining %= 3600000;

  const minutes = Math.floor(remaining / 60000);
  remaining %= 60000;

  const seconds = Math.floor(remaining / 1000);

  return {
    days,
    hours,
    minutes,
    seconds,
    finished: false,
  };
};

const formatPrice = (price: number) =>
  `Rs. ${Number(price || 0).toLocaleString("en-LK")}`;

const formatColomboDateTime = (value: string) =>
  new Intl.DateTimeFormat("en-LK", {
    timeZone: "Asia/Colombo",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));


const CONTAINER = "mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-12";

type IconName = "leaf" | "arrow" | "arrowRight" | "sprout" | "refresh";

const ICON_PATHS: Record<IconName, string[]> = {
  leaf: [
    "M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z",
    "M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12",
  ],
  arrow: ["M7 7h10v10", "M7 17 17 7"],
  arrowRight: ["M5 12h14", "m12 5 7 7-7 7"],
  sprout: [
    "M7 20h10",
    "M10 20c5.5-2.5.8-6.4 3-10",
    "M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z",
    "M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z",
  ],
  refresh: [
    "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8",
    "M21 3v5h-5",
    "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16",
    "M8 16H3v5",
  ],
};

const Icon = ({
  name,
  className = "h-5 w-5",
}: {
  name: IconName;
  className?: string;
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    {ICON_PATHS[name].map((d) => (
      <path key={d} d={d} />
    ))}
  </svg>
);

const SmartImage = ({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) => {
  const [failedSrc, setFailedSrc] = useState("");

  if (!src || failedSrc === src) {
    return (
      <div
        role="img"
        aria-label={`${alt} image unavailable`}
        className={`grid place-items-center bg-gradient-to-br from-[#E8F5E9] to-[#DDEFE0] text-green-700 ${className}`}
      >
        <Icon name="sprout" className="h-12 w-12 opacity-70" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setFailedSrc(src)}
      className={`${className} object-cover`}
    />
  );
};

const Skeleton = ({ className }: { className: string }) => (
  <div
    className={`animate-pulse overflow-hidden rounded-2xl border border-green-100 bg-white ${className}`}
  />
);

const ErrorNote = ({ children }: { children: ReactNode }) => (
  <p className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
    {children}
  </p>
);

const CountdownBox = ({
  availableAt,
  now,
}: {
  availableAt: string;
  now: number;
}) => {
  const { days, hours, minutes, seconds, finished } = getCountdown(
    availableAt,
    now
  );

  if (finished) {
    return (
      <span className="inline-flex items-center rounded-full border border-green-200 bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
        Available Now
      </span>
    );
  }

  const parts = [
    { label: "DAYS", value: days },
    { label: "HRS", value: hours },
    { label: "MIN", value: minutes },
    { label: "SEC", value: seconds },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {parts.map((part) => (
        <div
          key={part.label}
          className="flex min-w-[52px] flex-col items-center rounded-xl border border-green-200 bg-white px-2.5 py-1.5 shadow-sm"
        >
          <span className="text-sm font-bold tabular-nums text-green-800 sm:text-base">
            {String(part.value).padStart(2, "0")}
          </span>
          <span className="text-[9px] font-semibold uppercase tracking-wider text-green-600/70">
            {part.label}
          </span>
        </div>
      ))}
    </div>
  );
};

const Home = () => {
  const role = getUserRole();
  const [latestPlants, setLatestPlants] = useState<PlantItem[]>([]);
  const [upcomingPlants, setUpcomingPlants] = useState<PlantItem[]>([]);
  const [latestProducts, setLatestProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<{
    plants?: string;
    upcoming?: string;
    products?: string;
  }>({});
  const [now, setNow] = useState(Date.now());
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

 
  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        setErrors({});

        const [plantsResult, upcomingResult, productsResult] =
          await Promise.all([
            getPlants({ page: 1, limit: DISPLAY_LIMIT, includeUpcoming: false }),
            getUpcomingPlants().catch((err) => {
              console.error("Upcoming load error:", err);
              return [] as PlantItem[];
            }),
            role
              ? getProducts({ status: "Active" }).catch(() => ({
                  count: 0,
                  products: [] as ProductItem[],
                }))
              : Promise.resolve({ count: 0, products: [] as ProductItem[] }),
          ]);

        if (!active) return;

        setLatestPlants(plantsResult.plants || []);
        setUpcomingPlants(getAvailableUpcomingPlants(upcomingResult));
        setLatestProducts((productsResult.products || []).slice(0, DISPLAY_LIMIT));
      } catch (error) {
        console.error("Home load error:", error);
        if (active) {
          setErrors({ plants: getErrorMessage(error) });
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [reloadKey, role]);

  useEffect(() => {
    let active = true;

    const refreshUpcoming = async () => {
      try {
        const upcomingResult = await getUpcomingPlants();
        if (!active) return;
        setUpcomingPlants(getAvailableUpcomingPlants(upcomingResult));
      } catch (error) {
        console.error("Upcoming refresh error:", error);
        if (active) {
          setErrors((prev) => ({
            ...prev,
            upcoming: getErrorMessage(error),
          }));
        }
      }
    };

    const timer = window.setInterval(() => {
      void refreshUpcoming();
    }, 60_000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  // const orderLink = role ? "/orders" : "/login";
  const orderLink = role ? "/shop" : "/login";
  const productLink = "/products";

  return (
    <div className="min-h-screen bg-[#F8FAF5] text-[#1F2A22] antialiased">
      <Navbar />

      <main className="pt-16">
        <section className="relative isolate overflow-hidden">
          <div className="absolute inset-0">
            <img
              src={heroPlant}
              alt=""
              aria-hidden="true"
              className="h-full w-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#E8F5E9]/97 via-[#E8F5E9]/90 to-[#E8F5E9]/55" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#F8FAF5] via-transparent to-transparent" />
          </div>

          <div className={`${CONTAINER} relative py-20 sm:py-24 lg:py-28`}>
            <div className="max-w-2xl">
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-green-200 bg-white/90 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-green-800 shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                NURIX
              </p>

              <h1 className="text-4xl font-bold leading-[1.12] tracking-tight text-[#1F2A22] sm:text-5xl lg:text-6xl">
                Plant Care &amp;
                <br />
                <span className="text-green-700">Nursery</span>
              </h1>

              <p className="mt-5 max-w-lg text-base leading-7 text-[#5B665E] sm:text-lg">
                Discover healthy plants, care tips and garden essentials.
                Grow a greener space with NURIX.
              </p>

              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  to="/plants"
                  className="inline-flex items-center gap-2 rounded-xl bg-green-700 px-7 py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-green-800 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Explore Plants
                  <Icon name="arrow" className="h-4 w-4" />
                </Link>

                <Link
                  to={productLink}
                  className="inline-flex items-center gap-2 rounded-xl border-2 border-green-700/40 bg-white/90 px-7 py-3.5 text-sm font-semibold text-green-800 shadow-sm transition hover:border-green-700 hover:bg-white"
                >
                  View Products
                  <Icon name="arrowRight" className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className={`${CONTAINER} py-14 sm:py-16`}>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-green-700">
                From the nursery
              </p>
              <h2 className="mt-1 text-2xl font-bold text-[#1F2A22] sm:text-3xl">
                Recently added plants
              </h2>
            </div>
            <Link
              to="/plants"
              className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-white px-4 py-2 text-sm font-semibold text-green-800 shadow-sm transition hover:border-green-600 hover:bg-green-50"
            >
              See more
              <Icon name="arrowRight" className="h-3.5 w-3.5" />
            </Link>
          </div>

          {errors.plants ? (
            <ErrorNote>{errors.plants}</ErrorNote>
          ) : loading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-72" />
              ))}
            </div>
          ) : latestPlants.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {latestPlants.map((plant) => (
                <Link
                  key={plant._id}
                  to="/plants"
                  className="group overflow-hidden rounded-2xl border border-green-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(48,61,50,0.12)]"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-[#E8F5E9]">
                    <SmartImage
                      src={plant.image ? getImageUrl(plant.image) : ""}
                      alt={plant.name}
                      className="h-full w-full transition duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-green-600">
                      {plant.category?.join(" · ") || "Plant"}
                    </p>
                    <h3 className="mt-1 truncate text-base font-bold text-[#1F2A22]">
                      {plant.name}
                    </h3>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-sm font-semibold text-green-700">
                        {formatPrice(plant.price)}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          plant.stock > 0
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-600"
                        }`}
                      >
                        {plant.stock > 0 ? "In stock" : "Out of stock"}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-green-100 bg-white py-16 text-center">
              <p className="text-4xl">🌱</p>
              <p className="mt-3 font-semibold text-gray-800">
                Plants are on the way
              </p>
              <p className="mt-1 text-sm text-gray-500">
                New plants will appear here soon.
              </p>
            </div>
          )}
        </section>

        <section className="border-y border-green-100 bg-[#E8F5E9] py-14 sm:py-16">
          <div className={CONTAINER}>
            <div className="mb-10 text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-green-700">
                Coming Soon
              </p>
              <h2 className="mt-2 text-2xl font-bold text-[#1F2A22] sm:text-3xl">
                Upcoming plants
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-[#5B665E]">
                Plants marked as Coming Soon show a live countdown until they
                become available.
              </p>
            </div>

            {errors.upcoming ? (
              <ErrorNote>{errors.upcoming}</ErrorNote>
            ) : loading ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-80" />
                ))}
              </div>
            ) : upcomingPlants.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {upcomingPlants.map((plant) => (
                  <div
                    key={plant._id}
                    className="overflow-hidden rounded-2xl border border-green-100 bg-white shadow-sm"
                  >
                    <div className="aspect-[4/3] overflow-hidden bg-[#F1F8F2]">
                      <SmartImage
                        src={plant.image ? getImageUrl(plant.image) : ""}
                        alt={plant.name}
                        className="h-full w-full"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="truncate text-base font-bold text-[#1F2A22]">
                        {plant.name}
                      </h3>

                      {plant.availableAt && (
                        <p className="mt-1 text-[11px] text-[#5B665E]">
                          Available · {formatColomboDateTime(plant.availableAt)}
                        </p>
                      )}

                      <div className="mt-4">
                        {plant.availableAt && (
                          <CountdownBox
                            availableAt={plant.availableAt}
                            now={now}
                          />
                        )}
                      </div>

                      <div className="mt-4">
                        <span className="text-sm font-semibold text-green-700">
                          {formatPrice(plant.price)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-green-200 bg-white/80 py-14 text-center">
                <p className="text-3xl">🪴</p>
                <p className="mt-3 text-sm text-[#5B665E]">
                  No upcoming plants right now. When a plant is set as Coming
                  Soon with a date, it will appear here with a countdown.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className={`${CONTAINER} py-14 sm:py-16`}>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-green-700">
                Garden essentials
              </p>
              <h2 className="mt-1 text-2xl font-bold text-[#1F2A22] sm:text-3xl">
                Useful products
              </h2>
            </div>
            <Link
              to={productLink}
              className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-white px-4 py-2 text-sm font-semibold text-green-800 shadow-sm transition hover:border-green-600 hover:bg-green-50"
            >
              See more
              <Icon name="arrowRight" className="h-3.5 w-3.5" />
            </Link>
          </div>

          {!role ? (
            <div className="rounded-2xl border border-green-100 bg-white py-14 text-center">
              <p className="text-4xl">🛒</p>
              <h3 className="mt-3 text-lg font-semibold text-gray-800">
                Sign in to explore products
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Login to view gardening products and essentials.
              </p>
              <Link
                to="/login"
                className="mt-6 inline-flex rounded-xl bg-green-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-green-800"
              >
                Login now
              </Link>
            </div>
          ) : errors.products ? (
            <ErrorNote>{errors.products}</ErrorNote>
          ) : loading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-72" />
              ))}
            </div>
          ) : latestProducts.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {latestProducts.map((product) => (
                <Link
                  key={product._id}
                  to="/orders"
                  className="group overflow-hidden rounded-2xl border border-green-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(48,61,50,0.12)]"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-[#E8F5E9]">
                    <SmartImage
                      src={
                        product.imageUrl ? getImageUrl(product.imageUrl) : ""
                      }
                      alt={product.productName}
                      className="h-full w-full transition duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-green-600">
                      {product.category || "Product"}
                    </p>
                    <h3 className="mt-1 truncate text-base font-bold text-[#1F2A22]">
                      {product.productName}
                    </h3>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-sm font-semibold text-green-700">
                        {formatPrice(product.sellingPrice)}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          product.stock > 0
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-600"
                        }`}
                      >
                        {product.stock > 0
                          ? `${product.stock} ${product.unit || "pcs"}`
                          : "Out of stock"}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-green-100 bg-white py-14 text-center">
              <p className="text-4xl">📦</p>
              <p className="mt-3 font-semibold text-gray-800">
                Products coming soon
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Active products will appear here.
              </p>
            </div>
          )}
        </section>

        <section className="bg-[#E8F5E9] py-14 sm:py-16">
          <div className={`${CONTAINER} text-center`}>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-green-700">
              NURIX
            </p>
            <h2 className="mt-2 text-2xl font-bold text-green-800 sm:text-3xl">
              Start your green journey today
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-[#5B665E]">
              Explore plants, care details and essentials for your space.
            </p>
            <Link
              to="/plants"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-green-700 px-7 py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-green-800 hover:scale-[1.02]"
            >
              Browse Plants
              <Icon name="arrow" className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-green-100 bg-white pb-8 pt-12">
        <div className={CONTAINER}>
          <div className="flex flex-col items-center justify-between gap-6 border-b border-green-100 pb-8 sm:flex-row">
            <div className="flex items-center gap-3">
              <img
                src={logo}
                alt="NURIX"
                className="h-11 w-auto object-contain"
              />
              <div>
                <p className="text-sm font-semibold text-[#1F2A22]">NURIX</p>
                <p className="text-xs text-gray-500">
                  Plant Care & Nursery Management
                </p>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-5 text-sm text-gray-600">
              <Link to="/" className="transition hover:text-green-700">
                Home
              </Link>
              <Link to="/plants" className="transition hover:text-green-700">
                Plants
              </Link>
              <Link to={orderLink} className="transition hover:text-green-700">
                Products
              </Link>
              {!role && (
                <Link to="/login" className="transition hover:text-green-700">
                  Login
                </Link>
              )}
            </div>
          </div>
          <p className="pt-6 text-center text-xs text-gray-400">
            © {new Date().getFullYear()} NURIX. All rights reserved.
          </p>
        </div>
      </footer>

      <button
        type="button"
        onClick={() => setReloadKey((k) => k + 1)}
        disabled={loading}
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-green-800 px-5 py-3 text-xs font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-green-700 disabled:opacity-60"
      >
        <Icon
          name="refresh"
          className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
        />
        {loading ? "Loading..." : "Refresh"}
      </button>
    </div>
  );
};

export default Home;