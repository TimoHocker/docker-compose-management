import { CommandType } from './command_definition';
import { do_down, do_pull, do_up } from './commands';
import { Store } from './store';

async function main () {
  const store = (new Store);
  await store.read_config ();

  const argv = process.argv.slice (2);

  let type: CommandType = 'up';
  if (argv.includes ('down'))
    type = 'down';
  else if (argv.includes ('pull'))
    type = 'pull';
  else if (argv.includes ('restart'))
    type = 'restart';

  let include_passive = false;
  if (argv.includes ('--include-passive'))
    include_passive = true;

  let pull = false;
  if (argv.includes ('--pull'))
    pull = true;

  switch (type) {
    case 'up':
      do_up (store, include_passive, pull);
      break;
    case 'down':
      do_down (store);
      break;
    case 'pull':
      do_pull (store);
      break;
    case 'restart':
      do_down (store);
      do_up (store, include_passive, pull);
      break;
    default:
      throw new Error (`Unknown command type: ${type}`);
  }
}

main ();
