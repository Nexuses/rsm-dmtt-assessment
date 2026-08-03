# **RSM UAE: E-Invoicing Mandate & Readiness Assessment**

Objective: To determine if your entity falls under the upcoming UAE E-Invoicing mandate (Phase 1 or Phase 2\) and assess your technical readiness for integration.

Assessment Provider: RSM UAE

## **Part 1: Mandate Applicability**

*These questions determine IF and WHEN you must comply.*

*Company legal name?*

*Full name.*

*Position*

*Contact number*

*Email address, business email address.*

*Website*

*—--*

**1\. Where is your business entity legally established?**

* \[ \] UAE Mainland  
* \[ \] UAE Free Zone  
* \[ \] Outside UAE (Non-Resident)

**Logic & Scoring (Urgency):**

* **Mainland:** High probability of Phase 1 inclusion. **(Points: 5\)**  
* **Free Zone:** Likely included, but specific Free Zones may have delayed timelines. **(Points: 3\)**  
* **Outside UAE:** Non-residents may have different compliance timelines. **(Points: 1\)**

**2\. What is your entity's approximate Annual Aggregate Turnover?**

* \[ \] Greater than AED 50 Million (Likely Phase 1\)  
* \[ \] Less than AED 50 Million (Likely Phase 2\)  
* \[ \] Not Registered for VAT

**Logic & Scoring (Urgency):**

* **\> AED 50M:** **Critical Priority.** Likely Phase 1 (July 2026). **(Points: 10\)**  
* **\< AED 50M:** Phase 2 (2027+). **(Points: 5\)**  
* **Not Registered:** Currently out of scope. **(Points: 0\)**

**3\. What is the nature of your primary transactions? (Select all that apply)**

* \[ \] B2B (Business to Business)  
* \[ \] B2G (Business to Government)  
* \[ \] B2C (Business to Consumer)

**Logic & Scoring (Urgency):**

* **B2B & B2G:** Primary targets for the mandate. **(Points: 5\)**  
* **B2C:** Often excluded from initial phases. **(Points: 1\)**

**4\. Do you operate in any of the following exempt or special sectors?**

* \[ \] Financial Services / Banking  
* \[ \] Passenger Transport Services  
* \[ \] Healthcare / Education  
* \[ \] None of the above (General Trading/Services/Manufacturing)

**Logic & Scoring (Urgency):**

* **Exempt Sectors:** May have complex partial exemptions. **(Points: 1\)**  
* **General Trading:** Standard compliance rules apply. **(Points: 3\)**

**5\. Are you currently registered for VAT in the UAE?**

* \[ \] Yes  
* \[ \] No

**Logic & Scoring:**

* **No:** Disqualifies from E-Invoicing (Score 0). **Yes:** Proceed.

## **Part 2: Volume & Scope**

*These questions determine the scale and complexity of the solution.*

**6\. What is your estimated annual volume of Sales Invoices (Outbound)?**

* \[ \] Less than 1,000 invoices/year  
* \[ \] 1,000 \- 10,000 invoices/year  
* \[ \] 10,000 \- 100,000 invoices/year  
* \[ \] 100,000+ invoices/year

**Logic & Scoring (Complexity):**

* **\< 1,000:** Simple Connector/Portal. **(Points: 1\)**  
* **1k \- 10k:** Standard Integration. **(Points: 3\)**  
* **10k \- 100k:** Robust Middleware required. **(Points: 5\)**  
* **100k+:** High Throughput Enterprise Solution. **(Points: 10\)**

**7\. How many distinct Legal Entities (Tax Registration Numbers) need to be onboarded?**

* \[ \] Single Entity (1 TRN)  
* \[ \] Multiple Entities (Separate TRNs)  
* \[ \] Tax Group (1 TRN for multiple entities)

**Logic & Scoring (Complexity):**

* **Single:** Standard. **(Points: 1\)**  
* **Multiple TRNs:** Multi-tenant setup required. **(Points: 5\)**  
* **Tax Group:** Complex internal reporting logic required. **(Points: 8\)**

**8\. Do you issue invoices from multiple locations or branches?**

* \[ \] No, centralized invoicing  
* \[ \] Yes, multiple branches issuing independently

**Logic & Scoring (Complexity):**

* **Centralized:** Simple. **(Points: 0\)**  
* **Multiple Branches:** Aggregation or multiple connectors needed. **(Points: 3\)**

**9\. Do you require e-invoicing compliance for countries other than the UAE?**

* \[ \] No, UAE only  
* \[ \] Yes, KSA (ZATCA)  
* \[ \] Yes, other Global mandates

**Logic & Scoring (Complexity):**

* **UAE Only:** Standard. **(Points: 0\)**  
* **Global/KSA:** Requires Unified Regional Solution. **(Points: 5\)**

