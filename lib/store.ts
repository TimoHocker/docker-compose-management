import fs from 'fs/promises';
import assert from 'assert';
import { Network } from './classes/Network';
import { Service } from './classes/Service';
import { Volume } from './classes/Volume';

export class Store {
  services: Service[] = [];
  networks: Network[] = [];
  volumes: Volume[] = [];

  private async read_json (filename: string): Promise<Record<string, unknown>> {
    const file = await fs.readFile (filename, 'utf-8');
    const json = JSON.parse (file);
    return json;
  }

  private async read_volumes (): Promise<void> {
    const data = await this.read_json ('./volumes.json');
    assert (Array.isArray (data), 'volumes.json is not an array');
    for (const volume of data)
      this.volumes.push (Volume.from_json (volume));
  }

  public read_config () {

  }
}
