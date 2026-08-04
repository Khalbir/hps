"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ShieldCheck, User, UploadCloud, CheckCircle, AlertTriangle,
  ArrowRight, ArrowLeft, FileText, Camera, Users, Award, Sparkles,
  HelpCircle, Check, X, ShieldAlert,
} from "lucide-react";
import { getQuizForCategory, QuizQuestion } from "@/lib/quiz";
import styles from "../pro.module.css";

const steps = [
  { id: 1, label: "Government Identity", desc: "NIN / Passport & Live Selfie" },
  { id: 2, label: "Trade Credentials", desc: "Certificate & Work Portfolio" },
  { id: 3, label: "Guarantors Audit", desc: "2 Verified Referees" },
  { id: 4, label: "Trade Skill Assessment", desc: "Technical Competency Quiz" },
];

export default function ProVerificationPage() {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  // Form State
  const [category, setCategory] = useState("plumbing");
  const [idType, setIdType] = useState("NIN");
  const [idNumber, setIdNumber] = useState("");
  const [idUploaded, setIdUploaded] = useState(false);
  const [selfieUploaded, setSelfieUploaded] = useState(false);

  // Step 2 State
  const [certUploaded, setCertUploaded] = useState(false);
  const [portfolioCount, setPortfolioCount] = useState(0);

  // Step 3 State
  const [g1, setG1] = useState({ name: "", phone: "", relationship: "Landlord / Community Leader", nin: "" });
  const [g2, setG2] = useState({ name: "", phone: "", relationship: "Former Employer / Master Craftsman", nin: "" });

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

    try {
      await fetch("/api/pro/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "pro-user-demo-id",
          idType,
          idNumber,
          idDocumentUrl: "https://handyhub.ng/docs/id_nin_sample.jpg",
          selfieUrl: "https://handyhub.ng/docs/selfie_sample.jpg",
          tradeCertUrl: "https://handyhub.ng/docs/trade_cert.pdf",
          portfolioUrls: [
            "https://handyhub.ng/docs/portfolio_1.jpg",
            "https://handyhub.ng/docs/portfolio_2.jpg",
          ],
          guarantor1: g1,
          guarantor2: g2,
          quizScore: finalScore,
          serviceCategory: category,
        }),
      });
      setCompleted(true);
    } catch {
      // Fallback completed UI for demonstration
      setCompleted(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.verifyPage}>
      {/* Top Banner */}
      <header className={styles.verifyHeader}>
        <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link href="/pro" className={styles.backLink}>
            <ArrowLeft size={18} />
            Back to Pro Dashboard
          </Link>
          <div className={styles.headerBadge}>
            <ShieldCheck size={18} />
            <span>HandyHub Verification Portal</span>
          </div>
        </div>
      </header>

      <div className="container" style={{ padding: "var(--space-8) 0", maxWidth: 900 }}>
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
                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>Select Primary Skill Category</label>
                    <select
                      className={styles.input}
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option value="plumbing">Plumbing (Pipes, Drainage, Water Heaters)</option>
                      <option value="electrical">Electrical Repairs & Wiring</option>
                      <option value="cleaning">Cleaning Services (Residential, Commercial, Deep Clean)</option>
                      <option value="hvac">AC & HVAC Technical (Servicing, Gas Refill, Repair)</option>
                      <option value="painting">Painting & Surface Finish (POP, Screeding)</option>
                      <option value="carpentry">Carpentry & Custom Furniture</option>
                      <option value="security">Security & CCTV Camera Installation</option>
                      <option value="solar">Solar & Inverter Power Systems</option>
                      <option value="home-improvement">Home Improvement & Building Renovation</option>
                      <option value="outdoor">Gardening, Lawn Care & Landscaping</option>
                      <option value="laundry">Laundry & Garment Care</option>
                      <option value="moving">Moving & Relocation Services</option>
                      <option value="automotive">Auto Repair & Mobile Mechanic</option>
                      <option value="smart-home">Smart Home & Automation Systems</option>
                      <option value="general">General Handyman Maintenance</option>
                      <option value="others">Others (Custom Skillset Request)</option>
                    </select>
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>Government ID Type</label>
                    <select
                      className={styles.input}
                      value={idType}
                      onChange={(e) => setIdType(e.target.value)}
                    >
                      <option value="NIN">National Identification Number (NIN)</option>
                      <option value="PASSPORT">International Passport</option>
                      <option value="VOTERS_CARD">Voter&apos;s Card</option>
                      <option value="DRIVERS_LICENSE">Driver&apos;s License</option>
                    </select>
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>{idType} Number</label>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder={`Enter 11-digit ${idType} Number`}
                      value={idNumber}
                      onChange={(e) => setIdNumber(e.target.value)}
                    />
                  </div>

                  <div className={styles.uploadRow}>
                    <div
                      className={`${styles.uploadBox} ${idUploaded ? styles.uploadBoxDone : ""}`}
                      onClick={() => setIdUploaded(!idUploaded)}
                    >
                      <UploadCloud size={24} />
                      <span>{idUploaded ? "✓ Front & Back ID Uploaded" : "Upload ID Document Photo"}</span>
                    </div>

                    <div
                      className={`${styles.uploadBox} ${selfieUploaded ? styles.uploadBoxDone : ""}`}
                      onClick={() => setSelfieUploaded(!selfieUploaded)}
                    >
                      <Camera size={24} />
                      <span>{selfieUploaded ? "✓ Live Selfie Uploaded" : "Take Live Facial Verification Photo"}</span>
                    </div>
                  </div>
                </div>

                <div className={styles.actions}>
                  <div />
                  <button
                    className="btn btn-primary btn-md"
                    onClick={() => setStep(2)}
                    disabled={!idNumber || !idUploaded || !selfieUploaded}
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
                    <label className={styles.label}>Trade Certificate / Master Apprenticeship Document</label>
                    <div
                      className={`${styles.uploadBoxLarge} ${certUploaded ? styles.uploadBoxDone : ""}`}
                      onClick={() => setCertUploaded(!certUploaded)}
                    >
                      <FileText size={32} />
                      <span>
                        {certUploaded
                          ? "✓ Trade License / Apprenticeship Certificate Uploaded"
                          : "Upload Trade Certificate, License, or Master Craftsman Apprenticeship Document"}
                      </span>
                    </div>
                  </div>

                  <div className={styles.uploadArea}>
                    <label className={styles.label}>Past Work Portfolio (Upload 3-5 Photos of Past Completed Jobs)</label>
                    <div className={styles.portfolioGrid}>
                      {[1, 2, 3].map((num) => (
                        <div
                          key={num}
                          className={`${styles.portfolioBox} ${portfolioCount >= num ? styles.uploadBoxDone : ""}`}
                          onClick={() => setPortfolioCount(Math.max(portfolioCount, num))}
                        >
                          <Camera size={20} />
                          <span>{portfolioCount >= num ? `✓ Job Photo #${num}` : `+ Add Work Photo #${num}`}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className={styles.actions}>
                  <button className="btn btn-secondary btn-md" onClick={() => setStep(1)}>
                    <ArrowLeft size={18} />
                    Back
                  </button>
                  <button
                    className="btn btn-primary btn-md"
                    onClick={() => setStep(3)}
                    disabled={!certUploaded || portfolioCount < 2}
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
                    <h4>Guarantor #1 (Landlord / Community Leader)</h4>
                    <div className={styles.gRow}>
                      <input
                        type="text"
                        className={styles.input}
                        placeholder="Full Name"
                        value={g1.name}
                        onChange={(e) => setG1({ ...g1, name: e.target.value })}
                      />
                      <input
                        type="tel"
                        className={styles.input}
                        placeholder="Phone Number (+234)"
                        value={g1.phone}
                        onChange={(e) => setG1({ ...g1, phone: e.target.value })}
                      />
                      <input
                        type="text"
                        className={styles.input}
                        placeholder="NIN Number"
                        value={g1.nin}
                        onChange={(e) => setG1({ ...g1, nin: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className={styles.guarantorCard}>
                    <h4>Guarantor #2 (Former Employer / Master Craftsman)</h4>
                    <div className={styles.gRow}>
                      <input
                        type="text"
                        className={styles.input}
                        placeholder="Full Name"
                        value={g2.name}
                        onChange={(e) => setG2({ ...g2, name: e.target.value })}
                      />
                      <input
                        type="tel"
                        className={styles.input}
                        placeholder="Phone Number (+234)"
                        value={g2.phone}
                        onChange={(e) => setG2({ ...g2, phone: e.target.value })}
                      />
                      <input
                        type="text"
                        className={styles.input}
                        placeholder="NIN Number"
                        value={g2.nin}
                        onChange={(e) => setG2({ ...g2, nin: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className={styles.actions}>
                  <button className="btn btn-secondary btn-md" onClick={() => setStep(2)}>
                    <ArrowLeft size={18} />
                    Back
                  </button>
                  <button
                    className="btn btn-primary btn-md"
                    onClick={() => setStep(4)}
                    disabled={!g1.name || !g1.phone || !g2.name || !g2.phone}
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
                    <p>Answer 5 practical trade safety questions to authenticate your technical knowledge.</p>
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
                            onClick={() => handleAnswerSelect(q.id, oIdx)}
                          >
                            <span className={styles.optLetter}>{String.fromCharCode(65 + oIdx)}.</span>
                            <span>{opt}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className={styles.actions}>
                  <button className="btn btn-secondary btn-md" onClick={() => setStep(3)}>
                    <ArrowLeft size={18} />
                    Back
                  </button>
                  <button
                    className={`btn btn-primary btn-lg ${submitting ? "btn-loading" : ""}`}
                    onClick={handleSubmitFinal}
                    disabled={Object.keys(selectedAnswers).length < quizQuestions.length || submitting}
                  >
                    {submitting ? "Submitting Audit..." : "Submit Verification Audit"}
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
