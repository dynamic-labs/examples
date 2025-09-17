interface SetupProgressProps {
  isKYCComplete: boolean;
  hasPaymentMethods: boolean;
}

export default function SetupProgress({
  isKYCComplete,
  hasPaymentMethods,
}: SetupProgressProps) {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-card rounded-xl shadow-lg p-6 border">
        <h3 className="text-lg font-semibold text-card-foreground mb-4 text-center">
          Setup Progress
        </h3>
        <div className="flex items-center justify-center space-x-4">
          <div
            className={`flex items-center ${
              isKYCComplete
                ? "text-green-600 dark:text-green-400"
                : "text-muted-foreground"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                isKYCComplete
                  ? "border-green-600 bg-green-100 dark:bg-green-900/20"
                  : "border-border"
              }`}
            >
              {isKYCComplete ? "✓" : "1"}
            </div>
            <span className="ml-2 text-sm font-medium">KYC Verification</span>
          </div>

          <div
            className={`w-16 h-0.5 ${
              isKYCComplete ? "bg-green-600" : "bg-border"
            }`}
          ></div>

          <div
            className={`flex items-center ${
              hasPaymentMethods
                ? "text-green-600 dark:text-green-400"
                : "text-muted-foreground"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                hasPaymentMethods
                  ? "border-green-600 bg-green-100 dark:bg-green-900/20"
                  : "border-border"
              }`}
            >
              {hasPaymentMethods ? "✓" : "2"}
            </div>
            <span className="ml-2 text-sm font-medium">
              Payment Methods (1+)
            </span>
          </div>

          <div
            className={`w-16 h-0.5 ${
              hasPaymentMethods ? "bg-green-600" : "bg-border"
            }`}
          ></div>

          <div
            className={`flex items-center ${
              hasPaymentMethods
                ? "text-green-600 dark:text-green-400"
                : "text-muted-foreground"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                hasPaymentMethods
                  ? "border-green-600 bg-green-100 dark:bg-green-900/20"
                  : "border-border"
              }`}
            >
              {hasPaymentMethods ? "✓" : "3"}
            </div>
            <span className="ml-2 text-sm font-medium">Ready to Convert</span>
          </div>
        </div>
      </div>
    </div>
  );
}
