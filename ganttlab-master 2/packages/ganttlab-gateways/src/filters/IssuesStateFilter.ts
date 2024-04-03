import { Filter } from "ganttlab-entities";


export class IssuesStateFilter implements Filter {
  public slug = "";
  public name = "Issues State Filter";
  public icon = "";
  public shortDescription = "Filter issues by state, can be opened or closed";

    constructor(state: boolean | string) {
      // find a way to know if the instance used is github or gitlab and set the slug accordingly
        if (state) {
          if (state === 'allIssues') {
            this.slug = "all";
          }
          else {
            this.slug = "opened";
          }
        }
        else {
            this.slug = "closed";
        } 
      }

  requestGitLabArgs(): string {
    return this.slug;
  }
}