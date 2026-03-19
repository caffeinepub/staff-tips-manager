import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { ShiftTipRecord } from "../backend";
import {
  useEmployees,
  useMarkTipsPaid,
  useUnpaidRecords,
  useWeekData,
} from "../hooks/useQueries";
import {
  SHIFT_LABELS,
  formatDateRange,
  formatMoney,
  formatShortDate,
  getISOWeekKey,
  getWeekDates,
  isToday,
  navigateWeek,
} from "../lib/weekUtils";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function WeeklySummaryTab() {
  const [weekKey, setWeekKey] = useState(() => getISOWeekKey(new Date()));
  const weekDates = getWeekDates(weekKey);

  const { data: employees = [], isLoading: empLoading } = useEmployees();
  const { data: weekData = [], isLoading: weekLoading } = useWeekData(weekKey);
  const { data: unpaidRecords = [] } = useUnpaidRecords();
  const markTipsPaid = useMarkTipsPaid();

  const isLoading = empLoading || weekLoading;

  function getRecord(
    dayIdx: number,
    shiftIdx: number,
  ): ShiftTipRecord | undefined {
    return weekData.find(
      (r) => Number(r.dayIndex) === dayIdx && Number(r.shiftIndex) === shiftIdx,
    );
  }

  function getEmployeeShare(
    empId: bigint,
    dayIdx: number,
    shiftIdx: number,
  ): number | null {
    const rec = getRecord(dayIdx, shiftIdx);
    if (!rec) return null;
    const worked = rec.employeeIds.some((id) => id === empId);
    if (!worked) return null;
    return rec.sharePerEmployee;
  }

  function getEmployeeWeeklyTotal(empId: bigint): number {
    let total = 0;
    for (let d = 0; d < 7; d++) {
      for (let s = 0; s < 2; s++) {
        const share = getEmployeeShare(empId, d, s);
        if (share !== null) total += share;
      }
    }
    return total;
  }

  function getShiftTotal(dayIdx: number, shiftIdx: number): number {
    const rec = getRecord(dayIdx, shiftIdx);
    return rec ? rec.poolAmount : 0;
  }

  const grandTotal = weekData.reduce((sum, r) => sum + r.poolAmount, 0);

  async function handleMarkAllPaid(rec: ShiftTipRecord) {
    const unpaidIds = rec.employeeIds.filter(
      (id) => !rec.paidEmployeeIds.some((pid) => pid === id),
    );
    if (unpaidIds.length === 0) return;
    try {
      await markTipsPaid.mutateAsync({
        weekKey: rec.weekKey,
        dayIndex: rec.dayIndex,
        shiftIndex: rec.shiftIndex,
        employeeIds: unpaidIds,
      });
      toast.success("Marked as paid");
    } catch {
      toast.error("Failed to mark as paid");
    }
  }

  // Filter unpaid records that are not in current week
  const currentWeekKey = getISOWeekKey(new Date());
  const outstandingRecords = unpaidRecords.filter(
    (r) => r.weekKey !== currentWeekKey,
  );

  return (
    <div className="space-y-5">
      {/* Outstanding unpaid section */}
      {outstandingRecords.length > 0 && (
        <div
          className="bg-card rounded-lg border-2 border-destructive/40 overflow-hidden"
          data-ocid="summary.panel"
        >
          <div className="px-5 py-4 bg-destructive/5 border-b border-destructive/20 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <h3 className="text-lg font-bold text-destructive">
              Outstanding (Unpaid)
            </h3>
          </div>
          <div className="divide-y divide-border">
            {outstandingRecords.map((rec, idx) => {
              const unpaidIds = rec.employeeIds.filter(
                (id) => !rec.paidEmployeeIds.some((pid) => pid === id),
              );
              const unpaidEmployeeNames = unpaidIds.map((id) => {
                const emp = employees.find((e) => e.id === id);
                return {
                  name: emp?.name ?? `Staff #${String(id)}`,
                  amount: rec.sharePerEmployee,
                };
              });
              // Build day label from dayIndex
              const dayName = DAY_NAMES[Number(rec.dayIndex)] ?? "";
              const shiftLabel = SHIFT_LABELS[Number(rec.shiftIndex)] ?? "";
              return (
                <div
                  key={`${rec.weekKey}-${rec.dayIndex}-${rec.shiftIndex}`}
                  data-ocid={`summary.item.${idx + 1}`}
                  className="px-5 py-4 flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-foreground">
                      {dayName} {shiftLabel} — Week {rec.weekKey}
                    </p>
                    <p className="text-base text-muted-foreground mt-1">
                      {unpaidEmployeeNames
                        .map((e) => `${e.name}: ${formatMoney(e.amount)}`)
                        .join(", ")}
                    </p>
                  </div>
                  <Button
                    data-ocid="summary.confirm_button"
                    variant="destructive"
                    className="text-base font-semibold h-11 px-5"
                    disabled={markTipsPaid.isPending}
                    onClick={() => handleMarkAllPaid(rec)}
                  >
                    Mark All Paid
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Week navigation */}
      <div className="bg-card rounded-lg shadow-card border border-border px-5 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Weekly Summary</h2>
          <p className="text-base text-muted-foreground mt-0.5">
            {formatDateRange(weekKey)}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            data-ocid="summary.pagination_prev"
            size="icon"
            variant="outline"
            className="h-10 w-10"
            onClick={() => setWeekKey((wk) => navigateWeek(wk, -1))}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            data-ocid="summary.secondary_button"
            variant="ghost"
            className="h-10 text-base font-medium px-4"
            onClick={() => setWeekKey(getISOWeekKey(new Date()))}
          >
            This Week
          </Button>
          <Button
            data-ocid="summary.pagination_next"
            size="icon"
            variant="outline"
            className="h-10 w-10"
            onClick={() => setWeekKey((wk) => navigateWeek(wk, 1))}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3" data-ocid="summary.loading_state">
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      ) : (
        <>
          {/* Main summary table */}
          <div className="bg-card rounded-lg shadow-card border border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="text-base font-bold text-foreground">
                Tip Distribution by Day &amp; Shift
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[900px]">
                <thead>
                  <tr className="bg-muted/60 border-b border-border">
                    <th className="text-left px-4 py-3 font-bold text-muted-foreground uppercase tracking-wide sticky left-0 bg-muted/60 w-36">
                      Employee
                    </th>
                    {weekDates.map((date) => {
                      const todayDate = isToday(date);
                      return (
                        <th
                          key={date.toISOString()}
                          colSpan={2}
                          className={`text-center px-2 py-3 font-bold uppercase tracking-wide ${
                            todayDate
                              ? "text-primary bg-primary/5"
                              : "text-muted-foreground"
                          }`}
                        >
                          {formatShortDate(date)}
                        </th>
                      );
                    })}
                    <th className="text-right px-4 py-3 font-bold text-muted-foreground uppercase tracking-wide">
                      Total
                    </th>
                  </tr>
                  <tr className="bg-muted/40 border-b border-border">
                    <th className="sticky left-0 bg-muted/40" />
                    {weekDates.map((date) => {
                      const todayDate = isToday(date);
                      return SHIFT_LABELS.map((label) => (
                        <th
                          key={`${date.toISOString()}-${label}`}
                          className={`text-center px-2 py-2 font-semibold text-muted-foreground/80 text-sm ${
                            todayDate ? "bg-primary/5" : ""
                          }`}
                        >
                          {label.split(" ")[0]}
                        </th>
                      ));
                    })}
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {employees.length === 0 ? (
                    <tr>
                      <td
                        colSpan={16}
                        className="text-center py-10 text-base text-muted-foreground"
                        data-ocid="summary.empty_state"
                      >
                        No employees — add staff in the Employees tab
                      </td>
                    </tr>
                  ) : (
                    employees.map((emp, empIdx) => {
                      const weeklyTotal = getEmployeeWeeklyTotal(emp.id);
                      return (
                        <tr
                          key={String(emp.id)}
                          data-ocid={`summary.row.${empIdx + 1}`}
                          className="border-b border-border hover:bg-muted/20 transition-colors"
                        >
                          <td className="px-4 py-3 font-semibold text-base text-foreground sticky left-0 bg-card">
                            {emp.name}
                          </td>
                          {weekDates.map((date, dayIdx) =>
                            SHIFT_LABELS.map((shiftLabel, shiftIdx) => {
                              const share = getEmployeeShare(
                                emp.id,
                                dayIdx,
                                shiftIdx,
                              );
                              const todayDate = isToday(date);
                              return (
                                <td
                                  key={`${date.toISOString()}-${shiftLabel}`}
                                  className={`text-center px-2 py-3 ${
                                    todayDate ? "bg-primary/5" : ""
                                  }`}
                                >
                                  {share !== null ? (
                                    <span className="font-semibold text-base text-foreground">
                                      {formatMoney(share)}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground/50">
                                      –
                                    </span>
                                  )}
                                </td>
                              );
                            }),
                          )}
                          <td className="text-right px-4 py-3 font-bold text-foreground">
                            {weeklyTotal > 0 ? (
                              <span className="px-2 py-0.5 rounded success-badge">
                                {formatMoney(weeklyTotal)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground/50">
                                –
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}

                  {/* Totals row */}
                  {weekData.length > 0 && (
                    <tr className="bg-muted/50 border-t-2 border-border font-bold">
                      <td className="px-4 py-3 text-muted-foreground uppercase text-sm tracking-wide sticky left-0 bg-muted/50">
                        Pool Total
                      </td>
                      {weekDates.map((date, dayIdx) =>
                        SHIFT_LABELS.map((shiftLabel, shiftIdx) => {
                          const total = getShiftTotal(dayIdx, shiftIdx);
                          const todayDate = isToday(date);
                          return (
                            <td
                              key={`total-${date.toISOString()}-${shiftLabel}`}
                              className={`text-center px-2 py-3 ${
                                todayDate ? "bg-primary/10" : ""
                              }`}
                            >
                              {total > 0 ? (
                                <span className="text-base text-foreground">
                                  {formatMoney(total)}
                                </span>
                              ) : (
                                <span className="text-muted-foreground/40">
                                  –
                                </span>
                              )}
                            </td>
                          );
                        }),
                      )}
                      <td className="text-right px-4 py-3 text-lg text-foreground">
                        {formatMoney(grandTotal)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Per-employee breakdown card */}
          <div className="bg-card rounded-lg shadow-card border border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h3 className="text-base font-bold text-foreground">
                Per Employee Breakdown
              </h3>
              {grandTotal > 0 && (
                <span className="ml-auto text-base font-medium text-muted-foreground">
                  Week total:{" "}
                  <span className="text-foreground font-bold">
                    {formatMoney(grandTotal)}
                  </span>
                </span>
              )}
            </div>
            {employees.length === 0 || weekData.length === 0 ? (
              <div
                className="py-12 text-center text-muted-foreground text-base"
                data-ocid="summary.empty_state"
              >
                <p>No tip data for this week yet.</p>
                <p className="text-sm mt-1">
                  Enter shift tips in the Shift Entry tab.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {employees
                  .map((emp) => ({
                    emp,
                    total: getEmployeeWeeklyTotal(emp.id),
                    shifts: weekDates
                      .flatMap((_, dayIdx) =>
                        SHIFT_LABELS.map((label, shiftIdx) => ({
                          label: `${DAY_NAMES[dayIdx]} ${label}`,
                          share: getEmployeeShare(emp.id, dayIdx, shiftIdx),
                        })),
                      )
                      .filter((s) => s.share !== null),
                  }))
                  .sort((a, b) => b.total - a.total)
                  .map(({ emp, total, shifts }, idx) => (
                    <div
                      key={String(emp.id)}
                      data-ocid={`summary.item.${idx + 1}`}
                      className="px-5 py-5 flex flex-wrap items-start gap-3"
                    >
                      <div className="min-w-[140px]">
                        <p className="font-bold text-lg text-foreground">
                          {emp.name}
                        </p>
                        <p className="text-base text-muted-foreground mt-0.5">
                          {shifts.length} shift{shifts.length !== 1 ? "s" : ""}{" "}
                          worked
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 flex-1">
                        {shifts.map((s) => (
                          <span
                            key={s.label}
                            className="text-base px-3 py-1.5 rounded-md bg-muted text-muted-foreground font-medium"
                          >
                            {s.label}: {formatMoney(s.share!)}
                          </span>
                        ))}
                      </div>
                      <div className="text-right">
                        {total > 0 ? (
                          <span className="text-lg font-bold px-3 py-1 rounded success-badge">
                            {formatMoney(total)}
                          </span>
                        ) : (
                          <span className="text-lg text-muted-foreground">
                            £0.00
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
