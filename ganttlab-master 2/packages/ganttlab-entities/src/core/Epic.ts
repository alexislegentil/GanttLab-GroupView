import { PaginatedListOfTasks } from "../pagination/PaginatedListOfTasks";

/**
 * A project, which can contain tasks, milestones...
 */
export class Epic {

    public Tasks: PaginatedListOfTasks | null = null;

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

    public addTasks(Task: PaginatedListOfTasks) {
      this.Tasks = Task;
    }
  }
  