
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as mammoth from 'mammoth';
import * as officeparser from 'officeparser';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PDFParse } = require('pdf-parse');

@Injectable()
export class ParserService {
  async parseDocument(filePath: string, fileType: string): Promise<string> {
    const ext = path.extname(filePath).toLowerCase();

    try {
      switch (ext) {
        case '.pdf':
          return await this.parsePdf(filePath);
        case '.docx':
          return await this.parseDocx(filePath);
        case '.doc':
        case '.ppt':
        case '.pptx':
          return await this.parseOffice(filePath);
        case '.txt':
          return await this.parseTxt(filePath);
        default:
          throw new InternalServerErrorException(`Unsupported document extension: ${ext}`);
      }
    } catch (error: any) {
      console.error('Document parsing error:', error);
      throw new InternalServerErrorException(`Failed to parse document (${ext}): ${error.message || error}`);
    }
  }

  private async parsePdf(filePath: string): Promise<string> {
    const dataBuffer = fs.readFileSync(filePath);
    const uint8Array = new Uint8Array(dataBuffer.buffer, dataBuffer.byteOffset, dataBuffer.byteLength);
    const parser = new PDFParse(uint8Array);
    const result = await parser.getText();
    return result.text;
  }

  private async parseDocx(filePath: string): Promise<string> {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  private async parseOffice(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      officeparser.parseOffice(filePath, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  private async parseTxt(filePath: string): Promise<string> {
    return fs.readFileSync(filePath, 'utf8');
  }
}
