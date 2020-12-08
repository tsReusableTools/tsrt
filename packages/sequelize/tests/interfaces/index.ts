export interface IOrderingItem {
  id: number;
  order?: number;
}

export interface IContext {
  contextMockText: string;
  onAfterQueryBuiltData: string;
  onBeforeCreateData: string;
  onBeforeBulkCreateData: string;
  onBeforeReadData: string;
  onBeforeUpdateData: string;
  onBeforeUpdateItemsOrderData: string;
  onBeforeInsertAssociationsData: string;
  onBeforeDeleteData: string;
  onBeforeRestoreData: string;
}
