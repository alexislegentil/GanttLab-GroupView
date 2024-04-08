<template>
    <div>


      <!-- 
        PAGINATION NOT IMPLEMENTED YET FOR GROUPS

        <div
        v-if="previousPage || nextPage"
        class="w-full flex items-center justify-center -mb-10 text-gray-600"
      >
        <Paginator
          :previousPage="previousPage"
          :currentPage="currentPage"
          :nextPage="nextPage"
          :lastPage="lastPage"
          @set-page="setTasksPage($event)"
        />
      </div> -->
        <div v-if="group.epics && group.epics.length > 0">
            <div v-for="(project, index) in group.epics" :key="index">
                
                <div class="flex items" >
                     <!-- <TasksChartMediator :tasks="project.list" :chart="chart" />  -->
                    <TasksDisplay
                    :paginatedTasks="project.Tasks"
                    @set-tasks-page="setTasksPage($event)"
                    />
                </div>
            </div>
        </div>
       

        <div v-else-if="group.tasks && Object.keys(group.tasks).length> 0" class="flex items-center justify-center">
            <div v-for="(project, index) in group.tasks" :key="index">
                <div class="flex items" >
                    <!-- <TasksChartMediator :tasks="project.list" :chart="chart" /> -->
                    <TasksDisplay
                    :paginatedTasks="project"
                    @set-tasks-page="setTasksPage($event)"
                    />
                </div>
            </div>
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
  import TasksDisplay from './TasksDisplay.vue';
  import Paginator from '../generic/Paginator.vue';
  import { Group, PaginatedListOfTasks } from 'ganttlab-entities';
import { Project } from 'ganttlab-entities';
import { SourceVisitor } from 'ganttlab-entities';
import NoData from '../generic/illustrations/NoData.vue';
  
  const mainState = getModule(MainModule);
  const defaultChart = 'legacy';
  
  @Component({
    components: {
      TasksChartMediator,
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
  
    // get previousPage(): number | null {
    //   if (this.paginatedTasks && this.paginatedTasks.previousPage) {
    //     return this.paginatedTasks.previousPage;
    //   }
    //   return null;
    // }
  
    // get currentPage(): number | null {
    //   if (this.paginatedTasks && this.paginatedTasks.page) {
    //     return this.paginatedTasks.page;
    //   }
    //   return null;
    // }
  
    // get nextPage(): number | null {
    //   if (this.paginatedTasks && this.paginatedTasks.nextPage) {
    //     return this.paginatedTasks.nextPage;
    //   }
    //   return null;
    // }
  
    // get lastPage(): number | null {
    //   if (this.paginatedTasks && this.paginatedTasks.lastPage) {
    //     return this.paginatedTasks.lastPage;
    //   }
    //   return null;
    // }
  
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
  