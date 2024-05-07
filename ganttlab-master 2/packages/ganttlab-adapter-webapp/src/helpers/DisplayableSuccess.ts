import { hashCode } from '.';

export class DisplayableSuccess {
  public message: string;
  public hash: number;
  constructor(
    public _message: string,
    public title: string = 'Success',
  ) {
    this.message = _message;
    this.hash = hashCode(`${this.message}${title}`);
  }
}
