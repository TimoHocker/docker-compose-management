import fs from 'fs/promises';
import assert from 'assert';
import YAML from 'yaml';
import { debug } from 'debug';
import { Network } from './classes/Network';
import { Service } from './classes/Service';
import { Volume } from './classes/Volume';
import { run_command } from './exec';

const log = debug ('sapphirecode:dcm:store');

export class Store {
  services: Service[] = [];
  networks: Network[] = [];
  volumes: Volume[] = [];

  private async read_json (filename: string): Promise<Record<string, unknown>> {
    const file = await fs.readFile (filename, 'utf-8');
    const json = JSON.parse (file);
    return json;
  }

  private async read_volume_status (): Promise<void> {
    log ('Reading volume status');
    const existing = (await run_command ('docker', [
      'volume',
      'ls',
      '--format',
      'json'
    ])).split ('\n')
      .filter ((v) => {
        try {
          JSON.parse (v);
          return true;
        }
        catch (e) { return false; }
      })
      .map ((v) => JSON.parse (v).Name);

    log ('Existing volumes:', existing);

    for (const volume of this.volumes)
      volume.exists = existing.includes (volume.name);
  }

  private async read_volumes (): Promise<void> {
    log ('Reading volumes');
    const data = await this.read_json ('./volumes.json');
    assert (Array.isArray (data), 'volumes.json is not an array');
    this.volumes = [];
    for (const volume of data)
      this.volumes.push (Volume.from_json (volume));
  }

  private async read_network_status (): Promise<void> {
    log ('Reading network status');
    const existing = (await run_command ('docker', [
      'network',
      'ls',
      '--format',
      'json'
    ])).split ('\n')
      .filter ((v) => {
        try {
          JSON.parse (v);
          return true;
        }
        catch (e) { return false; }
      })
      .map ((v) => JSON.parse (v).Name);

    log ('Existing networks:', existing);

    for (const network of this.networks)
      network.exists = existing.includes (network.name);
  }

  private async read_networks (): Promise<void> {
    log ('Reading networks');
    const data = await this.read_json ('./networks.json');
    assert (Array.isArray (data), 'networks.json is not an array');
    this.networks = [];
    for (const network of data)
      this.networks.push (Network.from_json (network));
  }

  private async read_services (): Promise<void> {
    log ('Reading services');
    const passive = await this.read_json ('./passive.json');
    log ('Passive services:', passive);
    assert (Array.isArray (passive), 'passive.json is not an array');
    const dependencies = await this.read_json ('./dependencies.json');
    log ('Dependencies:', dependencies);
    assert (
      typeof dependencies === 'object',
      'dependencies.json is not an object'
    );

    const list = await fs.readdir ('./services');
    log ('Service list:', list);
    this.services = [];
    const services: Service[] = [];
    for (const file of list) {
      if (file.startsWith ('.')) {
        log (`Skipping ${file}`);
        continue;
      }

      const service = new Service (file, passive.includes (file));

      const stat = await fs.stat (service.directory);
      if (!stat.isDirectory ()) {
        log (`${file} is not a directory`);
        continue;
      }

      try {
        await fs.access (service.compose_file);
      }
      catch (err) {
        console.warn (`${file}: error reading docker-compose.yml: ${err}`);
        continue;
      }
      if (typeof dependencies[file] !== 'undefined') {
        if (Array.isArray (dependencies[file])) {
          service.depends_on = dependencies[file] as string[];
          log (`${file}: dependencies: ${service.depends_on}`);
        }
        else { console.warn (`${file}: dependencies is not an array`); }
      }
      const contents = YAML.parse (
        await fs.readFile (service.compose_file, 'utf-8')
      );

      assert (
        typeof contents.services === 'object',
        `no service configuration in ${service.compose_file}`
      );

      const images = Object.keys (contents.services)
        .map ((key) => contents.services[key].image)
        .filter ((v, i, a) => a.indexOf (v === i));

      service.images = images.filter ((v) => typeof v === 'string');
      service.buildable = images.length > service.images.length;

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
        if (
          !added.includes (service.name)
          && service.depends_on.filter (
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
    log ('Reading config');
    await this.read_networks ();
    await this.read_volumes ();
    await this.read_services ();
  }

  public async read_docker_status () {
    await this.read_network_status ();
    await this.read_volume_status ();
  }
}
