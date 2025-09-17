import WalletControls from "./components/WalletControls";
import { useDarkMode } from "./lib/useDarkMode";
import DynamicMethods from "./components/Methods";
import "./App.css";

function App() {
  const { isDarkMode } = useDarkMode();

  return (
    <div className={`container ${isDarkMode ? "dark" : "light"}`}>
      <div className="header">
        <img
          className="logo"
          src={isDarkMode ? "/logo-light.png" : "/logo-dark.png"}
          alt="dynamic"
        />
        <div className="header-buttons">
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
      </div>

      <div className="hero">
        <h1 className="hero-title">Linera</h1>
        <p className="hero-subtitle">
          Connect with Dynamic and interact with a Linera counter application.
        </p>
      </div>

      <div className="modal">
        <WalletControls />
        <DynamicMethods isDarkMode={isDarkMode} />
      </div>

      <div className="footer">
        <div className="footer-text">Made with 💙 by dynamic</div>
        <img
          className="footer-image"
          src={isDarkMode ? "/image-dark.png" : "/image-light.png"}
          alt="dynamic"
        />
      </div>
    </div>
  );
}

export default App;
