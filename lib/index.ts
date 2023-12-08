import { Stream } from 'stream';
import { CommandType } from './command_definition';
import { do_create_filter, do_down, do_pull, do_up } from './commands';
import { Store } from './store';

async function main () {
  const argv = process.argv.slice (2);

  let type: CommandType = 'up';
  if (argv.includes ('down'))
    type = 'down';
  else if (argv.includes ('pull'))
    type = 'pull';
  else if (argv.includes ('restart'))
    type = 'restart';
  else if (argv.includes ('create_filter'))
    type = 'create_filter';

  let include_passive = false;
  if (argv.includes ('--include-passive'))
    include_passive = true;

  let pull = false;
  if (argv.includes ('--pull'))
    pull = true;

  let delay = 0;
  for (const arg of argv) {
    if (arg.startsWith ('--delay=')) {
      delay = parseInt (arg.slice ('--delay='.length));
      if (isNaN (delay))
        throw new Error (`Invalid delay: ${arg}`);
    }
  }

  if (delay > 0) {
    console.log (`Delaying for ${delay} seconds...`);
    await new Promise ((resolve) => setTimeout (resolve, delay * 1000));
  }

  const store = (new Store);
  await store.read_config ();

  store.docker.pull('httpd',(err:string, stream:Stream)=>{
    stream.pipe(process.stdout);
  });
  return;

  switch (type) {
    case 'up':
      await do_up (store, include_passive, pull);
      break;
    case 'down':
      await do_down (store);
      break;
    case 'pull':
      await do_pull (store);
      break;
    case 'restart':
      await do_down (store);
      await do_up (store, include_passive, pull);
      break;
    case 'create_filter':
      await do_create_filter (store);
      break;
    default:
      throw new Error (`Unknown command type: ${type}`);
  }
}

main ();
