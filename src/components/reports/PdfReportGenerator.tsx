
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';

interface PdfReportGeneratorProps {
  studentName?: string;
  data: any;
  reportType: 'essay' | 'reading' | 'answer' | 'report-card';
}

const PdfReportGenerator = ({ studentName = 'Student', data, reportType }: PdfReportGeneratorProps) => {
  const generatePdf = () => {
    // In a real implementation, this would use a library like jsPDF to generate a PDF
    // For this demo, we'll just log the data that would go into the PDF
    console.log('Generating PDF report for:', reportType);
    console.log('Student:', studentName);
    console.log('Data:', data);
    
    // Mock PDF generation - in a real app, this would create an actual PDF
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${studentName.replace(/\s+/g, '-')}-${reportType}-${timestamp}.pdf`;
    
    alert(`PDF would be generated and downloaded as: ${fileName}`);
  };

  const getReportTitle = () => {
    switch (reportType) {
      case 'essay':
        return 'Essay Feedback Report';
      case 'reading':
        return 'Reading Analysis Report';
      case 'answer':
        return 'Answer Assessment Report';
      case 'report-card':
        return 'Academic Performance Report';
      default:
        return 'Student Report';
    }
  };

  return (
    <Button onClick={generatePdf} className="w-full" variant="outline">
      <FileText className="h-4 w-4 mr-2" />
      Download {getReportTitle()} as PDF
    </Button>
  );
};

export default PdfReportGenerator;
