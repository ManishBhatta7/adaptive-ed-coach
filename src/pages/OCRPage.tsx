import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import AnswerSheetUploader from '@/components/answer-sheet/AnswerSheetUploader';
import { SubmissionService } from '@/services/SubmissionService';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { 
  Loader2, ScanText, Wand2, Copy, Plus, Trash2, 
  FileDown, ChevronLeft, ChevronRight, Edit2, Check, 
  BrainCircuit, Sparkles 
} from 'lucide-react';

// Markdown & Math
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

// PDF Generation
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface OCRItem {
  q_number: string;
  question: string;
  solution: string;
}

const ITEMS_PER_PAGE = 5;

const OCRPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [items, setItems] = useState<OCRItem[]>([]);
  
  // Edit Mode State
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  // PDF Ref
  const reportRef = useRef<HTMLDivElement>(null);

  // === HELPER: CLEAN TEXT FORMATTING ===
  const formatText = (text: string) => {
    if (!text) return "";
    return text
      .replace(/\\n/g, '\n')
      .replace(/\n/g, '  \n') // Markdown line breaks
      .replace(/\\\[/g, '$$$').replace(/\\\]/g, '$$$')
      .replace(/\\\(/g, '$').replace(/\\\)/g, '$')
      .replace(/\\ /g, ' ');
  };

  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
  const currentItems = items.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleProcess = async () => {
    if (!file) return;
    setIsProcessing(true);
    setItems([]);
    setCurrentPage(1);
    setEditingIndex(null);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `ocr-temp/${uuidv4()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('submissions')
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      const { data: urlData } = supabase.storage.from('submissions').getPublicUrl(fileName);

      const result = await SubmissionService.processSmartOCR(urlData.publicUrl);
      
      if (result && result.items.length > 0) {
        const cleanItems = result.items.map(item => ({
          ...item,
          question: formatText(item.question),
          solution: formatText(item.solution)
        }));
        setItems(cleanItems);
        toast({ title: "Scan Complete", description: `Extracted ${result.items.length} questions.` });
      } else {
        throw new Error("No questions detected.");
      }

    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const updateItem = (pageIndex: number, field: keyof OCRItem, value: string) => {
    const globalIndex = (currentPage - 1) * ITEMS_PER_PAGE + pageIndex;
    const newItems = [...items];
    newItems[globalIndex] = { ...newItems[globalIndex], [field]: value };
    setItems(newItems);
  };

  const deleteItem = (pageIndex: number) => {
    const globalIndex = (currentPage - 1) * ITEMS_PER_PAGE + pageIndex;
    const newItems = items.filter((_, i) => i !== globalIndex);
    setItems(newItems);
    if (currentItems.length === 1 && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const addItem = () => {
    const newItem = { q_number: `${items.length + 1}`, question: "New Question", solution: "Solution" };
    setItems([...items, newItem]);
    const newTotalPages = Math.ceil((items.length + 1) / ITEMS_PER_PAGE);
    setCurrentPage(newTotalPages);
    setEditingIndex((newTotalPages - 1) * ITEMS_PER_PAGE + (items.length % ITEMS_PER_PAGE));
  };

  const toggleEdit = (pageIndex: number) => {
    setEditingIndex(editingIndex === pageIndex ? null : pageIndex);
  };

  // === WORKFLOW: GENERATE QUIZ ===
  const generateQuizFromScan = () => {
    if (items.length === 0) return;

    const contextText = items.map(i => `Q: ${i.question}\nA: ${i.solution}`).join('\n\n');

    navigate('/ai-tutor', { // Navigate to AI Tutor Page
      state: { 
        initialPrompt: "Create a practice quiz based on these scanned questions. Focus on concepts I might find difficult.",
        contextData: contextText,
        mode: 'socratic' 
      } 
    });
  };

  const exportPDF = async () => {
    if (!reportRef.current || items.length === 0) return;
    setIsExporting(true);
    toast({ title: "Generating PDF...", description: "Rendering layout..." });

    try {
      const element = reportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        windowWidth: 1000 
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Solution-Key-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast({ title: "Success", description: "PDF downloaded." });

    } catch (error) {
      console.error("PDF Error:", error);
      toast({ title: "Export Failed", description: "Could not generate PDF.", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <MainLayout>
      <div className="container px-4 py-8 max-w-6xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
              <ScanText className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Smart Digitizer</h1>
              <p className="text-gray-600">Convert exams into editable text & LaTeX solutions.</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            {items.length > 0 && (
              <>
                <Button 
                  onClick={generateQuizFromScan} 
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <BrainCircuit className="mr-2 h-4 w-4" /> 
                  Generate Quiz
                </Button>

                <Button onClick={exportPDF} disabled={isExporting} className="bg-red-600 hover:bg-red-700">
                  {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <FileDown className="mr-2 h-4 w-4" />}
                  Export PDF
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* LEFT: INPUT */}
          <div className="lg:col-span-4 space-y-6">
            <div className="sticky top-24">
              <Card>
                <CardHeader>
                  <CardTitle>Source File</CardTitle>
                  <CardDescription>Upload PDF or Images</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <AnswerSheetUploader 
                    title="Upload Document"
                    description="PDFs up to 20MB supported"
                    onFileSelected={setFile}
                    isProcessing={isProcessing}
                  />
                  <Button 
                    size="lg" 
                    className="w-full" 
                    onClick={handleProcess} 
                    disabled={!file || isProcessing}
                  >
                    {isProcessing ? <><Loader2 className="mr-2 animate-spin"/> Digitizing...</> : <><Wand2 className="mr-2"/> Scan & Solve</>}
                  </Button>
                </CardContent>
              </Card>
              {items.length > 0 && (
                <div className="bg-white p-4 rounded-lg border shadow-sm text-center space-y-2">
                  <p className="text-sm text-gray-500">Questions Extracted</p>
                  <p className="text-3xl font-bold text-blue-600">{items.length}</p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: OUTPUT LIST */}
          <div className="lg:col-span-8 space-y-6">
            {items.length === 0 && !isProcessing && (
              <div className="text-center py-20 border-2 border-dashed rounded-xl bg-gray-50 text-gray-400">
                <ScanText className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg">Upload a file to extract questions.</p>
              </div>
            )}

            {isProcessing && (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader className="h-16 bg-gray-100" />
                    <CardContent className="h-32 bg-gray-50" />
                  </Card>
                ))}
              </div>
            )}

            {currentItems.map((item, index) => (
              <Card key={index} className="overflow-hidden border-l-4 border-l-edu-primary shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="bg-gray-50/50 pb-3 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="bg-edu-primary text-white text-xs font-bold px-2 py-1 rounded">Q{item.q_number}</span>
                    {editingIndex === index && <span className="text-xs text-orange-500 font-bold uppercase tracking-wider animate-pulse">Editing...</span>}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant={editingIndex === index ? "default" : "outline"} 
                      size="sm" 
                      onClick={() => toggleEdit(index)}
                      className={editingIndex === index ? "bg-green-600 hover:bg-green-700" : ""}
                    >
                      {editingIndex === index ? <Check className="h-4 w-4 mr-1" /> : <Edit2 className="h-4 w-4 mr-1" />}
                      {editingIndex === index ? "Done" : "Edit"}
                    </Button>
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-red-500" onClick={() => deleteItem(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-4 space-y-6">
                  <div>
                    <div className="text-xs font-bold text-gray-400 uppercase mb-2">Question</div>
                    {editingIndex === index ? (
                      <Textarea 
                        className="min-h-[80px] font-medium text-base"
                        value={item.question}
                        onChange={(e) => updateItem(index, 'question', e.target.value)}
                      />
                    ) : (
                      <div className="prose prose-sm max-w-none text-gray-800 font-medium">
                        <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
                          {item.question}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>

                  <div className="bg-green-50/30 -mx-6 px-6 py-4 border-t border-green-100">
                    <div className="flex items-center gap-2 mb-2 text-green-700">
                      <Sparkles className="h-3 w-3" />
                      <span className="text-xs font-bold uppercase tracking-wider">Solution</span>
                    </div>
                    {editingIndex === index ? (
                      <Textarea 
                        className="min-h-[120px] font-mono text-sm bg-white"
                        value={item.solution}
                        onChange={(e) => updateItem(index, 'solution', e.target.value)}
                      />
                    ) : (
                      <div className="prose prose-sm max-w-none text-gray-700">
                        <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
                          {item.solution}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Pagination */}
            {items.length > 0 && (
              <div className="flex items-center justify-between pt-4 sticky bottom-0 bg-white/90 backdrop-blur p-4 border-t border-gray-100 z-10">
                <Button 
                  variant="outline" 
                  onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); setEditingIndex(null); }}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" /> Previous
                </Button>
                
                <span className="text-sm font-medium text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                
                <Button 
                  variant="outline" 
                  onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); setEditingIndex(null); }}
                  disabled={currentPage === totalPages}
                >
                  Next <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}

            {items.length > 0 && (
              <Button variant="outline" className="w-full border-dashed" onClick={addItem}>
                <Plus className="mr-2 h-4 w-4" /> Add Question Manually
              </Button>
            )}
          </div>
        </div>

        {/* === HIDDEN PDF RENDERER === */}
        <div className="absolute left-[-9999px] top-0">
          <div ref={reportRef} className="p-16 bg-white text-black" style={{ width: '850px', minHeight: '1100px' }}>
            <div className="border-b-4 border-blue-600 pb-8 mb-10">
              <h1 className="text-5xl font-bold text-blue-900 mb-4">Solution Key</h1>
              <div className="flex justify-between text-gray-500 text-lg">
                <p>Generated by RetainLearn</p>
                <p>{new Date().toLocaleDateString()}</p>
              </div>
            </div>
            <div className="space-y-12">
              {items.map((item, i) => (
                <div key={i} className="break-inside-avoid pb-8 border-b border-gray-200 last:border-0">
                  <div className="flex items-baseline gap-4 mb-6">
                    <span className="text-2xl font-bold text-blue-600 min-w-[4rem]">Q{item.q_number}</span>
                    <div className="prose prose-xl max-w-none text-gray-900 font-medium">
                      <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
                        {item.question}
                      </ReactMarkdown>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-8 rounded-2xl border border-gray-200 ml-20 relative">
                    <div className="text-sm font-bold text-green-700 uppercase mb-3 tracking-widest">Solution</div>
                    <div className="prose prose-lg max-w-none text-gray-800">
                      <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
                        {item.solution}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default OCRPage;