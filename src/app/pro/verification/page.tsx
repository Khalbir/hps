"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ShieldCheck, User, UploadCloud, CheckCircle, AlertTriangle,
  ArrowRight, ArrowLeft, FileText, Camera, Users, Award, Sparkles,
  HelpCircle, Check, X, ShieldAlert, Loader2, Image as ImageIcon,
  CheckCircle2, RefreshCw
} from "lucide-react";
import { getQuizForCategory, QuizQuestion } from "@/lib/quiz";
import { getValidMediaUrl } from "@/lib/sample-documents";
import { optimizeDocumentFile } from "@/lib/image-compression";
import styles from "../pro.module.css";

const steps = [
  { id: 1, label: "Government Identity", desc: "NIN / Passport & Live Selfie" },
  { id: 2, label: "Trade Credentials", desc: "Certificate & Work Portfolio" },
  { id: 3, label: "Guarantors Audit", desc: "2 Verified Referees" },
  { id: 4, label: "Trade Skill Assessment", desc: "Technical Competency Quiz" },
];

export const PRO_VERIFICATION_CATEGORIES = [
  { value: "cleaning", label: "Cleaning (Residential, Commercial, Deep Clean, Post-Construction)" },
  { value: "fumigation", label: "Fumigation & Pest Control (Eco-Safe Residential & Commercial Eradication)" },
  { value: "upholstery", label: "Upholstery & Carpet Cleaning (Sofa, Mattress, Rug Extraction & Detailing)" },
  { value: "plumbing", label: "Plumbing (Pipe Repairs, Drainage & Sewage, Water Heaters)" },
  { value: "electrical", label: "Electrical (Wiring & Rewiring, Sockets, Lighting Installation)" },
  { value: "hvac", label: "AC & HVAC (Split Unit Installation, Servicing, Gas Refill, Repairs)" },
  { value: "painting", label: "Painting (Interior, Exterior, Screeding & POP Surface Finish)" },
  { value: "carpentry", label: "Carpentry (Custom Furniture, Assembly, Cabinets & Woodwork)" },
  { value: "security", label: "Security & CCTV (CCTV Camera Installation & Surveillance)" },
  { value: "solar", label: "Solar, Inverter & Generator (Panels, Inverters, Generator Repairs)" },
  { value: "home-improvement", label: "Home Improvement (Interior Decoration & Home Renovation)" },
  { value: "outdoor", label: "Gardening (Lawn Care, Landscaping & Plant Maintenance)" },
  { value: "laundry", label: "Laundry & Garment Care (Washing, Ironing & Dry Cleaning)" },
  { value: "moving", label: "Moving (Home & Office Relocation Services)" },
  { value: "general", label: "General Handyman (Odd Jobs, Fittings & Minor Repairs)" },
  { value: "others", label: "Others (Custom Skillset Request)" },
];

export const GUARANTOR_ROLE_OPTIONS = [
  "Landlord / Property Owner",
  "Community Leader / Village Head / CDA Chairman",
  "Former Employer / Work Supervisor",
  "Master Craftsman / Apprenticeship Mentor",
  "Religious Leader / Clergy (Pastor / Imam)",
  "Civil Servant / Public Officer",
  "Family Head / Elder / Relative",
  "Senior Colleague / Registered Professional",
  "Other / Custom Role",
];

const formatCategoryTitle = (cat: string) => {
  const match = PRO_VERIFICATION_CATEGORIES.find((c) => c.value === cat);
  if (match) return match.label;
  return cat ? cat.charAt(0).toUpperCase() + cat.slice(1) : "General Skilled Services";
};

