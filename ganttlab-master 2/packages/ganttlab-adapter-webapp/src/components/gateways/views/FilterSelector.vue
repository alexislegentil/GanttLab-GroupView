<template>
    <div>
        <transition name="component-fade" mode="out-in">
            
            <Modal v-if="showModal" @close="closeModal">
                <template v-slot:header>
                    <p class="font-lead text-2xl">Choose another view</p>
                </template>
                

                <div v-for="filter in filters" :key="filter.id">
                <button @click="selectFilter(filter)">{{ filter.name }}</button>
                </div>
            </Modal>

            <div
            v-else
            class="flex items-center cursor-pointer text-lead-100 px-2 rounded border border-lead-600 hover:border-lead-500 transition duration-125 ease-in"
            @click="pickANewFilter"
            >
                <p class="flex-grow text-lg">
                    <span v-if="FilterGateway">{{ filterGateway.name }}</span>
                    <span v-else>...</span>
                </p>

                <div class="text-lead-500">
                    <Icon size="18" name="search-outline" />
                </div>
            </div>
    </transition>
    </div>

   
  </template>
  
  <script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import Modal from '../../generic/Modal.vue';
import { getModule } from 'vuex-module-decorators';
import MainModule from '../../../store/modules/MainModule';
import { Filter } from 'ganttlab-entities';
import { trackInteractionEvent } from '../../../helpers/GTM';
import {
  ImplementedFiltersGateways,
  FilterGateway,
} from '../../../helpers/ImplementedFiltersGateways';

const mainState = getModule(MainModule);
  
  @Component({
    components: {
      Modal,
    },
  })
  export default class FilterSelector extends Vue {
    public showModal = false;
    public filters: Filter[] = [
      { name: 'Opened issues', slug: 'openedIssues', shortDescription: 'Show only opened issues'},
      { name: 'Closed issues', slug: 'closedIssues', shortDescription: 'Show only closed issues'},
      // Add more filters as needed
    ];
    public selectedFilter = this.filters[0];

    get filterGateway(): FilterGateway | null {
        if (mainState.filterGateway) {
        return mainState.filterGateway;
        }
        return null;
    }
  
    closeModal() {
      this.showModal = false;
    }

    pickANewFilter() {
        this.showModal = true;
        trackInteractionEvent('Click', 'Pick a new filter');
    }
  
    selectFilter(filter: { id: number; name: string }) {
      // Handle filter selection
      console.log(`Selected filter: ${filter.name}`);
      this.closeModal();
    }
  }
  </script>
  
  <style scoped>
  /* Add your styles here */
  </style>