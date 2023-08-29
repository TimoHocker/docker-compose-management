import assert from 'assert';

export class Network {
  public name: string;
  public internal: boolean;
  public subnet: string;

  public constructor (data: Record<string, unknown>) {
    this.name = data.name as string;
    assert (
      typeof this.name === 'string' && this.name.length > 0,
      'Network name is required'
    );

    this.internal = data.internal as boolean;
    if (typeof this.internal !== 'boolean')
      this.internal = false;

    this.subnet = data.subnet as string;
    if (typeof this.subnet !== 'string')
      this.subnet = '';
  }

  public to_command (): string {
    let command = 'docker network create';
    if (this.internal)
      command += ' --internal';
    if (this.subnet.length > 0)
      command += ` --subnet ${this.subnet}`;
    command += ` ${this.name}`;
    return command;
  }
}
