import { CommandType } from './command_definition';
import { do_down, do_pull, do_up } from './commands';

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
    do_up (include_passive, pull);
    break;
  case 'down':
    do_down ();
    break;
  case 'pull':
    do_pull ();
    break;
  case 'restart':
    do_down ();
    do_up (include_passive, pull);
    break;
  default:
    throw new Error (`Unknown command type: ${type}`);
}