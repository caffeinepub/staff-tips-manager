import Map "mo:core/Map";
import Nat "mo:core/Nat";

module {
  type OldShiftTipRecord = {
    weekKey : Text;
    dayIndex : Nat;
    shiftIndex : Nat;
    poolAmount : Float;
    employeeIds : [Nat];
    sharePerEmployee : Float;
  };

  type OldActor = {
    tipRecordsByWeek : Map.Map<Text, [OldShiftTipRecord]>;
  };

  type NewShiftTipRecord = {
    weekKey : Text;
    dayIndex : Nat;
    shiftIndex : Nat;
    poolAmount : Float;
    employeeIds : [Nat];
    sharePerEmployee : Float;
    paidEmployeeIds : [Nat];
  };

  type NewActor = {
    tipRecordsByWeek : Map.Map<Text, [NewShiftTipRecord]>;
  };

  public func run(old : OldActor) : NewActor {
    let newTipRecordsByWeek = old.tipRecordsByWeek.map<Text, [OldShiftTipRecord], [NewShiftTipRecord]>(
      func(_key, oldRecords) {
        oldRecords.map(
          func(oldRecord) {
            { oldRecord with paidEmployeeIds = [] };
          }
        );
      }
    );
    { old with tipRecordsByWeek = newTipRecordsByWeek };
  };
};
