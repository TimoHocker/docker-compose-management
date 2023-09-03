import { exec_command } from '../exec';

export class Service {
  public name: string;
  public depends_on: string[] = [];
  public passive;

  public constructor (name: string, passive: boolean) {
    this.name = name;
    this.passive = passive;
  }

  public get directory (): string {
    return `services/${this.name}`;
  }

  public async pull (): Promise<void> {
    await exec_command ('docker', [
      'compose',
      'pull'
    ], this.directory);
    await exec_command ('docker', [
      'compose',
      'build'
    ], this.directory);
  }

  public async up (): Promise<void> {
    await exec_command ('docker', [
      'compose',
      'up',
      '-d'
    ], this.directory);
  }

  public async down (): Promise<void> {
    await exec_command ('docker', [
      'compose',
      'down'
    ], this.directory);
  }
}
