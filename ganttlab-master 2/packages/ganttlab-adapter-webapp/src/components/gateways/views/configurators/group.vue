<template>
    <div class="relative">
      <GenericAutocomplete
        :search="search"
        :loading="loading"
        :results="groups"
        :focus="true"
        @search="searchGroups"
        @select-result="setGroup"
      >
        <p slot="label">
          Search for a group directly, or in a group with a trailing slash
        </p>
        <template v-slot:no-result="slotProps">
          <p>No group found while searching for</p>
          <p>
            «
            <span class="font-bold">{{ slotProps.searched }}</span> »
          </p>
          <p class="mt-4 text-gray-600">
            Try searching for «
            <a
              class="font-bold"
              href="#"
              @click.prevent="
                groups = null;
                search = 'ganttlab';
              "
              >ganttlab</a
            >
            »
            <br />or directly in the «
            <a
              class="font-bold"
              href="#"
              @click.prevent="
                groups = null;
                search = 'ganttlab/';
              "
              >ganttlab/</a
            >
            » group
          </p>
        </template>
        <template v-slot:result="slotProps">
          <div class="flex items-center justify-start">
            <img
              v-if="slotProps.result.avatar_url"
              :src="slotProps.result.avatar_url"
              :alt="slotProps.result.path_with_namespace"
              class="flex-shrink-0 w-12 h-12 mr-3 rounded bg-white shadow"
            />
            <div
              v-else
              class="flex-shrink-0 w-12 h-12 p-2 mr-3 rounded bg-gray-200 text-gray-600"
            >
              <Icon size="32" name="cube-outline" />
            </div>
            <p class="flex-shrink truncate">
              <span class="font-bold">{{
                slotProps.result.name
              }}</span>
              <br />
              <span class="text-sm">{{ slotProps.result.description }}</span>
            </p>
          </div>
        </template>
      </GenericAutocomplete>
      <p class="mt-6 text-gray-600 text-center">
        As an example, search for «
        <a
          class="font-bold"
          href="#"
          @click.prevent="
            groups = null;
            search = 'ganttlab';
          "
          >ganttlab</a
        >
        » to find any
        <br />group with that name, or «
        <a
          class="font-bold"
          href="#"
          @click.prevent="
            groups = null;
            search = 'ganttlab/';
          "
          >ganttlab/</a
        >
        » with a
        <br />trailing slash to find groups in the ganttlab group
      </p>

      <template>
  
        
    <!-- ... -->
    <div class="radio-group">
      <input
        type="radio"
        id="sortByEpic"
        value="epic"
        v-model="sortBy"
      />
      <label for="sortByEpic">Sort by Epic</label>

      <input
        type="radio"
        id="sortByProjects"
        value="projects"
        v-model="sortBy"
      />
      <label for="sortByProjects">Sort by Projects</label>

      <input
        type="radio"
        id="sortByMilestones"
        value="milestones"
        v-model="sortBy"
      />
      <label for="sortByMilestones">Sort by Milestones</label>
    </div>
    <!-- ... -->

    <div class="checkbox-group">
      <input type="checkbox" id="admin" v-model="isAdmin" />
      <label for="admin">Admin</label>

      <input type="checkbox" id="displayLink" v-model="displayLink" />
      <label for="displayLink">Display Link</label>

      <input type="checkbox" id="addClosedIssue" v-model="addClosedIssue" />
      <label for="addClosedIssue">Add Closed Issue</label>
    </div>
  
</template>

    </div>
  </template>
  
  <script lang="ts">
  import { Component, Vue, Emit, Prop } from 'vue-property-decorator';
  import GenericAutocomplete from '../../../generic/forms/Autocomplete.vue';
  import Icon from '../../../generic/Icon.vue';
  import { GitLabGateway, GitLabGroup } from 'ganttlab-gateways';
  import { DisplayableError } from '../../../../helpers/DisplayableError';
  import { addDisplaybleError } from '../../../../helpers';
  import { Group } from 'ganttlab-entities';
  
  @Component({
    components: {
      GenericAutocomplete,
      Icon,
    },
  })
  export default class GroupViewConfigurator extends Vue {
    public search = '';
    public loading = false;
    public groups: Array<GitLabGroup> | null = null;
    public group: GitLabGroup | null = null;
    public sortBy = 'epic'; // 'projects', 'epic' or 'milestones'
    public isAdmin = false;
    public displayLink = false;
    public addClosedIssue = false;
  
    @Prop({ required: true }) readonly sourceGateway!: GitLabGateway;
  
    async searchGroups(newSearch: string) {
      this.search = newSearch;
      if (!newSearch) {
        // empty search? empty groups!
        this.groups = null;
        return;
      }
      if (this.group && newSearch === this.group.path) {
        // same? do nothing!
        return;
      }
      try {
        this.loading = true;
        this.groups = await this.sourceGateway.searchGroups(newSearch);
        this.loading = false;
      } catch (error) {
        this.groups = null;
        this.loading = false;
        addDisplaybleError(
          new DisplayableError(error as Error, 'Error while searching for that'),
        );
      }
    }
  
    setGroup(group: GitLabGroup) {
        console.log(group);
      if (
        this.group &&
        this.group.path === group.path
      ) {
        // same? do nothing!
        return;
      }
      this.group = group;
      this.setConfiguration();
    }
  
    get configuration() {
      if (this.group) {
        console.log(this.group);
        return {
          group: new Group(
            this.group.name,
            this.group.path,
            [],
           [],// await this.sourceGateway.getProjectsFromGitLabGroup(this.group),
            this.group.web_url,
            this.group.description,
            this.group.avatar_url,
            
          ),
          tasks: {
            page: 1,
            pageSize: 50,
          },
            sortBy: this.sortBy,
            isAdmin: this.isAdmin,
            displayLink: this.displayLink,
            addClosedIssue: this.addClosedIssue,
        };
      }
      return null;
    }
  
    @Emit('set-configuration')
    setConfiguration() {
      const configuration = this.configuration;
      if (configuration) {
        return this.configuration;
      }
    }
  }
  </script>
  <style scoped>
  .radio-group {
    display: flex;
    justify-content: space-between;
    margin-bottom: 20px;
  }
  
  .radio-group input[type="radio"] {
    display: none;
  }
  
  .radio-group label {
    padding: 10px 20px;
    background-color: #f2f2f2;
    border-radius: 5px;
    cursor: pointer;
  }
  
  .radio-group input[type="radio"]:checked + label {
    background-color: #4caf50;
    color: white;
  }

  .checkbox-group {
  display: flex;
  margin-bottom: 20px;
}

.checkbox-group label {
  padding: 10px 35px 10px 5px;
  cursor: pointer;
}

  </style>