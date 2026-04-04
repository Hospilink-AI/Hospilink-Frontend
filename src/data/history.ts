export const historyDuties = [
  {
    id: "1",
    title: "ER Nurse",
    hospital: "City General Hospital",
    date: "Oct 12, 2023",
    hours: "8 Hours",
    price: "₹320.00",
    rating: 5.0,
    status: "COMPLETED",
  },
  {
    id: "2",
    title: "Triage Support",
    hospital: "Metro Healthcare",
    date: "Oct 08, 2023",
    hours: "12 Hours",
    price: "₹480.00",
    rating: 4.8,
    status: "COMPLETED",
  },
  {
    id: "3",
    title: "Pediatric Specialist",
    hospital: "Children's Medical Center",
    date: "Oct 03, 2023",
    hours: "10 Hours",
    price: "₹550.00",
    rating: 4.9,
    status: "COMPLETED",
  },
  {
    id: "4",
    title: "Ward Assistant",
    hospital: "St. Jude's Infirmary",
    date: "Sep 28, 2023",
    hours: "8 Hours",
    price: "₹240.00",
    rating: 4.7,
    status: "COMPLETED",
  },
];

export const earningsData = [
  { date: "Oct 12, 2023", hospital: "City General Hospital",     role: "ER Nurse",             amount: "₹320.00" },
  { date: "Oct 08, 2023", hospital: "Metro Healthcare",          role: "Triage Support",       amount: "₹480.00" },
  { date: "Oct 03, 2023", hospital: "Children's Medical Center", role: "Pediatric Specialist", amount: "₹550.00" },
  { date: "Sep 28, 2023", hospital: "St. Jude's Infirmary",      role: "Ward Assistant",       amount: "₹240.00" },
  { date: "Sep 20, 2023", hospital: "City General Hospital",     role: "ER Nurse",             amount: "₹320.00" },
  { date: "Sep 15, 2023", hospital: "Metro Healthcare",          role: "Night Shift Lead",     amount: "₹600.00" },
  { date: "Sep 10, 2023", hospital: "Regional Clinic",           role: "General Practitioner", amount: "₹450.00" },
  { date: "Sep 05, 2023", hospital: "Children's Medical Center", role: "Consultant",           amount: "₹720.00" },
];

export const dutyDetails: Record<string, any> = {
  "1": {
    id: "1",
    title: "Duty Details - ER Nurse",
    hospital: "City General Hospital",
    dutyId: "#HL-82941-23",
    status: "COMPLETED",
    location: {
      ward: "Emergency Department, Wing B",
      address: "123 Medical Center Blvd, Metropolis, NY 10001",
    },
    time: {
      start: "Oct 12, 08:00 AM",
      end: "Oct 12, 04:00 PM",
      duration: "8 Hours",
    },
    summary:
      "Assigned to high-traffic Emergency Room during morning peak hours. Managed patient triage for 14 arrivals, assisted in 2 trauma stabilizations, and coordinated with the surgical team for immediate transfers. Maintained all electronic health records according to hospital standards.",
    responsibilities: [
      "Primary Triage Nurse",
      "Trauma Team Support",
      "EHR Documentation",
    ],
    earnings: "₹320.00",
    rating: 5.0,
    review:
      "Sarah was exceptional in the ER today. Her triage decisions were swift and accurate during the multi-car accident intake. Highly recommended.",
    reviewer: "Dr. Robert Chen",
    reviewerRole: "Chief of ER, City General",
  },
  "2": {
    id: "2",
    title: "Duty Details - Triage Support",
    hospital: "Metro Healthcare",
    dutyId: "#HL-82942-23",
    status: "COMPLETED",
    location: {
      ward: "Triage Unit, Floor 2",
      address: "456 Metro Ave, Metropolis, NY 10002",
    },
    time: {
      start: "Oct 08, 07:00 AM",
      end: "Oct 08, 07:00 PM",
      duration: "12 Hours",
    },
    summary:
      "Provided triage support during a high-volume shift. Assessed and prioritized over 30 patients, coordinated with attending physicians and ensured timely treatment.",
    responsibilities: [
      "Patient Assessment",
      "Priority Coordination",
      "Documentation",
    ],
    earnings: "₹480.00",
    rating: 4.8,
    review:
      "Excellent triage support. Handled the rush professionally and kept the team well coordinated.",
    reviewer: "Dr. Lisa Park",
    reviewerRole: "Head Nurse, Metro Healthcare",
  },
};