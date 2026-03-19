import Map "mo:core/Map";
import Array "mo:core/Array";
import Float "mo:core/Float";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Order "mo:core/Order";

import Migration "migration";

(with migration = Migration.run)
actor {
  // Data Types
  type Employee = {
    id : Nat;
    name : Text;
  };

  type ShiftTipRecord = {
    weekKey : Text;
    dayIndex : Nat;
    shiftIndex : Nat;
    poolAmount : Float;
    employeeIds : [Nat];
    sharePerEmployee : Float;
    paidEmployeeIds : [Nat];
  };

  // Employee logic
  let employees = Map.empty<Nat, Employee>();

  var nextEmployeeId = 1;

  module Employee {
    public func compareByName(a : Employee, b : Employee) : Order.Order {
      switch (Text.compare(a.name, b.name)) {
        case (#equal) { Nat.compare(a.id, b.id) };
        case (order) { order };
      };
    };
  };

  // Tip Records Logic
  let tipRecordsByWeek = Map.empty<Text, [ShiftTipRecord]>();
  let archivedWeekKeys = Map.empty<Text, Bool>();

  func calculateShare(poolAmount : Float, employeeIds : [Nat]) : Float {
    if (employeeIds.size() == 0) {
      0.0;
    } else {
      poolAmount / employeeIds.size().toInt().toFloat();
    };
  };

  public shared ({ caller }) func addEmployee(name : Text) : async Nat {
    let employeeId = nextEmployeeId;
    let employee : Employee = { id = employeeId; name };
    employees.add(employeeId, employee);
    nextEmployeeId += 1;
    employeeId;
  };

  public shared ({ caller }) func updateEmployee(id : Nat, name : Text) : async () {
    if (not employees.containsKey(id)) {
      Runtime.trap("Employee not found");
    };
    let updatedEmployee : Employee = { id; name };
    employees.add(id, updatedEmployee);
  };

  public shared ({ caller }) func deleteEmployee(id : Nat) : async () {
    if (not employees.containsKey(id)) {
      Runtime.trap("Employee not found");
    };
    employees.remove(id);
  };

  public query ({ caller }) func listEmployees() : async [Employee] {
    employees.values().toArray();
  };

  public shared ({ caller }) func saveShiftTip(
    weekKey : Text,
    dayIndex : Nat,
    shiftIndex : Nat,
    poolAmount : Float,
    employeeIds : [Nat],
  ) : async () {
    let sharePerEmployee = calculateShare(poolAmount, employeeIds);

    let shiftRecord : ShiftTipRecord = {
      weekKey;
      dayIndex;
      shiftIndex;
      poolAmount;
      employeeIds;
      sharePerEmployee;
      paidEmployeeIds = [];
    };

    let existingRecords = switch (tipRecordsByWeek.get(weekKey)) {
      case (null) { [] };
      case (?recs) { recs };
    };

    let updatedRecords = existingRecords.concat([shiftRecord]);
    tipRecordsByWeek.add(weekKey, updatedRecords);

    if (not archivedWeekKeys.containsKey(weekKey)) {
      archivedWeekKeys.add(weekKey, true);
    };
  };

  public shared ({ caller }) func markTipsPaid(weekKey : Text, dayIndex : Nat, shiftIndex : Nat, employeeIds : [Nat]) : async () {
    let records = switch (tipRecordsByWeek.get(weekKey)) {
      case (null) { [] };
      case (?recs) { recs };
    };

    let updatedRecords = records.map(
      func(r) {
        if (r.dayIndex == dayIndex and r.shiftIndex == shiftIndex) {
          let currentPaid = r.paidEmployeeIds;
          let newPaid = currentPaid.concat(employeeIds);
          { r with paidEmployeeIds = newPaid };
        } else {
          r;
        };
      }
    );

    tipRecordsByWeek.add(weekKey, updatedRecords);
  };

  public query ({ caller }) func getWeekData(weekKey : Text) : async [ShiftTipRecord] {
    switch (tipRecordsByWeek.get(weekKey)) {
      case (null) {
        [];
      };
      case (?records) {
        records;
      };
    };
  };

  public query ({ caller }) func getUnpaidRecords() : async [ShiftTipRecord] {
    let unpaidRecords = tipRecordsByWeek.values().toArray().foldRight<([ShiftTipRecord]), [ShiftTipRecord]>(
      [],
      func(weekRecords, acc) {
        acc.concat(weekRecords);
      },
    );

    let filteredRecords = unpaidRecords.filter(
      func(record) {
        record.employeeIds.any(
          func(empid) {
            record.paidEmployeeIds.find(
              func(paidId) {
                empid == paidId;
              }
            ) == null
          }
        );
      }
    );
    filteredRecords;
  };

  public query ({ caller }) func listArchivedWeekKeys() : async [Text] {
    archivedWeekKeys.keys().toArray();
  };
};
