import { Stream } from 'stream';
import { Task, TaskListHorizontal } from '@sapphirecode/tasks';
import chalk from 'chalk';
import Docker from 'dockerode';

const docker = new Docker;

function get_task (
  list: Record<string, Task>,
  task_list: TaskListHorizontal,
  id: string
) {
  if (!list[id]) {
    list[id] = new Task;
    task_list.tasks.push (list[id]);
  }
  return list[id];
}

export function pull_image (
  image: string,
  task_list: TaskListHorizontal
): Promise<void> {
  task_list.label.value = `Pulling ${image}`;
  const tasks: Record<string, Task> = {};

  return new Promise<void> ((resolve) => {
    docker.pull (image, (err: string, stream: Stream) => {
      if (err)
        throw new Error (err);

      stream.on ('end', () => {
        if (task_list.tasks.length === 0) {
          const task = new Task;
          task_list.tasks.push (task);
          task.completed = true;
          task.state = 'successful';
          task.progress = 1;
        }
        resolve ();
      });
      stream.on ('data', (data: string) => {
        const content = JSON.parse (data);

        if (![
          'Already exists',
          'Pull complete',
          'Waiting',
          'Pulling fs layer',
          'Extracting',
          'Downloading',
          'Download complete',
          'Verifying Checksum'
        ].includes (content.status))
          return;

        const task = get_task (tasks, task_list, content.id);
        switch (content.status) {
          case 'Already exists':
          case 'Pull complete':
            task.color = chalk.green;
            task.progress = 1;
            task.completed = true;
            task.state = 'successful';
            break;
          case 'Waiting':
            task.progress = 0.25;
            task.state = 'paused';
            break;
          case 'Pulling fs layer':
            task.progress = 0;
            task.state = 'running';
            task.color = chalk.white;
            break;
          case 'Extracting':
            task.progress = 0.5 + (0.5 * content.progressDetail.current
            / content.progressDetail.total);
            task.color = chalk.cyan;
            task.state = 'running';
            break;
          case 'Downloading':
            task.progress = (0.5 * content.progressDetail.current
            / content.progressDetail.total);
            task.color = chalk.white;
            task.state = 'running';
            break;
          case 'Download complete':
            task.progress = 0.5;
            task.color = chalk.gray;
            task.state = 'running';
            break;
          case 'Verifying Checksum':
            task.progress = 0.5;
            task.color = chalk.yellow;
            task.state = 'running';
            break;
          default:
            break;
        }
      });
    });
  });
}
