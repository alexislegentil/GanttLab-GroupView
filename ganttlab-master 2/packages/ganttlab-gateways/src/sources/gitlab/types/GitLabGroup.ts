import { Project } from "ganttlab-entities";

export class GitLabGroup {
    name: string;
    path: string;
    projects: Array<Project>;
    avatarUrl?: string;
    url?: string;
    description?: string;
    
    constructor(
      name: string,
      path: string,
      projects: Array<Project>,
      avatarUrl?: string,
      url?: string,
      description?: string,
    ) {
      this.name = name;
      this.path = path;
      this.projects = projects;
      this.avatarUrl = avatarUrl;
      this.url = url;
      this.description = description;
    }

  }
