import { Exclude, plainToClassFromExist } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsString, validateSync } from 'class-validator';
import { exec_command } from '../exec';

export class Network {
  @IsString ()
  @IsNotEmpty ()
  public name = '';

  @IsBoolean ()
  public internal = false;

  @IsString ()
  public subnet = '';

  @Exclude ()
  public exists = false;

  public async create (): Promise<void> {
    if (this.exists)
      return;
    const command = [
      'network',
      'create'
    ];
    if (this.internal)
      command.push ('--internal');
    if (this.subnet.length > 0)
      command.push ('--subnet', this.subnet);
    command.push (this.name);
    await exec_command ('docker', command);
  }

  public static from_json (data: Record<string, unknown>): Network {
    const net = (new Network);
    plainToClassFromExist (net, data);
    validateSync (
      net,
      { forbidNonWhitelisted: true, forbidUnknownValues: true }
    );
    return net;
  }
}
