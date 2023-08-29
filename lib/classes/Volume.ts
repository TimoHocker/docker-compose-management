import assert from 'assert';

export class Network {
  public name: string;
  public backup: boolean;
  public backup_exclude: string[] = [];

  public constructor (data: Record<string, unknown>) {
    this.name = data.name as string;
    assert (
      typeof this.name === 'string' && this.name.length > 0,
      'Volume name is required'
    );

    this.backup = data.backup as boolean;
    if (typeof this.backup !== 'boolean')
      this.backup = true;

    if (Array.isArray (data.backup_exclude)) {
      for (const item of data.backup_exclude) {
        if (typeof item === 'string' && item.length > 0)
          this.backup_exclude.push (item);
      }
    }
  }

  public to_command (): string {
    return `docker volume create ${this.name}`;
  }
}
