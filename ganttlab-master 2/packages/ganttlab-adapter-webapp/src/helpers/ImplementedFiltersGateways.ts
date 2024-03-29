import { Configuration, SourceVisitor } from 'ganttlab-entities';
// import {
//   FilterMine,
//   FilterProject,
//   FilterRepository,
//   FilterMilestone,
// } from 'ganttlab-gateways';

export interface FilterGateway {
  slug: string;
  icon: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  //instance: SourceVisitor<any>;
  //defaultConfiguration: Configuration;
}

export const ImplementedFiltersGateways: Array<FilterGateway> = [

  {
    slug: 'openedIssues',
    icon: '',
    //instance: new FilterProject(),
    //defaultConfiguration: {},
  },
  {
    slug: 'closedIssues',
    icon: '',
    //instance: new FilterRepository(),
    //defaultConfiguration: {},
  },
 
];
