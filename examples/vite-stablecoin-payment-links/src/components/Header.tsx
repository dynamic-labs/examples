import { useState } from "react";

export default function Header({ isDarkMode }: { isDarkMode: boolean }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  return (
    <div className="header">
      <img
        className="logo"
        src={isDarkMode ? "/logo-light.png" : "/logo-dark.png"}
        alt="dynamic"
      />

      {/* Desktop buttons */}
      <div className="header-buttons desktop-only">
        <button
          className="docs-button"
          onClick={() =>
            window.open(
              "https://docs.dynamic.xyz",
              "_blank",
              "noopener,noreferrer"
            )
          }
        >
          Docs
        </button>
        <button
          className="get-started"
          onClick={() =>
            window.open(
              "https://app.dynamic.xyz",
              "_blank",
              "noopener,noreferrer"
            )
          }
        >
          Get started
        </button>
      </div>

      {/* Hamburger menu button */}
      <button
        className="hamburger-button mobile-only"
        onClick={toggleMobileMenu}
        aria-label="Toggle menu"
      >
        <div className={`hamburger-icon ${isMobileMenuOpen ? "open" : ""}`}>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </button>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={toggleMobileMenu}>
          <div className="mobile-menu" onClick={(e) => e.stopPropagation()}>
            <button
              className="docs-button mobile-menu-item"
              onClick={() => {
                window.open(
                  "https://docs.dynamic.xyz",
                  "_blank",
                  "noopener,noreferrer"
                );
                setIsMobileMenuOpen(false);
              }}
            >
              Docs
            </button>
            <button
              className="get-started mobile-menu-item"
              onClick={() => {
                window.open(
                  "https://app.dynamic.xyz",
                  "_blank",
                  "noopener,noreferrer"
                );
                setIsMobileMenuOpen(false);
              }}
            >
              Get started
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
