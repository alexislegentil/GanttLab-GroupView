import { PaginatedListOfTasks } from '../pagination/PaginatedListOfTasks';
import { Project } from './Project';

/**
 * A way to group {@link Task}s
 */
export class Group {
  /**
   * The paginated list of {@link Task}s in the group
   */
  public tasks: PaginatedListOfTasks | null = null;

  /**
   * @param name - The group name
   * @param path - The group path
   * @param avatarUrl - The URL to this group avatar (directly usable in an img src) 
   * @param url - The URL to this group (directly usable in an `<a>` href)
   * @param description - The group description
   * @param projects - The list of projects in the group

   */
  constructor(
    public name: string,
    public path: string,
    public projects: Array<Project>,
    public avatarUrl?: string,
    public url?: string,
    public description?: string,
  ) {}
}
