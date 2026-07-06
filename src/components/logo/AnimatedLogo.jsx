import React, { useState } from "react";
import { Link } from "react-router-dom";

const PCW_LOGO_URL = "https://media.base44.com/images/public/691b84df6fc6a5089f596212/8d7f12bd0_d30d7223-ab00-4daa-9920-1fda787341f8.jpeg";

export default function AnimatedLogo({ collapsed = false }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link
      to="/"
      className="relative block cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Glow effect */}
      <div
        className={`absolute inset-0 blur-xl transition-opacity duration-500 ${
          isHovered ? "opacity-60" : "opacity-0"
        }`}
        style={{
          background: "linear-gradient(135deg, #8b3dff 0%, #dc2626 100%)",
        }}
      />

      {/* Logo container */}
      <div className="relative flex items-center gap-2">
        {/* Logo image */}
        <div
          className={`relative transition-all duration-300 ${
            isHovered ? "scale-110" : ""
          }`}
          style={{
            filter: isHovered
              ? "drop-shadow(0 0 15px rgba(139, 61, 255, 0.5)) drop-shadow(0 0 30px rgba(220, 38, 38, 0.3))"
              : "none",
          }}
        >
          <img
            src={PCW_LOGO_URL}
            alt="PCW Logo"
            className={`${collapsed ? "w-10 h-10" : "w-36 h-auto"} object-contain rounded`}
            style={{ background: "transparent" }}
          />
        </div>
      </div>

      {/* Sparkle effects */}
      {isHovered && (
        <>
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full animate-ping" />
          <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-purple-400 rounded-full animate-ping animation-delay-200" />
        </>
      )}
    </Link>
  );
}