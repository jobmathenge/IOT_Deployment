// src/report/report.service.ts

import { Injectable, Logger } from '@nestjs/common'; 
import { InjectRepository } from '@nestjs/typeorm'; 
import { Repository } from 'typeorm'; 
import { TDocumentDefinitions, Content, TableCell } from 'pdfmake/interfaces'; 
import * as pdfMake from 'pdfmake/build/pdfmake';
import { DataService } from '../data/data.service'; 
import { SensorReading } from '../data/interfaces/sensor-reading.interface'; 
import { AlertEntity } from '../alerts/entities/alert.entity'; 


import * as fs from 'fs'; 
import * as path from 'path'; 

const pdfFonts = require('pdfmake/build/vfs_fonts');

if (pdfFonts && pdfFonts.pdfMake && pdfFonts.pdfMake.vfs) {
    (pdfMake as any).vfs = pdfFonts.pdfMake.vfs;
} else if (pdfFonts.vfs) {
    (pdfMake as any).vfs = pdfFonts.vfs;
} else {
    console.warn("Could not find pdfMake VFS fonts. PDF rendering might fail.");
}

// --- Interfaces for Alert Report Data --- 
interface TopicAlertSummary {
    topic: string;
    total: number;
    active: number;
    categories: {
        [category: string]: number; 
    };
}

export interface AlertSummaryReport {
    totalAlerts: number;
    activeAlerts: number;
    topics: TopicAlertSummary[];
}




