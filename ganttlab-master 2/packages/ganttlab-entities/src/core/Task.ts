import { TimeEstimate } from './TimeEstimate';

/**
 * The main unit of a Gantt chart
 */
export class Task {
  /**
   * The TimeEstimate (in days) attached to this task
   */
  public daysEstimate: TimeEstimate | undefined;

  /**
   * @param title - The title of this task
   * @param url - The URL to this task (directly usable in an `<a>` href)
   * @param start - A start date, which is mandatory without a predecessor
   * @param due - A due date (if start set, defaults to start + 1 day)
   * @param predecessor - The parent of this task, which might be used to override the start date
   */
  public state: string | null = null;
  public user: string | null = null;

  constructor(
    public title: string,
    public url: string,
    public start?: Date,
    public due?: Date,
    public predecessor?: Task,
  ) {
    if (!predecessor && !start) {
      throw new Error('A Task with no predecessor must have a start date');
    }

    if (!due && start) {
      const calculatedDue = new Date(start);
      calculatedDue.setDate(calculatedDue.getDate() + 1);
      this.due = calculatedDue;
    }
  }

  public addState(state: string): void {
    this.state = state;
  }

  public addUser(user: string): void {
    this.user = user;
  }
}
