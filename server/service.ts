//


export class Service {

  public async main(): Promise<void> {
    await this.execute();
  }

  private async execute(): Promise<void> {
    console.log("noop");
  }

}


let service = new Service();
service.main();