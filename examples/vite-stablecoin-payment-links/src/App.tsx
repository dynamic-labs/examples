import { useEffect, useState } from "react";
import { useUser } from "@dynamic-labs-sdk/react-hooks";
import { logout } from "@dynamic-labs-sdk/client";

import { dynamicClient, initDynamic } from "./lib/dynamic";
import { useDarkMode } from "./lib/useDarkMode";
import PaymentLinkGenerator from "./components/PaymentLinkGenerator";
import PaymentProcessor from "./components/PaymentProcessor";
import Header from "./components/Header";
import Footer from "./components/Footer";

import "./App.css";

function DynamicButton() {
  const user = useUser();
  return user ? (
    <button className="btn btn-secondary" onClick={() => logout(dynamicClient)}>
      {user.email ?? user.username ?? "Sign out"}
    </button>
  ) : (
    <button className="btn btn-primary" onClick={() => dynamicClient.ui.auth.show()}>
      Connect Wallet
    </button>
  );
}

function App() {
  const { isDarkMode } = useDarkMode();
  const [hasPaymentParams, setHasPaymentParams] = useState(false);

  useEffect(() => {
    initDynamic();
  }, []);

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
        <DynamicButton />
        {!hasPaymentParams && <PaymentLinkGenerator isDarkMode={isDarkMode} />}
        <PaymentProcessor isDarkMode={isDarkMode} />
      </div>

      <Footer />
    </div>
  );
}

export default App;
