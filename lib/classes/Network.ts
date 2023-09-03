import { plainToClassFromExist } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsString, validateSync } from 'class-validator';

export class Network {
  @IsString ()
  @IsNotEmpty ()
  public name = '';

  @IsBoolean ()
  public internal = false;

  @IsString ()
  public subnet = '';

  public to_command (): string {
    let command = 'docker network create';
    if (this.internal)
      command += ' --internal';
    if (this.subnet.length > 0)
      command += ` --subnet ${this.subnet}`;
    command += ` ${this.name}`;
    return command;
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