function getLogoBase64(filename: string): string {
    try {
        const filePath = path.join(__dirname, '..', 'assets', 'logos', filename); 
        
        const mimeType = path.extname(filename) === '.png' ? 'image/png' : 'image/jpeg';
        
        const fileBuffer = fs.readFileSync(filePath);
        return `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
    } catch (error) {
        console.error(`ERROR: Could not load logo file: ${filename}. Ensure file exists at the expected path: ${path.join(__dirname, '..', 'assets', 'logos')}`, error.message);
        return 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; 
    }
}

const DAVIS_SHIRT_LOGO_BASE64 = getLogoBase64('dayliff.png'); 



const REPORT_LIMIT = 100;

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name); 

  constructor(
      private readonly dataService: DataService, 
      @InjectRepository(AlertEntity) 
      private alertRepository: Repository<AlertEntity>,
  ) {}
  

  public async getFullReportData(): Promise<{[topic: string]: SensorReading[]}> {
      return this.dataService.getAllHistoricalData(REPORT_LIMIT); 
  }
  

  public async getAlertSummaryReport(days: number = 7): Promise<AlertSummaryReport> {
      this.logger.log(`Generating alert summary for the last ${days} days using Query Builder.`);
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - days);


      const allAlerts = await this.alertRepository.createQueryBuilder("alert")
          .where("alert.timestamp >= :pastDate", { pastDate: pastDate }) 
          .getMany(); 

      const report: AlertSummaryReport = {
          totalAlerts: 0,
          activeAlerts: 0,
          topics: [],
      };

      const topicMap = new Map<string, TopicAlertSummary>();

   
      allAlerts.forEach(alert => {
          report.totalAlerts++;
          if (alert.status === 'Active') {
              report.activeAlerts++;
          }

          if (!topicMap.has(alert.topic)) {
              topicMap.set(alert.topic, {
                  topic: alert.topic,
                  total: 0,
                  active: 0,
                  categories: {},
              });
          }

          const summary = topicMap.get(alert.topic)!;
          summary.total++;
          if (alert.status === 'Active') {
              summary.active++;
          }

          // Extract and count category
          const category = this.extractCategory(alert.condition);
          summary.categories[category] = (summary.categories[category] || 0) + 1;
      });

      report.topics = Array.from(topicMap.values());

      return report;
  }
  

  private extractCategory(condition: string): string {
      const parts = condition.split(':');
      if (parts.length > 0) {
          // Remove the sensor name (first word) and then trim the rest.
          let category = parts[0].trim();
          category = category.replace(/^\w+\s/, '').trim();
          return category;
      }
      return 'UNKNOWN';
  }

  
  public async generatePdfBuffer(
    allHistoricalData: {[topic: string]: SensorReading[]},
    alertReport: AlertSummaryReport 
  ): Promise<Buffer> {
    let docContent: Content[] = [];

  
    docContent.push(this.createAlertSummaryPage(alertReport));

  
    docContent.push({ text: '', pageBreak: 'before' } as Content);
    // Passed alertReport to Sensor Summary for synchronization
    docContent.push(this.createSensorSummaryPage(allHistoricalData, alertReport));

   
    for (const topic in allHistoricalData) {
        if (allHistoricalData[topic].length > 0) {
            docContent.push({ text: '', pageBreak: 'before' } as Content);
            docContent.push(this.createDetailPage(topic, allHistoricalData[topic]));
        }
    }

    const docDefinition: TDocumentDefinitions = {
      header: this.createHeader(),
      footer: this.createFooter(), 
      
      content: docContent,
      styles: {
        header: { fontSize: 22, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
        subHeader: { fontSize: 16, bold: true, margin: [0, 10, 0, 5] },
        pageHeader: { fontSize: 20, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
        tableTitle: { fontSize: 14, bold: true, margin: [0, 10, 0, 5] },
        tableHeader: { bold: true, fillColor: '#cccccc' },
        summaryData: { fontSize: 10, alignment: 'center' },
        contactInfo: { fontSize: 8, alignment: 'right', color: '#555555' },
        pageFooter: { fontSize: 9, color: '#888888', margin: [20, 10, 20, 0] },
      },
      defaultStyle: { font: 'Roboto' }
    };

    return new Promise((resolve) => {
      const pdfDoc = pdfMake.createPdf(docDefinition);
      pdfDoc.getBuffer((buffer) => {
        resolve(buffer);
      });
    });
  }



  private createHeader(): any {
      return {
          columns: [
              { 
                  image: DAVIS_SHIRT_LOGO_BASE64, 
                  width: 120, 
                  alignment: 'left' as const, 
                  margin: [20, 20, 20, 20]
              },
              {
                  text: [
                      { text: 'Davis & Shirtliff Technical Report\n', bold: true },
                      'Address: P.O. Box 41762 - 00100 GPO\n',
                      'Contact: +254 (0) 711 079 000\n',
                      'Email: info@davisandshirtliff.com',
                  ],
                  style: 'contactInfo',
                  alignment: 'right' as const, 
                  margin: [20, 15, 20, 20] 
              },

          ],
          canvas: [
              { type: 'line', x1: 20, y1: 70, x2: 575, y2: 70, lineWidth: 0.5 }
          ]
      } as any;
  }

  private createFooter(): any { 
      return (currentPage, pageCount) => {
          return {
              columns: [
                  { 
                      text: `Generated on: ${new Date().toLocaleDateString()}`, 
                      style: 'pageFooter', 
                      alignment: 'left' as const
                  },
                  { 
                      text: `Page ${currentPage} of ${pageCount}`, 
                      style: 'pageFooter', 
                      alignment: 'right' as const
                  }
              ]
          } as any;
      };
  }


  private createSensorSummaryPage(
    allHistoricalData: {[topic: string]: SensorReading[]},
    alertReport: AlertSummaryReport
  ): Content {
      const allData = allHistoricalData;
      let summaryBody: TableCell[][] = [];
      
      // Convert alertReport.topics to a Map for quick lookup by topic
      const alertMap = new Map<string, TopicAlertSummary>();
      alertReport.topics.forEach(t => alertMap.set(t.topic, t));


      summaryBody.push([
          { text: 'Sensor Topic', style: 'tableHeader' },
          { text: 'Count', style: 'tableHeader' },
          { text: 'Min Value', style: 'tableHeader' },
          { text: 'Max Value', style: 'tableHeader' },
          { text: 'Average Value', style: 'tableHeader' },
      ]);

      for (const topic in allData) {
          const data = allData[topic];
          
          let count = data.length;
          let min = 'N/A', max = 'N/A', avg = 'N/A';
          
          // SYNCHRONIZATION LOGIC: If the topic has an active alert count, use it.
          const topicAlertSummary = alertMap.get(topic);
          if (topicAlertSummary) {
              // Override the count with the ACTIVE alert count to match the pop-up/alert summary.
              count = topicAlertSummary.active;
              
              // Change the description for clarity in the PDF
              min = 'N/A'; 
              max = 'N/A'; 
              avg = 'ACTIVE';
          }
          // -----------------------------------------------------------
          
          if (data.length > 0 && !topicAlertSummary) { // Only calculate min/max/avg for non-alert topics
              const values = data.map(r => r.value as number);
              const sum = values.reduce((a, b) => a + b, 0);
              
              if (topic.includes('Status')) {
                  const onCount = sum; 
                  const offCount = data.length - onCount; // Use raw data length here
                  
                  min = `OFF: ${offCount}`;
                  max = `ON: ${onCount}`;
                  avg = `${((onCount / data.length) * 100).toFixed(0)}% ON`;
                  count = data.length; // Revert count for Status topics which are not alerts
              } else {
                  min = Math.min(...values).toFixed(2);
                  max = Math.max(...values).toFixed(2);
                  avg = (sum / data.length).toFixed(2);
                  count = data.length; // Revert count for regular sensor topics
              }
          }

          const countText = topicAlertSummary 
            ? { text: count, style: 'summaryData', color: count > 0 ? 'red' : 'black' }
            : { text: data.length, style: 'summaryData' }; // Use raw count for non-alert topics


          summaryBody.push([
              { text: topic, style: 'summaryData', alignment: 'left' },
              countText, // Use the dynamically set count/color
              { text: min, style: 'summaryData' },
              { text: max, style: 'summaryData' },
              { text: avg, style: 'summaryData' },
          ]);
      }
      
      return [
          { text: 'Sensor Data Summary', style: 'tableTitle', margin: [0, 20, 0, 5] }, 
          { 
              text: `Data Period: Last ${REPORT_LIMIT} Readings per Topic (Alerts synchronized to ACTIVE count)`, 
              style: 'subHeader', alignment: 'left', margin: [0, 5, 0, 10] 
          },
          {
              table: {
                  headerRows: 1,
                  widths: ['30%', '10%', '20%', '20%', '20%'],
                  body: summaryBody,
              },
              layout: 'lightHorizontalLines'
          }
      ];
  }
  
  private createAlertSummaryPage(report: AlertSummaryReport): Content {
    let topicTableBody: TableCell[][] = [];

    // Table Header
    topicTableBody.push([
        { text: 'Topic', style: 'tableHeader', alignment: 'left' },
        { text: 'Total Alerts', style: 'tableHeader' },
        { text: 'Active Alerts', style: 'tableHeader' },
        { text: 'Top Alert Types', style: 'tableHeader', alignment: 'left' },
    ]);

    // Table Body
    report.topics.forEach(topicSummary => {
        // Format categories: 'CRITICAL HIGH (5), WARNING LOW (2)'
        const formattedCategories = Object.entries(topicSummary.categories)
            .sort(([, countA], [, countB]) => countB - countA)
            .map(([category, count]) => `${category} (${count})`)
            .join(', ');

        topicTableBody.push([
            { text: topicSummary.topic, style: 'summaryData', alignment: 'left' },
            { text: topicSummary.total, style: 'summaryData' },
            { text: topicSummary.active, style: 'summaryData', color: topicSummary.active > 0 ? 'red' : 'black' },
            { text: formattedCategories || 'N/A', style: 'summaryData', alignment: 'left' },
        ]);
    });

    return [
        { text: 'System Monitoring Technical Report', style: 'header',margin: [0, 20, 0, 0] },
        { text: `Report Generated: ${new Date().toLocaleString()}`, style: 'subHeader', alignment: 'center' },
        
        { text: 'Alert Monitoring Summary', style: 'tableTitle', margin: [0, 20, 0, 5] },

        // Global Alert Totals
        {
            table: {
                widths: ['25%', '25%', '25%', '25%'],
                body: [
                    [{ text: 'Total Alerts', style: 'tableHeader' }, { text: 'Active Alerts', style: 'tableHeader' }, { text: 'Total Topics', style: 'tableHeader' }, { text: 'Alert Period (Days)', style: 'tableHeader' }],
                    [
                        { text: report.totalAlerts, style: 'summaryData' },
                        { text: report.activeAlerts, style: 'summaryData', color: report.activeAlerts > 0 ? 'red' : 'black' },
                        { text: report.topics.length, style: 'summaryData' },
                        { text: '7 (Default)' as any, style: 'summaryData' } 
                    ],
                ]
            },
            layout: 'lightHorizontalLines',
            margin: [0, 5, 0, 15]
        },

        // Detailed Topic Alerts
        { text: 'Detailed Alert Breakdown by Topic', style: 'tableTitle', margin: [0, 20, 0, 5] },
        {
            table: {
                headerRows: 1,
                widths: ['25%', '15%', '15%', '45%'],
                body: topicTableBody,
            },
            layout: 'lightHorizontalLines'
        }
    ];
}


  private createDetailPage(topic: string, data: SensorReading[]): Content { 
      return [
          { text: `Detail Report: ${topic}`, style: 'pageHeader' , margin: [0, 20, 0, 0]},
          this.createDetailSummary(topic, data), 
          { text: `Data Log (Last ${data.length} Readings)`, style: 'tableTitle' },
          this.createDataTable(data), 
      ];
  }
  
  private createDetailSummary(topic: string, data: SensorReading[]): Content {
      if (data.length === 0) {
        return { text: 'No data available for summary.', margin: [0, 10] };
      }
      
      const values = data.map(r => r.value as number);
      const sum = values.reduce((a, b) => a + b, 0);
      const count = data.length;

      if (topic.includes('Status')) {
           const onCount = sum; 
           const offCount = count - onCount;

           return {
              text: `Status Readings: ${onCount} ON / ${offCount} OFF (Total: ${data.length})`,
              margin: [0, 10],
              style: 'subHeader'
           }
      }

      const avg = sum / count;
      const min = Math.min(...values);
      const max = Math.max(...values);
      
      return {
        table: {
          widths: ['*', '*', '*', '*', '*'],
          body: [
            [{ text: 'Metric', style: 'tableHeader' }, { text: 'Readings Count', style: 'tableHeader' }, { text: 'Min Value', style: 'tableHeader' }, { text: 'Max Value', style: 'tableHeader' }, { text: 'Average Value', style: 'tableHeader' }],
            ['Value', count, min.toFixed(2), max.toFixed(2), avg.toFixed(2)],
          ],
        },
        layout: 'lightHorizontalLines',
        margin: [0, 5, 0, 15]
      };
  }

  private createDataTable(data: SensorReading[]): Content {
      if (data.length === 0) {
          return { text: 'No detailed data available.', margin: [0, 10] };
      }

      const body: TableCell[][] = [];

      body.push([
        { text: 'Timestamp (Local)', style: 'tableHeader' },
        { text: 'Topic', style: 'tableHeader' },
        { text: 'Value', style: 'tableHeader' }
      ]);

      data.slice(0, 50).forEach(r => {
        body.push([
          r.timestamp.toLocaleString(),
          r.topic,
          typeof r.value === 'number' ? r.value.toFixed(2) : String(r.value), 
        ]);
      });

      return {
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto'],
          body: body,
        },
        fontSize: 8,
        layout: 'lightHorizontalLines'
      };
  }
}