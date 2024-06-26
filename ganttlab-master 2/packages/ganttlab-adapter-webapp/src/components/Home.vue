<template>
  <div class="w-full">
   
            <div class="mb-2 p-2 bg-gray-200">
              <div class="flex items-center text-gray-600 space-between">
                <a
                  class="w-32 flex justify-start items-center"
                  href="https://www.ganttlab.com/"
                  target="_blank"
                  rel="noopener"
                  @click="goToWebsite"
                >
                  <Icon class="text-gray-400" size="20" name="logo-ganttlab" />
                  <h1 class="text-gray-800 text-xl leading-none font-lead ml-2">
                    GanttLab
                  </h1>
                </a>

                <div class="flex-grow flex items-center justify-center">
                  <a
                    class="flex items-center"
                    :href="sourceUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    @click="goToSource"
                  >
                    <div class="mr-2">
                      <Icon size="16" :name="sourceLogoIcon" />
                    </div>
                    <p>{{ sourceUrl }}</p>
                  </a>
                </div>

                <div class="flex-grow flex justify-center mt-2 w-32">
                  <div
                    class="cursor-default flex items-center content-center justify-center h-10 bg-lead-600 rounded-lg shadow-md"
                  >
                    <div class="h-full p-2 flex justify-center items-center">
                      <p class="pb-1 text-xs tracking-wider text-lead-200">GROUP VIEW</p>
                      <ViewSelector
                        :littleHeader=littleHeader
                        :sourceGateway="sourceGateway"
                        @set-view="setView($event)"
                      />
                    </div>
                  </div>
                  </div>

                <div class="w-32 flex items-center justify-end">
                  <a
                    class="mr-6 flex items-center img-reset-opacity"
                    :href="user.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    @click="goToUser"
                  >
                    <p>{{ user.username }}</p>
                    <img
                      :src="user.avatarUrl"
                      :alt="user.username"
                      class="w-4 ml-2 inline-block rounded-full shadow-inner"
                    />
                  </a>
                  <div
                    class="cursor-pointer transition duration-200 ease-in hover:text-yellow-700"
                    @click="refresh"
                  >
                    <Icon size="16" name="refresh-circle-outline" />
                  </div>
                  <a
                    href="https://gitlab.com/ganttlab/ganttlab/-/blob/master/README.md#how-it-works"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="ml-2 transition duration-200 ease-in hover:text-lead-700"
                    @click="goToHelp"
                  >
                    <Icon size="16" name="help-circle-outline" />
                  </a>
                  <div
                    class="cursor-pointer ml-2 transition duration-200 ease-in hover:text-red-700"
                    @click="logout"
                  >
                    <Icon size="16" name="close-circle-outline" />
                  </div>
                </div>
              </div>
            </div>
    <div class="p-2">
      <transition name="component-fade" mode="out-in">
        <div
          v-if="paginatedTasks === null && paginatedMilestones === null && group === null"
          key="spinner"
          class="w-full h-64 mb-12 flex items-center justify-center text-lead-600"
        >
          <Spinner size="64" />
        </div>
        <div v-else-if="paginatedMilestones && paginatedMilestones.list.length">
          <MilestonesDisplay
            :activeMilestone="activeMilestone"
            :paginatedMilestones="paginatedMilestones"
            :paginatedTasks="paginatedTasks"
            :project="project"
            :sourceUrl="sourceUrl"
            :viewGateway="viewGateway"
            @set-active-milestone="setActiveMilestone($event)"
            @set-milestones-page="setMilestonesPage($event)"
            @set-tasks-page="setTasksPage($event)"
          />
        </div>
        <div v-else-if="paginatedTasks && paginatedTasks.list.length">
          <TasksDisplay
            :paginatedTasks="paginatedTasks"
            @set-tasks-page="setTasksPage($event)"
          />
        </div>
        <div v-else-if="group">
          <GroupDisplay 
          :group="group"
          :project="project"
          :sourceUrl="sourceUrl"
          :viewGateway="viewGateway"
          @upload-tasks="uploadTasks"
           />
        </div>
        <div v-else class="w-full p-16">
          <NoData
            :project="project"
            :sourceUrl="sourceUrl"
            :viewGateway="viewGateway"
          />
        </div>
      </transition>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { getModule } from 'vuex-module-decorators';
