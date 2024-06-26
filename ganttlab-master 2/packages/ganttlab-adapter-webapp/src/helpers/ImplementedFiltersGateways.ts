import { Configuration, Filter, SourceVisitor } from 'ganttlab-entities';
 import {
   IssuesStateFilter,
 } from 'ganttlab-gateways';

export interface FilterGateway {
  slug: string;
  name: string;
  icon: string;
  shortDescription: string;
  //instance: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  instance: Filter | null;
  defaultConfiguration: Configuration;
}

export const ImplementedFiltersGateways: Array<FilterGateway> = [
  {
    slug: 'allIssues',
    icon: '',
    name: 'All Issues',
    shortDescription: 'Show all issues, included closed ones',
    instance: new IssuesStateFilter('allIssues'), // Add the 'instance' property with a value of null
    //instance: new IssuesStateFilter('closed'),
    //instance: new FilterRepository(),
    defaultConfiguration: {},
  },
  {
    slug: 'openedIssues',
    name: 'Opened Issues',
    icon: '',
    shortDescription: 'Show only opened issues',
    instance: new IssuesStateFilter(true),
    defaultConfiguration: {
      filers : {
        state: 'opened',
      },
    },
  },
  {
    slug: 'closedIssues',
    icon: '',
    name: 'Closed Issues',
    shortDescription: 'Show only closed issues',
    instance: new IssuesStateFilter(false), // Add the 'instance' property with a value of null
    //instance: new IssuesStateFilter('closed'),
    //instance: new FilterRepository(),
    defaultConfiguration: {},
  },
 
];
