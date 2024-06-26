import axios from 'axios';
import { AxiosBackedAuthenticatableSource } from '../abstracts/AxiosBackedAuthenticatableSource';
import { Credentials, User } from 'ganttlab-entities';
import { GitLabUser } from './types/GitLabUser';
import { GitLabProject } from './types/GitLabProject';
import { GitLabGroup } from './types/GitLabGroup';

export class GitLabGateway extends AxiosBackedAuthenticatableSource {
  public slug = 'gitlab';
  public name = 'GitLab';

  setCredentials(credentials: Credentials): void {
    const safeInstance = credentials.instance.replace(/\/$/, '');
    this.credentials = { instance: safeInstance, token: credentials.token };
    this.setAxiosInstance(
      axios.create({
        baseURL: `${this.credentials.instance}/api/v4/`,
        headers: {
          common: {
            'PRIVATE-TOKEN': this.credentials.token,
          },
        },
      }),
    );
  }

  getUrl(): string | null {
    return this.credentials ? this.credentials.instance : null;
  }

  async getLoggedInUser(): Promise<User> {
    const { data } = await this.safeAxiosRequest<GitLabUser>({
      method: 'GET',
      url: '/user',
    });
    return new User(data.id, data.email, data.username, data.web_url, data.avatar_url);
  }

  async searchProjects(search: string): Promise<GitLabProject[]> {
    let uri = '/search';
    let toSearch = search;
    if (search.includes('/')) {
      const splitted = search.split('/');
      toSearch = splitted.pop() as string;
      const group = splitted.join('/');
      uri = `/groups/${encodeURI(group)}/search`;
    }
    const { data } = await this.safeAxiosRequest<Array<GitLabProject>>({
      method: 'GET',
      url: uri,
      params: {
        scope: 'projects',
        search: toSearch,
      },
    });
    console.log(data);
    const projectsList: Array<GitLabProject> = [];
    for (const project of data) {
      projectsList.push(
        new GitLabProject(
          project.name,
          project.path_with_namespace,
          project.web_url,
          project.description,
          project.avatar_url,
        ),
      );
    }
    return projectsList;
  }

  async searchGroups(search: string): Promise<GitLabGroup[]> {
    let uri = '/groups';
    let toSearch = search;
    if (search.includes('/')) {
      const splitted = search.split('/');
      toSearch = splitted.pop() as string;
      const group = splitted.join('/');
      uri = `/groups/${encodeURI(group)}/subgroups`;
    }
    const { data } = await this.safeAxiosRequest<Array<GitLabGroup>>({
      method: 'GET',
      url: uri,
      params: {
        search: toSearch,
      },
    });
    console.log(data);
    const groupList: Array<GitLabGroup> = [];
    for (const group of data) {
      groupList.push(
        new GitLabGroup(
          group.name,
          group.path,
          await this.getProjectsFromGitLabGroup(group),
          group.web_url,
          group.description,
          group.avatar_url,
        ),
      );
    }
    return groupList;
  }

  async getProjectsFromGitLabGroup(group: GitLabGroup): Promise<GitLabProject[]> {
    const { data } = await this.safeAxiosRequest<Array<GitLabProject>>({
      method: 'GET',
      url: `/groups/${group.path}/projects`,
    });
    const projectsList: Array<GitLabProject> = [];
    for (const project of data) {
      projectsList.push(
        new GitLabProject(
          project.name,
          project.path_with_namespace,
          project.web_url,
          project.description,
          project.avatar_url,
        ),
      );
    }
    return projectsList;
  }
}
