import { Store } from './store';

async function init_structure (store: Store): Promise<void> {
  for (const volume of store.volumes)
    await volume.create ();
  for (const network of store.networks)
    await network.create ();
}

export async function do_up (
  store: Store,
  include_passive: boolean,
  pull: boolean
): Promise<void> {
  await init_structure (store);
  for (const service of store.services) {
    if (service.passive && !include_passive)
      continue;
    if (pull)
      await service.pull ();
    await service.up ();
  }
}

export async function do_down (store: Store): Promise<void> {
  for (const service of store.services)
    await service.down ();
}

export async function do_pull (store: Store): Promise<void> {
  for (const service of store.services)
    await service.pull ();
}
