// Help guides. Every fact here comes from the product record (PRODUCT.md) and the app's signed-off copy.
export type Audience = "Hospitals" | "Staff" | "Everyone";

export interface GuideStep { t: string; d: string }
export interface GuideSection { h: string; p?: string[]; steps?: GuideStep[]; bullets?: string[]; note?: string }

export interface Guide {
  slug: string;
  title: string;
  description: string;
  audience: Audience;
  icon: string;
  minutes: number;
  intro: string;
  sections: GuideSection[];
  related: string[];
}

export const GUIDES: Guide[] = [
  {
    slug: "how-to-post-a-duty",
    title: "How to post a duty",
    description: "Post a short duty from the HospiLink hospital web app, choose the role and rate, and follow it until someone accepts.",
    audience: "Hospitals",
    icon: "square-plus",
    minutes: 3,
    intro: "A duty is a short shift you need covered: a night RMO, an ICU nurse for twelve hours, an OT technician tomorrow morning. Posting one takes a few minutes, and verified staff nearby see it straight away.",
    sections: [
      {
        h: "Before you start",
        bullets: [
          "Register your hospital on the HospiLink web app and complete your hospital profile, including the pinned location on the map. Duties start against that pin, not a typed address.",
          "Decide the role, the date and hours, and the rate you are offering.",
        ],
      },
      {
        h: "Post the duty",
        steps: [
          { t: "Open Post a duty", d: "From your hospital dashboard, start a new duty." },
          { t: "Choose the role", d: "Pick the exact role you need, for example RMO, ICU Nurse or OT Technician. Only verified staff in that role will see it." },
          { t: "Set the date and hours", d: "Duties are at least 3 hours long." },
          { t: "Set the rate", d: "The total for the duty has to be between ₹499 and ₹9,999. Staff see the rate before they accept." },
          { t: "Post it", d: "The offer goes out at once to verified staff within 30 km of your hospital." },
        ],
      },
      {
        h: "After you post",
        p: [
          "If nobody accepts, the reach widens by 5 km every hour, up to 75 km. You don't need to repost.",
          "The first person to accept gets the duty. You see who it is, their verified profile and rating, and you can follow them on the map as they travel to you.",
        ],
        note: "If it can't wait, raise an emergency request instead. It reaches staff across the city at once.",
      },
    ],
    related: ["how-duty-offers-reach-staff", "start-and-end-codes", "emergency-requests"],
  },
  {
    slug: "how-duty-offers-reach-staff",
    title: "How duty offers reach staff",
    description: "The order in which HospiLink sends a duty: invited staff, then staff within 30 km, widening 5 km an hour up to 75 km, or city-wide for emergencies.",
    audience: "Everyone",
    icon: "radar-2",
    minutes: 3,
    intro: "HospiLink does not blast a duty to everyone. It sends the offer to the right verified people, nearest first, and widens only when it has to. The first to accept gets it.",
    sections: [
      {
        h: "The order offers go out",
        steps: [
          { t: "Invited staff first", d: "If the hospital invited staff it trusts, those staff get a 30-minute window to accept before anyone else." },
          { t: "Staff who marked themselves free", d: "Staff who have switched on their availability get a 10-minute head start on new offers." },
          { t: "Everyone verified within 30 km", d: "The offer reaches verified staff in that role within 30 km of the hospital." },
          { t: "Widening every hour", d: "If nobody has accepted, the reach grows by 5 km an hour, up to 75 km." },
        ],
      },
      {
        h: "Emergency requests",
        p: ["Emergency requests skip the widening. They reach staff across the city straight away."],
      },
      {
        h: "What staff see",
        bullets: [
          "The role, the hospital, the date and hours, the distance, and the rate, before they accept.",
          "Location is only used while the app is open. HospiLink does not track staff in the background.",
        ],
      },
    ],
    related: ["how-to-post-a-duty", "emergency-requests", "start-and-end-codes"],
  },
  {
    slug: "getting-verified",
    title: "Getting verified as staff",
    description: "What HospiLink checks before you can take duties: identity through Aadhaar, medical registration, degree and licence, and what each document status means.",
    audience: "Staff",
    icon: "id-badge-2",
    minutes: 3,
    intro: "Only verified staff are shown duties. You get verified once, and hospitals see that verification every time you accept a duty or apply to a vacancy.",
    sections: [
      {
        h: "What we check",
        bullets: [
          "Identity through Aadhaar, checked with our verification provider, IDfy.",
          "Your medical registration (for example your MCIM or NCIM number) where your role needs one.",
          "Your degree and your practising licence where your role needs them.",
        ],
      },
      {
        h: "How to get verified",
        steps: [
          { t: "Install the app and sign up", d: "Choose the doctor or clinical staff account and pick your role." },
          { t: "Verify your identity", d: "Complete the Aadhaar check in the app." },
          { t: "Upload your documents", d: "Add your registration, degree and licence as photos or PDFs, each under 5 MB." },
          { t: "Wait for the checks", d: "Each document shows its status in the app. When everything you need is verified, duties near you start to appear." },
        ],
      },
      {
        h: "What the statuses mean",
        bullets: [
          "Verified: checked and accepted.",
          "Auto-verified: confirmed automatically against the source.",
          "Manual review: a person on the HospiLink team is checking it.",
          "Pending: waiting to be checked.",
          "Rejected: it couldn't be accepted. The app tells you why so you can upload it again.",
        ],
      },
    ],
    related: ["how-duty-offers-reach-staff", "applying-for-a-vacancy", "ratings-and-no-shows"],
  },
  {
    slug: "start-and-end-codes",
    title: "Start and end codes",
    description: "How a HospiLink duty starts with a code from the hospital's duty desk inside a 100 m geofence, and closes with an end code the hospital enters.",
    audience: "Everyone",
    icon: "password",
    minutes: 3,
    intro: "Every duty starts and ends with a 6-digit code. The codes prove the right person arrived at the right place and that the hospital agrees when the duty ended.",
    sections: [
      {
        h: "Starting a duty",
        steps: [
          { t: "Arrive at the hospital", d: "You need to be within 100 m of the hospital's pinned location." },
          { t: "Ask for your start code", d: "From 15 minutes before the start, request the code in the app. It goes to the hospital's duty desk, not to you." },
          { t: "The desk reads it out", d: "The duty desk reads the 6-digit code to you in person." },
          { t: "Enter it", d: "Type the code into the app. The code and your location are checked together, and the duty starts." },
        ],
        note: "No code, no start. Not at the hospital, no start. These checks can't be skipped.",
      },
      {
        h: "Ending a duty",
        steps: [
          { t: "Get your end code", d: "When the shift is over, request your end code. It arrives on your phone by SMS." },
          { t: "Read it to the duty desk", d: "Read the code out to the desk." },
          { t: "The desk enters it", d: "The hospital enters the code and the duty closes as completed." },
        ],
      },
      {
        h: "If the hospital doesn't enter the end code",
        p: ["The duty waits in pending confirmation. This is not a dispute. HospiLink follows it up with the hospital. If it stays like that, tell us from the app."],
      },
    ],
    related: ["how-to-post-a-duty", "ratings-and-no-shows", "getting-help-and-disputes"],
  },
  {
    slug: "emergency-requests",
    title: "Emergency requests",
    description: "When a shift can't wait, an emergency request on HospiLink reaches verified staff across the city at once instead of widening hour by hour.",
    audience: "Hospitals",
    icon: "urgent",
    minutes: 2,
    intro: "Most duties are posted ahead of time and widen their reach hour by hour. When the gap is now, raise an emergency request instead.",
    sections: [
      {
        h: "How it differs from a normal duty",
        bullets: [
          "It reaches verified staff across the city straight away, with no 30 km start and no hourly widening.",
          "It is marked as an emergency on the staff side, so it stands out from other offers.",
          "Everything else stays the same: verified staff only, the first to accept gets it, and it starts with a start code inside the 100 m geofence.",
        ],
      },
      {
        h: "Raise one",
        steps: [
          { t: "Open the emergency request", d: "From your hospital dashboard, choose emergency instead of a normal duty." },
          { t: "Pick the role and hours", d: "Choose the exact role and how long you need them." },
          { t: "Set the rate", d: "Staff see it before they accept." },
          { t: "Send it", d: "Follow the request live and see who accepts." },
        ],
      },
    ],
    related: ["how-to-post-a-duty", "how-duty-offers-reach-staff", "start-and-end-codes"],
  },
  {
    slug: "applying-for-a-vacancy",
    title: "Applying for a permanent vacancy",
    description: "Apply for a permanent hospital vacancy on HospiLink with your verified profile and résumé, pick an interview time, and follow your application to an offer.",
    audience: "Staff",
    icon: "briefcase-2",
    minutes: 3,
    intro: "Alongside short duties, hospitals on HospiLink post permanent vacancies. You apply with the profile you already verified, plus your résumé.",
    sections: [
      {
        h: "Apply",
        steps: [
          { t: "Find a vacancy", d: "Browse permanent vacancies on the website or in the app, by role or city." },
          { t: "Check the details", d: "Each vacancy shows the role, hospital, location, experience, education, skills and salary where the hospital has given them." },
          { t: "Apply in the app", d: "Sign in, add your résumé if you haven't already, and send your application." },
        ],
      },
      {
        h: "Follow your application",
        p: ["Your application moves through these steps, and you can see where it is at any time:"],
        steps: [
          { t: "Application sent", d: "The hospital has it." },
          { t: "Being reviewed", d: "The hospital is looking at your profile and résumé." },
          { t: "Shortlisted", d: "You're on the shortlist." },
          { t: "Pick an interview time", d: "The hospital has offered interview slots. Choose the one that suits you." },
          { t: "Interview scheduled", d: "The time is confirmed. Interviews happen on a Google Meet link the hospital sends you." },
          { t: "Offer received", d: "The hospital has made you an offer." },
          { t: "Hired", d: "Congratulations." },
        ],
        note: "An application can also end as not selected, or you can withdraw it yourself.",
      },
    ],
    related: ["getting-verified", "getting-help-and-disputes", "how-duty-offers-reach-staff"],
  },
  {
    slug: "ratings-and-no-shows",
    title: "Ratings, cancellations and no-shows",
    description: "How hospitals and staff rate each other on HospiLink, the 30-minute cancellation cut-off, and how no-shows affect a rating.",
    audience: "Everyone",
    icon: "star",
    minutes: 2,
    intro: "Ratings go both ways. Hospitals rate staff, and staff rate hospitals. They are how reliability becomes visible.",
    sections: [
      {
        h: "Ratings",
        bullets: [
          "After a completed duty, both sides can rate each other.",
          "Hospitals see a staff member's rating and the duties they have done before anyone arrives.",
        ],
      },
      {
        h: "Cancelling a duty you accepted",
        bullets: [
          "Staff can cancel up to 30 minutes before the start.",
          "Cancelling later than that, or not turning up, counts as a no-show.",
          "No-shows and late cancellations count against a rating.",
        ],
      },
    ],
    related: ["start-and-end-codes", "getting-help-and-disputes", "getting-verified"],
  },
  {
    slug: "getting-help-and-disputes",
    title: "Getting help and raising a dispute",
    description: "Help chat in English, Hindi and Marathi, support tickets, duty disputes with a 14-day timeline and written reasons, and how to block or report someone.",
    audience: "Everyone",
    icon: "lifebuoy",
    minutes: 3,
    intro: "When something goes wrong on a duty or an application, there is a process, and every step has a reference you can follow.",
    sections: [
      {
        h: "Where to start",
        steps: [
          { t: "Ask the help chat", d: "The in-app help chat answers in English, Hindi and Marathi." },
          { t: "Raise a ticket", d: "If the chat can't sort it out, raise a ticket. You get a reference number to follow." },
          { t: "Add evidence", d: "Attach what helps: photos, documents, messages." },
        ],
      },
      {
        h: "Duty disputes",
        bullets: [
          "Duty disputes are decided within 14 days, with written reasons.",
          "A duty waiting for its end code is in pending confirmation. That is not a dispute: HospiLink follows it up separately.",
          "You can appeal a decision from the app.",
        ],
      },
      {
        h: "Blocking and reporting",
        p: ["Both hospitals and staff can block or report anyone they have dealt with on HospiLink."],
      },
      {
        h: "Still stuck?",
        p: ["Write to support@hospilink.in. Complaints go to our Grievance Officer, Dr. Sumit Thombre, and we aim to resolve them within 30 days."],
      },
    ],
    related: ["start-and-end-codes", "ratings-and-no-shows", "applying-for-a-vacancy"],
  },
];

export const guideBySlug = (s: string) => GUIDES.find((g) => g.slug === s);
