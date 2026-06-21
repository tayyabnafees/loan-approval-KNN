# Loan Approval Forecasting Webapp

An end-to-end predictive machine learning pipeline designed to automate and evaluate loan application decisions using a K-Nearest Neighbors (KNN) classification framework. This project processes mixed tabular applicant data, addresses severe class imbalances, and optimizes neighbor proximity features to forecast loan eligibility.

---

## 🚀 Key Engineering & Optimization Steps

During development, the baseline model fell into a common classification trap: due to an imbalanced dataset, it blindly predicted "Approved" for almost every row. The pipeline was restructured with the following data science methodologies to optimize real predictive power:

* **Geometric Distortion Fix (One-Hot Encoding)**: Swapped out standard Label Encoding for `pd.get_dummies()`. This prevents the KNN distance equations from assuming an arbitrary mathematical order or priority on non-ordinal text strings (such as Gender, Married status, or Education level).
* **Imbalance Resolution (SMOTE)**: Integrated Synthetic Minority Over-sampling Technique (`SMOTE`) strictly within the training split boundaries to synthetically scale up minority class instances ("Rejected" applications) without causing data leakage into the test evaluation set.
* **Hyperparameter Tuning via GridSearchCV**: Executed an optimized cross-validation sweep over `n_neighbors` (ranges 5 to 25), comparing uniform voting metrics against inverse-distance metrics (`weights='distance'`) across both Manhattan and Euclidean mathematical spaces.
* **Strict Classification Metrics Alignment**: Removed misleading continuous regression metrics like Mean Absolute Error (MAE) and R-Squared (R²), which lack smooth numerical tracking on static binary targets. Performance is evaluated strictly via **Confusion Matrices**, **Precision**, **Recall**, and **F1-Scores**.

---

## 🛠️ Technology Stack
* **Language:** Python 3.11
* **Core Frameworks:** Scikit-Learn, Pandas, NumPy, Imbalanced-Learn (`imblearn`)
* **Visualization:** Matplotlib, Seaborn

---

## 📦 Project Directory Structure
```text
loan-approval-KNN/
├── backend/               # Server-side predictive logic & API endpoints
│   └── train_model.py     # Main model script
├── frontend/              # Interactive user interface code
├── data.csv               # Baseline loan applicants dataset
└── loan applications KNN.ipynb  # Interactive development & experimentation notebook
```

---

## 📊 Core Performance & Evaluation

The final model moves away from biased majority-class guesswork to actively flag high-risk applications. 

### Final Optimization Metrics Output
* **Hyperparameter Selection**: Optimizes neighborhood validation counts natively by utilizing Manhattan metrics to better handle the binary layout of dummy fields.
* **Granular Target Profiling**: Evaluates independent performance weights for both classes (`Rejected (0)` and `Approved (1)`) to ensure steady business-risk management tracking.

---

## 📥 Getting Started Locally

### 1. Clone the repository
```bash
git clone https://github.com
cd loan-approval-KNN
```

### 2. Install dependencies
```bash
pip install -r backend/requirements.txt
```

### 3. Run the development environment
Open and run `loan applications KNN.ipynb` via Google Colab, Jupyter Notebook, or VS Code to step through the preprocessing, training, and visualization layers.
