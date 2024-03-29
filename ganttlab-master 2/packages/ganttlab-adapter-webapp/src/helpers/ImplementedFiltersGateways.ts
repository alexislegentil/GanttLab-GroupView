import { Configuration, SourceVisitor } from 'ganttlab-entities';
// import {
//   OpenedClosedIssuesFilter,
// } from 'ganttlab-gateways';

export interface FilterGateway {
  slug: string;
  name: string;
  icon: string;
  shortDescription: string;
  //instance: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  //instance: SourceVisitor<any>;
  //defaultConfiguration: Configuration;
}

export const ImplementedFiltersGateways: Array<FilterGateway> = [

  {
    slug: 'openedIssues',
    name: 'Opened Issues',
    icon: '',
    //instance: new FilterProject(),
    //defaultConfiguration: {},
    shortDescription: 'Show opnly opened issues',
  //  instance: new OpenedClosedIssuesFilter('openedIssues'),
  },
  {
    slug: 'closedIssues',
    icon: '',
    name: 'Closed Issues',
    shortDescription: 'Show only closed issues',
   // instance: new OpenedClosedIssuesFilter('closedIssues'),
    //instance: new FilterRepository(),
    //defaultConfiguration: {},
  },
 
];
