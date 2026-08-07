"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ChangeEventHandler,
  type InputHTMLAttributes,
} from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Layers3,
  Play,
  RefreshCw,
  RotateCcw,
} from "lucide-react";
import { DynamicWidget } from "@/lib/dynamic";
import { hasDynamicEnvironment } from "@/lib/providers";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DEFAULT_FORM_VALUES,
  type OperationLogEntry,
  type DepositFormValues,
  useZeroDevBatchedDeposit,
} from "@/lib/useZeroDevBatchedDeposit";
import type { BatchCall, DepositStage, NormalizedError } from "@/lib/pods-types";

const STAGES = [
  { key: "setup", label: "Smart wallet" },
  { key: "request", label: "Bytecode" },
  { key: "batch", label: "Batch" },
  { key: "submitted", label: "Sent" },
  { key: "confirmed", label: "Included" },
] as const;

const STAGE_INDEX: Record<DepositStage, number> = {
  setup: 0,
  input: 0,
  request: 1,
  batch: 2,
  submitted: 3,
  not_included: 3,
  confirmed: 4,
};

const STAGE_LABELS: Record<DepositStage, string> = {
  setup: "setup",
  input: "input",
  request: "bytecode",
  batch: "batch",
  submitted: "sent",
  not_included: "not included",
  confirmed: "included",
};

const ERROR_STAGE_LABELS: Record<NormalizedError["stage"], string> = {
  setup: "Setup",
  input: "Input",
  request: "Bytecode request",
  batch: "Batch",
  submitted: "Submission",
  not_included: "Monad inclusion",
};

export function BatchedPodsDeposit() {
  if (!hasDynamicEnvironment) return <MissingEnvironment />;
  return <ConnectedBatchedPodsDeposit />;
}

