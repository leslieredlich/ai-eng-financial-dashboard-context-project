import { useMemo } from "react";
import useSWR from "swr";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { KPIRow } from "@/components/dashboard/kpi-row";
import { IncomeOutcomeChart } from "@/components/dashboard/income-outcome-chart";
import { ProfitPercentChart } from "@/components/dashboard/profit-percent-chart";
import {
  type FinancialMovement,
  type MonthlyDataPoint,
} from "@/lib/financial-types";
import {
  computeKPIs,
  computeMonthlyData,
  formatPeriodLabel,
} from "@/lib/financial-utils";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

const fetcher = (url: string): Promise<FinancialMovement[]> =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error(`Failed to fetch financial data: ${res.status}`);
    return res.json();
  });

function SkipLink() {
  return (
    <a
      href="#main-content"
      className="visually-hidden focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:inline-flex focus:items-center focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:shadow-lg"
    >
      Skip to main content
    </a>
  );
}

function App() {
  const {
    data: movements,
    error,
    isLoading,
  } = useSWR(`${API_BASE_URL}/api/metrics`, fetcher, {
    errorRetryCount: 2,
  });

  const metrics = useMemo(
    () => (movements ? computeKPIs(movements) : null),
    [movements],
  );

  const monthlyData: MonthlyDataPoint[] = useMemo(
    () => (movements ? computeMonthlyData(movements) : []),
    [movements],
  );

  return (
    <>
      <SkipLink />
      <main
        id="main-content"
        className="dark min-h-screen bg-background text-foreground"
        tabIndex={-1}
      >
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-8" role="region" aria-label="Dashboard content">
            <DashboardHeader period={formatPeriodLabel(monthlyData)} />

            {error ? (
              <div
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive-foreground"
              >
                Could not load financial data. Check that the backend API is running.
              </div>
            ) : null}

            <section aria-label="Key performance indicators">
              <KPIRow metrics={metrics} loading={isLoading} />
            </section>

            <section
              aria-label="Financial charts"
              className="grid grid-cols-1 gap-4 xl:grid-cols-2"
            >
              <IncomeOutcomeChart data={monthlyData} loading={isLoading} />
              <ProfitPercentChart data={monthlyData} loading={isLoading} />
            </section>
          </div>
        </div>
      </main>
    </>
  );
}

export default App;
