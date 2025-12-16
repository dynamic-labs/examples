interface ConnectedWalletInfoProps {
  address: string;
}

export default function ConnectedWalletInfo({
  address,
}: ConnectedWalletInfoProps) {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
          Connected Wallet
        </p>
        <p className="font-mono text-sm break-all">{address}</p>
      </div>
      <div className="shrink-0 ml-4">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{
            background: "linear-gradient(to bottom right, #4679FE, #6B8AFE)",
          }}
        >
          <span className="text-white text-xs font-bold">
            {address?.slice(2, 4).toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
}
