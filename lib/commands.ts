import path from 'path';
import fs from 'fs/promises';
import {
  Task,
  TaskListHorizontal,
  TaskListVertical
} from '@sapphirecode/tasks';
import { Store } from './store';
import { exec_command } from './exec';
import { Service } from './classes/Service';
import { pull_image } from './docker_interface';

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
  if (pull)
    await do_pull (store);
  for (const service of store.services) {
    if (service.passive && !include_passive)
      continue;
    await service.up ();
  }
}

export async function do_down (store: Store): Promise<void> {
  for (const service of [ ...store.services ].reverse ())
    await service.down ();
}

export async function do_pull (store: Store): Promise<void> {
  const all_images: string[] = [];
  const buildable: Service[] = [];
  for (const service of store.services) {
    all_images.push (...service.images);
    if (service.buildable)
      buildable.push (service);
  }

  const images = all_images.filter ((v, i, a) => a.indexOf (v) === i);

  const tasks = [];
  const task_list = new TaskListVertical;

  for (const buildable_service of buildable) {
    const tl = new TaskListHorizontal;
    task_list.tasks.push (tl);
    tl.label = `Building ${buildable_service.name}`;
    tl.label_length = 20;
    tl.display_percentage = false;
    const task = new Task;
    tl.tasks.push (task);
    task.progress = 0.5;
    tasks.push (exec_command ('docker', [
      'compose',
      'build'
    ], buildable_service.directory)
      .then (() => {
        task.progress = 1;
        task.completed = true;
      }));
  }

  for (const pullable of images) {
    const tl = new TaskListHorizontal;
    task_list.tasks.push (tl);
    tl.label_length = 20;
    tasks.push (pull_image (pullable, tl));
  }

  task_list.update ();

  await Promise.all (tasks);
}

export async function do_create_filter (store: Store): Promise<void> {
  const filter_lines = [];
  const backup_volumes = store.volumes.filter ((volume) => volume.backup)
    .sort ((a, b) => a.name.localeCompare (b.name));
  for (const volume of backup_volumes)
    filter_lines.push (`+ /${volume.name}/`);
  filter_lines.push ('- /*');

  for (const volume of backup_volumes) {
    for (const exclude of volume.backup_exclude) {
      const link = path.normalize (`/${volume.name}/_data/${exclude}`)
        .replace (/\\/gu, '/');
      filter_lines.push (`- ${link}`);
    }
  }

  await fs.writeFile ('filter', filter_lines.join ('\n'));
}
