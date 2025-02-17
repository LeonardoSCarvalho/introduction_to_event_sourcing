import { v4 as uuid } from 'uuid';
import { ShoppingCartEvent } from '../oop/gettingStateFromEvents.exercise.test';

export type Event<
  EventType extends string = string,
  EventData extends Record<string, unknown> = Record<string, unknown>,
> = Readonly<{
  type: Readonly<EventType>;
  data: Readonly<EventData>;
}>;

export interface ProductItem {
  productId: string;
  quantity: number;
}

export type PricedProductItem = ProductItem & {
  unitPrice: number;
};

export type ShoppingCartOpened = Event<
  'ShoppingCartOpened',
  {
    shoppingCartId: string;
    clientId: string;
    openedAt: Date;
  }
>;

export type ProductItemAddedToShoppingCart = Event<
  'ProductItemAddedToShoppingCart',
  {
    shoppingCartId: string;
    productItem: PricedProductItem;
  }
>;

export type ProductItemRemovedFromShoppingCart = Event<
  'ProductItemRemovedFromShoppingCart',
  {
    shoppingCartId: string;
    productItem: PricedProductItem;
  }
>;

export type ShoppingCartConfirmed = Event<
  'ShoppingCartConfirmed',
  {
    shoppingCartId: string;
    confirmedAt: Date;
  }
>;

export type ShoppingCartCanceled = Event<
  'ShoppingCartCanceled',
  {
    shoppingCartId: string;
    canceledAt: Date;
  }
>;

enum ShoppingCartStatus {
  Pending = 'Pending',
  Confirmed = 'Confirmed',
  Canceled = 'Canceled',
}

export type ShoppingCart = Readonly<{
  id: string;
  clientId: string;
  status: ShoppingCartStatus;
  productItems: PricedProductItem[];
  openedAt: Date;
  confirmedAt?: Date;
  canceledAt?: Date;
}>;

export const addProductItem = (
  productItems: PricedProductItem[],
  newProductItem: PricedProductItem,
): PricedProductItem[] => {
  const { productId, quantity } = newProductItem;
  const existingProductItemIndex = productItems.findIndex(
    (productItem) => productItem.productId === productId,
  );
  if (existingProductItemIndex === -1) {
    return [...productItems, newProductItem];
  }

  const newQuantity =
    productItems[existingProductItemIndex].quantity + quantity;
  const mergedProductItem = {
    ...productItems[existingProductItemIndex],
    quantity: newQuantity,
  };
  return [
    ...productItems.slice(0, existingProductItemIndex),
    mergedProductItem,
    ...productItems.slice(existingProductItemIndex + 1),
  ];
};

export const removeProductItem = (
  productItems: PricedProductItem[],
  newProductItem: PricedProductItem,
): PricedProductItem[] => {
  const { productId, quantity } = newProductItem;
  const existingProductItemIndex = productItems.findIndex(
    (productItem) => productItem.productId === productId,
  );
  if (existingProductItemIndex === -1) {
    return productItems;
  }
  const newQuantity =
    productItems[existingProductItemIndex].quantity - quantity;
  if (newQuantity <= 0) {
    return productItems.filter(
      (productItem) => productItem.productId !== productId,
    );
  }
  const mergedProductItem = {
    ...productItems[existingProductItemIndex],
    quantity: newQuantity,
  };
  return [
    ...productItems.slice(0, existingProductItemIndex),
    mergedProductItem,
    ...productItems.slice(existingProductItemIndex + 1),
  ];
};

export const evolveShoppingCart = (
  state: ShoppingCart,
  shoppingCartEvent: ShoppingCartEvent,
): ShoppingCart => {
  const { type, data: event } = shoppingCartEvent;
  switch (type) {
    case 'ShoppingCartOpened':
      return {
        id: event.shoppingCartId,
        clientId: event.clientId,
        openedAt: event.openedAt,
        productItems: [],
        status: ShoppingCartStatus.Pending,
      };
    case 'ProductItemAddedToShoppingCart': {
      const productItems = state.productItems;
      const productItem = event.productItem;
      return {
        ...state,
        productItems: addProductItem(productItems, productItem),
      };
    }
    case 'ProductItemRemovedFromShoppingCart': {
      const productItems = state.productItems;
      const productItem = event.productItem;
      return {
        ...state,
        productItems: removeProductItem(productItems, productItem),
      };
    }
    case 'ShoppingCartConfirmed': {
      return {
        ...state,
        status: ShoppingCartStatus.Confirmed,
        confirmedAt: event.confirmedAt,
      };
    }
    case 'ShoppingCartCanceled': {
      return {
        ...state,
        status: ShoppingCartStatus.Canceled,
        canceledAt: event.canceledAt,
      };
    }
  }
  //return state;
};

export const getShoppingCart = (events: ShoppingCartEvent[]): ShoppingCart => {
  // 1. Add logic here
  return events.reduce<ShoppingCart>(evolveShoppingCart, {} as ShoppingCart);
};

describe('Events definition', () => {
  it('all event types should be defined', () => {
    const shoppingCartId = uuid();

    const clientId = uuid();
    const openedAt = new Date();
    const confirmedAt = new Date();
    const canceledAt = new Date();

    const shoesId = uuid();

    const twoPairsOfShoes: PricedProductItem = {
      productId: shoesId,
      quantity: 2,
      unitPrice: 100,
    };
    const pairOfShoes: PricedProductItem = {
      productId: shoesId,
      quantity: 1,
      unitPrice: 100,
    };

    const tShirtId = uuid();
    const tShirt: PricedProductItem = {
      productId: tShirtId,
      quantity: 1,
      unitPrice: 5,
    };

    const events: ShoppingCartEvent[] = [
      // 2. Put your sample events here
      {
        type: 'ShoppingCartOpened',
        data: {
          shoppingCartId,
          clientId,
          openedAt,
        },
      },
      {
        type: 'ProductItemAddedToShoppingCart',
        data: {
          shoppingCartId,
          productItem: twoPairsOfShoes,
        },
      },
      {
        type: 'ProductItemAddedToShoppingCart',
        data: {
          shoppingCartId,
          productItem: tShirt,
        },
      },
      {
        type: 'ProductItemRemovedFromShoppingCart',
        data: { shoppingCartId, productItem: pairOfShoes },
      },
      {
        type: 'ShoppingCartConfirmed',
        data: {
          shoppingCartId,
          confirmedAt,
        },
      },
      {
        type: 'ShoppingCartCanceled',
        data: {
          shoppingCartId,
          canceledAt,
        },
      },
    ];

    const shoppingCart = getShoppingCart(events);

    expect(shoppingCart).toStrictEqual({
      id: shoppingCartId,
      clientId,
      status: ShoppingCartStatus.Canceled,
      productItems: [pairOfShoes, tShirt],
      openedAt,
      confirmedAt,
      canceledAt,
    });
  });
});
