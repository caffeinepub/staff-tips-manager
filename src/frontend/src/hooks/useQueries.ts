import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Employee, ShiftTipRecord } from "../backend";
import { useActor } from "./useActor";

export function useEmployees() {
  const { actor, isFetching } = useActor();
  return useQuery<Employee[]>({
    queryKey: ["employees"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listEmployees();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddEmployee() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error("No actor");
      return actor.addEmployee(name);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["employees"] }),
  });
}

export function useUpdateEmployee() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id: bigint; name: string }) => {
      if (!actor) throw new Error("No actor");
      return actor.updateEmployee(id, name);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["employees"] }),
  });
}

export function useDeleteEmployee() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteEmployee(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["employees"] }),
  });
}

export function useWeekData(weekKey: string) {
  const { actor, isFetching } = useActor();
  return useQuery<ShiftTipRecord[]>({
    queryKey: ["weekData", weekKey],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getWeekData(weekKey);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveShiftTip() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      weekKey,
      dayIndex,
      shiftIndex,
      poolAmount,
      employeeIds,
    }: {
      weekKey: string;
      dayIndex: bigint;
      shiftIndex: bigint;
      poolAmount: number;
      employeeIds: bigint[];
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.saveShiftTip(
        weekKey,
        dayIndex,
        shiftIndex,
        poolAmount,
        employeeIds,
      );
    },
    onSuccess: (_, { weekKey }) =>
      qc.invalidateQueries({ queryKey: ["weekData", weekKey] }),
  });
}

export function useMarkTipsPaid() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      weekKey,
      dayIndex,
      shiftIndex,
      employeeIds,
    }: {
      weekKey: string;
      dayIndex: bigint;
      shiftIndex: bigint;
      employeeIds: bigint[];
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.markTipsPaid(weekKey, dayIndex, shiftIndex, employeeIds);
    },
    onSuccess: (_, { weekKey }) => {
      qc.invalidateQueries({ queryKey: ["weekData", weekKey] });
      qc.invalidateQueries({ queryKey: ["unpaidRecords"] });
    },
  });
}

export function useUnpaidRecords() {
  const { actor, isFetching } = useActor();
  return useQuery<ShiftTipRecord[]>({
    queryKey: ["unpaidRecords"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getUnpaidRecords();
    },
    enabled: !!actor && !isFetching,
  });
}
