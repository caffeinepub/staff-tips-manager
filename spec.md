# Staff Tips Manager

## Current State
App has ShiftEntryTab with per-day, per-shift tip entry. Employee selection uses an absolute-positioned dropdown. ShiftTipRecord has no paid tracking. WeeklySummaryTab shows weekly totals.

## Requested Changes (Diff)

### Add
- `paidEmployeeIds: [Nat]` field on ShiftTipRecord in backend
- `markTipsPaid(weekKey, dayIndex, shiftIndex, employeeIds)` backend function
- `getUnpaidRecords()` backend function returning all ShiftTipRecords where some employee is unpaid
- Per-employee "Mark as Paid" button in ShiftEntryTab saved record section
- Carryover section in WeeklySummaryTab showing unpaid tips from previous weeks

### Modify
- Employee selection in ShiftRow: replace absolute dropdown with inline scrollable checklist (max-h scrollable, no overflow clip issues)
- Increase font sizes throughout for readability (minimalist, big text)
- ShiftTipRecord backend type gains `paidEmployeeIds` field
- useQueries: add `useMarkTipsPaid` and `useUnpaidRecords` hooks

### Remove
- The absolute-positioned dropdown for employee selection (replace with inline)

## Implementation Plan
1. Regenerate backend with paidEmployeeIds field and markTipsPaid + getUnpaidRecords functions
2. Update backend.d.ts to reflect new types/functions
3. Update useQueries.ts with new hooks
4. Rewrite ShiftRow employee selector as inline scrollable checklist
5. Add Mark as Paid per-employee buttons in saved record section
6. Add unpaid carryover section to WeeklySummaryTab
7. Increase font sizes / improve readability throughout
