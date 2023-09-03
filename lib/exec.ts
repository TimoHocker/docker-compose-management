import { spawn } from 'child_process';

export function exec_command (
  command: string,
  args: string[],
  cwd: string
): Promise<void> {
  return new Promise<void> ((resolve) => {
    const proc = spawn (command, [], { cwd, stdio: 'inherit' });
    proc.on ('close', (code) => {
      if (code !== 0) {
        throw new Error (
          `${command} ${args.join (' ')} exited with code ${code}`
        );
      }
      resolve ();
    });
  });
}
