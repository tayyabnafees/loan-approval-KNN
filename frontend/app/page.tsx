"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";

// Interface definitions
interface FormData {
  Gender: string;
  Married: string;
  Dependents: string;
  Education: string;
  Self_Employed: string;
  ApplicantIncome: string;
  CoapplicantIncome: string;
  LoanAmount: string;
  Loan_Amount_Term: string;
  Credit_History: string;
  Property_Area: string;
}

interface PredictionResult {
  prediction: string;
  probability: number;
  status_code: number;
}

interface HistoryItem {
  id: string;
  timestamp: string;
  inputs: FormData;
  result: PredictionResult;
}

// Preset applicant profiles
const PRESETS = {
  prime: {
    name: "Prime Graduate",
    data: {
      Gender: "Male",
      Married: "Yes",
      Dependents: "0",
      Education: "Graduate",
      Self_Employed: "No",
      ApplicantIncome: "6500",
      CoapplicantIncome: "2200",
      LoanAmount: "160",
      Loan_Amount_Term: "360",
      Credit_History: "1.0",
      Property_Area: "Semiurban",
    },
  },
  highrisk: {
    name: "High Risk Applicant",
    data: {
      Gender: "Female",
      Married: "No",
      Dependents: "2",
      Education: "Not Graduate",
      Self_Employed: "Yes",
      ApplicantIncome: "2400",
      CoapplicantIncome: "0",
      LoanAmount: "140",
      Loan_Amount_Term: "360",
      Credit_History: "0.0",
      Property_Area: "Rural",
    },
  },
  entrepreneur: {
    name: "Young Business Owner",
    data: {
      Gender: "Male",
      Married: "No",
      Dependents: "0",
      Education: "Graduate",
      Self_Employed: "Yes",
      ApplicantIncome: "8200",
      CoapplicantIncome: "1500",
      LoanAmount: "240",
      Loan_Amount_Term: "180",
      Credit_History: "1.0",
      Property_Area: "Urban",
    },
  },
};

// Imputation default labels shown inline
const IMPUTATION_LABELS = {
  Gender: "Male",
  Married: "Yes",
  Dependents: "0",
  Education: "Graduate",
  Self_Employed: "No",
  ApplicantIncome: "3812",
  CoapplicantIncome: "1188",
  LoanAmount: "128",
  Loan_Amount_Term: "360",
  Credit_History: "Good (1.0)",
  Property_Area: "Semiurban",
};

