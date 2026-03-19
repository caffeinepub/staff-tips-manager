import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, Pencil, Trash2, UserPlus, Users, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Employee } from "../backend";
import {
  useAddEmployee,
  useDeleteEmployee,
  useEmployees,
  useUpdateEmployee,
} from "../hooks/useQueries";

export function EmployeesTab() {
  const { data: employees = [], isLoading } = useEmployees();
  const addEmployee = useAddEmployee();
  const updateEmployee = useUpdateEmployee();
  const deleteEmployee = useDeleteEmployee();

  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<bigint | null>(null);
  const [editingName, setEditingName] = useState("");

  async function handleAdd() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    try {
      await addEmployee.mutateAsync(trimmed);
      setNewName("");
      toast.success(`${trimmed} added to staff`);
    } catch {
      toast.error("Failed to add employee");
    }
  }

  function startEdit(emp: Employee) {
    setEditingId(emp.id);
    setEditingName(emp.name);
  }

  async function saveEdit() {
    if (editingId === null) return;
    const trimmed = editingName.trim();
    if (!trimmed) return;
    try {
      await updateEmployee.mutateAsync({ id: editingId, name: trimmed });
      setEditingId(null);
      toast.success("Employee updated");
    } catch {
      toast.error("Failed to update employee");
    }
  }

  async function handleDelete(emp: Employee) {
    try {
      await deleteEmployee.mutateAsync(emp.id);
      toast.success(`${emp.name} removed`);
    } catch {
      toast.error("Failed to delete employee");
    }
  }

  return (
    <div className="space-y-5">
      {/* Add form */}
      <div className="bg-card rounded-lg shadow-card border border-border p-5">
        <h2 className="text-[15px] font-semibold text-foreground mb-4 flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-primary" />
          Add New Employee
        </h2>
        <div className="flex gap-2 max-w-sm">
          <Input
            data-ocid="employee.input"
            placeholder="Employee name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="text-sm"
          />
          <Button
            data-ocid="employee.submit_button"
            onClick={handleAdd}
            disabled={!newName.trim() || addEmployee.isPending}
            className="bg-primary hover:bg-primary/90 text-primary-foreground shrink-0"
          >
            {addEmployee.isPending ? "Adding..." : "Add Employee"}
          </Button>
        </div>
      </div>

      {/* Employee list */}
      <div className="bg-card rounded-lg shadow-card border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          <h2 className="text-[15px] font-semibold text-foreground">
            Staff Members
          </h2>
          {!isLoading && (
            <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              {employees.length} {employees.length === 1 ? "person" : "people"}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="p-5 space-y-3" data-ocid="employees.loading_state">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : employees.length === 0 ? (
          <div
            className="py-14 text-center text-muted-foreground text-sm"
            data-ocid="employees.empty_state"
          >
            <Users className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No employees yet</p>
            <p className="text-xs mt-1">Add your first team member above</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/60 border-b border-border">
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Name
                </th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-32">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp, idx) => (
                <tr
                  key={String(emp.id)}
                  data-ocid={`employees.item.${idx + 1}`}
                  className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-5 py-3">
                    {editingId === emp.id ? (
                      <Input
                        data-ocid="employees.input"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit();
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        className="h-8 text-sm max-w-xs"
                        autoFocus
                      />
                    ) : (
                      <span className="font-medium text-foreground">
                        {emp.name}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {editingId === emp.id ? (
                        <>
                          <Button
                            data-ocid="employees.save_button"
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-success-foreground hover:bg-success"
                            onClick={saveEdit}
                            disabled={updateEmployee.isPending}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            data-ocid="employees.cancel_button"
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => setEditingId(null)}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            data-ocid={`employees.edit_button.${idx + 1}`}
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-muted-foreground hover:text-primary"
                            onClick={() => startEdit(emp)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            data-ocid={`employees.delete_button.${idx + 1}`}
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDelete(emp)}
                            disabled={deleteEmployee.isPending}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
