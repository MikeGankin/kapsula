import {filter, firstValueFrom, map, merge, Observable, share, take, timeout} from 'rxjs';
import {observe} from 'selector-observer';

export async function hostReactAppReady(selector = "#__next > div", pollIntervalMs = 300, timeoutMs = 10000) {
  return new Promise((resolve) => {
    const startedAt = Date.now();

    const waiter = () => {
      const hostElement = document.querySelector(selector);
      if (hostElement?.getBoundingClientRect().height) {
        resolve(hostElement);
        return;
      }

      if (Date.now() - startedAt >= timeoutMs) {
        resolve(null);
        return;
      }

      setTimeout(waiter, pollIntervalMs);
    };
    waiter();
  });
}

export const reactDomObserver = (defaultOptions = {}) => {
  const {
    emitInitialize = true,
    emitAdd = true,
    emitRemove = true,
  } = defaultOptions;

  const observeSelector$ = (selector, options = {}) => {
    const {
      name = selector,
      emitInitialize: shouldEmitInitialize = emitInitialize,
      emitAdd: shouldEmitAdd = emitAdd,
      emitRemove: shouldEmitRemove = emitRemove,
    } = options;

    return new Observable((subscriber) => {
      const observer = observe(selector, {
        initialize(element) {
          if (!shouldEmitInitialize) return;

          subscriber.next({type: 'initialize', selector, name, element});
        },

        add(element) {
          if (!shouldEmitAdd) return;

          subscriber.next({type: 'add', selector, name, element});
        },

        remove(element) {
          if (!shouldEmitRemove) return;

          subscriber.next({type: 'remove', selector, name, element});
        },
      });

      return () => observer.abort();
    }).pipe(share());
  };

  const waitElement = (selector, options = {}) => {
    const {timeoutMs = 10000, ...watchOptions} = options;
    const existingElement = document.querySelector(selector);

    if (existingElement) {
      return Promise.resolve(existingElement);
    }

    return firstValueFrom(
      merge(
        observeSelector$(selector, watchOptions).pipe(
          filter((event) => event.type === 'initialize'),
          map((event) => event.element)
        ),
        observeSelector$(selector, watchOptions).pipe(
          filter((event) => event.type === 'add'),
          map((event) => event.element)
        )
      ).pipe(
        take(1),
        timeout({first: timeoutMs})
      )
    );
  };

  return {
    observeSelector$,
    waitElement,
  };
};
