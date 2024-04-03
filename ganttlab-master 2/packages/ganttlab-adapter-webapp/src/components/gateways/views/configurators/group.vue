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
                slotProps.result.path_with_namespace
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
          new DisplayableError(error, 'Error while searching for that'),
        );
      }
    }
  
    setGroup(group: GitLabGroup) {
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
        return {
          group: new Group(
            this.group.name,
            this.group.path,
            [],
            this.group.avatarUrl,
            this.group.url,
            this.group.description,
            
          ),
          tasks: {
            page: 1,
            pageSize: 50,
          },
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
  