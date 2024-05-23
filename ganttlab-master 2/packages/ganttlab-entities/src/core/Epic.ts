import { PaginatedListOfTasks } from "../pagination/PaginatedListOfTasks";
import { Task } from "./Task";

class Label {
  constructor(
    public name: string,
    public color: string,
  ) {}
}

/**
 * A project, which can contain tasks, milestones...
 */
export class Epic {

    public Tasks: Task[] | null = null;
    public labels: Array<Label> = [];

    constructor(
        public title: string,
        public description: string,
        public web_url: string,
        public state: string,
        public start_date: string,
        public due_date: string,
        public iid: number,
    ) {
        this.Tasks = null;
    }

    public addTasks(Task: Task[]) {
      this.Tasks = Task;
    }

    public addLabel(labelName: string, labelColor: string): void {
      const label = new Label(labelName, labelColor);
      this.labels.push(label);
    }
  }
  