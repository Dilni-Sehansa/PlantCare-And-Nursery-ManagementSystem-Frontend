import { useState } from "react";

const OrderImage = ({
  src,
  alt,
  compact = false,
}: {
  src: string;
  alt: string;
  compact?: boolean;
}) => {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 text-green-700 ${
          compact ? "h-16 w-16 rounded-xl text-2xl" : "h-full w-full text-5xl"
        }`}
        aria-label={`${alt} image unavailable`}
      >
        🌿
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      className={`object-cover ${compact ? "h-16 w-16 rounded-xl" : "h-full w-full"}`}
    />
  );
};

export default OrderImage;
