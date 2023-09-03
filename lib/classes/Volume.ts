import { plainToClassFromExist } from 'class-transformer';
import {
  IsString, IsNotEmpty, IsArray,
  IsBoolean, validateSync
} from 'class-validator';

export class Volume {
  @IsString ()
  @IsNotEmpty ()
  public name = '';

  @IsBoolean ()
  public backup = true;

  @IsArray ()
  @IsString ({ each: true })
  @IsNotEmpty ({ each: true })
  public backup_exclude: string[] = [];

  public to_command (): string {
    return `docker volume create ${this.name}`;
  }

  public static from_json (data: Record<string, unknown>): Volume {
    const vol = (new Volume);
    plainToClassFromExist (vol, data);
    validateSync (
      vol,
      { forbidNonWhitelisted: true, forbidUnknownValues: true }
    );
    return vol;
  }
}
