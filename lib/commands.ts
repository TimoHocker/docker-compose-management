/* eslint-disable require-unicode-regexp, max-depth */

import path from 'path';
import fs from 'fs/promises';
import assert from 'assert';
import {
  TaskHorizontal,
  TaskListHorizontal,
  TaskListVertical
} from '@sapphirecode/tasks';
import debug from 'debug';
import chalk from 'chalk';
import { Store } from './store';
import { exec_command } from './exec';
import { Service } from './classes/Service';
import { pull_image } from './docker_interface';
import { delay } from './util';

const log = debug ('sapphirecode:dcm:commands');

async function init_structure (store: Store): Promise<void> {
  log ('Initializing structure');
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

function check_stoppable (
  service: string,
  services: Service[],
  stopped: string[]
): boolean {
  const sublog = log.extend ('check_stoppable');
  const depending = services.filter ((s) => s.depends_on.includes (service));
  const missing = depending.filter ((dep) => !stopped.includes (dep.name));
  sublog ('Stoppable:', missing.length === 0, 'missing:', missing);
  return missing.length === 0;
}

function build_queue (store: Store, include_passive: boolean) {
  const services = [ ...store.services ];
  const queue: Service[] = [];
  let index = 0;
  let passes = 0;
  while (services.length > 0) {
    if (index >= services.length) {
      passes++;
      assert (
        passes < 128,
        `Maximum depth reached. Circular dependency detected\n${
          services.map ((s) => `[${s.name}] ${s.depends_on.join (', ')}`)
            .join ('\n')}`
      );
    }
    index %= services.length;
    const service = services[index];
    if (service.passive && !include_passive) {
      log (`Skipping passive service ${service.name}`);
      services.splice (index, 1);
      continue;
    }

    const waiting_for = service.depends_on.filter ((dep) => {
      const active = queue.filter ((s) => s.name === dep).length;
      return active === 0;
    });
    if (waiting_for.length > 0) {
      log (`Service ${service.name} waiting for ${waiting_for.join (', ')}`);
      for (const waiting_for_service of waiting_for) {
        let is_available = false;
        for (const available of services) {
          if (available.name === waiting_for_service) {
            is_available = true;
            break;
          }
        }
        assert (
          is_available,
          `Service ${waiting_for_service
          } does not exist. Cannot start ${service.name}`
        );
      }
      index++;
      continue;
    }

    log (`Queueing ${service.name}`);

    queue.push (...services.splice (index, 1));
  }
  return queue;
}

export async function do_up (
  store: Store,
  include_passive: boolean,
  pull: boolean
): Promise<void> {
  log ('Starting up');
  await init_structure (store);
  if (pull)
    await do_pull (store);

  const started: string[] = [];
  const queue = build_queue (store, include_passive);

  log ('Queue:', queue.map ((s) => s.name));

  const task_list = new TaskListVertical;
  task_list.clear_completed = true;
  debug.log = task_list.log.bind (task_list);

  const threads = [];
  for (let i = 0; i < 4; i++) {
    // eslint-disable-next-line no-async-promise-executor
    threads.push (new Promise<void> (async (res, reject) => {
      try {
        while (queue.length > 0) {
          const service = queue.shift ();
          assert (typeof service !== 'undefined');
          log (`Checking ${service.name}`);
          const task = new TaskHorizontal;
          task.task_id = `up_${service.name}`;
          task.progress_by_time = true;
          task.label.value = service.name;
          task.label.length = 20;
          task.state = 'paused';
          task_list.tasks.push (task);
          while (!check_startable (service.depends_on, started))
            await delay (100);

          log (`Starting ${service.name}`);
          task.state = 'running';
          task.start_timer ();
          await service.up (
            (label) => (message) => task_list.log ({ label, message })
          );
          await task.stop_timer (true);
          task.completed = true;
          task.state = 'successful';
          started.push (service.name);
          log (`${service.name} started`);
          log (`Started: ${started.length}/${store.services.length
          }, remaining: ${queue.length}`);
        }
        res ();
      }
      catch (e) {
        reject (e);
      }
    }));
  }
  task_list.update ();
  await Promise.all (threads);
  await task_list.await_end ();
  debug.log = console.log.bind (console);
  log ('All services started');
}

export async function do_down (store: Store): Promise<void> {
  const threads = [];
  const stopped: string[] = [];
  const services = [ ...store.services ];
  const task_list = new TaskListVertical;
  debug.log = task_list.log.bind (task_list);
  for (const service of services) {
    threads.push ((async () => {
      const task = new TaskHorizontal;
      task.task_id = `down_${service.name}`;
      task.progress_by_time = true;
      task.label.value = service.name;
      task.label.length = 20;
      task.state = 'paused';
      task_list.tasks.push (task);

      while (!check_stoppable (service.name, services, stopped))
        await delay (100);
      task.state = 'running';
      task.start_timer ();
      await service.down (
        (label) => (message) => task_list.log ({ label, message })
      );
      task.completed = true;
      task.state = 'successful';
      task.stop_timer (true);
      stopped.push (service.name);
    }) ());
  }
  task_list.update ();
  await Promise.all (threads);
  await task_list.await_end ();
  debug.log = console.log.bind (console);
}

export async function do_pull (store: Store): Promise<void> {
  log ('Pulling images');
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
  debug.log = task_list.log.bind (task_list);

  for (const buildable_service of buildable) {
    const task = new TaskHorizontal;
    task_list.tasks.push (task);
    task.label.value = `Building ${buildable_service.name}`;
    task.label.length = 20;
    task.progress_by_time = true;
    task.task_id = `build_${buildable_service.name}`;
    task.start_timer ();
    tasks.push (exec_command (
      'docker',
      [
        'compose',
        'build'
      ],
      (message: string) => task_list.log (
        { label: buildable_service.name, message }
      ),
      buildable_service.directory
    )
      .catch (async (e) => {
        task.completed = true;
        task.state = 'failed';
        await task.stop_timer (false);
        task_list.log ({
          label:       buildable_service.name,
          message:     e.message,
          label_color: chalk.red
        });
      }))
      .then (async () => {
        task.completed = true;
        task.state = 'successful';
        await task.stop_timer (true);
      });
  }

  for (const pullable of images) {
    const tl = new TaskListHorizontal;
    task_list.tasks.push (tl);
    tl.label.length = 20;
    tasks.push (pull_image (
      pullable,
      tl,
      (msg) => task_list.log ({
        label:       pullable,
        message:     msg,
        label_color: chalk.red
      })
    ));
  }

  task_list.update ();

  await Promise.all (tasks);
  await task_list.await_end ();
  debug.log = console.log.bind (console);
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
