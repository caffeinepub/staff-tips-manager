import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calculator,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { ShiftTipRecord } from "../backend";
import {
  useEmployees,
  useMarkTipsPaid,
  useSaveShiftTip,
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

type ShiftFormState = {
  poolAmount: string;
  selectedEmployeeIds: Set<string>;
};

function emptyShiftForm(): ShiftFormState {
  return { poolAmount: "", selectedEmployeeIds: new Set() };
}

export function ShiftEntryTab() {
  const [weekKey, setWeekKey] = useState(() => getISOWeekKey(new Date()));
  const weekDates = getWeekDates(weekKey);

  const { data: employees = [], isLoading: empLoading } = useEmployees();
  const { data: weekData = [], isLoading: weekLoading } = useWeekData(weekKey);
  const saveShiftTip = useSaveShiftTip();
  const markTipsPaid = useMarkTipsPaid();

  const [formState, setFormState] = useState<Record<string, ShiftFormState>>(
    {},
  );

  function getFormKey(dayIdx: number, shiftIdx: number) {
    return `${dayIdx}-${shiftIdx}`;
  }

  function getForm(dayIdx: number, shiftIdx: number): ShiftFormState {
    return formState[getFormKey(dayIdx, shiftIdx)] ?? emptyShiftForm();
  }

  function updateForm(
    dayIdx: number,
    shiftIdx: number,
    updates: Partial<ShiftFormState>,
  ) {
    const key = getFormKey(dayIdx, shiftIdx);
    setFormState((prev) => ({
      ...prev,
      [key]: { ...(prev[key] ?? emptyShiftForm()), ...updates },
    }));
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional reset on weekKey change
  useEffect(() => {
    setFormState({});
  }, [weekKey]);

  function getSavedRecord(
    dayIdx: number,
    shiftIdx: number,
  ): ShiftTipRecord | undefined {
    return weekData.find(
      (r) => Number(r.dayIndex) === dayIdx && Number(r.shiftIndex) === shiftIdx,
    );
  }

  async function handleCalculate(dayIdx: number, shiftIdx: number) {
    const form = getForm(dayIdx, shiftIdx);
    const poolAmount = Number.parseFloat(form.poolAmount);
    if (Number.isNaN(poolAmount) || poolAmount <= 0) {
      toast.error("Please enter a valid tip amount");
      return;
    }
    if (form.selectedEmployeeIds.size === 0) {
      toast.error("Please select at least one employee");
      return;
    }
    const employeeIds = [...form.selectedEmployeeIds].map((id) => BigInt(id));
    try {
      await saveShiftTip.mutateAsync({
        weekKey,
        dayIndex: BigInt(dayIdx),
        shiftIndex: BigInt(shiftIdx),
        poolAmount,
        employeeIds,
      });
      const key = getFormKey(dayIdx, shiftIdx);
      setFormState((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      toast.success("Tips saved successfully");
    } catch {
      toast.error("Failed to save shift tips");
    }
  }

  async function handleMarkPaid(
    weekKey: string,
    dayIdx: number,
    shiftIdx: number,
    employeeIds: bigint[],
  ) {
    try {
      await markTipsPaid.mutateAsync({
        weekKey,
        dayIndex: BigInt(dayIdx),
        shiftIndex: BigInt(shiftIdx),
        employeeIds,
      });
      toast.success("Marked as paid");
    } catch {
      toast.error("Failed to mark as paid");
    }
  }

  const isLoading = empLoading || weekLoading;

  return (
    <div className="space-y-4">
      {/* Week navigation header */}
      <div className="bg-card rounded-lg shadow-card border border-border px-5 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Shift Entry</h2>
          <p className="text-base text-muted-foreground mt-0.5">
            {formatDateRange(weekKey)}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            data-ocid="shift.pagination_prev"
            size="icon"
            variant="outline"
            className="h-10 w-10"
            onClick={() => setWeekKey((wk) => navigateWeek(wk, -1))}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            data-ocid="shift.secondary_button"
            variant="ghost"
            className="h-10 text-base font-medium px-4"
            onClick={() => setWeekKey(getISOWeekKey(new Date()))}
          >
            This Week
          </Button>
          <Button
            data-ocid="shift.pagination_next"
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
        <div className="space-y-3" data-ocid="shift.loading_state">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {weekDates.map((date, dayIdx) => (
            <DaySection
              key={date.toISOString()}
              date={date}
              dayIdx={dayIdx}
              weekKey={weekKey}
              employees={employees}
              getForm={getForm}
              updateForm={updateForm}
              getSavedRecord={getSavedRecord}
              handleCalculate={handleCalculate}
              handleMarkPaid={handleMarkPaid}
              isSaving={saveShiftTip.isPending}
              isMarkingPaid={markTipsPaid.isPending}
              isToday={isToday(date)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

type Employee = { id: bigint; name: string };

function DaySection({
  date,
  dayIdx,
  weekKey,
  employees,
  getForm,
  updateForm,
  getSavedRecord,
  handleCalculate,
  handleMarkPaid,
  isSaving,
  isMarkingPaid,
  isToday: today,
}: {
  date: Date;
  dayIdx: number;
  weekKey: string;
  employees: Employee[];
  getForm: (d: number, s: number) => ShiftFormState;
  updateForm: (d: number, s: number, u: Partial<ShiftFormState>) => void;
  getSavedRecord: (d: number, s: number) => ShiftTipRecord | undefined;
  handleCalculate: (d: number, s: number) => Promise<void>;
  handleMarkPaid: (
    wk: string,
    d: number,
    s: number,
    ids: bigint[],
  ) => Promise<void>;
  isSaving: boolean;
  isMarkingPaid: boolean;
  isToday: boolean;
}) {
  const [open, setOpen] = useState(today);

  return (
    <div
      className={`bg-card rounded-lg shadow-card border overflow-hidden ${
        today ? "border-primary/40" : "border-border"
      }`}
    >
      <button
        type="button"
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-muted/30 transition-colors text-left"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex items-center gap-3">
          {today && (
            <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" />
          )}
          <span
            className={`font-bold text-lg ${
              today ? "text-primary" : "text-foreground"
            }`}
          >
            {formatShortDate(date)}
          </span>
          {today && (
            <span className="text-sm font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
              Today
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <ShiftSummaryPills dayIdx={dayIdx} getSavedRecord={getSavedRecord} />
          {open ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </button>

      {open && (
        <div className="border-t border-border divide-y divide-border">
          {SHIFT_LABELS.map((label, shiftIdx) => (
            <ShiftRow
              key={label}
              label={label}
              dayIdx={dayIdx}
              shiftIdx={shiftIdx}
              weekKey={weekKey}
              employees={employees}
              form={getForm(dayIdx, shiftIdx)}
              updateForm={(u) => updateForm(dayIdx, shiftIdx, u)}
              savedRecord={getSavedRecord(dayIdx, shiftIdx)}
              onCalculate={() => handleCalculate(dayIdx, shiftIdx)}
              onMarkPaid={(ids) =>
                handleMarkPaid(weekKey, dayIdx, shiftIdx, ids)
              }
              isSaving={isSaving}
              isMarkingPaid={isMarkingPaid}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ShiftSummaryPills({
  dayIdx,
  getSavedRecord,
}: {
  dayIdx: number;
  getSavedRecord: (d: number, s: number) => ShiftTipRecord | undefined;
}) {
  return (
    <div className="flex gap-1.5">
      {SHIFT_LABELS.map((shiftLabel, shiftIdx) => {
        const rec = getSavedRecord(dayIdx, shiftIdx);
        if (!rec) return null;
        return (
          <span
            key={shiftLabel}
            className="text-sm font-medium px-2.5 py-0.5 rounded-full success-badge"
          >
            {shiftLabel.split(" ")[0]} {formatMoney(rec.poolAmount)}
          </span>
        );
      })}
    </div>
  );
}

function ShiftRow({
  label,
  dayIdx,
  shiftIdx,
  weekKey: _weekKey,
  employees,
  form,
  updateForm,
  savedRecord,
  onCalculate,
  onMarkPaid,
  isSaving,
  isMarkingPaid,
}: {
  label: string;
  dayIdx: number;
  shiftIdx: number;
  weekKey: string;
  employees: Employee[];
  form: ShiftFormState;
  updateForm: (u: Partial<ShiftFormState>) => void;
  savedRecord: ShiftTipRecord | undefined;
  onCalculate: () => Promise<void>;
  onMarkPaid: (ids: bigint[]) => Promise<void>;
  isSaving: boolean;
  isMarkingPaid: boolean;
}) {
  const rowId = `shift-${dayIdx}-${shiftIdx}`;
  const [staffOpen, setStaffOpen] = useState(false);

  function toggleEmployee(id: string) {
    const next = new Set(form.selectedEmployeeIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    updateForm({ selectedEmployeeIds: next });
  }

  const selectedCount = form.selectedEmployeeIds.size;
  const poolAmount = Number.parseFloat(form.poolAmount);
  const shareAmount =
    selectedCount > 0 && !Number.isNaN(poolAmount) && poolAmount > 0
      ? poolAmount / selectedCount
      : null;

  return (
    <div className="px-5 py-5">
      {/* Shift label */}
      <p className="text-base font-bold text-foreground mb-4">{label}</p>

      <div className="space-y-4">
        {/* Pool amount input */}
        <div className="flex items-center gap-3">
          <label
            htmlFor={`${rowId}-pool`}
            className="text-base font-semibold text-muted-foreground w-32 shrink-0"
          >
            Pool Amount
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base text-muted-foreground font-semibold">
              £
            </span>
            <Input
              data-ocid="shift.input"
              id={`${rowId}-pool`}
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={form.poolAmount}
              onChange={(e) => updateForm({ poolAmount: e.target.value })}
              className="pl-8 w-36 h-12 text-base"
            />
          </div>
          {shareAmount !== null && (
            <div className="flex items-center gap-1.5">
              <span className="text-base text-muted-foreground">Each:</span>
              <span className="text-lg font-bold text-primary">
                {formatMoney(shareAmount)}
              </span>
            </div>
          )}
        </div>

        {/* Employee selection — inline expandable checklist */}
        <div>
          <button
            type="button"
            className="flex items-center gap-2 text-base font-semibold text-foreground mb-2"
            onClick={() => setStaffOpen((o) => !o)}
          >
            <span>
              {selectedCount === 0
                ? "Select Staff"
                : `Staff (${selectedCount} selected)`}
            </span>
            {staffOpen ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>

          {staffOpen && (
            <div className="border border-border rounded-lg overflow-hidden">
              {employees.length === 0 ? (
                <p className="px-4 py-3 text-base text-muted-foreground">
                  No employees — add staff first
                </p>
              ) : (
                <div className="max-h-52 overflow-y-auto divide-y divide-border">
                  {employees.map((emp) => {
                    const idStr = String(emp.id);
                    const checked = form.selectedEmployeeIds.has(idStr);
                    const checkboxId = `${rowId}-emp-${idStr}`;
                    return (
                      <label
                        key={idStr}
                        htmlFor={checkboxId}
                        className="flex items-center gap-4 px-4 py-3.5 hover:bg-muted/40 cursor-pointer"
                      >
                        <Checkbox
                          id={checkboxId}
                          checked={checked}
                          onCheckedChange={() => toggleEmployee(idStr)}
                          className="h-5 w-5"
                        />
                        <span className="text-base font-medium text-foreground">
                          {emp.name}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
              {employees.length > 0 && (
                <div className="px-4 py-2.5 border-t border-border bg-muted/20 flex justify-end">
                  <button
                    type="button"
                    className="text-sm font-semibold text-primary hover:underline"
                    onClick={() => setStaffOpen(false)}
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Calculate button */}
        <Button
          data-ocid="shift.primary_button"
          onClick={onCalculate}
          disabled={
            isSaving || !form.poolAmount || form.selectedEmployeeIds.size === 0
          }
          className="h-12 px-6 text-base font-semibold gap-2"
        >
          <Calculator className="h-5 w-5" />
          Calculate & Assign
        </Button>
      </div>

      {/* Saved result + pay status */}
      {savedRecord && (
        <div
          className="mt-4 rounded-lg border border-border bg-muted/20 overflow-hidden"
          data-ocid="shift.success_state"
        >
          {/* Summary header */}
          <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-success border-b border-success-foreground/20">
            <CheckCircle2 className="h-5 w-5 text-success-foreground shrink-0" />
            <span className="text-base font-bold text-success-foreground">
              Pool: {formatMoney(savedRecord.poolAmount)}
            </span>
            <span className="text-base text-success-foreground/80">
              {savedRecord.employeeIds.length} staff ·{" "}
              {formatMoney(savedRecord.sharePerEmployee)} each
            </span>
          </div>

          {/* Per-employee pay rows */}
          <div className="divide-y divide-border">
            {savedRecord.employeeIds.map((empId, idx) => {
              const emp = employees.find((e) => e.id === empId);
              const isPaid = savedRecord.paidEmployeeIds.some(
                (pid) => pid === empId,
              );
              return (
                <div
                  key={String(empId)}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div>
                    <p className="text-base font-semibold text-foreground">
                      {emp?.name ?? `Staff #${String(empId)}`}
                    </p>
                    <p className="text-lg font-bold text-primary">
                      {formatMoney(savedRecord.sharePerEmployee)}
                    </p>
                  </div>
                  {isPaid ? (
                    <Badge
                      data-ocid={`shift.success_state.${idx + 1}`}
                      className="bg-success text-success-foreground border-success-foreground/20 text-sm px-3 py-1"
                    >
                      Paid ✓
                    </Badge>
                  ) : (
                    <Button
                      data-ocid={`shift.primary_button.${idx + 1}`}
                      size="sm"
                      variant="outline"
                      disabled={isMarkingPaid}
                      className="text-base font-semibold h-10 px-4"
                      onClick={() => onMarkPaid([empId])}
                    >
                      Mark Paid
                    </Button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Mark all paid button if any unpaid */}
          {savedRecord.employeeIds.some(
            (id) => !savedRecord.paidEmployeeIds.some((pid) => pid === id),
          ) && (
            <div className="px-4 py-3 border-t border-border bg-muted/20 flex justify-end">
              <Button
                data-ocid="shift.confirm_button"
                variant="default"
                className="text-base font-semibold h-10 px-5"
                disabled={isMarkingPaid}
                onClick={() =>
                  onMarkPaid(
                    savedRecord.employeeIds.filter(
                      (id) =>
                        !savedRecord.paidEmployeeIds.some((pid) => pid === id),
                    ),
                  )
                }
              >
                Mark All Paid
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
