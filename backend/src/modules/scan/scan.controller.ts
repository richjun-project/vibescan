import { Controller, Post, Get, Param, Body, UseGuards, Request, Patch, Res, Query, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ScanService } from './scan.service';
import { PDFService } from '../../services/pdf.service';

class CreateScanDto {
  @IsString()
  domain: string;

  @IsOptional()
  @IsString()
  repositoryUrl?: string;

  @IsOptional()
  @IsString()
  language?: 'ko' | 'en';
}

@Controller('scans')
export class ScanController {
  constructor(
    private readonly scanService: ScanService,
    private readonly pdfService: PDFService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  async createScan(@Request() req, @Body() dto: CreateScanDto) {
    return this.scanService.createScan(req.user, dto.domain, dto.repositoryUrl, dto.language || 'ko');
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getScans(
    @Request() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    return this.scanService.getScans(req.user.id, pageNum, limitNum);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getScan(@Request() req, @Param('id') id: number): Promise<any> {
    return this.scanService.getScanById(id, req.user.id);
  }

  @Get('public/:shareToken')
  async getPublicScan(@Param('shareToken') shareToken: string) {
    return this.scanService.getPublicScan(shareToken);
  }

  @Patch(':id/toggle-public')
  @UseGuards(JwtAuthGuard)
  async togglePublic(@Request() req, @Param('id') id: number) {
    return this.scanService.togglePublic(id, req.user.id);
  }

  @Get(':id/json-report')
  @UseGuards(JwtAuthGuard)
  async getJsonReport(@Request() req, @Param('id') id: number) {
    return this.scanService.getJsonReport(id, req.user.id);
  }

  @Post(':id/analyze-with-ai')
  @UseGuards(JwtAuthGuard)
  async analyzeWithAI(@Request() req, @Param('id') id: number) {
    return this.scanService.analyzeWithAI(id, req.user.id);
  }

  @Post(':id/generate-fix-guide')
  @UseGuards(JwtAuthGuard)
  async generateFixGuide(
    @Request() req,
    @Param('id') id: number,
    @Body() body: { vulnerabilityName: string },
  ) {
    return this.scanService.generateFixGuide(id, req.user.id, body.vulnerabilityName);
  }

  @Get(':id/download-pdf')
  @UseGuards(JwtAuthGuard)
  async downloadPdf(
    @Request() req,
    @Param('id') id: number,
    @Res() res: Response,
  ) {
    try {
      // Get scan details
      const scanData = await this.scanService.getScanById(id, req.user.id);

      // Check scan is completed
      if (scanData.status !== 'completed') {
        throw new HttpException(
          '스캔이 완료되지 않았습니다',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Generate PDF
      // Convert MikroORM Collection to array
      const vulnerabilities = scanData.vulnerabilities?.getItems ?
        scanData.vulnerabilities.getItems() :
        (Array.isArray(scanData.vulnerabilities) ? scanData.vulnerabilities : []);

      const pdfBuffer = await this.pdfService.generateScanReport(
        scanData,
        vulnerabilities,
      );

      // Set response headers
      const filename = `vibescan-report-${scanData.domain}-${new Date().toISOString().split('T')[0]}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);

      // Send PDF
      res.send(pdfBuffer);
    } catch (error) {
      console.error('[PDF_ERROR] PDF generation failed:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `PDF 생성에 실패했습니다: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/upgrade-to-paid')
  @UseGuards(JwtAuthGuard)
  async upgradeToPaid(@Request() req, @Param('id') id: number) {
    return this.scanService.upgradeToPaid(id, req.user.id);
  }
}