import MainModule from '../store/modules/MainModule';
import Icon from './generic/Icon.vue';
import ViewSelector from './gateways/views/ViewSelector.vue';
import FilterSelector from './gateways/views/FilterSelector.vue';
import Spinner from './generic/Spinner.vue';
import TasksDisplay from './displays/TasksDisplay.vue';
import MilestonesDisplay from './displays/MilestonesDisplay.vue';
import GroupDisplay from './displays/GroupDisplay.vue';
import NoData from './gateways/views/NoData.vue';
import {
  User,
  Source,
  AuthenticatableSource,
  SourceVisitor,
  PaginatedListOfTasks,
  PaginatedListOfMilestones,
  Project,
Filter,
Group,
} from 'ganttlab-entities';
import { ImplementedSourcesGateways } from '../helpers/ImplementedSourcesGateways';
import { DisplayableError } from '../helpers/DisplayableError';
import { addDisplaybleError, addDisplaybleSuccess } from '../helpers';
import { TasksAndMilestones } from 'ganttlab-use-cases';
import LocalForage, { getRememberedViews } from '../helpers/LocalForage';
import { trackVirtualpageView, trackInteractionEvent } from '../helpers/GTM';
import { FilterGateway } from '@/helpers/ImplementedFiltersGateways';
import { DisplayableSuccess } from '@/helpers/DisplayableSuccess';

const mainState = getModule(MainModule);

@Component({
  components: {
    Icon,
    ViewSelector,
    FilterSelector,
    Spinner,
    TasksDisplay,
    MilestonesDisplay,
    GroupDisplay,
    NoData,
  },
})
export default class Home extends Vue {
  public paginatedTasks: PaginatedListOfTasks | null = null;
  public paginatedMilestones: PaginatedListOfMilestones | null = null;
  public group: Group | null = null;
  public littleHeader= true;

  setTasksPage(page: number) {
    mainState.setViewGatewayTasksPage(page);
    this.refresh(false);
    trackInteractionEvent(
      'View',
      'Changed tasks page',
      this.viewGateway ? this.viewGateway.slug : undefined,
    );
  }

  setMilestonesPage(page: number) {
    mainState.setViewGatewayMilestonesPage(page);
    this.refresh(false);

    trackInteractionEvent(
      'View',
      'Changed milestones page',
      this.viewGateway ? this.viewGateway.slug : undefined,
    );
  }

  setActiveMilestone(index: number) {
    mainState.setViewGatewayActiveMilestone(index);
    // reset task page to avoid weird behaviors, that one will also refresh
    this.setTasksPage(1);
    trackInteractionEvent(
      'View',
      'Changed active milestone',
      this.viewGateway ? this.viewGateway.slug : undefined,
    );
  }

  get user(): User | null {
    return mainState.user;
  }

  // source gateway is stored in vuex store
  get sourceGateway(): Source | AuthenticatableSource | null {
    if (mainState.sourceGateway) {
      return mainState.sourceGateway;
    }
    return null;
  }

  get sourceUrl(): string | null {
    if (
      mainState.sourceGateway &&
      mainState.sourceGateway instanceof AuthenticatableSource
    ) {
      return mainState.sourceGateway.getUrl();
    }
    return null;
  }

  get sourceLogoIcon(): string | null {
    if (mainState.sourceGateway) {
      const gatewayDetails = ImplementedSourcesGateways.find((gateway) => {
        if (mainState.sourceGateway) {
          return gateway.slug === mainState.sourceGateway.slug;
        }
      });
      if (gatewayDetails) {
        return gatewayDetails.icon;
      }
    }
    return null;
  }

  // view gateway is stored in vuex store
  get viewGateway(): SourceVisitor<unknown> | null {
    if (mainState.viewGateway) {
      return mainState.viewGateway;
    }
    return null;
  }

  // there might be a project in the view gateway configuration
  get project(): Project | null {
    if (this.viewGateway && this.viewGateway.configuration.project) {
      return this.viewGateway.configuration.project;
    }
    return null;
  }

  // there might be an active milestone in the view gateway configuration
  get activeMilestone(): number | null {
    if (
      this.viewGateway &&
      this.viewGateway.configuration.activeMilestone !== undefined
    ) {
      return this.viewGateway.configuration.activeMilestone;
    }
    return null;
  }

