import { Injectable, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup } from '@angular/forms';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Subscription } from 'rxjs';
import { isEqual, cloneDeep } from 'lodash';

import { delay, updateItemsOrderInArray, getReorderedItem, parseTypes, IOrderedItem } from '@tsd/utils';
import { ICrudApiClient } from '@tsd/http';
import { RouterService } from './router.service';

/** Service which provides small useful reusable functions (methods) */
@Injectable({ providedIn: 'root' })
export class EntityService {
  public constructor(
    private router: Router,
    private routerService: RouterService,
  ) { }

  /**
   *  Handles get data from API. Updates form values.
   *
   *  @param id - Entity id.
   *  @param initForm - Init form method, which init form w/ (or without) provided values and subscribes its updates.
   *  @param service - Corresponding to entity service.
   *  @param [query] - Optional query params.
   *  @param [redirect] - enables or disables redirecting to new route
   */
  public async get<I extends GenericObject>(
    id: string | number, initForm: (item: Partial<I>) => void, service: ICrudApiClient<I>, query?: IQueryParams, redirect = true,
  ): Promise<I> {
    if (id === 'new') return;

    const result = await service.read(query, id);
    if (!result && redirect) this.router.navigate([`${this.routerService.parentRoute}/new`], { replaceUrl: true });
    initForm(result);
    return result;
  }

  /**
   *  Handles send data to API. Checks for form changes, disables form while request and updates values.
   *
   *  @param form - FromGroup to save.
   *  @param initForm - Init form method, which init form w/ (or without) provided values and subscribes its updates.
   *  @param service - Corresponding to entity service.
   *  @param [query] - Optional query params.
   *  @param [redirect] - enables or disables redirecting to new route
   */
  public async save<I extends GenericObject>(
    form: FormGroup, initForm: (item: Partial<I>) => void, service: ICrudApiClient<I>, query?: IQueryParams, redirect = true,
  ): Promise<I> {
    form.disable();
    const result = !form.value.id
      ? await service.create(form.value, query)
      : await service.update(form.value, form.value.id as number, query);

    if (result) {
      await delay(500);
      if (!form.value.id && redirect) this.router.navigate([`${this.routerService.parentRoute}/${result.id}`], { replaceUrl: true });
      initForm(result);
    }
    form.enable();

    return result;
  }

  /**
   *  Handles deleting specific entity.
   *
   *  @param id - Entity id.
   *  @param service - Corresponding to entity service.
   *  @param [query] - Optional query params.
   *  @param [checkBeforeCall] - Optional function to call before calling delete.
   */
  public async delete<I extends GenericObject>(
    id: string | number, service: ICrudApiClient<I>, query?: IQueryParams, checkBeforeCall?: () => boolean,
  ): Promise<string> {
    if (!id) return;

    const isPermitted = checkBeforeCall ? checkBeforeCall() : true;
    if (!isPermitted) return;

    const result = await service.delete(id, query) as string;
    return result;
  }

  /**
   *  Event handler: on dragAndDrop event
   *
   *  @param e - Drag And Drop event reordered list of items
   *  @param service - Service within to call API
   *  @param item - Item into which to insert reordered list
   *  @param [query] - Additional query params to be used for API call
   */
  public async reorder<I extends GenericObject = GenericObject>(
    e: IOrderedItem[], service: ICrudApiClient<I>, _item: I[], query?: IQueryParams,
  ): Promise<I[]> {
    const result = await service.updateItemsOrder(e as unknown as Array<Partial<I>>, query);

    if (result) {
      /* eslint-disable-next-line */
      _item = result;
      return result;
    }
  }

  /**
   *  Subscribe for form value changes to have correct form pristine state
   *  in order to check if there any changes to form in UI.
   *
   *  @param form - FormGroup to subscribe to.
   *  @param [subsription] - Optionally previous subscription to dismiss it.
   */
  public subscribeToFormCorrectPristineState(form: FormGroup, subsription?: Subscription): Subscription {
    if (subsription) subsription.unsubscribe();

    const original = cloneDeep(form.value);
    form.markAsPristine();
    return form.valueChanges.subscribe((change) => {
      if (isEqual(original, parseTypes(change))) form.markAsPristine();
      else form.markAsDirty();
    });
  }

  /* eslint-disable no-param-reassign */
  /**
   *  Handles Material Cdk dragNDrop event.
   *
   *  Reorders list of items and returns new order
   *  Here is also provided logic for storing recent changes in items order before sending to server
   *
   *  @param e - Material Cdk drag and drop event
   *  @param array - Object which stores data for UI
   *  @param onDragAndDrop - Event emmiter for dragAndDrop event
   *  @param [reorderTimeouts] - Var for storing reorder timeoutes (necessary for client-server optimizations)
   *  @param [reorderedItems] - Var for storing reordered lists (necessary for client-server optimizations)
   *  @param [emitWholeItemValue=false] - Whether to emit whole item value instead of just [id, order] list
   */
  public handleDragAndDrop<T extends IOrderedItem = IOrderedItem>(
    e: CdkDragDrop<IOrderedItem[]>, array: T[], onDragAndDrop: EventEmitter<IOrderedItem[]>,
    reorderTimeouts?: GenericObject, reorderedItems?: GenericObject<IOrderedItem[]>,
    emitWholeItemValue = false,
  ): T[] {
    const { item: { data }, previousIndex, currentIndex } = e;
    const copy = cloneDeep(array);

    const { title } = e.container.element.nativeElement.dataset;

    if (previousIndex !== currentIndex) {
      if (reorderedItems && reorderTimeouts && reorderTimeouts[title]) {
        clearTimeout(reorderTimeouts[title]);
        delete reorderTimeouts[title];
      }

      moveItemInArray(copy, previousIndex, currentIndex);

      const newOrder = updateItemsOrderInArray(data.id, previousIndex, currentIndex, copy);
      if (!newOrder) return;

      // If there is title for dragAndDrop container provided -> it is possible
      // to store reordered items in array and accumulate it on clientside for each table separately
      // in order to optimize client-server communication
      if (title && reorderTimeouts && reorderedItems) {
        // const reorderedItem = this.getReorderedItem(data.id, previousIndex, currentIndex, array);
        const reorderedItem = getReorderedItem(data.id, newOrder, null, null, emitWholeItemValue);

        if (!reorderedItems[title]) reorderedItems[title] = [];
        reorderedItems[title].push(reorderedItem);

        if (!reorderTimeouts[title]) {
          reorderTimeouts[title] = setTimeout(() => {
            onDragAndDrop.emit(reorderedItems[title]);
            delete reorderTimeouts[title];
            delete reorderedItems[title];
          }, 2000);
        }
      } else onDragAndDrop.emit(newOrder);

      if (newOrder) return newOrder.map((item) => ({ ...item }));
    }
  }
  /* eslint-enable no-param-reassign */
}
