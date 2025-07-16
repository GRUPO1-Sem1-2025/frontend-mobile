declare module 'qrcode-svg' {
  export default class QRCode {
    constructor(config: {
      content: string;
      padding?: number;
      width?: number;
      height?: number;
      ecl?: 'L' | 'M' | 'Q' | 'H';
    });
    svg(): string;
  }
}