import { View } from './View';
import { ViewSourceStrategy } from './ViewSourceStrategy';
import { Source } from '../sources/Source';
import { Filter } from '../filters/Filter';

/**
 * Implemented by {@link View} objects visiting {@link Source}s
 *
 * @typeParam T - The generic type expected back when visiting a {@link Source}
 *
 * @remarks Using the "Visitor" design pattern to add a behavior to existing {@link Source}s without altering those.
 */
export abstract class SourceVisitor<T> extends View {
  /**
   * The list of known {@link ViewSourceStrategy} per {@link Source} slug
   */
  abstract slugStrategies: { [sourceSlug: string]: ViewSourceStrategy<T> };

  /**
   * A list of slugs describing the supported {@link Source}s
   */
  supportedSourcesSlugs(): Array<string> {
    return Object.keys(this.slugStrategies);
  }

  /**
   * The "visit" method of the "Visitor" design pattern
   *
   * @param source - The visited {@link Source}
   */
  async getDataFrom(source: Source, filter: Filter | null ): Promise<T> {
    if (!this.slugStrategies[source.slug]) {
      throw new Error(
        `The '${source.slug}' source is not supported by the '${this.slug}'`,
      );
    }

    return this.slugStrategies[source.slug].execute(source, this.configuration, filter);
  }

  async uploadTasks(tasks: Array<any>, source: Source ): Promise<void> {
    if (!this.slugStrategies[source.slug]) {
      throw new Error(
        `The '${source.slug}' source is not supported by the '${this.slug}'`,
      );
    }

    // because that's the only implemented way to upload tasks
    if (source.slug === 'gitlab' && this.slug === 'group') { 
      console.log('Uploading tasks from source', source.slug, 'to view', this.slug);
      console.log('Tasks:', tasks);
      this.slugStrategies[source.slug].uploadTasks(source, this.configuration, tasks);
    }

   
  }
}
