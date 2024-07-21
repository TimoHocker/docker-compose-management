import { spawn } from 'child_process';
import chalk from 'chalk';
import { debug } from 'debug';

const log = debug ('sapphirecode:dcm:exec');

type Logger = (message: string) => void;
type GetLogger = (label: string) => Logger;

function spawn_command (
  command: string,
  args: string[],
  cwd: string,
  logger: Logger | null = null
): Promise<string> {
  log (`spawn_command: ${command} ${args.join (' ')}`);
  log (`cwd: ${cwd}`);
  return new Promise<string> ((resolve) => {
    const proc = spawn (command, args, { cwd, stdio: 'pipe' });
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
    let stdout_line = '';
    let stderr_line = '';
    proc.stdout.on ('data', (chunk) => {
      if (!logger) {
        data += chunk;
        return;
      }
      stdout_line += chunk;
      if (stdout_line.includes ('\n')) {
        const lines = stdout_line.split ('\n');
        stdout_line = lines.pop () || '';
        logger (lines.join ('\n'));
      }
    });
    if (logger) {
      proc.stderr.on ('data', (chunk) => {
        stderr_line += chunk;
        if (stderr_line.includes ('\n')) {
          const lines = stderr_line.split ('\n');
          stderr_line = lines.pop () || '';
          logger (chalk.red (lines.join ('\n')));
        }
      });
    }
  });
}

async function exec_command (
  command: string,
  args: string[],
  logger: Logger,
  cwd = '.'
): Promise<void> {
  log (`exec_command: ${command} ${args.join (' ')}`);
  await spawn_command (command, args, cwd, logger);
}

function run_command (
  command: string,
  args: string[],
  cwd = '.'
): Promise<string> {
  log (`run_command: ${command} ${args.join (' ')}`);
  return spawn_command (command, args, cwd);
}

export { exec_command, run_command, Logger, GetLogger };
