import type { Certificate } from "@/lib/types";

export const certificates: Record<string, Certificate> = {
  "CST-2026-DAI-00842": {
    id: "CST-2026-DAI-00842",
    holderName: "Ravindra Suresh Patil",
    programmeTitle: "Dairy Cooperative Operations",
    issuer: "Institute of Rural Management, Anand",
    issueDate: "2026-06-18",
    expiryDate: "2029-06-18",
    status: "Valid",
    skillsCertified: ["Dairy Operations", "Quality Testing", "Logistics Planning"],
    grade: "A (Distinction)",
  },
  "CST-2025-COOP-01193": {
    id: "CST-2025-COOP-01193",
    holderName: "Sunita Devi Yadav",
    programmeTitle: "Cooperative Management Fundamentals",
    issuer: "National Cooperative Union of India Training Centre, Delhi",
    issueDate: "2025-12-02",
    expiryDate: "2028-12-02",
    status: "Valid",
    skillsCertified: ["Cooperative Management", "Governance", "Bylaws Drafting"],
    grade: "B+",
  },
  "CST-2024-CRD-00317": {
    id: "CST-2024-CRD-00317",
    holderName: "Mohammed Aslam Sheikh",
    programmeTitle: "Agricultural Credit Cooperative Management",
    issuer: "Vaikunth Mehta National Institute of Cooperative Management, Pune",
    issueDate: "2024-03-27",
    expiryDate: "2027-03-27",
    status: "Expired",
    skillsCertified: ["Credit Appraisal", "Risk Management", "Compliance"],
    grade: "A",
  },
  "CST-2026-DMK-00459": {
    id: "CST-2026-DMK-00459",
    holderName: "Priya Ramesh Bose",
    programmeTitle: "Digital Marketing for Cooperatives",
    issuer: "Laxmanrao Inamdar National Academy for Cooperative Research, Gandhinagar",
    issueDate: "2026-08-05",
    status: "Revoked",
    skillsCertified: ["Digital Marketing", "E-commerce"],
    grade: "B",
  },
};

export const sampleCertificateId = "CST-2026-DAI-00842";
