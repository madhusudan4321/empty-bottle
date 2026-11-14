"use client";

import dynamic from "next/dynamic";

const DynamicWaterMap = dynamic(() => import("./WaterMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[220px] rounded-xl border border-gray-200 bg-gray-100 flex flex-col items-center justify-center animate-pulse">
      <div className="text-gray-500 text-sm flex items-center gap-2 font-medium">
        <svg
          className="animate-spin h-5 w-5 text-blue-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          />
        </svg>
        <span>Loading campus map...</span>
      </div>
    </div>
  ),
});

export default function WaterMapClient(props) {
  const height = props.height || "70vh";
  return (
    <div style={{ height, width: "100%" }} className="w-full">
      <DynamicWaterMap {...props} />
    </div>
  );
}
