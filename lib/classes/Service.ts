import { exec_command } from '../exec';

export class Service {
  public name: string;
  public depends_on: string[] = [];
  public passive;
  public buildable = false;
  public images: string[] = [];

  public constructor (name: string, passive: boolean) {
    this.name = name;
    this.passive = passive;
  }

  public get directory (): string {
    return `services/${this.name}`;
  }

  public get compose_file (): string {
    return `${this.directory}/docker-compose.yml`;
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
