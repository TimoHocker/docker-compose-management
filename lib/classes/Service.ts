export class Service {
  public name: string;
  public depends_on: string[] = [];

  public constructor (name: string) {
    this.name = name;
  }
}
