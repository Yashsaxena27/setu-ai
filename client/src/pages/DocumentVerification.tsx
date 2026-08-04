import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import {
  FaArrowLeft,
  FaCloudUploadAlt,
  FaFileAlt,
  FaTrashAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaDownload,
  FaShareAlt,
  FaCopy,
  FaHistory,
} from "react-icons/fa";

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import BottomBar from "../components/layout/BottomBar";
import PageContainer from "../components/layout/PageContainer";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import SectionHeader from "../components/ui/SectionHeader";
import Select from "../components/ui/Select";
import EmptyState from "../components/ui/EmptyState";
import {
  uploadDocument,
  analyzeDocument,
  getDocumentsHistory,
  getDocumentsReadiness,
  deleteDocument,
  type DocumentVerificationRecord,
  type ReadinessResponse,
} from "../services/documentsApi";
import { getApplicationScore } from "../services/applicationScoreApi";
import SuccessScoreCard from "../components/ui/SuccessScoreCard";

const DOCUMENT_TYPES = [
  "Aadhaar Card",
  "PAN Card",
  "Income Certificate",
  "Caste Certificate",
  "Domicile Certificate",
  "Birth Certificate",
  "Disability Certificate",
  "Farmer Certificate",
  "Education Certificate",
  "Marksheet",
  "Bank Passbook",
  "Driving License",
  "Passport",
  "Any Government Certificate",
];

