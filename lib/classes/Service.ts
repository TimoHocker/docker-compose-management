export class Service {
  public name: string;
  public depends_on: string[] = [];
  public passive;

  public constructor (name: string, passive: boolean) {
    this.name = name;
    this.passive = passive;
  }
}
