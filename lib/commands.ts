/* eslint-disable require-unicode-regexp */

import path from 'path';
import fs from 'fs/promises';
import assert from 'assert';
import {
  Task,
  TaskListHorizontal,
  TaskListVertical
} from '@sapphirecode/tasks';
import debug from 'debug';
import { Store } from './store';
import { exec_command } from './exec';
import { Service } from './classes/Service';
import { pull_image } from './docker_interface';
import { delay } from './util';

const log = debug ('sapphirecode:dcm:commands');

async function init_structure (store: Store): Promise<void> {
  await store.read_docker_status ();
  for (const volume of store.volumes)
    await volume.create ();
  for (const network of store.networks)
    await network.create ();
}

function check_startable (dependencies: string[], started: string[]): boolean {
  const sublog = log.extend ('check_startable');
  const missing = dependencies.filter ((dep) => !started.includes (dep));
  sublog ('Startable:', missing.length === 0, 'missing:', missing);
  return missing.length === 0;
}

export async function do_up (
  store: Store,
  include_passive: boolean,
  pull: boolean
): Promise<void> {
  await init_structure (store);
  if (pull)
    await do_pull (store);

  const services = [ ...store.services ];
  const queue: Service[] = [];
  const started: string[] = [];
  let index = 0;
  while (services.length > 0) {
    index %= services.length;
    const service = services[index];
    if (service.passive && !include_passive) {
      services.splice (index, 1);
      continue;
    }

    const waiting_for = service.depends_on.filter ((dep) => {
      const active = queue.filter ((s) => s.name === dep).length;
      return active === 0;
    });
    if (waiting_for.length > 0)
      continue;

    queue.push (...services.splice (index, 1));
  }

  log ('Queue:', queue.map ((s) => s.name));

  const threads = [];
  for (let i = 0; i < 4; i++) {
    // eslint-disable-next-line no-async-promise-executor
    threads.push (new Promise<void> (async (res, reject) => {
      try {
        while (queue.length > 0) {
          const service = queue.shift ();
          assert (typeof service !== 'undefined');
          log (`Checking ${service.name}`);
          while (!check_startable (service.depends_on, started))
            await delay (100);

          log (`Starting ${service.name}`);
          await service?.up ();
          started.push (service.name);
        }
        res ();
      }
      catch (e) {
        reject (e);
      }
    }));
  }
  await Promise.all (threads);
  log ('All services started');
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
  for (const volume of backup_volumes) {
    if (volume.backup_include.length > 0) {
      for (const include of volume.backup_include) {
        const link = path.normalize (`/${volume.name}/_data/${include}`)
          .replace (/\\/g, '/');
        filter_lines.push (`+ ${link}`);
      }
    }
    else {
      filter_lines.push (`+ /${volume.name}/`);
    }
  }
  filter_lines.push ('- /*');

  for (const volume of backup_volumes) {
    for (const exclude of volume.backup_exclude) {
      const link = path.normalize (`/${volume.name}/_data/${exclude}`)
        .replace (/\\/g, '/');
      filter_lines.push (`- ${link}`);
    }
  }

  await fs.writeFile ('filter', filter_lines.join ('\n'));
}
