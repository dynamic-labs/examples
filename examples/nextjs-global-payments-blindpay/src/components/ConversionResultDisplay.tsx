import { ConversionResult } from "@/types";

interface ConversionResultDisplayProps {
  conversionResult: ConversionResult;
  onClose: () => void;
}

export default function ConversionResultDisplay({
  conversionResult,
  onClose,
}: ConversionResultDisplayProps) {
  if (conversionResult.blindpay?.memoCode) {
    // Fiat to Stable conversion result
    return (
      <div className="mb-6">
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-primary">
              Payin Instructions - Complete Your ACH Transfer
            </h3>
            <button
              onClick={onClose}
              className="text-primary/70 hover:text-primary text-lg"
            >
              ✕
            </button>
          </div>
          <div className="text-primary space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p>
                  <strong>Conversion ID:</strong> {conversionResult.id}
                </p>
                <p>
                  <strong>From:</strong> {conversionResult.fromAmount}{" "}
                  {conversionResult.fromCurrency}
                </p>
                <p>
                  <strong>To:</strong> {conversionResult.toAmount}{" "}
                  {conversionResult.toCurrency}
                </p>
                <p>
                  <strong>Status:</strong> {conversionResult.status}
                </p>
              </div>

              {conversionResult.blindpay?.bankingDetails && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-primary">
                    Banking Details for ACH Transfer:
                  </h4>
                  <div className="bg-card p-3 rounded border text-sm space-y-1">
                    <p>
                      <strong>MEMO CODE:</strong>{" "}
                      <span className="font-mono bg-yellow-100 dark:bg-yellow-900/20 px-2 py-1 rounded">
                        {conversionResult.blindpay.memoCode}
                      </span>
                    </p>
                    <p>
                      <strong>Routing Number:</strong>{" "}
                      {conversionResult.blindpay.bankingDetails.routing_number}
                    </p>
                    <p>
                      <strong>Account Number:</strong>{" "}
                      {conversionResult.blindpay.bankingDetails.account_number}
                    </p>
                    <p>
                      <strong>Account Type:</strong>{" "}
                      {conversionResult.blindpay.bankingDetails.account_type}
                    </p>
                    <p>
                      <strong>Beneficiary:</strong>{" "}
                      {
                        conversionResult.blindpay.bankingDetails.beneficiary
                          .name
                      }
                    </p>
                    <p>
                      <strong>Bank Address:</strong>{" "}
                      {
                        conversionResult.blindpay.bankingDetails.receiving_bank
                          .address_line_1
                      }
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="text-sm mt-4 p-3 rounded bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300">
              <p>
                <strong>Important:</strong> Include the memo code with your ACH
                transfer.
              </p>
              <p>We will monitor for payments for 5 business days.</p>
              <p>
                Once payment is confirmed, USDC will be transferred to your
                wallet.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Stable to Fiat conversion result
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-2 text-green-800 dark:text-green-300">
          Conversion Initiated Successfully!
        </h3>
        <div className="text-green-700 dark:text-green-300 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p>
                <strong>Conversion ID:</strong> {conversionResult.id}
              </p>
              <p>
                <strong>From:</strong> {conversionResult.fromAmount}{" "}
                {conversionResult.fromCurrency}
              </p>
              <p>
                <strong>To:</strong> {conversionResult.toAmount}{" "}
                {conversionResult.toCurrency}
              </p>
              <p>
                <strong>Status:</strong> {conversionResult.status}
              </p>
            </div>
          </div>

          <div className="text-sm mt-4 p-3 rounded bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
            <p>
              You&apos;ll receive updates on the conversion progress. Bank
              transfers typically take 1-3 business days.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
