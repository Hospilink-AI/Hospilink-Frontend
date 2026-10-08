import type { LegalDocument } from "./types";

// Privacy policy shown at /privacy-policy (store listings), /auth/privacy-policy and in the app.
// Keep in line with the data the app actually collects (see the data-safety notes).
export const PRIVACY_POLICY: LegalDocument = {
  title: "Privacy Policy",
  updated: "6 October 2026",
  intro: [
    "HospiLink is operated by Hospilink Private Limited (\"HospiLink\", \"we\", \"us\"). HospiLink connects hospitals with doctors, nurses and other medical staff for short duties and permanent jobs. This policy explains what personal data HospiLink collects through its website and mobile apps, why, who it is shared with, how long it is kept, and the choices you have.",
    "It applies to everyone who uses HospiLink: medical staff, hospitals and the HospiLink team. We process personal data in line with India's Digital Personal Data Protection Act, 2023 and the Information Technology Act, 2000.",
  ],
  sections: [
    {
      title: "1. Data we collect",
      blocks: [
        {
          sub: "Account details",
          blocks: [{ bullets: ["Name, email address and phone number.", "Your password, stored only in a scrambled (hashed) form we cannot read.", "Your role on HospiLink (medical staff, hospital or admin)."] }],
        },
        {
          sub: "Profile and professional details",
          blocks: [
            {
              bullets: [
                "Medical staff: job role, qualifications, experience, skills, city and address, profile photo, availability, and your CV if you apply for a job.",
                "Hospitals: hospital name, address and map position, departments and services, contact details and profile photo.",
              ],
            },
          ],
        },
        {
          sub: "Verification documents",
          blocks: [
            "Medical registration, licences, certificates and identity documents you upload so we can verify you. Identity documents may include your Aadhaar or other government ID.",
          ],
        },
        {
          sub: "Location",
          blocks: [
            "Medical staff only, and only while the app is open:",
            {
              bullets: [
                "Your approximate position, so hospitals nearby can find available staff and you can be offered duties close to you.",
                "Your live position during a duty you have accepted, shared with that hospital until the duty ends.",
              ],
            },
            "HospiLink does not track your location in the background or when the app is closed. You can turn location off in your phone settings; nearby duties and live tracking will then not work.",
          ],
        },
        {
          sub: "Activity on HospiLink",
          blocks: [
            {
              bullets: [
                "Duties you post, accept, complete or cancel; job vacancies and applications; invitations and favourites.",
                "Ratings and reviews you give and receive.",
                "Support tickets, messages, chatbot questions and files you attach.",
                "Blocks and reports you make.",
              ],
            },
          ],
        },
        {
          sub: "Device and technical data",
          blocks: [
            {
              bullets: [
                "A notification token, device id and platform, so we can send you push notifications.",
                "Sign-in and security records (for example IP address, time and what was changed), kept to protect accounts and investigate misuse.",
              ],
            },
            "We do not use advertising trackers, we do not collect your contacts, and we do not use your microphone. The website stores your sign-in session in your browser's local storage; it does not use advertising or analytics cookies.",
          ],
        },
      ],
    },
    {
      title: "2. Why we use it",
      blocks: [
        {
          bullets: [
            "To create and run your account and keep it secure.",
            "To verify medical staff and hospitals before they can work together.",
            "To match duties and jobs with suitable staff, including by distance.",
            "To show a hospital the live position of the staff member on its duty, and the route to the hospital.",
            "To send duty offers, reminders and other notifications by push, email and in the app.",
            "To handle support requests, complaints, ratings disputes and reports of misconduct.",
            "To keep the platform safe, prevent fraud and meet our legal obligations.",
            "To understand how HospiLink is used, using combined figures that do not identify you.",
          ],
        },
        "We use your data on the basis of your consent when you sign up and use HospiLink, and where the law allows us to without consent (for example to comply with a legal requirement or respond to an emergency).",
      ],
    },
    {
      title: "3. Who we share it with",
      blocks: [
        "We do not sell your personal data.",
        {
          sub: "Other users",
          blocks: [
            {
              bullets: [
                "Hospitals see the profile, rating, distance, city and an approximate area (not your exact position or street address) of nearby verified staff, so they can invite them. Your phone number and email are shared with a hospital once you are assigned to its duty, and the hospital sees your live position during that duty.",
                "Medical staff see the hospital's name, address, contact details and duty details.",
                "Reviews are shown to the person reviewed after both sides have reviewed, or 14 days after the shift.",
              ],
            },
          ],
        },
        {
          sub: "Service providers that work for us",
          blocks: [
            "These providers only use your data to provide their service to HospiLink:",
            {
              bullets: [
                "Railway, MongoDB and Redis: hosting and databases.",
                "Amazon Web Services (S3, SES): storing files and sending email.",
                "Google Firebase Cloud Messaging: push notifications.",
                "Google Maps Platform: turning addresses into map positions and working out distances.",
                "Google Cloud Vision: reading text from uploaded documents and CVs.",
                "Google Gemini: reading CVs for job applications and answering support chatbot questions.",
                "IDfy: identity verification.",
                "OpenStreetMap, OSRM and Esri: map images, address search and route lines on maps. These receive the area being viewed or the start and end points of a route.",
                "Our email provider: sign-in codes and notification emails.",
              ],
            },
            "Some of these providers may process data outside India, with safeguards required by law.",
          ],
        },
        {
          sub: "When the law requires it",
          blocks: ["We may share data when required by law, a court order or a government authority, or to protect someone's safety."],
        },
      ],
    },
    {
      title: "4. How long we keep it",
      blocks: [
        {
          bullets: [
            "While your account is open, we keep your data so the service works.",
            "If you delete your account, your personal data is removed 7 days after the request. Signing in during those 7 days cancels the deletion.",
            "Records of completed duties, ratings, payments and support cases are kept after that without your name or contact details, for accounting, disputes and safety.",
            "Security and activity records are kept for 90 days.",
            "Identity verification records held by our verification provider are kept for the period that provider and the law require.",
          ],
        },
      ],
    },
    {
      title: "5. Your rights and choices",
      blocks: [
        "You can:",
        {
          bullets: [
            "See and correct your details in your profile at any time.",
            "Delete your account in the app (Profile → Account settings → Delete account) or at hospilink.in/delete-account.",
            "Block a hospital or staff member, and report users or reviews.",
            "Turn off location or notification permissions in your phone settings.",
            "Withdraw your consent, ask for a summary of the data we hold about you, or nominate someone to act for you, by emailing support@hospilink.in.",
            "Raise a complaint with us, and if you are not satisfied with our answer, with the Data Protection Board of India.",
          ],
        },
        "We reply to requests within 30 days.",
      ],
    },
    {
      title: "6. How we protect your data",
      blocks: [
        "Data is sent over encrypted connections (HTTPS). Passwords are hashed. Documents are stored privately and opened through short-lived links. Access by the HospiLink team is limited by role and recorded. No system is completely secure, but we work to protect your data and will tell you and the authorities about a data breach as the law requires.",
      ],
    },
    {
      title: "7. Children",
      blocks: ["HospiLink is for working medical professionals and hospitals. It is not meant for anyone under 18, and we do not knowingly collect data from children."],
    },
    {
      title: "8. Changes to this policy",
      blocks: ["We will post any changes on this page and update the date at the top. If a change is significant, we will also tell you in the app or by email."],
    },
    {
      title: "9. Contact and grievances",
      blocks: [
        "For questions, requests or complaints about your personal data, contact our Grievance Officer:",
        { bullets: ["Sumit Thombre, Grievance Officer, Hospilink Private Limited", "Email: support@hospilink.in"] },
        "We aim to resolve complaints within 30 days. For anything else, write to info@hospilink.in.",
      ],
    },
  ],
};
