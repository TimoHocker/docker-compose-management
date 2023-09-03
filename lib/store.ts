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
    this.volumes = [];
    for (const volume of data)
      this.volumes.push (Volume.from_json (volume));
  }

  private async read_networks (): Promise<void> {
    const data = await this.read_json ('./networks.json');
    assert (Array.isArray (data), 'networks.json is not an array');
    this.networks = [];
    for (const network of data)
      this.networks.push (Network.from_json (network));
  }

  private async read_services (): Promise<void> {
    const passive = await this.read_json ('./passive.json');
    assert (Array.isArray (passive), 'passive.json is not an array');
    const dependencies = await this.read_json ('./dependencies.json');
    assert (
      typeof dependencies === 'object',
      'dependencies.json is not an object'
    );

    const list = await fs.readdir ('./services');
    this.services = [];
    for (const file of list) {
      if (file.startsWith ('.'))
        continue;
      const stat = await fs.stat (`./services/${file}`);
      if (!stat.isDirectory ())
        continue;
      try {
        await fs.access (`./services/${file}/docker-compose.yml`);
      }
      catch (err) {
        console.warn (`${file}: error reading docker-compose.yml: ${err}`);
        continue;
      }
      const service = new Service (file, passive.includes (file));
      if (typeof dependencies[file] !== 'undefined') {
        if (Array.isArray (dependencies[file]))
          service.depends_on = dependencies[file] as string[];
        else
          console.warn (`${file}: dependencies is not an array`);
      }
      this.services.push (service);
    }

    for (const service of this.services) {
      for (const dependency of service.depends_on) {
        if (typeof dependency !== 'string') {
          console.warn (`${service.name}: dependency is not a string`);
          continue;
        }
        const found = this.services.find ((s) => s.name === dependency);
        if (typeof found === 'undefined')
          console.warn (`${service.name}: dependency ${dependency} not found`);
      }
    }
  }

  public async read_config () {
    await this.read_networks ();
    await this.read_volumes ();
    await this.read_services ();
  }
}
