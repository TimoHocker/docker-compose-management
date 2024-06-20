import { spawn } from 'child_process';
import {debug} from 'debug'

const log = debug ('sapphirecode:dcm:exec');

function spawn_command (
  command: string,
  args: string[],
  cwd: string,
  stdio: 'inherit' | 'pipe'
): Promise<string> {
  log (`spawn_command: ${command} ${args.join (' ')}`);
  log (`cwd: ${cwd}`);
  log (`stdio: ${stdio}`);
  return new Promise<string> ((resolve) => {
    const proc = spawn (command, args, { cwd, stdio });
    let data = '';
    proc.on ('close', (code) => {
      log (`${command} ${args.join (' ')} exited with code ${code}`);
      if (code !== 0) {
        throw new Error (
          `${command} ${args.join (' ')} exited with code ${code}`
        );
      }
      resolve (data);
    });
    if (proc.stdout !== null) {
      proc.stdout.on ('data', (chunk) => {
        data += chunk;
      });
    }
  });
}

export async function exec_command (
  command: string,
  args: string[],
  cwd = '.'
): Promise<void> {
  log (`exec_command: ${command} ${args.join (' ')}`);
  await spawn_command (command, args, cwd, 'inherit');
}

export function run_command (
  command: string,
  args: string[],
  cwd = '.'
): Promise<string> {
  log(`run_command: ${command} ${args.join (' ')}`);
  return spawn_command (command, args, cwd, 'pipe');
}
