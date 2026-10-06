import type { LegalDocument } from "@/component/legal/LegalDoc";

// Terms of Use shown at /terms, /auth/terms and in the app (sign-up asks users to accept them).
export const TERMS_OF_USE: LegalDocument = {
  title: "Terms of Use",
  updated: "6 October 2026",
  intro: [
    "HospiLink is operated by Hospilink Private Limited (\"HospiLink\", \"we\", \"us\"). These terms are an agreement between you and Hospilink Private Limited and apply to your use of the HospiLink website and mobile apps. By creating an account or using HospiLink, you agree to them and to our Privacy Policy. If you do not agree, please do not use HospiLink.",
  ],
  sections: [
    {
      title: "1. What HospiLink is",
      blocks: [
        "HospiLink is a platform that lets hospitals post short duties and permanent jobs, and lets verified doctors, nurses and other medical staff find and accept them. HospiLink is not the employer of medical staff and does not provide medical services. Each duty or job is an arrangement between the hospital and the staff member.",
      ],
    },
    {
      title: "2. Who can use it",
      blocks: [
        {
          bullets: [
            "You must be at least 18 years old.",
            "Medical staff must hold the qualifications and valid registration needed for the roles they accept.",
            "Hospitals must be legally allowed to operate and to engage the staff they request.",
            "You must give accurate information and keep it up to date.",
          ],
        },
      ],
    },
    {
      title: "3. Your account",
      blocks: [
        "Keep your password private; you are responsible for what happens under your account. Tell us at support@hospilink.in if you think someone else has used it. You can delete your account at any time from Profile → Account settings or at hospilink.in/delete-account.",
      ],
    },
    {
      title: "4. Verification",
      blocks: [
        "We check the documents you upload before you can take or post duties. Verification reduces risk but is not a guarantee: hospitals remain responsible for confirming that the staff they engage are fit for the role, and staff for confirming the hospital's details.",
      ],
    },
    {
      title: "5. Duties and jobs",
      blocks: [
        {
          bullets: [
            "When you accept a duty, you commit to attend at the time shown. When a hospital posts a duty, it commits to the role, time, place and rate shown.",
            "Cancel only when you must, and as early as possible. Late cancellations and no-shows may affect your rating or lead to restrictions on your account.",
            "Duties that are not filled may be offered again to more staff automatically.",
            "During an accepted duty, the staff member's live location is shared with the hospital while the app is open, as described in our Privacy Policy.",
            "Pay for a duty or job is agreed between the hospital and the staff member at the rate shown, unless HospiLink tells you otherwise in writing. HospiLink does not currently charge a fee or process payments.",
          ],
        },
      ],
    },
    {
      title: "6. Ratings and reviews",
      blocks: [
        "After a duty, hospitals and staff can rate each other. Reviews must be honest and about the duty. We may hide reviews that break these terms, and either side can report a review or dispute a rating through Support.",
      ],
    },
    {
      title: "7. Conduct",
      blocks: [
        "You must not:",
        {
          bullets: [
            "Harass, abuse, threaten or discriminate against anyone.",
            "Post false, misleading or offensive content, or someone else's personal data without permission.",
            "Pretend to be someone else or upload documents that are not yours.",
            "Use HospiLink to contact users for anything other than duties and jobs on HospiLink.",
            "Interfere with HospiLink, try to access accounts or data that are not yours, or copy data from it automatically.",
          ],
        },
        "You can block any hospital or staff member, and report them or their content from the ⋯ menu. We review reports and may remove content, restrict or suspend accounts.",
      ],
    },
    {
      title: "8. Suspension and ending your use",
      blocks: [
        "We may restrict, suspend or close an account that breaks these terms, puts patients or other users at risk, or where the law requires it. Where we can, we will tell you why and how to appeal through Support. You can stop using HospiLink and delete your account at any time.",
      ],
    },
    {
      title: "9. Our content",
      blocks: ["The HospiLink name, logo, apps and website belong to Hospilink Private Limited. You keep the rights in content you upload, and you allow us to use it to run the service."],
    },
    {
      title: "10. Responsibility",
      blocks: [
        "We work to keep HospiLink available and accurate, but we provide it as it is and cannot promise it will always be uninterrupted or error-free. HospiLink is not responsible for the clinical care given during a duty, or for disputes between hospitals and staff, although we will help through Support. Nothing in these terms limits rights you have under Indian consumer law.",
      ],
    },
    {
      title: "11. Changes",
      blocks: ["We may update these terms. We will post changes on this page and, if they are significant, tell you in the app or by email. Using HospiLink after a change means you accept the updated terms."],
    },
    {
      title: "12. Law and contact",
      blocks: [
        "These terms are governed by the laws of India, and the courts of Mumbai, Maharashtra have jurisdiction. Questions: info@hospilink.in. Complaints and support: support@hospilink.in (Grievance Officer: Sumit Thombre).",
      ],
    },
  ],
};
