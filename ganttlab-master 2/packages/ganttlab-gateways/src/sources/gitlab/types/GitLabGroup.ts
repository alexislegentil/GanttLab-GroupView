import { Project } from "ganttlab-entities";
import { GitLabProject } from "./GitLabProject";

export class GitLabGroup {
    name: string;
    path: string;
    projects: Array<GitLabProject>;
    avatar_url?: string;
    web_url?: string;
    description?: string;
    
    constructor(
      name: string,
      path: string,
      projects: Array<GitLabProject>,
      url?: string,
      description?: string,
      avatarUrl?: string,
    ) {
      this.name = name;
      this.path = path;
      this.projects = projects;
      this.avatar_url = avatarUrl;
      this.web_url = url;
      this.description = description;
    }

  }