## **Part 3: Technical Readiness**

*These questions determine the gap between current state and compliance.*

**10\. Which ERP or Accounting Software do you currently use?**

* \[ \] Tier 1: SAP / Oracle / Microsoft Dynamics  
* \[ \] Tier 2/Cloud: Sage / Zoho / QuickBooks / Xero  
* \[ \] Legacy/Custom-built ERP  
* \[ \] Manual: Excel / Word

**Logic & Scoring (Complexity/Gap):**

* **Tier 1:** High Readiness but high cost to modify. **(Points: 3\)**  
* **Tier 2:** Low Complexity (Plugins available). **(Points: 1\)**  
* **Custom ERP:** High Complexity (Custom API dev needed). **(Points: 8\)**  
* **Manual:** **Critical Gap** (Digitization required first). **(Points: 15\)**

**11\. Does your current system support API connectivity?**

* \[ \] Yes, REST/SOAP APIs are available  
* \[ \] No, we use SFTP / File exports (CSV/XML)  
* \[ \] No, Manual Only

**Logic & Scoring (Complexity/Gap):**

* **API:** Ready. **(Points: 0\)**  
* **SFTP:** Middleware transformation needed. **(Points: 5\)**  
* **Manual:** Portal/Typing solution needed. **(Points: 10\)**

**12\. Where is your invoice data currently hosted (Data Residency)?**

* \[ \] Cloud (UAE Region)  
* \[ \] Cloud (Global/Outside UAE)  
* \[ \] On-Premise Server (UAE)  
* \[ \] Local Computers/Laptops

**Logic & Scoring (Complexity/Gap):**

* **UAE Region/On-Prem:** Compliant. **(Points: 0\)**  
* **Global/Local:** Compliance Risk (Requires archiving solution). **(Points: 5\)**

**13\. Do you have an internal IT team capable of managing system integration?**

* \[ \] Yes, in-house team  
* \[ \] No, we rely on an external vendor  
* \[ \] No IT resources available

**Logic & Scoring (Complexity/Gap):**

* **In-house:** Low Support need. **(Points: 0\)**  
* **External/None:** Turnkey Service required. **(Points: 5\)**

## **Part 4: Invoice Complexity**

*These questions identify specific functional roadblocks.*

**14\. Do you handle "Self-Billing" (generating invoices on behalf of suppliers)?**

* \[ \] Yes  
* \[ \] No

**Score (Complexity):** Yes \= **5 points**

**15\. Do you have transactions involving the "Reverse Charge Mechanism" (RCM)?**

* \[ \] Yes  
* \[ \] No

**Score (Complexity):** Yes \= **2 points**

**16\. How many different invoice templates/formats do you actively use?**

* \[ \] 1 Standard Template (Points: 0\)  
* \[ \] 2-5 Variations (Points: 3\)  
* \[ \] 5+ Complex Templates (Points: 8\)

**17\. What is your preferred integration model?**

* \[ \] **Full Integration** (Points: 5 \- High Setup / Low Ops)  
* \[ \] **Hybrid** (Points: 3 \- Med Setup / Med Ops)  
* \[ \] **Manual** (Points: 0 \- Low Setup / High Ops)

## **Part 5: Assessment & Scoring Guide**

To generate the final recommendation, sum the points for **Axis A** (Urgency) and **Axis B** (Complexity).

### **Axis A: Mandate Urgency Score (Max 23 pts)**

*Questions 1, 2, 3, 4*

| Total Score | Category | RSM Recommendation |
| :---- | :---- | :---- |
| **18 \- 23** | **Critical / Phase 1** | **Immediate Action.** Client is a prime target for the July 2026 mandate. Mobilize assessment team immediately. |
| **10 \- 17** | **Phase 2 / High Likely** | **Planning Phase.** Likely targeted for 2027, but should start vendor selection now to avoid bottlenecks. |
| **0 \- 9** | **Low Priority / Exempt** | **Monitor.** Keep client informed of regulatory changes. No immediate implementation needed. |

### **Axis B: Implementation Complexity Score (Max 75+ pts)**

*Questions 6-17*

| Total Score | Category | Recommended Solution Approach |
| :---- | :---- | :---- |
| **40+** | **Enterprise / Complex** | **Custom Project.** Requires dedicated Project Manager, robust middleware, data residency handling, and significant ERP customization. |
| **20 \- 39** | **Standard Integration** | **Middleware Solution.** Use standard connectors (API/SFTP) with moderate mapping for multiple templates or entities. |
| **10 \- 19** | **Simple / Plugin** | **Plug & Play.** Use ready-made connectors for Tier 2 ERPs (Zoho/Xero) or simple direct API. |
| **0 \- 9** | **Manual / Portal** | **Portal Solution.** Volume is too low to justify integration. Recommend web-portal manual entry or excel upload. |