  async setFilter(filter: FilterGateway) {
    mainState.setFilterGateway(filter);
    this.viewGateway ? this.setView(this.viewGateway) : null;
    trackInteractionEvent('Filter', 'Changed', `${filter}` );
  }

  async setView(view: SourceVisitor<unknown>) {
    const filter = mainState.filterGateway ? mainState.filterGateway.instance : null;

    // if (view.slug === 'group') {
    //   filter = null;
    //   if (!this.littleHeader) {
    //     this.littleHeader = true;
    //     return;
    //   }
    // }
    // else {
    //   this.littleHeader = false;
    // }

    if (!this.sourceGateway) {
      return;
    }
    // clear data so we get the spinner back while loading the new ones
    this.paginatedTasks = null;
    this.paginatedMilestones = null;
    this.group = null;
    
  
    try {
      const data = await this.sourceGateway.getDataFor(view, filter);
      if (data instanceof PaginatedListOfTasks) {
        this.paginatedTasks = data;
      }
      if (data instanceof PaginatedListOfMilestones) {
        this.paginatedMilestones = data;
      }
      if (data instanceof TasksAndMilestones) {
        this.paginatedTasks = data.tasks;
        this.paginatedMilestones = data.milestones;
      }
      if (data instanceof Group) {
        this.group = data;
      }

      trackVirtualpageView(
        `${this.sourceGateway.name} - ${view.name}`,
        `/${this.sourceGateway.slug}/${view.slug}`,
      );
    } catch (error) {
      addDisplaybleError(
        new DisplayableError(error as string, 'Unable to get view data'),
      );
      trackInteractionEvent('View', 'Error', view.slug);
      this.paginatedTasks = new PaginatedListOfTasks([], 1, 0);
    }

    // user okay to remember? let's do it!
    const remember = await LocalForage.getItem('remember');
    let viewsBySource = await getRememberedViews();
    if (remember) {
      if (!viewsBySource) viewsBySource = {};
      viewsBySource[this.sourceGateway.slug] = {
        slug: view.slug,
        configuration: view.configuration,
      };
      LocalForage.setItem('viewsBySource', viewsBySource);
    }
  }

  async uploadTasks(tasks: Array<any>) {
    if (this.sourceGateway && this.viewGateway && tasks.length > 0) {
      try {
        await this.sourceGateway.uploadTasks(tasks, this.viewGateway);
        trackInteractionEvent('Tasks', 'Uploaded');
        addDisplaybleSuccess(
          new DisplayableSuccess('Tasks uploaded successfully', 'Tasks uploaded'),
        )
      } catch (error) {
        addDisplaybleError(
          new DisplayableError(error as Error, 'Error while uploading tasks'),
        );
      }
    }
    else if (tasks.length === 0) {
      addDisplaybleError(
        new DisplayableError('No tasks to upload', 'Error while uploading tasks'),
      );
    }
  }

  async refresh(manual = true) {
    if (this.viewGateway) {
      this.setView(this.viewGateway);
      if (manual) {
        trackInteractionEvent('View', 'Refreshed', this.viewGateway.slug);
      }
    }
  }

  logout() {
    mainState.logout();
    trackInteractionEvent(
      'Authentication',
      'Logged out',
      this.sourceGateway ? this.sourceGateway.slug : undefined,
    );
  }

  goToWebsite() {
    trackInteractionEvent('Click', 'Website');
  }

  goToSource() {
    trackInteractionEvent(
      'Click',
      'Source',
      this.sourceGateway ? this.sourceGateway.slug : undefined,
    );
  }

  goToProject() {
    trackInteractionEvent('Click', 'Project');
  }

  goToUser() {
    trackInteractionEvent('Click', 'User');
  }

  goToHelp() {
    const source = this.sourceGateway
      ? `Source ${this.sourceGateway.slug}`
      : undefined;
    const view = this.viewGateway ? `View ${this.viewGateway.slug}` : undefined;
    const agg = [source, view];
    trackInteractionEvent('Click', 'Help', agg.join(' - '));
  }
}
</script>

<style lang="scss" scoped>
.img-reset-opacity {
  img {
    @apply opacity-75 transition duration-200 ease-in;
  }
}
.img-reset-opacity:hover {
  img {
    @apply opacity-100;
  }
}
</style>