export default function Home() {
  // Form State
  const [formData, setFormData] = useState<FormData>({
    Gender: "",
    Married: "",
    Dependents: "",
    Education: "",
    Self_Employed: "",
    ApplicantIncome: "",
    CoapplicantIncome: "",
    LoanAmount: "",
    Loan_Amount_Term: "",
    Credit_History: "",
    Property_Area: "",
  });

  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("credi_knn_history");
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save history helper
  const saveHistory = (newHistory: HistoryItem[]) => {
    setHistory(newHistory);
    localStorage.setItem("credi_knn_history", JSON.stringify(newHistory));
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setActivePreset(null); // Clear preset selection if manual modification happens
  };

  const loadPreset = (presetKey: keyof typeof PRESETS) => {
    setFormData(PRESETS[presetKey].data);
    setActivePreset(presetKey);
    setError(null);
  };

  const clearForm = () => {
    setFormData({
      Gender: "",
      Married: "",
      Dependents: "",
      Education: "",
      Self_Employed: "",
      ApplicantIncome: "",
      CoapplicantIncome: "",
      LoanAmount: "",
      Loan_Amount_Term: "",
      Credit_History: "",
      Property_Area: "",
    });
    setActivePreset(null);
    setResult(null);
    setError(null);
  };

  const clearHistory = () => {
    saveHistory([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    // Format request payload (convert numbers to floats, leave empty fields as null for API imputation)
    const payload: Record<string, string | number | null> = {};
    
    // Categorical mappings
    const keys: (keyof FormData)[] = [
      "Gender",
      "Married",
      "Dependents",
      "Education",
      "Self_Employed",
      "Property_Area",
    ];
    keys.forEach((key) => {
      payload[key] = formData[key] !== "" ? formData[key] : null;
    });

    // Numerical mappings
    const numKeys: (keyof FormData)[] = [
      "ApplicantIncome",
      "CoapplicantIncome",
      "LoanAmount",
      "Loan_Amount_Term",
      "Credit_History",
    ];
    numKeys.forEach((key) => {
      payload[key] = formData[key] !== "" ? parseFloat(formData[key]) : null;
    });

    try {
      // Pointing to local FastAPI backend port 8000
      const response = await fetchconst response = await fetch('/api/predict', { ... })
;

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }

      const data: PredictionResult = await response.json();
      setResult(data);

      // Create new history log
      const newHistoryItem: HistoryItem = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        inputs: { ...formData },
        result: data,
      };
      
      saveHistory([newHistoryItem, ...history.slice(0, 4)]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to connect to the prediction server. Make sure the backend FastAPI is running on port 8000.");
    } finally {
      setLoading(false);
    }
  };

  // Load values from historical prediction back into the form
  const loadHistoryItem = (item: HistoryItem) => {
    setFormData(item.inputs);
    setResult(item.result);
    setActivePreset(null);
    setError(null);
  };

  // Circular gauge logic
  const confidencePercent = result ? Math.round(result.probability * 100) : 0;
  const strokeDashoffset = 502 - (502 * confidencePercent) / 100;

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <header className={styles.appHeader}>
        <div className={styles.titleContainer}>
          <svg
            className={styles.logoIcon}
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v1" />
            <path d="M18 8h4a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-4" />
            <circle cx="7.5" cy="12" r="2.5" />
            <path d="m11.5 15.5 3.5-3.5-3.5-3.5" />
          </svg>
          <h1 className={styles.appTitle}>CrediKNN</h1>
        </div>
        <p className={styles.appSubtitle}>
          Real-time loan approval assessment powered by an optimized K-Nearest Neighbors Classifier model.
        </p>
      </header>

      {/* Preset Pickers */}
      <section className={styles.presetsContainer}>
        <span className={styles.sectionLabel}>Quick Test Presets</span>
        <div className={styles.presetsGrid}>
          <button
            type="button"
            className={`${styles.presetBtn} ${activePreset === "prime" ? styles.presetBtnActive : ""}`}
            onClick={() => loadPreset("prime")}
          >
            🌟 Prime Graduate
          </button>
          <button
            type="button"
            className={`${styles.presetBtn} ${activePreset === "highrisk" ? styles.presetBtnActive : ""}`}
            onClick={() => loadPreset("highrisk")}
          >
            ⚠️ High Risk Profile
          </button>
          <button
            type="button"
            className={`${styles.presetBtn} ${activePreset === "entrepreneur" ? styles.presetBtnActive : ""}`}
            onClick={() => loadPreset("entrepreneur")}
          >
            💼 Young Entrepreneur
          </button>
          <button type="button" className={styles.presetBtn} onClick={clearForm}>
            Reset Form
          </button>
        </div>
      </section>

      {/* Main Grid */}
      <main className={styles.mainGrid}>
        {/* Left Form Panel */}
        <section className={`${styles.glassPanel}`}>
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.formGrid}>
              
              {/* Gender */}
              <div className={styles.formGroup}>
                <label className={styles.inputLabel} htmlFor="Gender">
                  Gender
                  {!formData.Gender && <span className={styles.imputedTag}>Impute: {IMPUTATION_LABELS.Gender}</span>}
                </label>
                <select
                  id="Gender"
                  name="Gender"
                  className={styles.selectField}
                  value={formData.Gender}
                  onChange={handleInputChange}
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              {/* Married */}
              <div className={styles.formGroup}>
                <label className={styles.inputLabel} htmlFor="Married">
                  Married
                  {!formData.Married && <span className={styles.imputedTag}>Impute: {IMPUTATION_LABELS.Married}</span>}
                </label>
                <select
                  id="Married"
                  name="Married"
                  className={styles.selectField}
                  value={formData.Married}
                  onChange={handleInputChange}
                >
                  <option value="">Select marital status</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              {/* Dependents */}
              <div className={styles.formGroup}>
                <label className={styles.inputLabel} htmlFor="Dependents">
                  Dependents
                  {!formData.Dependents && <span className={styles.imputedTag}>Impute: {IMPUTATION_LABELS.Dependents}</span>}
                </label>
                <select
                  id="Dependents"
                  name="Dependents"
                  className={styles.selectField}
                  value={formData.Dependents}
                  onChange={handleInputChange}
                >
                  <option value="">Select dependents count</option>
                  <option value="0">0</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3+">3+</option>
                </select>
              </div>

              {/* Education */}
              <div className={styles.formGroup}>
                <label className={styles.inputLabel} htmlFor="Education">
                  Education
                  {!formData.Education && <span className={styles.imputedTag}>Impute: {IMPUTATION_LABELS.Education}</span>}
                </label>
                <select
                  id="Education"
                  name="Education"
                  className={styles.selectField}
                  value={formData.Education}
                  onChange={handleInputChange}
                >
                  <option value="">Select education level</option>
                  <option value="Graduate">Graduate</option>
                  <option value="Not Graduate">Not Graduate</option>
                </select>
              </div>

              {/* Self Employed */}
              <div className={styles.formGroup}>
                <label className={styles.inputLabel} htmlFor="Self_Employed">
                  Self Employed
                  {!formData.Self_Employed && <span className={styles.imputedTag}>Impute: {IMPUTATION_LABELS.Self_Employed}</span>}
                </label>
                <select
                  id="Self_Employed"
                  name="Self_Employed"
                  className={styles.selectField}
                  value={formData.Self_Employed}
                  onChange={handleInputChange}
                >
                  <option value="">Select status</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              {/* Property Area */}
              <div className={styles.formGroup}>
                <label className={styles.inputLabel} htmlFor="Property_Area">
                  Property Area
                  {!formData.Property_Area && <span className={styles.imputedTag}>Impute: {IMPUTATION_LABELS.Property_Area}</span>}
                </label>
                <select
                  id="Property_Area"
                  name="Property_Area"
                  className={styles.selectField}
                  value={formData.Property_Area}
                  onChange={handleInputChange}
                >
                  <option value="">Select property area</option>
                  <option value="Urban">Urban</option>
                  <option value="Semiurban">Semiurban</option>
                  <option value="Rural">Rural</option>
                </select>
              </div>

              {/* Applicant Income */}
              <div className={styles.formGroup}>
                <label className={styles.inputLabel} htmlFor="ApplicantIncome">
                  Applicant Monthly Income ($)
                  {!formData.ApplicantIncome && <span className={styles.imputedTag}>Impute: {IMPUTATION_LABELS.ApplicantIncome}</span>}
                </label>
                <input
                  id="ApplicantIncome"
                  name="ApplicantIncome"
                  type="number"
                  placeholder="e.g. 5000"
                  className={styles.inputField}
                  value={formData.ApplicantIncome}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>

              {/* Coapplicant Income */}
              <div className={styles.formGroup}>
                <label className={styles.inputLabel} htmlFor="CoapplicantIncome">
                  Co-applicant Monthly Income ($)
                  {!formData.CoapplicantIncome && <span className={styles.imputedTag}>Impute: {IMPUTATION_LABELS.CoapplicantIncome}</span>}
                </label>
                <input
                  id="CoapplicantIncome"
                  name="CoapplicantIncome"
                  type="number"
                  placeholder="e.g. 1500"
                  className={styles.inputField}
                  value={formData.CoapplicantIncome}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>

              {/* Loan Amount */}
              <div className={styles.formGroup}>
                <label className={styles.inputLabel} htmlFor="LoanAmount">
                  Loan Amount ($ in Thousands)
                  {!formData.LoanAmount && <span className={styles.imputedTag}>Impute: {IMPUTATION_LABELS.LoanAmount}k</span>}
                </label>
                <input
                  id="LoanAmount"
                  name="LoanAmount"
                  type="number"
                  placeholder="e.g. 150 (for $150,000)"
                  className={styles.inputField}
                  value={formData.LoanAmount}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>

              {/* Loan Amount Term */}
              <div className={styles.formGroup}>
                <label className={styles.inputLabel} htmlFor="Loan_Amount_Term">
                  Loan Term (Months)
                  {!formData.Loan_Amount_Term && <span className={styles.imputedTag}>Impute: {IMPUTATION_LABELS.Loan_Amount_Term}</span>}
                </label>
                <input
                  id="Loan_Amount_Term"
                  name="Loan_Amount_Term"
                  type="number"
                  placeholder="e.g. 360 (30 Years)"
                  className={styles.inputField}
                  value={formData.Loan_Amount_Term}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>

              {/* Credit History Slider */}
              <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                <label className={styles.inputLabel} htmlFor="Credit_History">
                  Credit History
                  <span className={styles.sliderValueDisplay}>
                    {formData.Credit_History === "1.0"
                      ? "Good History (1.0)"
                      : formData.Credit_History === "0.0"
                      ? "No/Bad History (0.0)"
                      : `Defaults to Good (1.0)`}
                  </span>
                </label>
                <input
                  id="Credit_History"
                  name="Credit_History"
                  type="range"
                  min="-1"
                  max="1"
                  step="1"
                  className={styles.rangeInput}
                  value={formData.Credit_History === "" ? "-1" : formData.Credit_History === "0.0" ? "0" : "1"}
                  onChange={(e) => {
                    const val = e.target.value;
                    let targetVal = "";
                    if (val === "0") targetVal = "0.0";
                    if (val === "1") targetVal = "1.0";
                    setFormData((prev) => ({ ...prev, Credit_History: targetVal }));
                    setActivePreset(null);
                  }}
                />
              </div>
            </div>

            {error && <p style={{ color: "var(--danger)", fontSize: "0.9rem", marginTop: "0.5rem" }}>{error}</p>}

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? (
                <>
                  <div className={styles.spinner}></div>
                  Analyzing Profiles...
                </>
              ) : (
                <>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                  Analyze Risk (KNN)
                </>
              )}
            </button>
          </form>
        </section>

        {/* Right Outputs Section */}
        <section className={styles.visualizerWrapper}>
          
          {/* Output Card */}
          <div className={`${styles.glassPanel}`}>
            {!result ? (
              <div className={styles.emptyState}>
                <svg
                  className={styles.emptyIcon}
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="18" height="18" x="3" y="3" rx="2" />
                  <path d="M9 17V7" />
                  <path d="M15 17v-4" />
                  <path d="M15 9V7" />
                </svg>
                <h3 className={styles.emptyTitle}>Awaiting Submission</h3>
                <p className={styles.emptyDesc}>
                  Enter applicant financial details and submit the profile to run the K-Nearest Neighbors evaluation.
                </p>
              </div>
            ) : (
              <div className={styles.resultPanel}>
                <h3 className={styles.resultTitle}>Risk Analysis Result</h3>
                
                {/* Result Badge */}
                <div
                  className={`${styles.badge} ${
                    result.prediction === "Approved" ? styles.badgeApproved : styles.badgeRejected
                  }`}
                >
                  {result.prediction === "Approved" ? "Approved" : "Rejected"}
                </div>

                {/* Circular Gauge */}
                <div className={styles.gaugeContainer}>
                  <svg className={styles.gaugeSvg} viewBox="0 0 180 180">
                    <circle className={styles.gaugeBg} cx="90" cy="90" r="80" />
                    <circle
                      className={`${styles.gaugeFill} ${
                        result.prediction === "Approved" ? styles.gaugeApprovedStroke : styles.gaugeRejectedStroke
                      }`}
                      cx="90"
                      cy="90"
                      r="80"
                      strokeDasharray="502"
                      strokeDashoffset={strokeDashoffset}
                    />
                  </svg>
                  <div className={styles.gaugeTextWrapper}>
                    <span className={styles.gaugeValue}>{confidencePercent}%</span>
                    <span className={styles.gaugeLabel}>Confidence</span>
                  </div>
                </div>

                {/* Narrative Explanation */}
                <p className={styles.explanationText}>
                  Our classifier is <span className={styles.highlightText}>{confidencePercent}% confident</span> that this loan application will be{" "}
                  <span
                    className={styles.highlightText}
                    style={{ color: result.prediction === "Approved" ? "var(--success)" : "var(--danger)" }}
                  >
                    {result.prediction.toUpperCase()}
                  </span>.
                  <br />
                  <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "block", marginTop: "0.5rem" }}>
                    The KNN model references the 18 nearest customer records using the Manhattan distance metric to identify patterns.
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* History Card */}
          <div className={`${styles.glassPanel} ${styles.historyPanel}`}>
            <div className={styles.historyTitle}>
              <span>Recent Evaluations</span>
              {history.length > 0 && (
                <button className={styles.clearBtn} onClick={clearHistory}>
                  Clear Log
                </button>
              )}
            </div>
            {history.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", textAlign: "center", padding: "1rem" }}>
                No recent evaluations yet.
              </p>
            ) : (
              <div className={styles.historyList}>
                {history.map((item) => (
                  <div key={item.id} className={styles.historyItem} onClick={() => loadHistoryItem(item)}>
                    <div className={styles.historyDetails}>
                      <span className={styles.historyName}>
                        ${item.inputs.ApplicantIncome || IMPUTATION_LABELS.ApplicantIncome} / month
                      </span>
                      <span className={styles.historyMeta}>
                        Amount: ${item.inputs.LoanAmount || IMPUTATION_LABELS.LoanAmount}k • {item.timestamp}
                      </span>
                    </div>
                    <div className={styles.historyStatus}>
                      <span
                        className={`${styles.statusIndicator} ${
                          item.result.prediction === "Approved" ? styles.statusApproved : styles.statusRejected
                        }`}
                      >
                        {item.result.prediction === "Approved" ? "✓ Approved" : "✗ Rejected"}
                      </span>
                      <span className={styles.historyProb}>
                        {Math.round(item.result.probability * 100)}% Conf.
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
