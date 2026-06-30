import { Injectable, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as mammoth from 'mammoth';
import * as officeparser from 'officeparser';

const pdfParse = require('pdf-parse');

@Injectable()
export class ParserService {
  async parseDocument(filePath: string, fileType?: string): Promise<string> {
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
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Document parsing error:', error);
      throw new InternalServerErrorException(`Failed to parse document (${ext}): ${error.message || error}`);
    }
  }

  private async parsePdf(filePath: string): Promise<string> {
    const dataBuffer = fs.readFileSync(filePath);
    try {
      const data = await pdfParse(dataBuffer);
      
      if (data.numpages > 15) {
        throw new BadRequestException('PDF files are limited to a maximum of 15 pages.');
      }
      
      return data.text || '';
    } catch (err: any) {
      if (err instanceof BadRequestException) {
        throw err;
      }
      throw new InternalServerErrorException(`Failed to parse PDF file: ${err.message || err}`);
    }
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
