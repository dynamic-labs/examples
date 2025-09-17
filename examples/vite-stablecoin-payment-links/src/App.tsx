import { useEffect, useState } from "react";
import { DynamicWidget } from "@dynamic-labs/sdk-react-core";

import { useDarkMode } from "./lib/useDarkMode";
import PaymentLinkGenerator from "./components/PaymentLinkGenerator";
import PaymentProcessor from "./components/PaymentProcessor";
import Header from "./components/Header";
import Footer from "./components/Footer";

import "./App.css";

function App() {
  const { isDarkMode } = useDarkMode();
  const [hasPaymentParams, setHasPaymentParams] = useState(false);

  useEffect(() => {
    // Check if there are payment parameters in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const recipient = urlParams.get("recipient");
    const amount = urlParams.get("amount");

    setHasPaymentParams(!!(recipient && amount));
  }, []);

  return (
    <div className={`container ${isDarkMode ? "dark" : "light"}`}>
      <Header isDarkMode={isDarkMode} />

      <div className="modal">
        <DynamicWidget />
        {!hasPaymentParams && <PaymentLinkGenerator isDarkMode={isDarkMode} />}
        <PaymentProcessor isDarkMode={isDarkMode} />
      </div>

      <Footer />
    </div>
  );
}

export default App;
