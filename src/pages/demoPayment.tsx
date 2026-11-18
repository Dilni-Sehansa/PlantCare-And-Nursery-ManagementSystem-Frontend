import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "../component/common/Navbar";
import { getOrderById } from "../data/orders";
import type { OrderRecord } from "../data/orders";

type DemoResult = "success" | "cancelled";

const formatLkr = (amount: number) =>
  new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 2,
  }).format(amount);

const getCardType = (cardNumber: string) => {
  const digits = cardNumber.replace(/\D/g, "");
  if (/^4/.test(digits)) return "Visa";
  if (/^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/.test(digits)) {
    return "Mastercard";
  }
  if (/^3[47]/.test(digits)) return "American Express";
  if (/^6/.test(digits)) return "Discover";
  return digits ? "Card" : "Card type";
};

const DemoPayment = () => {
  const { orderId = "" } = useParams();
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [cardholder, setCardholder] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<DemoResult | null>(null);

  useEffect(() => {
    let active = true;

    const loadOrder = async () => {
      try {
        setLoadingOrder(true);
        setLoadError("");
        const foundOrder = await getOrderById(orderId);
        if (active) setOrder(foundOrder);
      } catch {
        if (active) {
          setLoadError("We could not load this order. Sign in and try again.");
        }
      } finally {
        if (active) setLoadingOrder(false);
      }
    };

    void loadOrder();
    return () => {
      active = false;
    };
  }, [orderId]);

  const clearCardDetails = () => {
    setCardholder("");
    setCardNumber("");
    setExpiry("");
    setCvv("");
  };

  const cancelDemo = () => {
    clearCardDetails();
    setFieldError("");
    setResult("cancelled");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFieldError("");

    const digits = cardNumber.replace(/\D/g, "");
    const expiryMatch = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(expiry);
    const expiryIsValid = expiryMatch
      ? Number(`20${expiryMatch[2]}`) > new Date().getFullYear() ||
        (Number(`20${expiryMatch[2]}`) === new Date().getFullYear() &&
          Number(expiryMatch[1]) >= new Date().getMonth() + 1)
      : false;

    if (cardholder.trim().length < 2) {
      setFieldError("Enter the cardholder name.");
      return;
    }
    if (digits.length < 13 || digits.length > 19) {
      setFieldError("Enter a card number between 13 and 19 digits.");
      return;
    }
    if (!expiryIsValid) {
      setFieldError("Enter a valid future expiry date in MM/YY format.");
      return;
    }
    if (!/^\d{3,4}$/.test(cvv)) {
      setFieldError("Enter a 3- or 4-digit security code.");
      return;
    }

    setProcessing(true);
    await new Promise((resolve) => window.setTimeout(resolve, 1200));
    clearCardDetails();
    setResult("success");
    setProcessing(false);
  };

  const isUnavailable =
    !order ||
    order.paymentMethod !== "CARD" ||
    order.paymentStatus === "PAID" ||
    order.status === "CANCELLED";

  return (
    <div className="min-h-screen bg-green-50 text-gray-800">
      <Navbar />
      <main className="mx-auto max-w-6xl px-5 pb-16 pt-28">
        <Link
          to="/my-orders"
          className="inline-flex items-center gap-2 font-semibold text-green-800 hover:text-green-950"
        >
          <span aria-hidden="true">←</span> Back to orders
        </Link>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <section className="rounded-3xl border border-green-100 bg-white p-6 shadow-lg sm:p-8">
            {loadingOrder ? (
              <p role="status" className="py-12 text-center text-gray-600">
                Loading order...
              </p>
            ) : loadError ? (
              <div role="alert" className="py-10 text-center">
                <h1 className="text-2xl font-bold">Order unavailable</h1>
                <p className="mt-2 text-gray-600">{loadError}</p>
              </div>
            ) : result ? (
              <div className="py-8 text-center" aria-live="polite">
                <div
                  className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full text-3xl ${
                    result === "success"
                      ? "bg-green-100 text-green-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {result === "success" ? "✓" : "×"}
                </div>
                <h1 className="mt-5 text-2xl font-bold text-gray-900">
                  {result === "success"
                    ? "Demo Payment Successful"
                    : "Demo payment cancelled"}
                </h1>
                <p className="mx-auto mt-3 max-w-lg text-gray-600">
                  {result === "success"
                    ? "This was only a simulation. No money was charged, and the order was not marked as paid."
                    : "You cancelled the simulation. No money was charged, and the order was not marked as paid."}
                </p>
                {order && (
                  <div className="mx-auto mt-5 max-w-sm rounded-xl bg-green-50 p-4 text-left text-sm">
                    <p>
                      Order ID: <span className="font-bold">{order.orderId}</span>
                    </p>
                    <p className="mt-1">
                      Demo amount:{" "}
                      <span className="font-bold">
                        {formatLkr(order.totalAmount)}
                      </span>
                    </p>
                    <p className="mt-1 text-gray-600">
                      Recorded payment status: {order.paymentStatus}
                    </p>
                  </div>
                )}
                <div className="mt-7 flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setResult(null)}
                    className="rounded-xl border border-green-200 px-5 py-3 font-semibold text-green-800 hover:bg-green-50"
                  >
                    Try Again
                  </button>
                  <Link
                    to="/my-orders"
                    className="rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800"
                  >
                    Return to My Orders
                  </Link>
                </div>
              </div>
            ) : isUnavailable ? (
              <div className="py-10 text-center">
                <h1 className="text-2xl font-bold text-gray-900">
                  Demo payment unavailable
                </h1>
                <p className="mt-2 text-gray-600">
                  This order is not awaiting a demo card payment.
                </p>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-wider text-green-700">
                      NURIX · Demo checkout
                    </p>
                    <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
                      Card payment prototype
                    </h1>
                  </div>
                  <span className="rounded-full bg-green-50 px-4 py-2 text-sm font-bold text-green-800">
                    {getCardType(cardNumber)}
                  </span>
                </div>

                <div
                  role="note"
                  className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"
                >
                  Demonstration only. Do not enter real payment details. This
                  prototype does not contact a payment provider, charge money,
                  or change the order's payment status. Card details stay in
                  page memory only and are cleared after the simulation.
                </div>

                <form onSubmit={handleSubmit} className="mt-7 space-y-5">
                  <div>
                    <label
                      htmlFor="demo-cardholder"
                      className="mb-2 block text-sm font-semibold text-gray-700"
                    >
                      Cardholder name
                    </label>
                    <input
                      id="demo-cardholder"
                      autoComplete="off"
                      maxLength={60}
                      value={cardholder}
                      onChange={(event) => setCardholder(event.target.value)}
                      disabled={processing}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-gray-100"
                      placeholder="Name on card"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="demo-card-number"
                      className="mb-2 block text-sm font-semibold text-gray-700"
                    >
                      Card number
                    </label>
                    <input
                      id="demo-card-number"
                      autoComplete="off"
                      inputMode="numeric"
                      maxLength={23}
                      value={cardNumber}
                      onChange={(event) => {
                        const digits = event.target.value
                          .replace(/\D/g, "")
                          .slice(0, 19);
                        setCardNumber(
                          digits.replace(/(.{4})/g, "$1 ").trim()
                        );
                      }}
                      disabled={processing}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 tracking-wider outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-gray-100"
                      placeholder="Enter demo card number"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="demo-expiry"
                        className="mb-2 block text-sm font-semibold text-gray-700"
                      >
                        Expiry date
                      </label>
                      <input
                        id="demo-expiry"
                        autoComplete="off"
                        inputMode="numeric"
                        maxLength={5}
                        value={expiry}
                        onChange={(event) => {
                          const digits = event.target.value
                            .replace(/\D/g, "")
                            .slice(0, 4);
                          setExpiry(
                            digits.length > 2
                              ? `${digits.slice(0, 2)}/${digits.slice(2)}`
                              : digits
                          );
                        }}
                        disabled={processing}
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-gray-100"
                        placeholder="MM/YY"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="demo-cvv"
                        className="mb-2 block text-sm font-semibold text-gray-700"
                      >
                        Security code
                      </label>
                      <input
                        id="demo-cvv"
                        type="password"
                        autoComplete="off"
                        inputMode="numeric"
                        maxLength={4}
                        value={cvv}
                        onChange={(event) =>
                          setCvv(
                            event.target.value.replace(/\D/g, "").slice(0, 4)
                          )
                        }
                        disabled={processing}
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-gray-100"
                        placeholder="CVV"
                      />
                    </div>
                  </div>

                  {fieldError && (
                    <p role="alert" className="text-sm font-medium text-red-700">
                      {fieldError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={processing}
                    className="w-full rounded-xl bg-green-700 px-5 py-4 font-bold text-white shadow transition hover:bg-green-800 disabled:cursor-wait disabled:bg-green-500"
                  >
                    {processing
                      ? "Simulating payment..."
                      : `Pay ${order ? formatLkr(order.totalAmount) : ""}`}
                  </button>
                  <button
                    type="button"
                    onClick={cancelDemo}
                    disabled={processing}
                    className="w-full rounded-xl border border-gray-200 px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel demo payment
                  </button>
                </form>
              </>
            )}
          </section>

          <aside className="h-fit rounded-3xl border border-green-100 bg-white p-6 shadow-lg sm:p-8">
            <h2 className="text-xl font-bold text-gray-900">Order summary</h2>
            {order ? (
              <>
                <p className="mt-2 text-sm text-gray-600">
                  Order ID{" "}
                  <span className="font-bold text-gray-900">{order.orderId}</span>
                </p>
                <div className="mt-5 space-y-4 border-y border-gray-100 py-5">
                  {order.items.map((item, index) => {
                    const itemName =
                      item.itemType === "PRODUCT"
                        ? item.productName || item.productId || "Product"
                        : item.plantName || item.plantId || "Plant";
                    return (
                      <div
                        key={`${item.itemType}-${item.productId || item.plantId || index}`}
                        className="flex justify-between gap-4 text-sm"
                      >
                        <span className="text-gray-600">
                          {itemName} × {item.quantity}
                        </span>
                        <span className="shrink-0 font-semibold text-gray-800">
                          {formatLkr(item.price * item.quantity)}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between gap-4 pt-4 text-lg font-bold">
                  <span>Total</span>
                  <span>{formatLkr(order.totalAmount)}</span>
                </div>
                <p className="mt-5 rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
                  Payment method: Demo card · Status: {order.paymentStatus}
                </p>
              </>
            ) : (
              <p className="mt-3 text-sm text-gray-600">
                Order details will appear here.
              </p>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
};

export default DemoPayment;
