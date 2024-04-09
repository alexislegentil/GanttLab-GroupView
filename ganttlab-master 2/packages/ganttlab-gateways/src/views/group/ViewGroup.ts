import {
    SourceVisitor,
    Configuration,
    Group,
    Project,
    Sort,
    Filter,
    PaginatedListOfTasks,
  } from 'ganttlab-entities';
  //import { ViewGroupGitHubStrategy } from './strategies/ViewGroupGitHubStrategy';
  import { ViewGroupGitLabStrategy } from './strategies/ViewGroupGitLabStategy';
  
  export class ViewGroup extends SourceVisitor<Group> {
    public slug = 'group';
    public name = 'By group';
    public shortDescription = 'Issues in a group sorted by Epic or Projects';
    public slugStrategies = {
  //    github: new ViewGroupGitHubStrategy(),
      gitlab: new ViewGroupGitLabStrategy(),
    };
  
    public configuration: Configuration = {
      project: null as Project | null,
      activeGroup: 0,
      tasks: {
        page: 1,
        pageSize: 50,
      },
      Groups: {
        page: 1,
        pageSize: 50,
      },
    };
  
    setSort(sort: Sort): void {
      throw new Error('Method not implemented.');
    }
    reverseSort(): void {
      throw new Error('Method not implemented.');
    }
    setFilter(filter: Filter): void {
      throw new Error('Method not implemented.');
    }
  }
  