export default function DocumentVerification() {
  const { schemeId: urlSchemeId } = useParams<{ schemeId: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States
  const [matchedSchemes, setMatchedSchemes] = useState<any[]>([]);
  const [selectedSchemeId, setSelectedSchemeId] = useState<string>("");
  const [selectedUploadType, setSelectedUploadType] = useState<string>("Aadhaar Card");
  
  // History & Readiness score states
  const [history, setHistory] = useState<DocumentVerificationRecord[]>([]);
  const [readiness, setReadiness] = useState<ReadinessResponse | null>(null);
  const [loadingReadiness, setLoadingReadiness] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Tracks active upload progress/loading states for uploads list
  const [uploadingFiles, setUploadingFiles] = useState<
    Array<{
      id: string;
      name: string;
      progress: number;
      status: string;
      error?: string;
    }>
  >([]);

  // Load matched schemes from localStorage for dropdown fallback
  useEffect(() => {
    const cached = localStorage.getItem("latestMatches");
    if (cached) {
      const schemes = JSON.parse(cached);
      setMatchedSchemes(schemes);
      if (urlSchemeId) {
        setSelectedSchemeId(urlSchemeId);
      } else if (schemes.length > 0) {
        setSelectedSchemeId(schemes[0]._id);
      }
    }
  }, [urlSchemeId]);

  // Success score states
  const [successScoreData, setSuccessScoreData] = useState<any>(null);
  const [loadingScore, setLoadingScore] = useState(false);

  const fetchSuccessScore = async () => {
    if (!selectedSchemeId) return;
    setLoadingScore(true);
    try {
      const res = await getApplicationScore(selectedSchemeId);
      setSuccessScoreData(res.score);
    } catch (e) {
      console.error("Failed to load success score", e);
    } finally {
      setLoadingScore(false);
    }
  };

  // Load History and Readiness whenever selectedSchemeId changes
  useEffect(() => {
    if (!selectedSchemeId) return;
    loadReadinessAndHistory();
  }, [selectedSchemeId]);

  const loadReadinessAndHistory = async () => {
    setLoadingReadiness(true);
    try {
      const [histData, readyData] = await Promise.all([
        getDocumentsHistory(selectedSchemeId),
        getDocumentsReadiness(selectedSchemeId),
      ]);
      setHistory(histData.history || []);
      setReadiness(readyData);
      await fetchSuccessScore();
    } catch (e) {
      console.error(e);
      toast.error("Failed to load verification logs for this scheme.");
    } finally {
      setLoadingReadiness(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Verified":
        return <Badge variant="success">Verified</Badge>;
      case "Pending":
        return <Badge variant="warning">Analyzing...</Badge>;
      case "Needs Better Scan":
        return <Badge variant="info">Low Quality</Badge>;
      case "Expired":
        return <Badge variant="error">Expired</Badge>;
      case "Wrong Document":
        return <Badge variant="error">Wrong Type</Badge>;
      case "Name Mismatch":
        return <Badge variant="error">Name Mismatch</Badge>;
      case "OCR Confidence Low":
        return <Badge variant="warning">OCR Warning</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Verified":
        return <FaCheckCircle className="text-[#22C55E] h-5 w-5 shrink-0" />;
      case "Needs Better Scan":
      case "OCR Confidence Low":
        return <FaExclamationTriangle className="text-[#F59E0B] h-5 w-5 shrink-0" />;
      case "Expired":
      case "Wrong Document":
      case "Name Mismatch":
        return <FaTimesCircle className="text-[#EF4444] h-5 w-5 shrink-0" />;
      default:
        return <FaFileAlt className="text-slate-400 h-5 w-5 shrink-0" />;
    }
  };

  // Convert File object to Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  // Handle document file insertion and pipeline run
  const handleFiles = async (files: FileList) => {
    if (!selectedSchemeId) {
      toast.error("Please select a scheme first before uploading.");
      return;
    }

    const fileList = Array.from(files);
    for (const file of fileList) {
      // Validate file size (max 8MB)
      if (file.size > 8 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 8MB file size limit.`);
        continue;
      }

      const tempId = Math.random().toString(36).substring(2, 9);
      // Add to uploading list
      setUploadingFiles((prev) => [
        ...prev,
        { id: tempId, name: file.name, progress: 10, status: "Converting file..." },
      ]);

      try {
        const base64 = await fileToBase64(file);
        
        // 1. Upload stub to database
        setUploadingFiles((prev) =>
          prev.map((f) => (f.id === tempId ? { ...f, progress: 40, status: "Saving to database..." } : f))
        );
        const uploadRes = await uploadDocument(
          selectedSchemeId,
          selectedUploadType,
          file.name,
          base64,
          file.type
        );

        const docId = uploadRes.document._id;

        // 2. Trigger AI verification pipeline
        setUploadingFiles((prev) =>
          prev.map((f) => (f.id === tempId ? { ...f, progress: 70, status: "Analyzing with AI OCR..." } : f))
        );
        await analyzeDocument(docId);

        // Success: Remove from uploading list and reload scores
        setUploadingFiles((prev) => prev.filter((f) => f.id !== tempId));
        toast.success(`Verified: ${file.name}`);
        loadReadinessAndHistory();
      } catch (err: any) {
        console.error(err);
        setUploadingFiles((prev) =>
          prev.map((f) => (f.id === tempId ? { ...f, status: "Verification Failed", error: err.message } : f))
        );
      }
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleRemoveDocument = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete verification logs for ${name}?`)) return;
    try {
      await deleteDocument(id);
      toast.success("Document removed successfully.");
      loadReadinessAndHistory();
    } catch (e) {
      toast.error("Failed to delete document.");
    }
  };

  const handleMissingUploadTrigger = (docTypeName: string) => {
    // Select the document type in dropdown and open the file dialog
    setSelectedUploadType(docTypeName);
    fileInputRef.current?.click();
  };

  // Export handlers
  const exportPDF = async () => {
    const reportEl = document.getElementById("readiness-report");
    if (!reportEl) return;

    try {
      toast.loading("Generating Verification Report PDF...", { id: "pdf-doc" });
      const canvas = await html2canvas(reportEl, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#FAF8F3",
      });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Setu_AI_Readiness_Report_${readiness?.schemeName.replace(/\s+/g, "_")}.pdf`);
      toast.success("PDF Downloaded!", { id: "pdf-doc" });
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate PDF.", { id: "pdf-doc" });
    }
  };

  const copySummaryText = () => {
    if (!readiness) return;
    let txt = `Setu AI - Document Verification Report\n`;
    txt += `Scheme: ${readiness.schemeName}\n`;
    txt += `Readiness Score: ${readiness.readiness_score}%\n`;
    txt += `Success Probability: ${readiness.probability}\n`;
    txt += `AI Verdict: ${readiness.explanation}\n\n`;
    txt += `Recommendations:\n`;
    readiness.recommendations.forEach((r) => {
      txt += `- ${r}\n`;
    });
    navigator.clipboard.writeText(txt);
    toast.success("Summary copied to clipboard!");
  };

  const shareSimulation = () => {
    if (!readiness) return;
    if (navigator.share) {
      navigator.share({
        title: `Setu AI Readiness Report - ${readiness.schemeName}`,
        text: `My Setu AI Application Success Score is ${readiness.readiness_score}%. Check yours!`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      copySummaryText();
    }
  };

  return (
    <main className="min-h-screen bg-[#FAF8F3] font-sans pb-16 md:pb-0">
      <Header />

      <PageContainer>
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Header Action */}
          <div className="flex justify-between items-center">
            <Button variant="secondary" size="sm" onClick={() => navigate(-1)}>
              <FaArrowLeft className="mr-2 h-3.5 w-3.5" /> Back
            </Button>
            <Badge variant="accent">AI Document Officer Active</Badge>
          </div>

          <div className="space-y-2">
            <h1 className="font-serif text-4xl font-extrabold text-[#0F172A] tracking-tight">
              Document Verification & Readiness
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              Verify your documents with our AI checklist checker to evaluate compliance and validity.
            </p>
          </div>

          {/* Scheme Selector */}
          <div className="max-w-md">
            <Select
              label="Verify against Scheme requirements"
              value={selectedSchemeId}
              onChange={(e) => setSelectedSchemeId(e.target.value)}
            >
              {matchedSchemes.length === 0 ? (
                <option value="">No matched schemes available</option>
              ) : (
                matchedSchemes.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.scheme_name}
                  </option>
                ))
              )}
            </Select>
          </div>

          {!selectedSchemeId ? (
            <EmptyState
              title="No Scheme Selected"
              description="Please complete your profile matching wizard first to select matched welfare options."
              action={<Button onClick={() => navigate("/profile")}>Go to Profile Wizard</Button>}
            />
          ) : (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
              
              {/* LEFT SIDE: UPLOAD & LOGS */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Drag & Drop Upload card */}
                <Card className="border border-[#0F172A]/5 p-6 bg-white shadow-premium space-y-5">
                  <SectionHeader title="Upload Document" />
                  
                  {/* Select upload type */}
                  <Select
                    label="Choose Document Type to Upload"
                    value={selectedUploadType}
                    onChange={(e) => setSelectedUploadType(e.target.value)}
                  >
                    {DOCUMENT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </Select>

                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-3 cursor-pointer transition duration-150 ${
                      dragActive
                        ? "border-[#14B8A6] bg-[#14B8A6]/5"
                        : "border-slate-200 hover:border-[#14B8A6] hover:bg-slate-50/50"
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileInput}
                      multiple
                      className="hidden"
                      accept=".pdf,image/png,image/jpeg,image/jpg"
                    />
                    <FaCloudUploadAlt className="h-10 w-10 text-slate-400" />
                    <div>
                      <p className="text-xs font-extrabold text-[#0F172A]">
                        Drag & drop files here, or click to browse
                      </p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-1">
                        Supports PDF, PNG, JPG, JPEG (Max 8MB)
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Upload Status Card Lists */}
                {(uploadingFiles.length > 0 || history.length > 0) && (
                  <Card className="border border-[#0F172A]/5 p-6 bg-white shadow-premium space-y-4">
                    <SectionHeader title="Uploaded Documents Logs" />
                    
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                      
                      {/* Active Uploading Skeletons */}
                      {uploadingFiles.map((file) => (
                        <div
                          key={file.id}
                          className="border border-slate-100 p-3.5 rounded-xl flex items-center justify-between gap-4 bg-slate-50/50"
                        >
                          <div className="flex-1 space-y-1">
                            <p className="text-xs font-bold text-slate-700 truncate w-48">{file.name}</p>
                            <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase">
                              <span>{file.status}</span>
                              {file.progress > 0 && <span>{file.progress}%</span>}
                            </div>
                            {file.progress > 0 && (
                              <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                                <div
                                  className="bg-[#14B8A6] h-full transition-all duration-300"
                                  style={{ width: `${file.progress}%` }}
                                />
                              </div>
                            )}
                            {file.error && <p className="text-[10px] text-[#EF4444] font-bold">{file.error}</p>}
                          </div>
                          {file.error && (
                            <button
                              onClick={() => setUploadingFiles((prev) => prev.filter((f) => f.id !== file.id))}
                              className="text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                              <FaTrashAlt size={12} />
                            </button>
                          )}
                        </div>
                      ))}

                      {/* Completed/History Uploads */}
                      {history.map((doc) => (
                        <div
                          key={doc._id}
                          className="border border-slate-100 p-3.5 rounded-xl flex items-center justify-between gap-4 bg-white shadow-soft hover:shadow-premium transition duration-150"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {getStatusIcon(doc.validation_status)}
                            <div className="min-w-0">
                              <p className="text-xs font-extrabold text-[#0F172A] truncate">
                                {doc.fileName}
                              </p>
                              <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                                {doc.document_type}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {getStatusBadge(doc.validation_status)}
                            <button
                              onClick={() => handleRemoveDocument(doc._id, doc.fileName)}
                              className="text-slate-400 hover:text-[#EF4444] transition cursor-pointer"
                            >
                              <FaTrashAlt size={12} />
                            </button>
                          </div>
                        </div>
                      ))}

                    </div>
                  </Card>
                )}

              </div>

              {/* RIGHT SIDE: READINESS ANALYSIS REPORT */}
              <div className="lg:col-span-7 space-y-6">
                
                {loadingReadiness ? (
                  <div className="space-y-6 animate-pulse">
                    <Card className="p-6 bg-white border border-slate-100 h-44"><div className="h-full bg-slate-100 rounded-xl" /></Card>
                    <Card className="p-6 bg-white border border-slate-100 h-56"><div className="h-full bg-slate-100 rounded-xl" /></Card>
                  </div>
                ) : !readiness ? (
                  <EmptyState
                    title="Awaiting Verification Logs"
                    description="Upload your files in the sandbox left panel to trigger the AI analysis report."
                    icon={<FaFileAlt className="h-8 w-8 text-slate-400" />}
                  />
                ) : (
                  <div id="readiness-report" className="space-y-6">
                    
                    {/* EXPORT Sticky Control Bar */}
                    <Card className="border border-[#0F172A]/5 p-4 bg-white shadow-soft flex items-center justify-between gap-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-[#14B8A6] animate-ping" />
                        Analysis Ready
                      </span>
                      <div className="flex gap-2">
                        <Button size="sm" variant="secondary" onClick={copySummaryText}>
                          <FaCopy className="mr-1.5" /> Copy Summary
                        </Button>
                        <Button size="sm" variant="secondary" onClick={shareSimulation}>
                          <FaShareAlt className="mr-1.5" /> Share
                        </Button>
                        <Button size="sm" onClick={exportPDF}>
                          <FaDownload className="mr-1.5" /> Export PDF
                        </Button>
                      </div>
                    </Card>

                    {loadingScore ? (
                      <Card className="p-6 bg-white border border-slate-100 animate-pulse h-48"><div className="h-full bg-slate-100 rounded-xl" /></Card>
                    ) : successScoreData ? (
                      <SuccessScoreCard scoreData={successScoreData} onRefresh={fetchSuccessScore} />
                    ) : null}

                    {/* Missing Document Panel */}
                    {readiness.missingDocs?.length > 0 && (
                      <Card className="border border-red-100 bg-red-50/10 p-6 rounded-2xl shadow-soft space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="font-serif text-sm font-extrabold text-red-700 flex items-center gap-2">
                            <FaExclamationTriangle /> Missing Documents checklist
                          </h4>
                          <Badge variant="error">{readiness.missingDocs.length} Missing</Badge>
                        </div>

                        <div className="space-y-3">
                          {readiness.missingDocs.map((doc) => (
                            <div
                              key={doc.name}
                              className="border border-red-100 bg-white p-4 rounded-xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-soft"
                            >
                              <div className="space-y-0.5">
                                <p className="text-xs font-extrabold text-[#0F172A]">
                                  {doc.name}
                                </p>
                                <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                                  {doc.whyRequired}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleMissingUploadTrigger(doc.name)}
                                className="shrink-0"
                              >
                                Upload {doc.name}
                              </Button>
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}

                    {/* History Timelines / Details Panel */}
                    {history.length > 0 && (
                      <Card className="border border-slate-100 bg-white p-6 rounded-2xl shadow-soft space-y-4">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                          <FaHistory /> Document History Audit logs
                        </div>
                        
                        <div className="divide-y divide-slate-100">
                          {history.map((doc) => (
                            <div key={doc._id} className="py-3 first:pt-0 last:pb-0 space-y-2">
                              <div className="flex justify-between items-center text-xs font-semibold">
                                <span className="text-[#0F172A] font-extrabold">{doc.fileName}</span>
                                <span className="text-slate-400 text-[10px]">
                                  {new Date(doc.createdAt).toLocaleDateString(undefined, {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 font-medium">
                                <p>Type: <span className="font-bold text-slate-700">{doc.document_type}</span></p>
                                <p>Status: <span className="font-bold text-slate-700">{doc.validation_status}</span></p>
                                {doc.ocr_data?.name && (
                                  <p className="col-span-2">OCR Name: <span className="font-bold text-slate-700">{doc.ocr_data.name}</span></p>
                                )}
                                {doc.ocr_data?.document_number && (
                                  <p>Doc #: <span className="font-bold text-slate-700">{doc.ocr_data.document_number}</span></p>
                                )}
                                {doc.ocr_data?.expiry_date && (
                                  <p>Expires: <span className="font-bold text-slate-700">{doc.ocr_data.expiry_date}</span></p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}

                  </div>
                )}

              </div>

            </div>
          )}

        </div>
      </PageContainer>

      <Footer />
      <BottomBar />
    </main>
  );
}
