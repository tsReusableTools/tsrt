/* eslint-disable @typescript-eslint/no-explicit-any */
import { assert } from 'chai';
import { range } from '@tsrt/utils';

import { OrderingService } from '../src';

describe('OrderingService', () => {
  interface IOrderItem { id: string; order?: number }
  const orderingService = new OrderingService<IOrderItem>();
  const target: IOrderItem[] = [
    { id: 'First', order: 1 },
    { id: 'Second', order: 5 },
    { id: 'Third', order: 7 },
    { id: 'Fourth', order: 14 },
    { id: 'Fifth', order: 16 },
    { id: 'Sixth', order: 21 },
    { id: 'Seventh', order: 44 },
    { id: 'Eights', order: 21 },
    { id: 'Ninth', order: 58 },
    { id: 'Tenth', order: null },
  ];
  const { length } = target;
  const lastIndex = length - 1;

  const orderChanges: Array<Required<IOrderItem>> = [
    { id: 'First', order: 25 },
    { id: 'Ninth', order: 1 },
    { id: 'Fifth', order: 54 },
  ];

  describe('moveItemInArray', () => {
    it('should clamp newIndex and prevIndex value to be within [0, ..., target.length]', () => {
      const tooBigNewIndexTooSmallPrevIndex = orderingService.moveItemInArray(target, -100, 100);
      const tooBigPrevIndexTooSmallNewIndex = orderingService.moveItemInArray(target, 100, -100);

      assert.equal(tooBigNewIndexTooSmallPrevIndex[lastIndex].id, target[0].id);
      assert.equal(tooBigPrevIndexTooSmallNewIndex[0].id, target[lastIndex].id);
    });

    it('should not mutate target array', () => {
      const copy = target.map((item) => ({ ...item }));
      const result = orderingService.moveItemInArray(copy, -100, 100);

      assert.notEqual(result[0].id, copy[0].id);
    });

    it('should mutate target array', () => {
      const copy = target.map((item) => ({ ...item }));
      const result = orderingService.moveItemInArray(copy, -100, 100, true);

      assert.equal(result[0].id, copy[0].id);
    });
  });

  describe('reorderByIndex (tests for `moveItemInArray` are also related to this method)', () => {
    it('should throw exception if invalid target provided', () => {
      const fakeTarget1: any[] = [{ pk: 'First', order: '1' }, { pk: 'Second', order: '1' }];
      const fakeTarget2: any[] = [{ id: 'First', order: 'asd' }, { pk: 'Second', order: '1' }];

      try {
        orderingService.reorderByIndex(fakeTarget1, 0, 1);
        assert.fail('Oops');
      } catch (err) {
        assert.equal(err.data?.id, fakeTarget1[0].id);
      }

      try {
        orderingService.reorderByIndex(fakeTarget2, 0, 1);
        assert.fail('Oops');
      } catch (err) {
        assert.equal(err.data?.id, fakeTarget2[0].id);
      }
    });
  });

  describe('reorder', () => {
    it('should throw exception if invalid target provided', () => {
      const fakeTarget1: any[] = [{ pk: 'First', order: '1' }];
      const fakeTarget2: any[] = [{ id: 'First', order: 'asd' }];

      try {
        orderingService.reorder(fakeTarget1);
        assert.fail('Oops');
      } catch (err) {
        assert.equal(err.data?.id, fakeTarget1[0].id);
      }

      try {
        orderingService.reorder(fakeTarget2);
        assert.fail('Oops');
      } catch (err) {
        assert.equal(err.data?.id, fakeTarget2[0].id);
      }
    });

    it('should throw exception if invalid order changes provided', () => {
      const fakeChanges1: any[] = [{ pk: 'First', order: '1' }];
      const fakeChanges2: any[] = [{ pk: 'First', orders: '1' }];
      const fakeChanges3: any[] = [{ id: 'First', order: 'asd' }];
      const fakeChanges4: any[] = [{ id: 'First', order: 100 }];

      try {
        orderingService.reorder(target, fakeChanges1);
        assert.fail('Oops');
      } catch (err) {
        assert.equal(err.data?.id, fakeChanges1[0].id);
      }

      try {
        orderingService.reorder(target, fakeChanges2);
        assert.fail('Oops');
      } catch (err) {
        assert.equal(err.data?.id, fakeChanges2[0].id);
      }

      try {
        orderingService.reorder(target, fakeChanges3);
        assert.fail('Oops');
      } catch (err) {
        assert.equal(err.data?.id, fakeChanges3[0].id);
      }

      try {
        orderingService.reorder(target, fakeChanges4);
        assert.fail('Oops');
      } catch (err) {
        assert.ok('Ok');
      }
    });

    it('should provide correct `order` for those items without it and with duplicates', () => {
      const result = orderingService.reorder(target);

      const eights = result.find((item) => item.id === 'Eights');
      const tenth = result.find((item) => item.id === 'Tenth');

      assert.notEqual(eights.order, target[7].order);
      assert.isNotNull(tenth.order);
    });

    it('should reorder items correctly', () => {
      const result = orderingService.reorder(target, orderChanges, { insertAfterOnly: true });

      const expected = ['Ninth', 'Second', 'Third', 'Fourth', 'Sixth', 'First', 'Seventh', 'Fifth', 'Eights', 'Tenth'];

      assert.deepEqual(result.map((item) => item.id), expected);
    });

    it('should clamp orders which exceeds existing range if `clampRange: true`', () => {
      const fakeChanges = [{ id: 'First', order: 100 }];
      const result = orderingService.reorder(target, fakeChanges, { clampRange: true });

      const sortedTarget = target.sort((a, b) => a.order - b.order);

      assert.equal(result[lastIndex].id, fakeChanges[0].id);
      assert.equal(result[lastIndex].order, sortedTarget[lastIndex].order);
    });

    it('should refresh orders after reordering if `clampRange: true`', () => {
      const result = orderingService.reorder(target, orderChanges, { refreshSequence: true });

      const exprected = range(0, 9);

      assert.deepEqual(result.map((item) => item.order), exprected);
    });
  });
});