function ConnectedBatchedPodsDeposit() {
  const [values, setValues] =
    useState<DepositFormValues>(DEFAULT_FORM_VALUES);
  const formValues = { ...DEFAULT_FORM_VALUES, ...values };
  const resultRef = useRef<HTMLDivElement>(null);
  const operation = useZeroDevBatchedDeposit();
  const { state, summary } = operation;
  const currentIndex = STAGE_INDEX[state.stage] ?? 0;

  useEffect(() => {
    if (
      state.error ||
      state.stage === "submitted" ||
      state.stage === "not_included" ||
      state.stage === "confirmed"
    ) {
      resultRef.current?.focus();
    }
  }, [state.error, state.stage]);

  const updateField =
    (field: keyof DepositFormValues) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setValues((current) => ({
        ...DEFAULT_FORM_VALUES,
        ...current,
        [field]: event.target.value,
      }));
    };

  const resetAll = () => {
    setValues(DEFAULT_FORM_VALUES);
    operation.reset();
  };

  return (
    <div className="min-h-screen bg-[#f7f8fb] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-4 py-4 sm:flex-row sm:items-center sm:px-6">
          <div>
            <h1 className="text-xl font-semibold tracking-normal">
              Pods ZeroDev batched deposit
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Dynamic smart wallet, Pods bytecode, one ZeroDev batch.
            </p>
          </div>
          <DynamicWidget />
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(320px,420px)_minmax(0,1fr)]">
        <Card className="h-fit min-w-0 rounded-md border-slate-300 shadow-none">
          <CardHeader>
            <CardTitle className="text-lg">Deposit request</CardTitle>
            <CardDescription>
              The connected ZeroDev smart wallet is passed to Pods as the wallet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                void operation.startDeposit(formValues);
              }}
            >
              <Field
                id="chainId"
                label="Chain id"
                description="Monad mainnet uses 143."
                value={formValues.chainId}
                onChange={updateField("chainId")}
                inputMode="numeric"
              />
              <Field
                id="strategyId"
                label="Strategy id"
                description="Known fixture: Morpho-hyperUSDCa-monad."
                value={formValues.strategyId}
                onChange={updateField("strategyId")}
              />
              <Field
                id="asset"
                label="Asset address"
                description="Monad USDC is prefilled."
                value={formValues.asset}
                onChange={updateField("asset")}
              />
              <Field
                id="amount"
                label="Raw amount"
                description="1000000 is 1 USDC with 6 decimals."
                value={formValues.amount}
                onChange={updateField("amount")}
                inputMode="numeric"
              />

              <dl className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">
                <SummaryRow
                  label="Smart wallet"
                  value={summary.smartWalletAddress}
                />
                <SummaryRow label="Connector" value={summary.connectorName} />
                <SummaryRow
                  label="ZeroDev"
                  value={operation.isZeroDevWallet ? "available" : "not selected"}
                />
              </dl>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="submit"
                  disabled={!operation.canSubmit || state.busy}
                  title={operation.disabledReason}
                  className="gap-2 bg-blue-600 text-white hover:bg-blue-700"
                >
                  {state.busy ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  Start batched deposit
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetAll}
                  disabled={state.busy}
                  className="gap-2 border-slate-900 bg-white text-slate-950"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>
              </div>
              {!operation.canSubmit && operation.disabledReason && (
                <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
                  {operation.disabledReason}
                </p>
              )}
              {state.logs.length > 0 && (
                <OperationLog
                  entries={state.logs}
                  title="Live operation log"
                  compact
                />
              )}
            </form>
          </CardContent>
        </Card>

        <section className="min-w-0 space-y-5">
          <Card className="min-w-0 rounded-md border-slate-300 shadow-none">
            <CardHeader>
              <CardTitle className="text-lg">Execution stages</CardTitle>
              <CardDescription>
                The batch stage submits every Pods bytecode item in one ZeroDev call.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="grid gap-2 sm:grid-cols-5" aria-label="Execution stages">
                {STAGES.map((stage, index) => {
                  const active = stage.key === state.stage;
                  const complete = currentIndex > index;
                  const failed =
                    state.error?.stage === stage.key ||
                    (state.stage === "not_included" &&
                      stage.key === "submitted");
                  return (
                    <li
                      key={stage.key}
                      className={[
                        "rounded-md border p-3 text-sm",
                        failed
                          ? "border-red-300 bg-red-50 text-red-900"
                          : active
                            ? "border-blue-300 bg-blue-50 text-blue-950"
                            : complete
                              ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                              : "border-slate-200 bg-white text-slate-600",
                      ].join(" ")}
                    >
                      <span className="flex items-center gap-2 font-medium">
                        {complete ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : failed ? (
                          <AlertTriangle className="h-4 w-4" />
                        ) : (
                          <span className="h-2 w-2 rounded-full bg-current" />
                        )}
                        {stage.label}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </CardContent>
          </Card>

          <Card className="min-w-0 rounded-md border-slate-300 shadow-none">
            <CardHeader>
              <CardTitle className="text-lg">Diagnostics</CardTitle>
              <CardDescription>
                Bytecode request details stay separate from the ZeroDev batch.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                ref={resultRef}
                tabIndex={-1}
                aria-live="polite"
                className="space-y-4 outline-none"
              >
                <dl className="grid min-w-0 gap-3 rounded-md border border-slate-200 bg-white p-4 text-sm sm:grid-cols-2">
                  <SummaryRow label="Action id" value={summary.actionId} />
                  <SummaryRow
                    label="Bytecode calls"
                    value={
                      summary.callCount ? String(summary.callCount) : undefined
                    }
                  />
                  <SummaryRow
                    label="UserOp hash"
                    value={summary.submittedHash}
                  />
                  <SummaryRow
                    label="On-chain tx"
                    value={summary.transactionHash}
                  />
                  <SummaryRow
                    label="EntryPoint logs"
                    value={
                      summary.inclusion
                        ? String(summary.inclusion.entryPointLogs.length)
                        : undefined
                    }
                  />
                  <SummaryRow
                    label="Searched blocks"
                    value={
                      summary.inclusion
                        ? String(summary.inclusion.searchedBlocks)
                        : undefined
                    }
                  />
                  <SummaryRow label="Stage" value={STAGE_LABELS[state.stage]} />
                </dl>

                {state.error && <ErrorPanel error={state.error} />}

                {summary.requestUrl && (
                  <details className="min-w-0 overflow-hidden rounded-md border border-slate-200 bg-white p-3 text-sm">
                    <summary className="cursor-pointer font-medium text-slate-900">
                      Pods request URL
                    </summary>
                    <pre className="mt-3 max-w-full overflow-x-auto whitespace-pre-wrap break-all rounded-md bg-slate-950 p-3 text-xs text-slate-50">
                      {summary.requestUrl}
                    </pre>
                  </details>
                )}

                {state.calls.length > 0 && (
                  <details open className="min-w-0 overflow-hidden rounded-md border border-slate-200 bg-white p-3 text-sm">
                    <summary className="flex cursor-pointer items-center gap-2 font-medium text-slate-900">
                      <Layers3 className="h-4 w-4" />
                      Batched calls
                    </summary>
                    <CallPreview calls={state.calls} />
                  </details>
                )}

                {state.logs.length > 0 && (
                  <OperationLog
                    entries={state.logs}
                    title="Operation log"
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}

function MissingEnvironment() {
  return (
    <div className="min-h-screen bg-[#f7f8fb] p-6 text-slate-950">
      <Card className="mx-auto max-w-xl rounded-md border-slate-300 shadow-none">
        <CardHeader>
          <CardTitle className="text-lg">Missing Dynamic environment</CardTitle>
          <CardDescription>
            Set `NEXT_PUBLIC_DYNAMIC_ENV_ID` before opening this example.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

function Field({
  id,
  label,
  description,
  value,
  onChange,
  inputMode,
}: {
  id: string;
  label: string;
  description: string;
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-slate-900">
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={onChange}
        inputMode={inputMode}
        className="mt-2 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
      <p className="mt-1 text-xs text-slate-500">{description}</p>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold uppercase tracking-normal text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 min-h-5 break-all font-mono text-xs text-slate-950">
        {value || "Not available"}
      </dd>
    </div>
  );
}

function ErrorPanel({ error }: { error: NormalizedError }) {
  return (
    <div className="rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-950">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="font-semibold">
            {ERROR_STAGE_LABELS[error.stage]} failed
          </p>
          <p className="mt-2">{error.message}</p>
        </div>
      </div>
      {error.details !== undefined && (
        <details className="mt-4 rounded-md border border-red-200 bg-white p-3">
          <summary className="cursor-pointer font-medium">
            Redacted external details
          </summary>
          <pre className="mt-3 max-h-72 max-w-full overflow-auto whitespace-pre-wrap break-words rounded-md bg-slate-950 p-3 text-xs text-slate-50">
            {JSON.stringify(error.details, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}

function CallPreview({ calls }: { calls: BatchCall[] }) {
  return (
    <div className="mt-3 max-w-full overflow-x-auto rounded-md border border-slate-200">
      <div className="grid min-w-[640px] grid-cols-[52px_minmax(0,1fr)_88px_88px] bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-normal text-slate-500">
        <span>#</span>
        <span>To</span>
        <span>Value</span>
        <span>Data bytes</span>
      </div>
      <ul className="min-w-[640px] divide-y divide-slate-200 bg-white text-xs">
        {calls.map((call, index) => (
          <li
            key={`${call.to}-${index}`}
            className="grid grid-cols-[52px_minmax(0,1fr)_88px_88px] px-3 py-2"
          >
            <span className="font-mono text-slate-500">{index + 1}</span>
            <span className="break-all font-mono text-slate-950">{call.to}</span>
            <span className="font-mono text-slate-950">
              {call.value.toString()}
            </span>
            <span className="font-mono text-slate-950">
              {Math.max(0, (call.data.length - 2) / 2)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function OperationLog({
  entries,
  title,
  compact = false,
}: {
  entries: OperationLogEntry[];
  title: string;
  compact?: boolean;
}) {
  const visibleEntries = compact ? entries.slice(-6) : entries;

  return (
    <details
      open
      className="min-w-0 overflow-hidden rounded-md border border-slate-200 bg-white p-3 text-sm"
    >
      <summary className="cursor-pointer font-medium text-slate-900">
        {title}
      </summary>
      <ol
        className={[
          "mt-3 space-y-2 overflow-auto pr-1",
          compact ? "max-h-56" : "max-h-96",
        ].join(" ")}
      >
        {visibleEntries.map((entry, index) => (
          <li
            key={`${entry.at}-${entry.message}-${index}`}
            className="min-w-0 rounded-md border border-slate-100 bg-slate-50 p-2"
          >
            <div className="grid min-w-0 gap-1 sm:grid-cols-[96px_minmax(0,1fr)]">
              <time className="font-mono text-xs text-slate-500">
                {entry.at}
              </time>
              <p className="min-w-0 break-words text-sm font-medium text-slate-950">
                {entry.message}
              </p>
            </div>
            {entry.details && (
              <pre className="mt-2 max-w-full overflow-x-auto whitespace-pre-wrap break-words rounded-md bg-slate-950 p-2 text-xs text-slate-50">
                {entry.details}
              </pre>
            )}
          </li>
        ))}
      </ol>
    </details>
  );
}
