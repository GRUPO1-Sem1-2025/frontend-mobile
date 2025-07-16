declare module 'base-64' {
  export function encode(input: string): string;
  export function decode(input: string): string;
}

declare module 'qrcode-svg' {
  export default class QRCode {
    constructor(config: {
      content: string;
      padding?: number;
      width?: number;
      height?: number;
      ecl?: 'L' | 'M' | 'Q' | 'H';
    });
    toDataURL(
    text: string,
    options?: { errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'; width?: number },
  ): Promise<string>;
    svg(): string;
  }
}