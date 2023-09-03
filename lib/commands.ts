import { Store } from './store';

export function do_up (store: Store, include_passive: boolean, pull: boolean) {
  for (const service of store.services) {
    if (service.passive && !include_passive)
      continue;
    if (pull)
      await service.pull ();
    await service.up ();
  }
}

export function do_down (store: Store) {
  for (const service of store.services)
    await service.down ();
}

export function do_pull (store: Store) {
  for (const service of store.services)
    await service.pull ();
}
