import {exec_command, type GetLogger} from '../exec';

export class Service {
	public name: string;
	public dependsOn: string[] = [];
	public isPassive: boolean;
	public buildable = false;
	public images: string[] = [];

	public constructor(name: string, isPassive: boolean) {
		this.name = name;
		this.isPassive = isPassive;
	}

	public get directory(): string {
		return `services/${this.name}`;
	}

	public get compose_file(): string {
		return `${this.directory}/docker-compose.yml`;
	}

	public async up(get_logger: GetLogger): Promise<void> {
		await exec_command('docker', [
			'compose',
			'up',
			'-d',
		], get_logger(this.name), this.directory);
	}

	public async down(get_logger: GetLogger): Promise<void> {
		await exec_command('docker', [
			'compose',
			'down',
		], get_logger(this.name), this.directory);
	}
}
