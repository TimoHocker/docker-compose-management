import { Exclude, plainToClassFromExist } from 'class-transformer';
import {
  IsString, IsNotEmpty, IsArray,
  IsBoolean, validateSync
} from 'class-validator';
import { exec_command } from '../exec';

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

  @IsArray ()
  @IsString ({ each: true })
  @IsNotEmpty ({ each: true })
  public backup_include: string[] = [];

  @Exclude ()
  public exists = false;

  public async create (): Promise<void> {
    if (this.exists)
      return;
    await exec_command ('docker', [
      'volume',
      'create',
      this.name
    ]);
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
