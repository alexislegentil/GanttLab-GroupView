import { PaginatedListOfTasks } from '../pagination/PaginatedListOfTasks';
import { Epic } from './Epic';
import { Project } from './Project';

/**
 * A way to group {@link Task}s
 */
export class Group {
  /**
   * The paginated list of {@link Task}s in the group
   */
  public tasks: { [key: string]: PaginatedListOfTasks } | null = null;

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
  
  constructor(
    public name: string,
    public path: string,
    public projects: Array<Project>,
    public avatar_url?: string,
    public web_url?: string,
    public description?: string,
  ) {}

  public addTasks(tasks: PaginatedListOfTasks, project: Project) {
    this.tasks = { ...this.tasks, [project.name]: tasks };
  }

  public getTasks(project: Project): PaginatedListOfTasks | null {
    return this.tasks ? this.tasks[project.name]? this.tasks[project.name] : null : null;
  }

  public addEpic(epic: Epic) {
    this.epics.push(epic);
  }

}
