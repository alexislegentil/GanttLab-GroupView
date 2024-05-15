import { PaginatedListOfTasks } from "../pagination/PaginatedListOfTasks";
import { Task } from "./Task";

/**
 * A project, which can contain tasks, milestones...
 */
export class Epic {

    public Tasks: Task[] | null = null;

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
  }
  