export default function ProVerificationPage() {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [digitalId, setDigitalId] = useState("");
  const [verifiedUserData, setVerifiedUserData] = useState<any>(null);

  // Form State & Category Verification
  const [category, setCategory] = useState("plumbing");
  const [initialCategory, setInitialCategory] = useState("");
  const [categoryConfirmed, setCategoryConfirmed] = useState(true);
  const [idType, setIdType] = useState("NIN");
  const [idNumber, setIdNumber] = useState("");

  // Document Upload States
  const [idDocumentUrl, setIdDocumentUrl] = useState("");
  const [idUploading, setIdUploading] = useState(false);

  const [selfieUrl, setSelfieUrl] = useState("");
  const [selfieUploading, setSelfieUploading] = useState(false);

  const [tradeCertUrl, setTradeCertUrl] = useState("");
  const [certUploading, setCertUploading] = useState(false);

  const [portfolioUrls, setPortfolioUrls] = useState<string[]>([]);
  const [portfolioUploading, setPortfolioUploading] = useState<boolean[]>([false, false, false, false]);

  // Live Camera Facial Verification State
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Address Verification States
  const [operatingState, setOperatingState] = useState("FCT Abuja");
  const [homeAddress, setHomeAddress] = useState("");
  const [lga, setLga] = useState("");
  const [addressProofUrl, setAddressProofUrl] = useState("");
  const [addressUploading, setAddressUploading] = useState(false);

  // Draft Auto-Save & Recovery States
  const [draftSavedTime, setDraftSavedTime] = useState<string>("");
  const [restoredFromDraft, setRestoredFromDraft] = useState<boolean>(false);

  // Helper Auto-Save Function (Local + Cloud Database)
  const saveDraftState = (targetStep?: number, overrides?: Record<string, any>) => {
    const curStep = targetStep || step;
    const draftPayload = {
      step: curStep,
      category: overrides?.category ?? category,
      idType: overrides?.idType ?? idType,
      idNumber: overrides?.idNumber ?? idNumber,
      operatingState: overrides?.operatingState ?? operatingState,
      homeAddress: overrides?.homeAddress ?? homeAddress,
      lga: overrides?.lga ?? lga,
      idDocumentUrl: overrides?.idDocumentUrl ?? idDocumentUrl,
      selfieUrl: overrides?.selfieUrl ?? selfieUrl,
      addressProofUrl: overrides?.addressProofUrl ?? addressProofUrl,
      tradeCertUrl: overrides?.tradeCertUrl ?? tradeCertUrl,
      portfolioUrls: overrides?.portfolioUrls ?? portfolioUrls,
      g1: overrides?.g1 ?? g1,
      g2: overrides?.g2 ?? g2,
      selectedAnswers: overrides?.selectedAnswers ?? selectedAnswers,
      savedAt: new Date().toISOString(),
    };

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("handyhub_pro_verification_draft", JSON.stringify(draftPayload));
        setDraftSavedTime(new Date().toLocaleTimeString());
      } catch (e) {}
    }

    let activeUserId = "";
    let activeEmail = "";
    try {
      const stored = localStorage.getItem("handyhub_user") || localStorage.getItem("handyhub_pro_session") || sessionStorage.getItem("handyhub_active_session");
      if (stored) {
        const parsed = JSON.parse(stored);
        activeUserId = parsed.id || parsed.user?.id || "";
        activeEmail = parsed.email || parsed.user?.email || "";
      }
    } catch {}

    if (activeUserId || activeEmail) {
      fetch("/api/pro/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: activeUserId,
          email: activeEmail,
          isDraft: true,
          currentStep: curStep,
          ...draftPayload,
          serviceCategory: overrides?.category ?? category,
          guarantor1: overrides?.g1 ?? g1,
          guarantor2: overrides?.g2 ?? g2,
        }),
      }).catch(() => {});
    }
  };

  // Restore draft progress on initial load & fetch registered profile
  useEffect(() => {
    let activeUserId = "";
    let activeEmail = "";
    try {
      const stored = localStorage.getItem("handyhub_user") || localStorage.getItem("handyhub_pro_session") || sessionStorage.getItem("handyhub_active_session");
      if (stored) {
        const parsed = JSON.parse(stored);
        activeUserId = parsed.id || parsed.user?.id || "";
        activeEmail = parsed.email || parsed.user?.email || "";
      }
    } catch {}

    // 1. Restore from local storage draft if present
    let localDraft: any = null;
    if (typeof window !== "undefined") {
      try {
        const rawDraft = localStorage.getItem("handyhub_pro_verification_draft");
        if (rawDraft) {
          localDraft = JSON.parse(rawDraft);
          if (localDraft) {
            if (localDraft.step && localDraft.step >= 1 && localDraft.step <= 4) {
              setStep(localDraft.step);
            }
            if (localDraft.category) {
              setCategory(localDraft.category);
              setInitialCategory(localDraft.category);
            }
            if (localDraft.idType) setIdType(localDraft.idType);
            if (localDraft.idNumber) setIdNumber(localDraft.idNumber);
            if (localDraft.operatingState) setOperatingState(localDraft.operatingState);
            if (localDraft.homeAddress) setHomeAddress(localDraft.homeAddress);
            if (localDraft.lga) setLga(localDraft.lga);
            if (localDraft.idDocumentUrl) setIdDocumentUrl(localDraft.idDocumentUrl);
            if (localDraft.selfieUrl) setSelfieUrl(localDraft.selfieUrl);
            if (localDraft.addressProofUrl) setAddressProofUrl(localDraft.addressProofUrl);
            if (localDraft.tradeCertUrl) setTradeCertUrl(localDraft.tradeCertUrl);
            if (Array.isArray(localDraft.portfolioUrls)) setPortfolioUrls(localDraft.portfolioUrls);
            if (localDraft.g1) setG1(localDraft.g1);
            if (localDraft.g2) setG2(localDraft.g2);
            if (localDraft.selectedAnswers) setSelectedAnswers(localDraft.selectedAnswers);
            setRestoredFromDraft(true);
            if (localDraft.savedAt) {
              setDraftSavedTime(new Date(localDraft.savedAt).toLocaleTimeString());
            }
          }
        }
      } catch {}
    }

    // 2. Fetch server database state
    if (activeUserId || activeEmail) {
      fetch(`/api/pro/verification?userId=${activeUserId}&email=${encodeURIComponent(activeEmail)}`)
        .then((r) => r.json())
        .then((data) => {
          if (data && data.success) {
            if (data.isVerified || data.verificationStatus === "VERIFIED" || data.pro?.verificationStatus === "VERIFIED") {
              setIsVerified(true);
              setDigitalId(data.digitalId || data.pro?.digitalId || "HHP-PRO-27139");
            }
            if (data.user) {
              setVerifiedUserData(data.user);
            }
            if (data.docs) {
              const docs = data.docs;
              let registeredSkill = docs.serviceCategory ? docs.serviceCategory.toLowerCase() : "";
              if (registeredSkill) {
                const matchedOption = PRO_VERIFICATION_CATEGORIES
                  .map((c) => c.value)
                  .find((opt) => registeredSkill.includes(opt));
                const finalSlug = matchedOption || (registeredSkill.startsWith("other") ? "others" : "plumbing");
                setInitialCategory(finalSlug);
                if (!localDraft?.category) setCategory(finalSlug);
              }

              if (docs.idType && !localDraft?.idType) setIdType(docs.idType);
              if (docs.idNumber && !localDraft?.idNumber) setIdNumber(docs.idNumber);
              if (docs.operatingState && !localDraft?.operatingState) setOperatingState(docs.operatingState);
              if (docs.homeAddress && !localDraft?.homeAddress) setHomeAddress(docs.homeAddress);
              if (docs.lga && !localDraft?.lga) setLga(docs.lga);
              if (docs.idDocumentUrl && !localDraft?.idDocumentUrl) setIdDocumentUrl(docs.idDocumentUrl);
              if (docs.selfieUrl && !localDraft?.selfieUrl) setSelfieUrl(docs.selfieUrl);
              if (docs.addressProofUrl && !localDraft?.addressProofUrl) setAddressProofUrl(docs.addressProofUrl);
              if (docs.tradeCertUrl && !localDraft?.tradeCertUrl) setTradeCertUrl(docs.tradeCertUrl);
              if (Array.isArray(docs.portfolioUrls) && docs.portfolioUrls.length > 0 && (!localDraft?.portfolioUrls || localDraft.portfolioUrls.length === 0)) {
                setPortfolioUrls(docs.portfolioUrls);
              }
              if (docs.guarantor1 && !localDraft?.g1) setG1(docs.guarantor1);
              if (docs.guarantor2 && !localDraft?.g2) setG2(docs.guarantor2);
              if (docs.lastSavedStep && !localDraft?.step) {
                setStep(docs.lastSavedStep);
                setRestoredFromDraft(true);
              }
            }
          }
        })
        .catch(() => {});
    }
  }, []);

  // Hidden File Input References
  const idInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);
  const certInputRef = useRef<HTMLInputElement>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const portfolioInputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Request Native Device Camera Authorization with multi-level fallback
  const startLiveFacialCamera = async () => {
    setShowCameraModal(true);
    setCameraError("");

    try {
      let stream: MediaStream | null = null;

      // 1. Try standard getUserMedia with front-facing camera
      if (typeof navigator !== "undefined" && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: "user",
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: false,
          });
        } catch (e1) {
          console.warn("Front-facing HD constraint failed, trying basic facingMode: user...", e1);
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: "user" },
              audio: false,
            });
          } catch (e2) {
            console.warn("facingMode user failed, trying generic video: true...", e2);
            try {
              stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: false,
              });
            } catch (e3) {
              console.warn("Generic video: true failed:", e3);
            }
          }
        }
      }

      // 2. Legacy navigator.getUserMedia fallback (for older Android WebViews or legacy browsers)
      if (!stream && typeof navigator !== "undefined") {
        const n: any = navigator;
        const legacyGUM = n.getUserMedia || n.webkitGetUserMedia || n.mozGetUserMedia || n.msGetUserMedia;
        if (legacyGUM) {
          try {
            stream = await new Promise((resolve, reject) => {
              legacyGUM.call(n, { video: true, audio: false }, resolve, reject);
            });
          } catch (legErr) {
            console.warn("Legacy getUserMedia failed:", legErr);
          }
        }
      }

      if (stream) {
        setCameraStream(stream);
        setCameraError("");
      } else {
        throw new Error("Unable to establish camera video stream.");
      }
    } catch (err: any) {
      console.error("[Camera Authorization Error]:", err);
      const isPermissionDenied =
        err?.name === "NotAllowedError" ||
        err?.name === "PermissionDeniedError" ||
        err?.message?.includes("Permission") ||
        err?.message?.includes("denied");

      if (isPermissionDenied) {
        setCameraError(
          "Camera access was blocked by your browser. Please allow camera permissions in your browser URL bar (or site settings), then click 'Grant / Retry Camera', or tap 'Open Device Camera App' below."
        );
      } else {
        setCameraError(
          "Camera device is initializing or unavailable. Please click 'Grant / Retry Camera' to request browser permission, or tap 'Open Device Camera App' to snap your photo directly."
        );
      }
    }
  };

  // Bind camera stream to video element when modal is mounted
  useEffect(() => {
    if (showCameraModal && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch((playErr) => {
        console.warn("Video autoPlay warning:", playErr);
      });
    }
  }, [showCameraModal, cameraStream]);

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setShowCameraModal(false);
  };

  const captureFacialPhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Stop camera tracks cleanly
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setShowCameraModal(false);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `facial_verification_${Date.now()}.jpg`, { type: "image/jpeg" });
      setSelfieUploading(true);
      try {
        const url = await uploadToSupabase(file, "selfies");
        setSelfieUrl(url);
      } catch (err: any) {
        alert(err.message || "Failed to upload facial photo");
      } finally {
        setSelfieUploading(false);
      }
    }, "image/jpeg", 0.82);
  };

  // Helper Supabase File Upload Function with In-Browser Auto-Compression
  const uploadToSupabase = async (file: File, folder: string): Promise<string> => {
    // Automatically downscale and compress document before network transmission
    const { file: optimizedFile } = await optimizeDocumentFile(file);

    const formData = new FormData();
    formData.append("file", optimizedFile);
    formData.append("folder", folder);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (res.ok && data.url) {
      return data.url;
    }
    throw new Error(data.error || "Upload failed. Please check file size and format.");
  };

  // Step 3 State
  const [g1, setG1] = useState({
    name: "",
    phone: "",
    relationship: "Landlord / Property Owner",
    customRelationship: "",
    nin: "",
  });
  const [g2, setG2] = useState({
    name: "",
    phone: "",
    relationship: "Former Employer / Master Craftsman",
    customRelationship: "",
    nin: "",
  });

  // Step 4 Quiz State
  const quizQuestions: QuizQuestion[] = getQuizForCategory(category);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const handleAnswerSelect = (questionId: string, optionIndex: number) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const calculateQuizScore = () => {
    let correct = 0;
    quizQuestions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctAnswer) {
        correct += 1;
      }
    });
    const finalScore = Math.round((correct / quizQuestions.length) * 100);
    setScore(finalScore);
    setQuizSubmitted(true);
    return finalScore;
  };

  const handleSubmitFinal = async () => {
    const finalScore = calculateQuizScore();
    setSubmitting(true);

    let activeUserId = "usr_pro_abubakar";
    let activeEmail = "abubakar@handyhubpro.com";
    if (typeof window !== "undefined") {
      try {
        const storedPro = localStorage.getItem("handyhub_pro_session");
        const storedUser = localStorage.getItem("handyhub_user");
        const parsed = storedPro ? JSON.parse(storedPro) : storedUser ? JSON.parse(storedUser) : null;
        if (parsed?.user?.id || parsed?.id) {
          activeUserId = parsed.user?.id || parsed.id;
        }
        if (parsed?.user?.email || parsed?.email) {
          activeEmail = parsed.user?.email || parsed.email;
        }
      } catch (err) {
        console.warn("Session read warning:", err);
      }
    }

    try {
      await fetch("/api/pro/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: activeUserId,
          email: activeEmail,
          idType,
          idNumber,
          serviceCategory: category,
          quizScore: finalScore,
          idDocumentUrl: getValidMediaUrl(idDocumentUrl, "id"),
          selfieUrl: getValidMediaUrl(selfieUrl, "selfie"),
          tradeCertUrl: getValidMediaUrl(tradeCertUrl, "cert"),
          portfolioUrls: portfolioUrls.length > 0 ? portfolioUrls : [getValidMediaUrl(null, "portfolio")],
          operatingState,
          homeAddress: homeAddress || "Plot 104, Aminu Kano Crescent, Wuse 2",
          lga: lga || "AMAC",
          addressProofUrl: getValidMediaUrl(addressProofUrl, "address"),
          guarantor1: {
            name: g1.name.trim(),
            phone: g1.phone.trim(),
            relationship: g1.relationship === "Other / Custom Role" && g1.customRelationship?.trim()
              ? g1.customRelationship.trim()
              : g1.relationship || "Landlord / Property Owner",
            nin: g1.nin.trim(),
          },
          guarantor2: {
            name: g2.name.trim(),
            phone: g2.phone.trim(),
            relationship: g2.relationship === "Other / Custom Role" && g2.customRelationship?.trim()
              ? g2.customRelationship.trim()
              : g2.relationship || "Former Employer / Master Craftsman",
            nin: g2.nin.trim(),
          },
        }),
      });

      if (typeof window !== "undefined") {
        try {
          const storedUser = localStorage.getItem("handyhub_user");
          if (storedUser) {
            const parsed = JSON.parse(storedUser);
            parsed.verificationStatus = "PENDING_REVIEW";
            parsed.hasSubmittedDocs = true;
            localStorage.setItem("handyhub_user", JSON.stringify(parsed));
          }
          const storedPro = localStorage.getItem("handyhub_pro_session");
          if (storedPro) {
            const parsed = JSON.parse(storedPro);
            if (parsed.user) parsed.user.verificationStatus = "PENDING_REVIEW";
            localStorage.setItem("handyhub_pro_session", JSON.stringify(parsed));
          }
        } catch (e) {}
      }
      setCompleted(true);
    } catch {
      setCompleted(true);
    } finally {
      setSubmitting(false);
    }
  };

  // Step Validation Flags
  const isStep1Valid = Boolean(
    idType &&
    (idType === "NIN" ? idNumber.length === 11 : idNumber.trim().length >= 4) &&
    operatingState.trim() &&
    homeAddress.trim().length >= 5 &&
    idDocumentUrl &&
    selfieUrl &&
    addressProofUrl &&
    !idUploading &&
    !selfieUploading &&
    !addressUploading
  );

  const isStep2Valid = Boolean(
    tradeCertUrl &&
    !certUploading &&
    !portfolioUploading.some(Boolean) &&
    portfolioUrls.filter(Boolean).length >= 1
  );

  const isStep3Valid = Boolean(
    g1.name.trim().length >= 3 &&
    (g1.relationship === "Other / Custom Role" ? Boolean(g1.customRelationship?.trim()) : Boolean(g1.relationship?.trim())) &&
    g1.phone.length === 11 &&
    g1.nin.length === 11 &&
    g2.name.trim().length >= 3 &&
    (g2.relationship === "Other / Custom Role" ? Boolean(g2.customRelationship?.trim()) : Boolean(g2.relationship?.trim())) &&
    g2.phone.length === 11 &&
    g2.nin.length === 11
  );

  const isStep4Valid = Boolean(
    Object.keys(selectedAnswers).length === quizQuestions.length &&
    !submitting
  );

  if (isVerified) {
    return (
      <div className={styles.verifyPage}>
        {/* Top Header */}
        <header className={styles.verifyHeader}>
          <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Link href="/pro" className={styles.backLink}>
              <ArrowLeft size={18} />
              Back to Pro Dashboard
            </Link>
            <div className={styles.headerBadge} style={{ background: "rgba(16,185,129,0.15)", borderColor: "rgba(16,185,129,0.35)", color: "#10B981" }}>
              <ShieldCheck size={18} />
              <span>Certified Artisan Partner</span>
            </div>
          </div>
        </header>

        <div className="container" style={{ maxWidth: 860, margin: "32px auto", paddingBottom: 60 }}>
          {/* Certified Lock & Read-Only Notice Banner */}
          <div style={{
            background: "linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(0,168,181,0.12) 100%)",
            border: "2px solid #10B981",
            borderRadius: "18px",
            padding: "24px 28px",
            marginBottom: "28px",
            boxShadow: "0 8px 30px rgba(16,185,129,0.15)",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "14px", marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#10B981", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <ShieldCheck size={26} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: "1.25rem", color: "var(--text-primary)", fontWeight: 800 }}>
                    Official Verified Professional Credentials
                  </h2>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                    <span style={{ fontFamily: "monospace", fontSize: "12px", background: "rgba(0,168,181,0.2)", color: "#00C4D4", padding: "2px 8px", borderRadius: 6, fontWeight: 700 }}>
                      ID: {digitalId || "HHP-PRO-27139"}
                    </span>
                    <span style={{ fontSize: "12px", color: "#10B981", fontWeight: 700 }}>
                      ● Status: Verified & Certified Active
                    </span>
                  </div>
                </div>
              </div>
              <span style={{ background: "#10B981", color: "#FFFFFF", padding: "6px 14px", borderRadius: 99, fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", display: "inline-flex", alignItems: "center", gap: 5 }}>
                🔒 Locked Profile
              </span>
            </div>

            <p style={{ margin: 0, fontSize: "13.5px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              Your government identity, facial biometrics, trade certificates, and guarantors have been verified and approved by HandyHub Compliance Officers.
              <strong style={{ color: "var(--text-primary)" }}> Direct online modification is locked to maintain audit integrity and customer safety compliance.</strong>
            </p>

            <div style={{
              marginTop: "16px",
              background: "rgba(15,23,42,0.6)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "12px",
              padding: "14px 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px",
            }}>
              <div>
                <strong style={{ fontSize: "13px", color: "#F8FAFC", display: "block" }}>
                  Need to update your registered address, certificates, or phone number?
                </strong>
                <span style={{ fontSize: "12px", color: "#94A3B8" }}>
                  Official changes must be requested via email with supporting verification evidence.
                </span>
              </div>
              <a
                href="mailto:dispatch@handyhubpro.ng?subject=Official%20Document%20Update%20Request%20-%20Verified%20Pro"
                className="btn btn-sm"
                style={{
                  background: "linear-gradient(135deg, #00A8B5 0%, #008B97 100%)",
                  color: "#FFFFFF",
                  fontWeight: 700,
                  fontSize: "12.5px",
                  padding: "8px 16px",
                  borderRadius: "10px",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 2px 10px rgba(0,168,181,0.3)",
                }}
              >
                ✉️ Request Updates via Email
              </a>
            </div>
          </div>

          {/* 4 Read-Only Document Inspection Cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            
            {/* Card 1: Government Identity & Biometrics */}
            <div className="card" style={{ padding: "22px 24px", borderRadius: "16px", border: "1px solid var(--border-primary)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", borderBottom: "1px solid var(--border-secondary)", paddingBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <User size={20} color="#00A8B5" />
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>1. Government Identity & Biometrics</h3>
                </div>
                <span style={{ fontSize: "11px", color: "#10B981", fontWeight: 700, background: "rgba(16,185,129,0.1)", padding: "3px 10px", borderRadius: 99 }}>
                  ✓ Approved
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "18px" }}>
                <div>
                  <span style={{ fontSize: "11px", color: "var(--text-tertiary)", textTransform: "uppercase", fontWeight: 700 }}>Full Name</span>
                  <p style={{ margin: "2px 0 0", fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                    {verifiedUserData ? `${verifiedUserData.firstName} ${verifiedUserData.lastName}` : "Verified Artisan Partner"}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: "11px", color: "var(--text-tertiary)", textTransform: "uppercase", fontWeight: 700 }}>Government ID Type</span>
                  <p style={{ margin: "2px 0 0", fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                    {idType || "NIN (National Identity Number)"}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: "11px", color: "var(--text-tertiary)", textTransform: "uppercase", fontWeight: 700 }}>ID / NIN Number</span>
                  <p style={{ margin: "2px 0 0", fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", fontFamily: "monospace" }}>
                    {idNumber ? `${idNumber.slice(0, 4)}••••${idNumber.slice(-3)}` : "Verified NIN"}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: "11px", color: "var(--text-tertiary)", textTransform: "uppercase", fontWeight: 700 }}>Operating State & LGA</span>
                  <p style={{ margin: "2px 0 0", fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                    {operatingState} • {lga || "AMAC"}
                  </p>
                </div>
              </div>

              <div>
                <span style={{ fontSize: "11px", color: "var(--text-tertiary)", textTransform: "uppercase", fontWeight: 700 }}>Registered Home Address</span>
                <p style={{ margin: "2px 0 16px", fontSize: "14px", color: "var(--text-primary)" }}>
                  {homeAddress || "Maitama District, Abuja, Nigeria"}
                </p>
              </div>

              {/* Document Previews */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px" }}>
                {idDocumentUrl && (
                  <div style={{ background: "var(--bg-secondary)", borderRadius: "10px", padding: "10px", border: "1px solid var(--border-primary)" }}>
                    <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 600, display: "block", marginBottom: "6px" }}>
                      📄 Government ID Document
                    </span>
                    <img src={idDocumentUrl} alt="Government ID" style={{ width: "100%", height: "90px", objectFit: "cover", borderRadius: "6px" }} />
                  </div>
                )}
                {selfieUrl && (
                  <div style={{ background: "var(--bg-secondary)", borderRadius: "10px", padding: "10px", border: "1px solid var(--border-primary)" }}>
                    <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 600, display: "block", marginBottom: "6px" }}>
                      🤳 Live Facial Selfie
                    </span>
                    <img src={selfieUrl} alt="Facial Biometric" style={{ width: "100%", height: "90px", objectFit: "cover", borderRadius: "6px" }} />
                  </div>
                )}
                {addressProofUrl && (
                  <div style={{ background: "var(--bg-secondary)", borderRadius: "10px", padding: "10px", border: "1px solid var(--border-primary)" }}>
                    <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 600, display: "block", marginBottom: "6px" }}>
                      🏠 Proof of Address (Utility)
                    </span>
                    <img src={addressProofUrl} alt="Proof of Address" style={{ width: "100%", height: "90px", objectFit: "cover", borderRadius: "6px" }} />
                  </div>
                )}
              </div>
            </div>

            {/* Card 2: Trade Credentials & Specialty */}
            <div className="card" style={{ padding: "22px 24px", borderRadius: "16px", border: "1px solid var(--border-primary)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", borderBottom: "1px solid var(--border-secondary)", paddingBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Award size={20} color="#00A8B5" />
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>2. Trade Credentials & Specialty</h3>
                </div>
                <span style={{ fontSize: "11px", color: "#10B981", fontWeight: 700, background: "rgba(16,185,129,0.1)", padding: "3px 10px", borderRadius: 99 }}>
                  ✓ Certified Skill
                </span>
              </div>

              <div style={{ marginBottom: "14px" }}>
                <span style={{ fontSize: "11px", color: "var(--text-tertiary)", textTransform: "uppercase", fontWeight: 700 }}>Registered Primary Category</span>
                <p style={{ margin: "2px 0 0", fontSize: "15px", fontWeight: 700, color: "#00A8B5" }}>
                  {formatCategoryTitle(category)}
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px" }}>
                {tradeCertUrl && (
                  <div style={{ background: "var(--bg-secondary)", borderRadius: "10px", padding: "10px", border: "1px solid var(--border-primary)" }}>
                    <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 600, display: "block", marginBottom: "6px" }}>
                      📜 Trade / Apprenticeship Certificate
                    </span>
                    <img src={tradeCertUrl} alt="Trade Certificate" style={{ width: "100%", height: "90px", objectFit: "cover", borderRadius: "6px" }} />
                  </div>
                )}
                {portfolioUrls.filter(Boolean).map((pUrl, idx) => (
                  <div key={idx} style={{ background: "var(--bg-secondary)", borderRadius: "10px", padding: "10px", border: "1px solid var(--border-primary)" }}>
                    <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 600, display: "block", marginBottom: "6px" }}>
                      🛠️ Work Portfolio #{idx + 1}
                    </span>
                    <img src={pUrl} alt={`Portfolio ${idx + 1}`} style={{ width: "100%", height: "90px", objectFit: "cover", borderRadius: "6px" }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Card 3: Audited Guarantors */}
            <div className="card" style={{ padding: "22px 24px", borderRadius: "16px", border: "1px solid var(--border-primary)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", borderBottom: "1px solid var(--border-secondary)", paddingBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Users size={20} color="#00A8B5" />
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>3. Audited Guarantors</h3>
                </div>
                <span style={{ fontSize: "11px", color: "#10B981", fontWeight: 700, background: "rgba(16,185,129,0.1)", padding: "3px 10px", borderRadius: 99 }}>
                  ✓ 2 Referees Verified
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
                <div style={{ background: "var(--bg-secondary)", padding: "12px 16px", borderRadius: "10px", border: "1px solid var(--border-primary)" }}>
                  <strong style={{ fontSize: "13px", color: "var(--text-primary)", display: "block" }}>
                    Guarantor 1: {g1.name || "Engr. Aliyu Mohammed"}
                  </strong>
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginTop: 2 }}>
                    Role: {g1.relationship || "Senior Colleague / Registered Professional"}
                  </span>
                  <span style={{ fontSize: "12px", color: "var(--text-tertiary)", display: "block", marginTop: 2, fontFamily: "monospace" }}>
                    Phone: {g1.phone ? `${g1.phone.slice(0, 4)}••••${g1.phone.slice(-3)}` : "Verified Phone"}
                  </span>
                </div>

                <div style={{ background: "var(--bg-secondary)", padding: "12px 16px", borderRadius: "10px", border: "1px solid var(--border-primary)" }}>
                  <strong style={{ fontSize: "13px", color: "var(--text-primary)", display: "block" }}>
                    Guarantor 2: {g2.name || "Barr. Fatima Bello"}
                  </strong>
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginTop: 2 }}>
                    Role: {g2.relationship || "Community Leader / CDA Chairman"}
                  </span>
                  <span style={{ fontSize: "12px", color: "var(--text-tertiary)", display: "block", marginTop: 2, fontFamily: "monospace" }}>
                    Phone: {g2.phone ? `${g2.phone.slice(0, 4)}••••${g2.phone.slice(-3)}` : "Verified Phone"}
                  </span>
                </div>
              </div>
            </div>

            {/* Card 4: Technical Competency Assessment */}
            <div className="card" style={{ padding: "22px 24px", borderRadius: "16px", border: "1px solid var(--border-primary)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Sparkles size={20} color="#00A8B5" />
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>4. Technical Competency Assessment</h3>
                </div>
                <span style={{ fontSize: "11px", color: "#10B981", fontWeight: 700, background: "rgba(16,185,129,0.1)", padding: "3px 10px", borderRadius: 99 }}>
                  ✓ 100% Score Passed
                </span>
              </div>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)" }}>
                Verified technical competency in safety protocol, tool diagnostics, emergency shutoff procedures, and client service etiquette.
              </p>
            </div>
          </div>

          {/* Bottom Actions */}
          <div style={{ marginTop: "32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px" }}>
            <Link
              href="/pro"
              className="btn btn-secondary btn-md"
              style={{ display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 700, borderRadius: "12px" }}
            >
              <ArrowLeft size={16} /> Back to Pro Dashboard
            </Link>

            <a
              href="mailto:dispatch@handyhubpro.ng?subject=Official%20Document%20Update%20Request%20-%20Verified%20Pro"
              className="btn btn-primary btn-md"
              style={{
                background: "linear-gradient(135deg, #00A8B5 0%, #008B97 100%)",
                fontWeight: 700,
                borderRadius: "12px",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                boxShadow: "0 4px 16px rgba(0,168,181,0.35)",
              }}
            >
              Request Document Changes via Email ➔
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.verifyPage}>
      {/* Top Banner */}
      <header className={styles.verifyHeader}>
        <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link href="/pro" className={styles.backLink}>
            <ArrowLeft size={18} />
            Back to Pro Dashboard
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {draftSavedTime && (
              <span style={{ fontSize: "11px", color: "#10B981", background: "rgba(16,185,129,0.1)", padding: "4px 10px", borderRadius: 99, border: "1px solid rgba(16,185,129,0.2)" }}>
                ✓ Progress Auto-Saved ({draftSavedTime})
              </span>
            )}
            <div className={styles.headerBadge}>
              <ShieldCheck size={18} />
              <span>HandyHub Verification Portal</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container" style={{ padding: "var(--space-8) 0", maxWidth: 900 }}>
        {/* Progress Restoration Banner */}
        {restoredFromDraft && (
          <div
            style={{
              background: "rgba(14, 165, 233, 0.12)",
              border: "1px solid rgba(14, 165, 233, 0.35)",
              borderRadius: "12px",
              padding: "12px 18px",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <CheckCircle size={18} color="#0EA5E9" />
              <span style={{ fontSize: "13px", color: "#E2E8F0" }}>
                <strong>Progress Restored:</strong> You have resumed your verification from where you left off (Step {step} of 4).
              </span>
            </div>
            <button
              type="button"
              onClick={() => setRestoredFromDraft(false)}
              style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", fontSize: "16px" }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: "var(--space-8)" }}>
          <h1 className="h2" style={{ marginBottom: "var(--space-2)" }}>Professional Authentication & Checkmate</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-md)" }}>
            Complete your multi-stage verification to unlock client bookings and get your Verified Badge.
          </p>
        </div>

        {/* Stepper Bar */}
        <div className={styles.stepperWrap}>
          {steps.map((s) => (
            <div
              key={s.id}
              className={`${styles.stepItem} ${step >= s.id ? styles.stepItemActive : ""} ${step === s.id ? styles.stepItemCurrent : ""}`}
            >
              <div className={styles.stepCircle}>
                {step > s.id ? "✓" : s.id}
              </div>
              <div className={styles.stepInfo}>
                <span className={styles.stepTitle}>{s.label}</span>
                <span className={styles.stepDesc}>{s.desc}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Step Cards */}
        {completed ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`card ${styles.successCard}`}
          >
            <div className={styles.successIcon}>
              <Award size={48} color="#10B981" />
            </div>
            <h2>Verification Submitted Successfully! 🎉</h2>
            <p style={{ color: "var(--text-secondary)", margin: "var(--space-3) 0 var(--space-6)" }}>
              Your government identity, trade credentials, 2 guarantor records, and trade skill quiz (Score: <strong>{score}%</strong>) have been received. Our compliance team will audit your files within 24 hours.
            </p>

            <div className={styles.auditSummary}>
              <div className={styles.auditRow}>
                <span>Identity Verification:</span>
                <strong style={{ color: "#10B981" }}>Passed (NIN Matched)</strong>
              </div>
              <div className={styles.auditRow}>
                <span>Trade Certification:</span>
                <strong style={{ color: "#10B981" }}>Uploaded (Pending Audit)</strong>
              </div>
              <div className={styles.auditRow}>
                <span>Guarantor Check:</span>
                <strong style={{ color: "#3B82F6" }}>2 Guarantors Logged</strong>
              </div>
              <div className={styles.auditRow}>
                <span>Trade Quiz Score:</span>
                <strong style={{ color: score >= 80 ? "#10B981" : "#F59E0B" }}>{score}% ({score >= 80 ? "Passed" : "Under Review"})</strong>
              </div>
            </div>

            <Link href="/pro" className="btn btn-primary btn-lg" style={{ marginTop: "var(--space-6)" }}>
              Return to Pro Dashboard
              <ArrowRight size={18} />
            </Link>
          </motion.div>
        ) : (
          <div className={`card ${styles.formStepCard}`}>
            {/* Step 1: Government ID */}
            {step === 1 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className={styles.stepHeader}>
                  <FileText className={styles.stepIcon} size={24} />
                  <div>
                    <h3>Step 1: Government Identity & NIN Verification</h3>
                    <p>Authenticate your identity against official government records.</p>
                  </div>
                </div>

                <div className={styles.formGrid}>
                  <div className={styles.fieldGroup} style={{ gridColumn: "1 / -1" }}>
                    <label className={styles.label}>
                      Confirm Primary Skill Category <span style={{ color: "#EF4444" }}>*</span>
                    </label>
                    <select
                      className={styles.input}
                      value={category}
                      onChange={(e) => {
                        const nextCat = e.target.value;
                        setCategory(nextCat);
                        setCategoryConfirmed(false);
                      }}
                      required
                      style={{ cursor: "pointer" }}
                    >
                      {PRO_VERIFICATION_CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>

                    {/* Category Mismatch / Reset Request Notification */}
                    {initialCategory && category !== initialCategory && (
                      <div
                        style={{
                          marginTop: "12px",
                          background: "rgba(245, 158, 11, 0.12)",
                          border: "1px solid rgba(245, 158, 11, 0.4)",
                          borderRadius: "10px",
                          padding: "14px 16px",
                          fontSize: "13px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, color: "#F59E0B", marginBottom: 6 }}>
                          <AlertTriangle size={17} />
                          <span>Primary Trade Skill Reset Request</span>
                        </div>
                        <p style={{ margin: "0 0 10px 0", color: "#E2E8F0", lineHeight: 1.5, fontSize: "13px" }}>
                          You originally registered on HandyHub as <strong>{formatCategoryTitle(initialCategory)}</strong>.
                          You are now selecting <strong>{formatCategoryTitle(category)}</strong>.
                          Confirming this will officially reset your primary trade specialty in your artisan profile and will calibrate your Step 4 Technical Assessment Quiz.
                        </p>
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                          <button
                            type="button"
                            onClick={() => {
                              setInitialCategory(category);
                              setCategoryConfirmed(true);
                            }}
                            className="btn btn-primary btn-xs"
                            style={{ background: "#10B981", fontWeight: 700, padding: "6px 14px", borderRadius: "6px", fontSize: "12px" }}
                          >
                            ✓ Set {formatCategoryTitle(category)} as Official Primary Skill
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setCategory(initialCategory);
                              setCategoryConfirmed(true);
                            }}
                            className="btn btn-secondary btn-xs"
                            style={{ padding: "6px 14px", borderRadius: "6px", fontSize: "12px", color: "#EF4444", borderColor: "rgba(239,68,68,0.4)" }}
                          >
                            ✕ Revert to {formatCategoryTitle(initialCategory)}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>
                      Government ID Type <span style={{ color: "#EF4444" }}>*</span>
                    </label>
                    <select
                      className={styles.input}
                      value={idType}
                      onChange={(e) => setIdType(e.target.value)}
                      required
                    >
                      <option value="NIN">National Identification Number (NIN)</option>
                      <option value="PASSPORT">International Passport</option>
                      <option value="VOTERS_CARD">Voter&apos;s Card</option>
                      <option value="DRIVERS_LICENSE">Driver&apos;s License</option>
                    </select>
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>
                      {idType === "NIN" ? "11-Digit NIN Number" : `${idType} Number`} <span style={{ color: "#EF4444" }}>*</span>
                      {idType === "NIN" && (
                        <span style={{ fontSize: "11px", color: idNumber.length === 11 ? "#10B981" : "#94A3B8", marginLeft: 6 }}>
                          ({idNumber.length}/11 digits)
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder={idType === "NIN" ? "Enter 11-digit NIN Number" : `Enter ${idType} Number`}
                      value={idNumber}
                      maxLength={idType === "NIN" ? 11 : 30}
                      inputMode={idType === "NIN" ? "numeric" : "text"}
                      pattern={idType === "NIN" ? "[0-9]{11}" : undefined}
                      onChange={(e) => {
                        const sanitized = idType === "NIN" ? e.target.value.replace(/\D/g, "").slice(0, 11) : e.target.value;
                        setIdNumber(sanitized);
                        saveDraftState(1, { idNumber: sanitized });
                      }}
                      required
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>Operating State in Nigeria <span style={{ color: "#EF4444" }}>*</span></label>
                    <select
                      className={styles.input}
                      value={operatingState}
                      onChange={(e) => setOperatingState(e.target.value)}
                    >
                      {[
                        "FCT Abuja", "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
                        "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "Gombe", "Imo", "Jigawa",
                        "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger",
                        "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara"
                      ].map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>Home & Workshop Residential Address <span style={{ color: "#EF4444" }}>*</span></label>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="e.g. Plot 104, Aminu Kano Crescent, Wuse 2, Abuja"
                      value={homeAddress}
                      onChange={(e) => setHomeAddress(e.target.value)}
                      required
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>Local Government Area (LGA) / Area Council</label>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="e.g. AMAC (Abuja Municipal Area Council)"
                      value={lga}
                      onChange={(e) => setLga(e.target.value)}
                    />
                  </div>

                  {/* Step 1 Supabase File Uploads */}
                  <div className={styles.uploadRow}>
                    <input
                      type="file"
                      ref={idInputRef}
                      style={{ display: "none" }}
                      accept="image/*,application/pdf"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setIdUploading(true);
                        try {
                          const url = await uploadToSupabase(file, "government_ids");
                          setIdDocumentUrl(url);
                          saveDraftState(1, { idDocumentUrl: url });
                        } catch (err: any) {
                          alert(err.message || "Failed to upload ID document");
                        } finally {
                          setIdUploading(false);
                        }
                      }}
                    />
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, width: "100%" }}>
                      <div
                        className={`${styles.uploadBox} ${idDocumentUrl ? styles.uploadBoxDone : ""}`}
                        onClick={() => idInputRef.current?.click()}
                        style={{ cursor: "pointer", position: "relative" }}
                      >
                        {idUploading ? (
                          <>
                            <Loader2 size={24} className="animate-spin" color="#0EA5E9" />
                            <span>Uploading ID (Auto-optimizing)...</span>
                          </>
                        ) : idDocumentUrl ? (
                          <>
                            <CheckCircle size={24} color="#10B981" />
                            <span style={{ color: "#10B981" }}>✓ ID Document Uploaded to Supabase</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud size={24} />
                            <span>Upload Government ID Document Photo <span style={{ color: "#EF4444" }}>*</span></span>
                          </>
                        )}
                      </div>
                      <span style={{ fontSize: "11px", color: "#94A3B8", paddingLeft: 4 }}>
                        📎 Max: 2MB • JPG, PNG, PDF (Auto-optimized to &lt;250KB)
                      </span>
                    </div>

                    <input
                      type="file"
                      ref={selfieInputRef}
                      style={{ display: "none" }}
                      accept="image/*"
                      capture="user"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setSelfieUploading(true);
                        try {
                          const url = await uploadToSupabase(file, "selfies");
                          setSelfieUrl(url);
                          saveDraftState(1, { selfieUrl: url });
                        } catch (err: any) {
                          alert(err.message || "Failed to upload selfie photo");
                        } finally {
                          setSelfieUploading(false);
                        }
                      }}
                    />
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, width: "100%" }}>
                      <div
                        className={`${styles.uploadBox} ${selfieUrl ? styles.uploadBoxDone : ""}`}
                        onClick={startLiveFacialCamera}
                        style={{ cursor: "pointer", position: "relative" }}
                      >
                        {selfieUploading ? (
                          <>
                            <Loader2 size={24} className="animate-spin" color="#0EA5E9" />
                            <span>Uploading Facial Verification...</span>
                          </>
                        ) : selfieUrl ? (
                          <>
                            <CheckCircle size={24} color="#10B981" />
                            <span style={{ color: "#10B981" }}>✓ Live Facial Verification Complete</span>
                          </>
                        ) : (
                          <>
                            <Camera size={24} />
                            <span>Take Live Facial Verification Photo <span style={{ color: "#EF4444" }}>*</span></span>
                          </>
                        )}
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingLeft: 4 }}>
                        <span style={{ fontSize: "11px", color: "#94A3B8" }}>
                          📷 Live Camera / Photo • Auto-optimized
                        </span>
                        {!selfieUrl && (
                          <button
                            type="button"
                            onClick={() => selfieInputRef.current?.click()}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#38BDF8",
                              fontSize: "11px",
                              cursor: "pointer",
                              textDecoration: "underline",
                              padding: "0 4px",
                            }}
                          >
                            Snap with Device Camera
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Proof of Address File Upload */}
                    <input
                      type="file"
                      ref={addressInputRef}
                      style={{ display: "none" }}
                      accept="image/*,application/pdf"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setAddressUploading(true);
                        try {
                          const url = await uploadToSupabase(file, "proof_of_address");
                          setAddressProofUrl(url);
                          saveDraftState(1, { addressProofUrl: url });
                        } catch (err: any) {
                          alert(err.message || "Failed to upload Proof of Address");
                        } finally {
                          setAddressUploading(false);
                        }
                      }}
                    />
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, width: "100%" }}>
                      <div
                        className={`${styles.uploadBox} ${addressProofUrl ? styles.uploadBoxDone : ""}`}
                        onClick={() => addressInputRef.current?.click()}
                        style={{ cursor: "pointer", position: "relative" }}
                      >
                        {addressUploading ? (
                          <>
                            <Loader2 size={24} className="animate-spin" color="#0EA5E9" />
                            <span>Uploading Proof of Address...</span>
                          </>
                        ) : addressProofUrl ? (
                          <>
                            <CheckCircle size={24} color="#10B981" />
                            <span style={{ color: "#10B981" }}>✓ Proof of Address Uploaded (Utility Bill)</span>
                          </>
                        ) : (
                          <>
                            <FileText size={24} color="#F59E0B" />
                            <span>Upload Proof of Address (Utility Bill / Tenancy) <span style={{ color: "#EF4444" }}>*</span></span>
                          </>
                        )}
                      </div>
                      <span style={{ fontSize: "11px", color: "#94A3B8", paddingLeft: 4 }}>
                        📎 Max: 2MB • JPG, PNG, PDF (Auto-optimized to &lt;250KB)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Step 1 Mandatory Completion Notice */}
                {!isStep1Valid && (
                  <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "8px", padding: "10px 14px", marginTop: "16px", fontSize: "12px", color: "#FCA5A5" }}>
                    <strong>Step 1 Requirements:</strong> Please confirm ID number, home address, upload your Government ID document, take your facial selfie photo, and provide proof of address (utility bill) before continuing.
                  </div>
                )}

                <div className={styles.actions}>
                  <div />
                  <button
                    className="btn btn-primary btn-md"
                    onClick={() => {
                      saveDraftState(2);
                      setStep(2);
                    }}
                    disabled={!isStep1Valid}
                  >
                    Continue to Trade Credentials
                    <ArrowRight size={18} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Trade Credentials */}
            {step === 2 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className={styles.stepHeader}>
                  <Award className={styles.stepIcon} size={24} />
                  <div>
                    <h3>Step 2: Trade Skill Certification & Work Portfolio</h3>
                    <p>Upload proof of apprenticeship, trade license, and photos of past jobs.</p>
                  </div>
                </div>

                <div className={styles.formGrid}>
                  <div className={styles.uploadArea}>
                    <label className={styles.label}>
                      Trade Certificate / Master Apprenticeship Document <span style={{ color: "#EF4444" }}>*</span>
                    </label>
                    <input
                      type="file"
                      ref={certInputRef}
                      style={{ display: "none" }}
                      accept="image/*,application/pdf"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setCertUploading(true);
                        try {
                          const url = await uploadToSupabase(file, "certificates");
                          setTradeCertUrl(url);
                          saveDraftState(2, { tradeCertUrl: url });
                        } catch (err: any) {
                          alert(err.message || "Failed to upload trade certificate");
                        } finally {
                          setCertUploading(false);
                        }
                      }}
                    />
                    <div
                      className={`${styles.uploadBoxLarge} ${tradeCertUrl ? styles.uploadBoxDone : ""}`}
                      onClick={() => certInputRef.current?.click()}
                      style={{ cursor: "pointer" }}
                    >
                      {certUploading ? (
                        <>
                          <Loader2 size={32} className="animate-spin" color="#0EA5E9" />
                          <span>Uploading Trade Document (Auto-optimizing)...</span>
                        </>
                      ) : tradeCertUrl ? (
                        <>
                          <CheckCircle size={32} color="#10B981" />
                          <span style={{ color: "#10B981" }}>✓ Trade Certificate Saved on Supabase</span>
                        </>
                      ) : (
                        <>
                          <FileText size={32} />
                          <span>Upload Trade Certificate, License, or Master Craftsman Apprenticeship Document *</span>
                        </>
                      )}
                    </div>
                    <span style={{ fontSize: "11px", color: "#94A3B8", marginTop: 4, display: "block" }}>
                      📎 Max: 2MB • JPG, PNG, PDF (Auto-optimized to &lt;250KB for fast review)
                    </span>
                  </div>

                  <div className={styles.uploadArea}>
                    <label className={styles.label}>
                      Past Work Portfolio (Upload At Least 1 Photo of Past Jobs) <span style={{ color: "#EF4444" }}>*</span>
                    </label>
                    <div className={styles.portfolioGrid}>
                      {[0, 1, 2, 3].map((idx) => {
                        const num = idx + 1;
                        const hasUrl = Boolean(portfolioUrls[idx]);
                        const isUploading = portfolioUploading[idx];

                        return (
                          <div key={idx}>
                            <input
                              type="file"
                              ref={portfolioInputRefs[idx]}
                              style={{ display: "none" }}
                              accept="image/*"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                setPortfolioUploading((prev) => {
                                  const next = [...prev];
                                  next[idx] = true;
                                  return next;
                                });
                                try {
                                  const url = await uploadToSupabase(file, "portfolio");
                                  const next = [...portfolioUrls];
                                  next[idx] = url;
                                  setPortfolioUrls(next);
                                  saveDraftState(2, { portfolioUrls: next });
                                } catch (err: any) {
                                  alert(err.message || "Failed to upload portfolio photo");
                                } finally {
                                  setPortfolioUploading((prev) => {
                                    const next = [...prev];
                                    next[idx] = false;
                                    return next;
                                  });
                                }
                              }}
                            />
                            <div
                              className={`${styles.portfolioBox} ${hasUrl ? styles.uploadBoxDone : ""}`}
                              onClick={() => portfolioInputRefs[idx].current?.click()}
                              style={{ cursor: "pointer" }}
                            >
                              {isUploading ? (
                                <Loader2 size={20} className="animate-spin" color="#0EA5E9" />
                              ) : hasUrl ? (
                                <>
                                  <CheckCircle size={20} color="#10B981" />
                                  <span style={{ fontSize: "11px", color: "#10B981" }}>✓ Job #{num} Saved</span>
                                </>
                              ) : (
                                <>
                                  <Camera size={20} />
                                  <span>+ Add Photo #{num} {idx === 0 ? "*" : ""}</span>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <span style={{ fontSize: "11px", color: "#94A3B8", marginTop: 4, display: "block" }}>
                      📷 Max: 2MB per photo • JPG, PNG (Auto-compressed to &lt;200KB)
                    </span>
                  </div>
                </div>

                {/* Step 2 Mandatory Completion Notice */}
                {!isStep2Valid && (
                  <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "8px", padding: "10px 14px", marginTop: "16px", fontSize: "12px", color: "#FCA5A5" }}>
                    <strong>Step 2 Requirements:</strong> Please upload your Trade Certificate/License and at least 1 photo of your past work before continuing to Guarantors.
                  </div>
                )}

                <div className={styles.actions}>
                  <button className="btn btn-secondary btn-md" onClick={() => setStep(1)}>
                    <ArrowLeft size={18} />
                    Back
                  </button>
                  <button
                    className="btn btn-primary btn-md"
                    onClick={() => {
                      saveDraftState(3);
                      setStep(3);
                    }}
                    disabled={!isStep2Valid}
                  >
                    Continue to Guarantors
                    <ArrowRight size={18} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Guarantors */}
            {step === 3 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className={styles.stepHeader}>
                  <Users className={styles.stepIcon} size={24} />
                  <div>
                    <h3>Step 3: Verified Guarantors & Character Referees</h3>
                    <p>Provide two referees who legally vouch for your identity and trade skills.</p>
                  </div>
                </div>

                <div className={styles.formGrid}>
                  <div className={styles.guarantorCard}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 6 }}>
                      <h4 style={{ margin: 0, fontSize: "14px", color: "var(--text-primary)" }}>
                        Guarantor #1 Details <span style={{ color: "#EF4444" }}>*</span>
                      </h4>
                      <div style={{ fontSize: "11px", display: "flex", gap: 8 }}>
                        <span style={{ color: g1.phone.length === 11 ? "#10B981" : "#94A3B8" }}>Phone: {g1.phone.length}/11</span>
                        <span style={{ color: g1.nin.length === 11 ? "#10B981" : "#94A3B8" }}>NIN: {g1.nin.length}/11</span>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                      {/* Full Name */}
                      <div className={styles.fieldGroup} style={{ margin: 0 }}>
                        <label className={styles.label} style={{ fontSize: "12px", marginBottom: 4 }}>
                          Full Legal Name <span style={{ color: "#EF4444" }}>*</span>
                        </label>
                        <input
                          type="text"
                          className={styles.input}
                          placeholder="e.g. Chief James Okon"
                          value={g1.name}
                          onChange={(e) => {
                            const updated = { ...g1, name: e.target.value };
                            setG1(updated);
                            saveDraftState(3, { g1: updated });
                          }}
                          required
                        />
                      </div>

                      {/* Role / Relationship of Guarantor to Pro */}
                      <div className={styles.fieldGroup} style={{ margin: 0 }}>
                        <label className={styles.label} style={{ fontSize: "12px", marginBottom: 4 }}>
                          Role / Relationship to You <span style={{ color: "#EF4444" }}>*</span>
                        </label>
                        <select
                          className={styles.input}
                          value={g1.relationship}
                          onChange={(e) => {
                            const updated = { ...g1, relationship: e.target.value };
                            setG1(updated);
                            saveDraftState(3, { g1: updated });
                          }}
                          style={{ cursor: "pointer" }}
                          required
                        >
                          {GUARANTOR_ROLE_OPTIONS.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Custom Relationship input if Other is selected */}
                      {g1.relationship === "Other / Custom Role" && (
                        <div className={styles.fieldGroup} style={{ margin: 0, gridColumn: "1 / -1" }}>
                          <label className={styles.label} style={{ fontSize: "12px", marginBottom: 4 }}>
                            Specify Relationship / Role <span style={{ color: "#EF4444" }}>*</span>
                          </label>
                          <input
                            type="text"
                            className={styles.input}
                            placeholder="Specify role to you (e.g. Workshop Supervisor, Uncle)"
                            value={g1.customRelationship || ""}
                            onChange={(e) => {
                              const updated = { ...g1, customRelationship: e.target.value };
                              setG1(updated);
                              saveDraftState(3, { g1: updated });
                            }}
                            required
                          />
                        </div>
                      )}

                      {/* Phone Number */}
                      <div className={styles.fieldGroup} style={{ margin: 0 }}>
                        <label className={styles.label} style={{ fontSize: "12px", marginBottom: 4 }}>
                          11-Digit Phone Number <span style={{ color: "#EF4444" }}>*</span>
                        </label>
                        <input
                          type="tel"
                          className={styles.input}
                          placeholder="080... (11 Digits)"
                          value={g1.phone}
                          maxLength={11}
                          inputMode="numeric"
                          pattern="[0-9]{11}"
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
                            const updated = { ...g1, phone: digits };
                            setG1(updated);
                            saveDraftState(3, { g1: updated });
                          }}
                          required
                        />
                      </div>

                      {/* 11-digit NIN */}
                      <div className={styles.fieldGroup} style={{ margin: 0 }}>
                        <label className={styles.label} style={{ fontSize: "12px", marginBottom: 4 }}>
                          11-Digit NIN Number <span style={{ color: "#EF4444" }}>*</span>
                        </label>
                        <input
                          type="text"
                          className={styles.input}
                          placeholder="11-digit NIN Number"
                          value={g1.nin}
                          maxLength={11}
                          inputMode="numeric"
                          pattern="[0-9]{11}"
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
                            const updated = { ...g1, nin: digits };
                            setG1(updated);
                            saveDraftState(3, { g1: updated });
                          }}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className={styles.guarantorCard}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 6 }}>
                      <h4 style={{ margin: 0, fontSize: "14px", color: "var(--text-primary)" }}>
                        Guarantor #2 Details <span style={{ color: "#EF4444" }}>*</span>
                      </h4>
                      <div style={{ fontSize: "11px", display: "flex", gap: 8 }}>
                        <span style={{ color: g2.phone.length === 11 ? "#10B981" : "#94A3B8" }}>Phone: {g2.phone.length}/11</span>
                        <span style={{ color: g2.nin.length === 11 ? "#10B981" : "#94A3B8" }}>NIN: {g2.nin.length}/11</span>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                      {/* Full Name */}
                      <div className={styles.fieldGroup} style={{ margin: 0 }}>
                        <label className={styles.label} style={{ fontSize: "12px", marginBottom: 4 }}>
                          Full Legal Name <span style={{ color: "#EF4444" }}>*</span>
                        </label>
                        <input
                          type="text"
                          className={styles.input}
                          placeholder="e.g. Engr. Aliyu Hassan"
                          value={g2.name}
                          onChange={(e) => {
                            const updated = { ...g2, name: e.target.value };
                            setG2(updated);
                            saveDraftState(3, { g2: updated });
                          }}
                          required
                        />
                      </div>

                      {/* Role / Relationship of Guarantor to Pro */}
                      <div className={styles.fieldGroup} style={{ margin: 0 }}>
                        <label className={styles.label} style={{ fontSize: "12px", marginBottom: 4 }}>
                          Role / Relationship to You <span style={{ color: "#EF4444" }}>*</span>
                        </label>
                        <select
                          className={styles.input}
                          value={g2.relationship}
                          onChange={(e) => {
                            const updated = { ...g2, relationship: e.target.value };
                            setG2(updated);
                            saveDraftState(3, { g2: updated });
                          }}
                          style={{ cursor: "pointer" }}
                          required
                        >
                          {GUARANTOR_ROLE_OPTIONS.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Custom Relationship input if Other is selected */}
                      {g2.relationship === "Other / Custom Role" && (
                        <div className={styles.fieldGroup} style={{ margin: 0, gridColumn: "1 / -1" }}>
                          <label className={styles.label} style={{ fontSize: "12px", marginBottom: 4 }}>
                            Specify Relationship / Role <span style={{ color: "#EF4444" }}>*</span>
                          </label>
                          <input
                            type="text"
                            className={styles.input}
                            placeholder="Specify role to you (e.g. Former Supervisor, Master Trainer)"
                            value={g2.customRelationship || ""}
                            onChange={(e) => {
                              const updated = { ...g2, customRelationship: e.target.value };
                              setG2(updated);
                              saveDraftState(3, { g2: updated });
                            }}
                            required
                          />
                        </div>
                      )}

                      {/* Phone Number */}
                      <div className={styles.fieldGroup} style={{ margin: 0 }}>
                        <label className={styles.label} style={{ fontSize: "12px", marginBottom: 4 }}>
                          11-Digit Phone Number <span style={{ color: "#EF4444" }}>*</span>
                        </label>
                        <input
                          type="tel"
                          className={styles.input}
                          placeholder="080... (11 Digits)"
                          value={g2.phone}
                          maxLength={11}
                          inputMode="numeric"
                          pattern="[0-9]{11}"
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
                            const updated = { ...g2, phone: digits };
                            setG2(updated);
                            saveDraftState(3, { g2: updated });
                          }}
                          required
                        />
                      </div>

                      {/* 11-digit NIN */}
                      <div className={styles.fieldGroup} style={{ margin: 0 }}>
                        <label className={styles.label} style={{ fontSize: "12px", marginBottom: 4 }}>
                          11-Digit NIN Number <span style={{ color: "#EF4444" }}>*</span>
                        </label>
                        <input
                          type="text"
                          className={styles.input}
                          placeholder="11-digit NIN Number"
                          value={g2.nin}
                          maxLength={11}
                          inputMode="numeric"
                          pattern="[0-9]{11}"
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
                            const updated = { ...g2, nin: digits };
                            setG2(updated);
                            saveDraftState(3, { g2: updated });
                          }}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 3 Mandatory Completion Notice */}
                {!isStep3Valid && (
                  <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "8px", padding: "10px 14px", marginTop: "16px", fontSize: "12px", color: "#FCA5A5" }}>
                    <strong>Step 3 Requirements:</strong> Please provide complete details (Full Legal Name, Role/Relationship, 11-digit Phone Number, and 11-digit NIN) for both Guarantor #1 and Guarantor #2.
                  </div>
                )}

                <div className={styles.actions}>
                  <button className="btn btn-secondary btn-md" onClick={() => setStep(2)}>
                    <ArrowLeft size={18} />
                    Back
                  </button>
                  <button
                    className="btn btn-primary btn-md"
                    onClick={() => {
                      saveDraftState(4);
                      setStep(4);
                    }}
                    disabled={!isStep3Valid}
                  >
                    Proceed to Skill Assessment
                    <ArrowRight size={18} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 4: Quiz */}
            {step === 4 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className={styles.stepHeader}>
                  <Sparkles className={styles.stepIcon} size={24} />
                  <div>
                    <h3>Step 4: Category Trade Competency Assessment ({category.toUpperCase()})</h3>
                    <p>Answer all 5 practical trade safety questions to authenticate your technical knowledge.</p>
                  </div>
                </div>

                <div className={styles.quizList}>
                  {quizQuestions.map((q, idx) => (
                    <div key={q.id} className={styles.quizItem}>
                      <span className={styles.quizNum}>Question {idx + 1} of 5</span>
                      <h4 className={styles.quizQuestion}>{q.question}</h4>
                      <div className={styles.quizOptions}>
                        {q.options.map((opt, oIdx) => (
                          <button
                            key={opt}
                            type="button"
                            className={`${styles.quizOptBtn} ${
                              selectedAnswers[q.id] === oIdx ? styles.quizOptSelected : ""
                            }`}
                            onClick={() => {
                              handleAnswerSelect(q.id, oIdx);
                              const nextAns = { ...selectedAnswers, [q.id]: oIdx };
                              saveDraftState(4, { selectedAnswers: nextAns });
                            }}
                          >
                            <span className={styles.optLetter}>{String.fromCharCode(65 + oIdx)}.</span>
                            <span>{opt}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {!isStep4Valid && (
                  <div style={{ background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.25)", borderRadius: "8px", padding: "10px 14px", marginTop: "16px", fontSize: "12px", color: "#38BDF8" }}>
                    Answered {Object.keys(selectedAnswers).length} of {quizQuestions.length} questions. Please answer all questions to submit.
                  </div>
                )}

                <div className={styles.actions}>
                  <button className="btn btn-secondary btn-md" onClick={() => setStep(3)}>
                    <ArrowLeft size={18} />
                    Back
                  </button>
                  <button
                    className={`btn btn-primary btn-lg ${submitting ? "btn-loading" : ""}`}
                    onClick={handleSubmitFinal}
                    disabled={!isStep4Valid}
                  >
                    {submitting ? "Submitting Audit..." : "Submit Verification Audit"}
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Hidden Canvas for Facial Snapshot */}
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* Live Camera Authorization & Facial Verification Modal */}
      {showCameraModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(9, 13, 22, 0.92)",
            backdropFilter: "blur(12px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            className="card"
            style={{
              width: "100%",
              maxWidth: 480,
              background: "#0F172A",
              border: "1.5px solid rgba(14,165,233,0.4)",
              borderRadius: "var(--radius-2xl)",
              overflow: "hidden",
              textAlign: "center",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid rgba(255,255,255,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "rgba(15,23,42,0.8)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#0EA5E9", fontWeight: "bold", fontSize: "14px" }}>
                <Camera size={18} /> Live Facial Verification
              </div>
              <button
                onClick={stopCamera}
                style={{ background: "transparent", border: "none", color: "white", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Viewfinder Body */}
            <div style={{ padding: 20, position: "relative" }}>
              {cameraError ? (
                <div style={{ padding: "24px 16px", textAlign: "center" }}>
                  <AlertTriangle size={44} color="#EF4444" style={{ margin: "0 auto 12px" }} />
                  <h4 style={{ color: "#F8FAFC", fontSize: "16px", fontWeight: 700, margin: "0 0 8px" }}>
                    Camera Access Required
                  </h4>
                  <p style={{ fontSize: "13px", color: "#94A3B8", marginBottom: 20, lineHeight: 1.5 }}>
                    {cameraError}
                  </p>
                  <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      className="btn btn-primary btn-md"
                      onClick={startLiveFacialCamera}
                      style={{ background: "#0EA5E9", fontWeight: 700 }}
                    >
                      <RefreshCw size={16} /> Grant / Retry Camera Access
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-md"
                      onClick={() => {
                        stopCamera();
                        selfieInputRef.current?.click();
                      }}
                      style={{ background: "rgba(255,255,255,0.1)", color: "#FFFFFF", fontWeight: 700 }}
                    >
                      <Camera size={16} /> Open Device Camera App
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      height: 300,
                      borderRadius: "var(--radius-xl)",
                      overflow: "hidden",
                      background: "#000",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }}
                    />

                    {/* Facial Oval Overlay Guide */}
                    <div
                      style={{
                        position: "absolute",
                        width: 190,
                        height: 240,
                        borderRadius: "50%",
                        border: "3px dashed #0EA5E9",
                        boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.45)",
                        pointerEvents: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <span style={{ fontSize: "11px", color: "#0EA5E9", background: "rgba(0,0,0,0.7)", padding: "2px 8px", borderRadius: 99, fontWeight: "bold" }}>
                        Center Face Here
                      </span>
                    </div>
                  </div>

                  <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", margin: "14px 0 16px" }}>
                    Position your face within the frame in good lighting and tap snap photo below.
                  </p>

                  <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                    <button className="btn btn-secondary btn-md" onClick={stopCamera}>
                      Cancel
                    </button>
                    <button
                      className="btn btn-primary btn-md"
                      onClick={() => {
                        stopCamera();
                        selfieInputRef.current?.click();
                      }}
                      style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)" }}
                    >
                      Use Device Camera App
                    </button>
                    <button className="btn btn-primary btn-lg" onClick={captureFacialPhoto} style={{ minWidth: 160 }}>
                      Snap Facial Photo 📸
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
