<template>
    <div>
        <transition name="component-fade" mode="out-in">
            
            <Modal v-if="showModal" @close="closeModal">
                <template v-slot:header>
                    <p class="font-lead text-2xl">Choose another view</p>
                </template>
                
                <div class="flex flex-wrap justify-start">
                <div 
                  v-for="(filter, key) in filters" 
                  :key="key"
                  class="cursor-pointer flex-none flex px-4 py-2 m-2 rounded-md text-white bg-lead-600 hover:bg-lead-500 shadow transition duration-125 ease-in"
                  @click="selectFilter(filter)"
                >
                  <div
                    class="flex items-center justify-center w-12 h-12 mr-4 rounded-full bg-lead-200 text-lead-600"
                  >
                    <Icon size="32" :name="filter.icon" />
                  </div>
                  <div class="w-56">
                    <p class="text-lg">{{ filter.name }}</p>
                    <p class="text-sm text-lead-200">
                      <!-- {{ filter.instance.shortDescription }} -->
                      {{ filter.shortDescription }}
                    </p>
                  </div>
                </div>
              </div>
            </Modal>

            <div
            v-else
            class="flex items-center cursor-pointer text-lead-100 px-2 rounded border border-lead-600 hover:border-lead-500 transition duration-125 ease-in"
            @click="pickANewFilter"
            >
                <p class="flex-grow text-lg">
                    <span v-if="filterGateway">{{ filterGateway.name }}</span>
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
import { trackInteractionEvent } from '../../../helpers/GTM';
import {
  ImplementedFiltersGateways,
  FilterGateway,
} from '../../../helpers/ImplementedFiltersGateways';
import { key } from 'localforage';

const mainState = getModule(MainModule);
  
  @Component({
    components: {
      Modal,
    },
  })
  export default class FilterSelector extends Vue {
    public showModal = false;
    public filters: Array<FilterGateway> = [];
    public selectedFilter = this.filters[0];

    /**
     * onFilterChange
     */
    // public onFilterChange(event) {
      
    // }

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
  
    selectFilter(filter: FilterGateway) {
      // Handle filter selection
      console.log(`Selected filter: ${filter.name}`);
      this.closeModal();
    }

    async mounted() {
      // Fetch filters
      const allFilters = ImplementedFiltersGateways;
      this.filters = allFilters;

    }
  }
  </script>
  
  <style scoped>
  /* Add your styles here */
  </style>