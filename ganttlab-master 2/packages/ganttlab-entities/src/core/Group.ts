import { PaginatedListOfTasks } from '../pagination/PaginatedListOfTasks';
import { Epic } from './Epic';
import { Iteration } from './Iteration';
import { Milestone } from './Milestone';
import { Project } from './Project';

/**
 * A way to group {@link Task}s
 */
export class Group {
  /**
   * The paginated list of {@link Task}s in the group
   */

  /**
   * @param name - The group name
   * @param path - The group path
   * @param avatar_url - The URL to this group avatar (directly usable in an img src) 
   * @param web_url - The URL to this group (directly usable in an `<a>` href)
   * @param description - The group description
   * @param projects - The list of projects in the group
   * @param epics - The list of epics in the group

   */

  public epics: Array<Epic> = [];
  public tasks: PaginatedListOfTasks | null = null;
  public milestones: Array<Milestone> = [];
  public iterations: Array<Iteration> = [];
  
  constructor(
    public name: string,
    public path: string,
    public projects: Array<Project>,
    public avatar_url?: string,
    public web_url?: string,
    public description?: string,
  ) {}

  public addTasks(tasks: PaginatedListOfTasks) {
    this.tasks = tasks ;
  }

  public getTasks(): PaginatedListOfTasks | null {
    return this.tasks;
  }

  public addEpic(epic: Epic) {
    this.epics.push(epic);
  }

  public addProjects(projects: Array<Project>) {
    this.projects = projects;
  }

  public addMilestones(milestones: Array<Milestone>) {
    this.milestones = milestones;
  }

  public addIterations(iteration: Array<Iteration>) {
    this.iterations = iteration;
  }

}
