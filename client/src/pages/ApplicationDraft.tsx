import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { generateDraft } from "../services/draft";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import Header from "../components/layout/Header";
import BottomBar from "../components/layout/BottomBar";
import PageContainer from "../components/layout/PageContainer";
import Button from "../components/ui/Button";
import { BridgeIcon } from "../components/ui/BridgeLogo";
import Badge from "../components/ui/Badge";
import Skeleton from "../components/ui/Skeleton";
import Reveal from "../components/effects/Reveal";
import { getApplicationScore } from "../services/applicationScoreApi";
import SuccessScoreCard from "../components/ui/SuccessScoreCard";

import {
  FaFileAlt,
  FaCheckCircle,
  FaCopy,
  FaShareAlt,
  FaExternalLinkAlt,
  FaDownload,
  FaArrowLeft,
} from "react-icons/fa";

import toast from "react-hot-toast";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const GENERATING_TEXT = "Analyzing parameters & compiling official draft welfare letter...";

export default function ApplicationDraft() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const pdfRef = useRef<HTMLDivElement>(null);

  const [scheme] = useState<any>(() => {
    if (location.state) return location.state;
    const latest = JSON.parse(localStorage.getItem("latestMatches") || "[]");
    return latest.find((m: any) => m._id === id) || null;
  });

  useEffect(() => {
    if (!scheme) {
      toast.error("Scheme details not found. Returning to matches.");
      navigate("/results", { replace: true });
    }
  }, [scheme, navigate]);

  const [draft, setDraft] = useState(GENERATING_TEXT);
  const [isGenerating, setIsGenerating] = useState(true);
  const [requiredDocuments, setRequiredDocuments] = useState<string[]>([]);

  // Success score states
  const [successScoreData, setSuccessScoreData] = useState<any>(null);
  const [loadingScore, setLoadingScore] = useState(false);

  const fetchSuccessScore = async () => {
    if (!scheme?._id) return;
    setLoadingScore(true);
    try {
      const res = await getApplicationScore(scheme._id);
      setSuccessScoreData(res.score);
    } catch (e) {
      console.error("Failed to load success score", e);
    } finally {
      setLoadingScore(false);
    }
  };

  useEffect(() => {
    fetchSuccessScore();
  }, [scheme?._id]);

  useEffect(() => {
    if (!scheme) return;

    const profile = JSON.parse(
      localStorage.getItem("profile") || "{}"
    );

    async function loadDraft() {
      try {
        setIsGenerating(true);

        const result = await generateDraft(profile, scheme);

        setDraft(result.draft);
        setRequiredDocuments(scheme.required_documents || []);

        const drafts = JSON.parse(
          localStorage.getItem("generatedDrafts") || "[]"
        );

        drafts.push({
          id: scheme._id,
          name: scheme.scheme_name,
          generatedAt: new Date().toISOString(),
        });

        localStorage.setItem(
          "generatedDrafts",
          JSON.stringify(drafts)
        );
      } catch (err) {
        console.error(err);
        setDraft(
          "We couldn't generate your application draft right now. Please try again."
        );
      } finally {
        setIsGenerating(false);
      }
    }

    loadDraft();
  }, [scheme]);

  if (!scheme) {
    return (
      <PageContainer>
        <div className="max-w-2xl mx-auto py-12 text-center">
          <FaFileAlt className="mx-auto text-slate-400 h-10 w-10 mb-4" />
          <h2 className="font-serif text-2xl font-bold text-[#0F172A]">Draft Not Found</h2>
          <Button className="mt-6" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </PageContainer>
    );
  }

  const buildFullText = () => `
Scheme: ${scheme?.scheme_name ?? "N/A"}

${draft}

Official Website:
${scheme?.official_link || "Not available"}
`.trim();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(buildFullText());
    toast.success("Draft copied successfully!");
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: scheme?.scheme_name || "Government Application Draft",
          text: draft,
          ...(scheme?.official_link ? { url: scheme.official_link } : {}),
        });
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          console.error(err);
        }
      }
    } else {
      toast("Sharing isn't supported on this device.");
    }
  };

  const handleDownloadPDF = async () => {
    if (!pdfRef.current) return;

    try {
      const canvas = await html2canvas(pdfRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        foreignObjectRendering: true,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 10;

      pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - 20;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight - 20;
      }

      const fileName = (scheme?.scheme_name || "Application_Draft")
        .replace(/[<>:"/\\|?*]+/g, "_")
        .replace(/\s+/g, "_");

      pdf.save(`${fileName}.pdf`);
      toast.success("PDF downloaded successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Unable to generate PDF.");
    }
  };

  const officialLinkEnabled = Boolean(scheme?.official_link);

  return (
    <main className="min-h-screen bg-[#FAF8F3] font-sans pb-32">
      <Header />

      <PageContainer>
        <div className="max-w-3xl mx-auto space-y-8">
          
          {/* Back Button */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(-1)}
          >
            <FaArrowLeft className="mr-2 h-3.5 w-3.5" /> Back
          </Button>

          {/* Heading Info */}
          <Reveal direction="down">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 items-center">
                <Badge variant="accent">AI Application Editor</Badge>
                <Badge variant="info">{scheme.category}</Badge>
              </div>
              <h1 className="font-serif text-3xl font-extrabold tracking-tight text-[#0F172A]">
                Application Draft
              </h1>
              <p className="text-slate-500 text-sm font-medium">
                Review your customized draft letter. Export to PDF to attach to your official portal submission.
              </p>
            </div>
          </Reveal>

          {loadingScore ? (
            <Skeleton className="h-48 w-full rounded-3xl" />
          ) : successScoreData ? (
            <SuccessScoreCard scoreData={successScoreData} onRefresh={fetchSuccessScore} />
          ) : null}

          {/* Docs style Sheet */}
          <div
            ref={pdfRef}
            className="bg-white border border-[#0F172A]/10 p-8 sm:p-12 shadow-premium rounded-xl min-h-[600px] flex flex-col justify-between"
          >
            <div>
              {/* Fake Official seal look */}
              <div className="text-center pb-6 border-b border-slate-100 mb-8 space-y-2">
                <div className="flex justify-center mb-4">
                  <BridgeIcon className="h-8 w-8" />
                </div>
                <h2 className="font-serif text-lg font-bold tracking-tight text-[#0F172A]">
                  CITIZEN APPLICATION SUPPORT LOG
                </h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Setu AI • Automated Welfare Scheme Verification Portal
                </p>
              </div>

              {/* Markdown Content */}
              {!isGenerating ? (
                <div className="prose prose-slate max-w-none font-serif text-sm leading-relaxed text-[#0F172A]">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {draft}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="space-y-4">
                  <Skeleton variant="text" className="w-2/3" />
                  <Skeleton variant="text" className="w-full" />
                  <Skeleton variant="text" className="w-5/6" />
                  <Skeleton variant="text" className="w-4/5" />
                  <Skeleton variant="text" className="w-full" />
                  <p className="text-xs text-slate-400 font-semibold italic animate-pulse">
                    {GENERATING_TEXT}
                  </p>
                </div>
              )}
            </div>

            {!isGenerating && (
              <div className="border-t border-slate-100 pt-8 mt-12 text-center text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                Document Generated Securely via Setu AI • Verified Criteria Checked
              </div>
            )}
          </div>

          {/* Required Documents List */}
          <Reveal direction="up">
            <div className="space-y-4">
              <h3 className="font-serif text-xl font-bold text-[#0F172A]">
                Documents checklist
              </h3>
              {isGenerating ? (
                <Skeleton className="h-16 w-full" />
              ) : requiredDocuments.length === 0 ? (
                <p className="text-sm text-slate-400 font-semibold">No mandatory documents listed for this draft.</p>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {requiredDocuments.map((doc, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 bg-[#FAF8F3] px-5 py-4 border border-[#0F172A]/5 rounded-xl shadow-soft"
                      >
                        <FaCheckCircle className="text-[#22C55E] shrink-0" />
                        <span className="text-xs font-semibold text-[#0F172A]">{doc}</span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-2 flex justify-center">
                    <Button
                      variant="accent"
                      onClick={() => navigate(`/document-verification/${scheme._id}`, { state: scheme })}
                      className="w-full"
                    >
                      Analyze Document Readiness with AI
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Reveal>

        </div>
      </PageContainer>

      {/* Floating Premium Action Toolbar (Apple / Vercel style) */}
      <div className="fixed bottom-20 md:bottom-6 inset-x-4 z-40 flex justify-center">
        <div className="bg-[#0F172A] border border-white/10 text-white px-5 py-3 rounded-2xl flex items-center gap-2 sm:gap-4 shadow-premium backdrop-blur-md max-w-full overflow-x-auto no-scrollbar">
          
          <button
            onClick={handleCopy}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white hover:bg-white/10 transition duration-150 cursor-pointer disabled:opacity-50"
          >
            <FaCopy />
            <span className="hidden sm:inline">Copy</span>
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white hover:bg-white/10 transition duration-150 cursor-pointer disabled:opacity-50"
          >
            <FaDownload />
            <span className="hidden sm:inline">PDF</span>
          </button>

          <button
            onClick={handleShare}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white hover:bg-white/10 transition duration-150 cursor-pointer disabled:opacity-50"
          >
            <FaShareAlt />
            <span className="hidden sm:inline">Share</span>
          </button>

          <button
            onClick={() => navigate(`/application-roadmap/${scheme._id}`, { state: scheme })}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-[#14B8A6] hover:text-white hover:bg-white/10 transition duration-150 cursor-pointer disabled:opacity-50"
          >
            <FaExchangeAlt />
            <span className="hidden sm:inline">Roadmap</span>
          </button>

          {officialLinkEnabled && (
            <a
              href={scheme.official_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-[#14B8A6] hover:text-[#0D9488] hover:bg-white/10 transition duration-150"
            >
              <FaExternalLinkAlt />
              <span className="hidden sm:inline">Apply Official</span>
            </a>
          )}

        </div>
      </div>

      <BottomBar />
    </main>
  );
}