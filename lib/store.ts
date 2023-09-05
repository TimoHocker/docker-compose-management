import fs from 'fs/promises';
import assert from 'assert';
import { Network } from './classes/Network';
import { Service } from './classes/Service';
import { Volume } from './classes/Volume';
import { exec_command, run_command } from './exec';

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

    const existing = (await run_command ('docker', [
      'volume',
      'ls',
      '--format',
      'json'
    ])).split ('\n')
      .map ((v) => JSON.parse (v).Name);

    for (const volume of this.volumes)
      volume.exists = existing.includes (volume.name);
  }

  private async read_networks (): Promise<void> {
    const data = await this.read_json ('./networks.json');
    assert (Array.isArray (data), 'networks.json is not an array');
    this.networks = [];
    for (const network of data)
      this.networks.push (Network.from_json (network));

    const existing = (await run_command ('docker', [
      'network',
      'ls',
      '--format',
      'json'
    ])).split ('\n')
      .map ((v) => JSON.parse (v).Name);

    for (const network of this.networks)
      network.exists = existing.includes (network.name);
  }

  // eslint-disable-next-line max-lines-per-function, max-statements
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
    const services: Service[] = [];
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
      services.push (service);
    }

    for (const service of services) {
      service.depends_on = service.depends_on.filter ((d) => {
        if (typeof d !== 'string') {
          console.warn (`${service.name}: dependency is not a string`);
          return false;
        }
        const found = services.find ((s) => s.name === d);
        if (typeof found === 'undefined') {
          console.warn (`${service.name}: dependency ${d} not found`);
          return false;
        }
        return true;
      });
    }

    const added: string[] = [];
    let last = 0;
    while (services.length > added.length) {
      for (const service of services) {
        if (service.depends_on.filter (
          (v) => !added.includes (v)
        ).length === 0) {
          this.services.push (service);
          added.push (service.name);
        }
      }
      if (last === added.length) {
        console.warn (services.map (
          (s) => `${s.name} depends on: ${s.depends_on.join (', ')}`
        ));
        throw new Error ('circular dependency detected');
      }
      last = added.length;
    }
  }

  public async read_config () {
    await this.read_networks ();
    await this.read_volumes ();
    await this.read_services ();
  }
}
