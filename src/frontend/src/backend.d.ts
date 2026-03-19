import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface ShiftTipRecord {
    paidEmployeeIds: Array<bigint>;
    weekKey: string;
    sharePerEmployee: number;
    dayIndex: bigint;
    shiftIndex: bigint;
    employeeIds: Array<bigint>;
    poolAmount: number;
}
export interface Employee {
    id: bigint;
    name: string;
}
export interface backendInterface {
    addEmployee(name: string): Promise<bigint>;
    deleteEmployee(id: bigint): Promise<void>;
    getUnpaidRecords(): Promise<Array<ShiftTipRecord>>;
    getWeekData(weekKey: string): Promise<Array<ShiftTipRecord>>;
    listArchivedWeekKeys(): Promise<Array<string>>;
    listEmployees(): Promise<Array<Employee>>;
    markTipsPaid(weekKey: string, dayIndex: bigint, shiftIndex: bigint, employeeIds: Array<bigint>): Promise<void>;
    saveShiftTip(weekKey: string, dayIndex: bigint, shiftIndex: bigint, poolAmount: number, employeeIds: Array<bigint>): Promise<void>;
    updateEmployee(id: bigint, name: string): Promise<void>;
}
