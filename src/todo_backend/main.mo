import Array "mo:base/Array";
import List "mo:base/List";
import Text "mo:base/Text";
import Principal "mo:base/Principal";

actor {
    public type Task = {
        id: Nat;
        description: Text;
        completed: Bool;
    };

    private stable var nextId : Nat = 0;
    private stable var tasks : List.List<Task> = List.nil();

    public shared(msg) func whoami() : async Text {
        Principal.toText(msg.caller)
    };

    public shared(msg) func addTask(description : Text) : async Nat {
        let task : Task = {
            id = nextId;
            description = description;
            completed = false;
        };
        tasks := List.push(task, tasks);
        nextId += 1;
        nextId - 1
    };

    public query func getAllTasks() : async [Task] {
        List.toArray(tasks)
    };

    public shared(msg) func updateTask(id : Nat, description : Text, completed : Bool) : async Bool {
        tasks := List.map(tasks, func (task : Task) : Task {
            if (task.id == id) {
                {
                    id = id;
                    description = description;
                    completed = completed;
                }
            } else {
                task
            }
        });
        true
    };
    
    public func deleteTask(id : Nat) : async Bool {
        let (remainingTasks, deletedTasks) = List.partition(tasks, func (task : Task) : Bool { task.id != id });
        tasks := remainingTasks;
        List.size(deletedTasks) > 0
    };
}