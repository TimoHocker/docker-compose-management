import { spawn } from 'child_process';

function spawn_command (
  command: string,
  args: string[],
  cwd: string,
  stdio: 'inherit' | 'pipe'
): Promise<string> {
  return new Promise<string> ((resolve) => {
    const proc = spawn (command, args, { cwd, stdio });
    let data = '';
    proc.on ('close', (code) => {
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
  await spawn_command (command, args, cwd, 'inherit');
}

export function run_command (
  command: string,
  args: string[],
  cwd = '.'
): Promise<string> {
  return spawn_command (command, args, cwd, 'pipe');
}
