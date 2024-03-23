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
import { delay } from './util';

async function init_structure(store: Store): Promise<void> {
  for (const volume of store.volumes)
    await volume.create();
  for (const network of store.networks)
    await network.create();
}

export async function do_up(
  store: Store,
  include_passive: boolean,
  pull: boolean
): Promise<void> {
  await init_structure(store);
  if (pull)
    await do_pull(store);

  const services = [...store.services];
  const queue: Service[] = [];
  const started: string[] = [];
  let index = 0;
  while (services.length > 0) {
    index %= services.length;
    const service = services[index];
    if (service.passive && !include_passive) {
      services.splice(index, 1);
    }

    const waiting_for = service.depends_on.filter(dep => {
      const active = queue.filter(started => {
        started.name === dep
      }).length;
      return active === 0;
    });
    if (waiting_for.length > 0)
      continue;

    queue.push(...services.splice(index, 1));
  }

  const threads = [];
  for (let i = 0; i < 4; i++) {
    threads.push(new Promise(async (res) => {
      while (queue.length > 0) {
        const service = queue.shift();
        let waiting_for = 0;
        do {
          waiting_for = service?.depends_on.filter(dep => {
            started.indexOf(dep) < 0;
          }).length;
          await delay(100);
        } while (waiting_for > 0);
        await service?.up();
      }
      res();
    }));
  }
  await Promise.all(threads);
}

export async function do_down(store: Store): Promise<void> {
  for (const service of [...store.services].reverse())
    await service.down();
}

export async function do_pull(store: Store): Promise<void> {
  const all_images: string[] = [];
  const buildable: Service[] = [];
  for (const service of store.services) {
    all_images.push(...service.images);
    if (service.buildable)
      buildable.push(service);
  }

  const images = all_images.filter((v, i, a) => a.indexOf(v) === i);

  const tasks = [];
  const task_list = new TaskListVertical;

  for (const buildable_service of buildable) {
    const tl = new TaskListHorizontal;
    task_list.tasks.push(tl);
    tl.label = `Building ${buildable_service.name}`;
    tl.label_length = 20;
    tl.display_percentage = false;
    const task = new Task;
    tl.tasks.push(task);
    task.progress = 0.5;
    tasks.push(exec_command('docker', [
      'compose',
      'build'
    ], buildable_service.directory)
      .then(() => {
        task.progress = 1;
        task.completed = true;
      }));
  }

  for (const pullable of images) {
    const tl = new TaskListHorizontal;
    task_list.tasks.push(tl);
    tl.label_length = 20;
    tasks.push(pull_image(pullable, tl));
  }

  task_list.update();

  await Promise.all(tasks);
}

export async function do_create_filter(store: Store): Promise<void> {
  const filter_lines = [];
  const backup_volumes = store.volumes.filter((volume) => volume.backup)
    .sort((a, b) => a.name.localeCompare(b.name));
  for (const volume of backup_volumes) {
    if (volume.backup_include.length > 0) {
      for (const include of volume.backup_include) {
        const link = path.normalize(`/${volume.name}/_data/${include}`)
          .replace(/\\/gu, '/');
        filter_lines.push(`+ ${link}`);
      }
    }
    else {
      filter_lines.push(`+ /${volume.name}/`);
    }
  }
  filter_lines.push('- /*');

  for (const volume of backup_volumes) {
    for (const exclude of volume.backup_exclude) {
      const link = path.normalize(`/${volume.name}/_data/${exclude}`)
        .replace(/\\/gu, '/');
      filter_lines.push(`- ${link}`);
    }
  }

  await fs.writeFile('filter', filter_lines.join('\n'));
}
