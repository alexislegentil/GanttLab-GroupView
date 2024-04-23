<template>
    <div>
        <div v-if="group">
            
            <div
            v-if="group.tasks.previousPage || group.tasks.nextPage"
            class="w-full flex items-center justify-center -mb-10 text-gray-600"
        >
            <Paginator
            :previousPage="group.tasks.previousPage"
            :currentPage="group.tasks.currentPage"
            :nextPage="group.tasks.nextPage"
            :lastPage="group.tasks.lastPage"
            @set-page="setTasksPage($event)"
            />
        </div>
            <GroupChartMediator
            :group="group"
            />

        </div>
            
    <div v-else>
        <NoData
        :project="project"
        :sourceUrl="sourceUrl"
        :viewGateway="viewGateway"
        />
    </div>

    </div>
  </template>
  
  <script lang="ts">

  import { Component, Vue, Prop, Emit } from 'vue-property-decorator';
  import { getModule } from 'vuex-module-decorators';
  import MainModule from '../../store/modules/MainModule';
  import TasksChartMediator from '../gateways/charts/TasksChartMediator.vue';
  import GroupChartMediator from '../gateways/charts/GroupChartMediator.vue';
  import TasksDisplay from './TasksDisplay.vue';
  import Paginator from '../generic/Paginator.vue';
  import { Group, PaginatedListOfTasks } from 'ganttlab-entities';
import { Project } from 'ganttlab-entities';
import { SourceVisitor } from 'ganttlab-entities';
import NoData from '../generic/illustrations/NoData.vue';
import Gantt from "./components/Gantt.vue";
import { Task } from 'ganttlab-entities';
  
  const mainState = getModule(MainModule);
  const defaultChart = 'legacy';
  
  @Component({
    components: {
      TasksChartMediator,
      GroupChartMediator,
      Paginator,
      TasksDisplay,
      NoData

    },
  })
  export default class GroupDisplay extends Vue {
    @Prop() private group!: Group;
    @Prop() readonly project!: Project | null;
    @Prop() readonly sourceUrl!: string | null;
    @Prop() readonly viewGateway!: SourceVisitor<unknown> | null;
  
    @Emit('set-tasks-page')
    setTasksPage(page: number) {
      return page;
    }

    data() {
        return {
        };
    }
  
    get previousPage(): number | null {
      if (this.group.tasks && this.group.tasks.previousPage) {
        return this.group.tasks.previousPage;
      }
      return null;
    }
  
    get currentPage(): number | null {
      if (this.group.tasks && this.group.tasks.page) {
        return this.group.tasks.page;
      }
      return null;
    }
  
    get nextPage(): number | null {
      if (this.group.tasks && this.group.tasks.nextPage) {
        return this.group.tasks.nextPage;
      }
      return null;
    }
  
    get lastPage(): number | null {
      if (this.group.tasks && this.group.tasks.lastPage) {
        return this.group.tasks.lastPage;
      }
      return null;
    }
  
    // chart name is stored in vuex store
    get chart(): string {
      if (!mainState.chart) {
        // save and use default if not set yet
        this.chart = defaultChart;
        return defaultChart;
      }
      return mainState.chart;
    }
    set chart(chart: string) {
       
      mainState.setChart(chart);
    }
  }
  </script>
  