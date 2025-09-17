"use client";

import { RouteExtended } from "@lifi/sdk";

interface ExecutionControlProps {
  activeRoute: RouteExtended | null;
  isExecuting: boolean;
  isRouteCompleted: boolean;
  onResumeRoute: () => void;
  onMoveToBackground: () => void;
  onStopRoute: () => void;
}

export default function ExecutionControl({
  activeRoute,
  isExecuting,
  isRouteCompleted,
  onResumeRoute,
  onMoveToBackground,
  onStopRoute,
}: ExecutionControlProps) {
  if (!activeRoute || isRouteCompleted) return null;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-md p-6 mb-6 border border-blue-200">
      <h3 className="text-xl font-semibold text-blue-900 mb-4 flex items-center space-x-2">
        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <span>Route Execution Control</span>
      </h3>
      
      <div className="flex flex-wrap gap-3">
        {isExecuting ? (
          <>
            <button
              onClick={onMoveToBackground}
              className="px-6 py-2 bg-blue-100 text-blue-700 font-medium rounded-lg hover:bg-blue-200 transition-colors shadow-sm"
            >
              Move to Background
            </button>
            <button
              onClick={onStopRoute}
              className="px-6 py-2 bg-red-100 text-red-700 font-medium rounded-lg hover:bg-red-200 transition-colors shadow-sm"
            >
              Stop Execution
            </button>
          </>
        ) : (
          <button
            onClick={onResumeRoute}
            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            Resume Route
          </button>
        )}
      </div>
      
      <div className="mt-4 p-3 bg-white rounded-lg border border-blue-200">
        <p className="text-sm text-blue-800">
          <span className="font-medium">Route ID:</span> {activeRoute.id.slice(0, 8)}...
        </p>
        <p className="text-sm text-blue-800">
          <span className="font-medium">Status:</span> {isExecuting ? "Executing" : "Paused"}
        </p>
      </div>
    </div>
  );
}
