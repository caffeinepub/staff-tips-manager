import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { Banknote, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { EmployeesTab } from "./components/EmployeesTab";
import { ShiftEntryTab } from "./components/ShiftEntryTab";
import { WeeklySummaryTab } from "./components/WeeklySummaryTab";
import {
  formatDateRange,
  getISOWeekKey,
  getISOWeekNumber,
  navigateWeek,
} from "./lib/weekUtils";

const NAV_TABS = [
  { value: "employees", label: "Employees" },
  { value: "shift-entry", label: "Shift Entry" },
  { value: "weekly-summary", label: "Weekly Summary" },
];

const MOBILE_TABS = [
  { value: "employees", label: "Employees" },
  { value: "shift-entry", label: "Shifts" },
  { value: "weekly-summary", label: "Summary" },
];

function App() {
  const [activeTab, setActiveTab] = useState("shift-entry");
  const [headerWeekKey, setHeaderWeekKey] = useState(() =>
    getISOWeekKey(new Date()),
  );

  const { week } = getISOWeekNumber(new Date());

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top App Bar */}
      <header className="sticky top-0 z-40 bg-card border-b border-border shadow-xs">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
                <Banknote className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-[15px] text-foreground tracking-tight">
                Staff Tips Manager
              </span>
            </div>

            {/* Nav tabs (desktop) */}
            <nav className="hidden sm:flex items-center gap-0">
              {NAV_TABS.map((tab) => (
                <button
                  type="button"
                  key={tab.value}
                  data-ocid={`nav.${tab.value.replace("-", "_")}.link`}
                  onClick={() => setActiveTab(tab.value)}
                  className={`px-4 h-14 text-sm font-medium transition-colors relative ${
                    activeTab === tab.value
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.value && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
                  )}
                </button>
              ))}
            </nav>

            {/* Week badge */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="font-medium">Week {week}</span>
            </div>
          </div>

          {/* Mobile tabs */}
          <div className="flex sm:hidden items-center gap-0 -mx-1 overflow-x-auto">
            {MOBILE_TABS.map((tab) => (
              <button
                type="button"
                key={tab.value}
                data-ocid={`nav.${tab.value.replace("-", "_")}.link`}
                onClick={() => setActiveTab(tab.value)}
                className={`px-4 py-2.5 text-[13px] font-medium whitespace-nowrap transition-colors relative ${
                  activeTab === tab.value
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {tab.label}
                {activeTab === tab.value && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-[1200px] mx-auto w-full px-4 sm:px-6 py-6">
        {/* Page title row */}
        <div className="flex items-start sm:items-center justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl sm:text-[28px] font-bold text-foreground leading-tight">
              Week: {formatDateRange(headerWeekKey)}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {activeTab === "employees"
                ? "Manage your staff members"
                : activeTab === "shift-entry"
                  ? "Enter daily shift tip pools"
                  : "View weekly tip totals per employee"}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              data-ocid="header.pagination_prev"
              size="icon"
              variant="outline"
              className="h-8 w-8"
              onClick={() => setHeaderWeekKey((wk) => navigateWeek(wk, -1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              data-ocid="header.secondary_button"
              variant="outline"
              className="h-8 text-xs font-medium px-3"
              onClick={() => setHeaderWeekKey(getISOWeekKey(new Date()))}
            >
              Current Week
            </Button>
            <Button
              data-ocid="header.pagination_next"
              size="icon"
              variant="outline"
              className="h-8 w-8"
              onClick={() => setHeaderWeekKey((wk) => navigateWeek(wk, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Tab content */}
        <div data-ocid={`${activeTab}.panel`}>
          {activeTab === "employees" && <EmployeesTab />}
          {activeTab === "shift-entry" && <ShiftEntryTab />}
          {activeTab === "weekly-summary" && <WeeklySummaryTab />}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 mt-auto">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <p className="text-xs text-muted-foreground text-center">
            © {new Date().getFullYear()}. Built with ❤️ using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>

      <Toaster />
    </div>
  );
}

export default App;
