import React from "react";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import ExportPrivateKey from "./export-private-key";
import ExportKeyShares from "./export-key-shares";
import ImportPrivateKey from "./import-private-key";
import SignMessage from "./sign-message";
import CreateMpcWallet from "./create-mpc-wallet";

const MPCDemo: React.FC = () => {
  const { user, handleLogOut, primaryWallet } = useDynamicContext();

  if (!user) {
    return (
      <div className="card">
        <h2>Please log in to use the MPC wallet features</h2>
        <p>
          You need to authenticate with Dynamic to access MPC wallet
          functionality
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="card">
        <h2>TSS-MPC Wallet Demo</h2>
        <p>Logged in as: {user.email || user.username || "Unknown user"}</p>
        <button onClick={handleLogOut}>Log Out</button>
      </div>

      <CreateMpcWallet wallet={primaryWallet} />

      {primaryWallet?.address && (
        <>
          <ImportPrivateKey wallet={primaryWallet} />
          <ExportKeyShares wallet={primaryWallet} />
          <ExportPrivateKey wallet={primaryWallet} />
          <SignMessage wallet={primaryWallet} />
        </>
      )}
    </div>
  );
};

export default MPCDemo;
