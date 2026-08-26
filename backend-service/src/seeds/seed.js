require("dotenv").config();
const mongoose = require("mongoose");
const {
  User,
  Team,
  Workflow,
  Customer,
  CustomerApplication,
  WorkItem,
  Activity,
  SyncJob,
  RefreshToken,
  Document,
} = require("../models");

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/workflow_management_db";

const seedDatabase = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("🌱 Connected to MongoDB for seeding...");

    // Clean existing collections
    await Promise.all([
      User.deleteMany({}),
      Team.deleteMany({}),
      Workflow.deleteMany({}),
      Customer.deleteMany({}),
      CustomerApplication.deleteMany({}),
      WorkItem.deleteMany({}),
      Activity.deleteMany({}),
      SyncJob.deleteMany({}),
      RefreshToken.deleteMany({}),
      Document.deleteMany({}),
    ]);
    console.log("🧹 Cleaned existing database collections.");

    // 1. Seed Teams
    const teams = await Team.create([
      { name: "North America Immigration Processing" }, // teams[0]
      { name: "Oceania Skilled Migration Desk" }, // teams[1]
      { name: "European Education & Admissions" }, // teams[2]
      { name: "Corporate Global Mobility Unit" }, // teams[3]
      { name: "Escalations & Dispute Resolution" }, // teams[4]
    ]);

    // 2. Seed Users (Admins, Managers, Executives)
    const users = await User.create([
      // Admins (teamId: null -> Global oversight)
      {
        name: "Rajesh Sharma",
        email: "admin.rajesh@workflowops.io",
        password: "Password@123",
        role: "admin",
        teamId: null,
      },
      {
        name: "Deepa Krishnan",
        email: "admin.deepa@workflowops.io",
        password: "Password@123",
        role: "admin",
        teamId: null,
      },
      // Managers (Scoped to respective department teams)
      {
        name: "Priyanka Verma",
        email: "manager.priyanka@workflowops.io",
        password: "Password@123",
        role: "manager",
        teamId: teams[0]._id, // North America
      },
      {
        name: "Amitabh Sen",
        email: "manager.amitabh@workflowops.io",
        password: "Password@123",
        role: "manager",
        teamId: teams[1]._id, // Oceania
      },
      {
        name: "Rohit Kulkarni",
        email: "manager.rohit@workflowops.io",
        password: "Password@123",
        role: "manager",
        teamId: teams[2]._id, // Europe
      },
      {
        name: "Shweta Mukherjee",
        email: "manager.shweta@workflowops.io",
        password: "Password@123",
        role: "manager",
        teamId: teams[3]._id, // Corporate Mobility
      },
      // Executives (Scoped to respective department teams)
      {
        name: "Vikram Joshi",
        email: "executive.vikram@workflowops.io",
        password: "Password@123",
        role: "executive",
        teamId: teams[0]._id, // North America
      },
      {
        name: "Ananya Iyer",
        email: "executive.ananya@workflowops.io",
        password: "Password@123",
        role: "executive",
        teamId: teams[0]._id, // North America
      },
      {
        name: "Utkarsh Gangwar",
        email: "utkarsh@workflowops.io",
        password: "Password@123",
        role: "executive",
        teamId: teams[0]._id, // North America
      },
      {
        name: "Suresh Menon",
        email: "executive.suresh@workflowops.io",
        password: "Password@123",
        role: "executive",
        teamId: teams[1]._id, // Oceania
      },
      {
        name: "Pooja Hegde",
        email: "executive.pooja@workflowops.io",
        password: "Password@123",
        role: "executive",
        teamId: teams[2]._id, // Europe
      },
      {
        name: "Nikhil Yadav",
        email: "nikhil@workflowops.io",
        password: "Password@123",
        role: "executive",
        teamId: teams[2]._id, // Europe
      },
      {
        name: "Farhan Akhtar",
        email: "executive.farhan@workflowops.io",
        password: "Password@123",
        role: "executive",
        teamId: teams[3]._id, // Corporate Mobility
      },
    ]);

    const adminRajesh = users[0];
    const managerNorthAmerica = users[2];
    const managerOceania = users[3];
    const managerEurope = users[4];
    const managerCorp = users[5];

    const execVikram = users[6];
    const execAnanya = users[7];
    const execUtkarsh = users[8];
    const execSuresh = users[9];
    const execPooja = users[10];
    const execNikhil = users[11];
    const execFarhan = users[12];

    // 3. Seed Workflows with explicit teamId and isUniversal flag
    const workflows = await Workflow.create([
      // Workflow 1: Skilled Worker PR -> Linked to North America Immigration Processing
      {
        name: "Federal Skilled Worker PR Program",
        code: "NA_SKILLED_PR",
        description:
          "Comprehensive skilled worker immigration pipeline for permanent residency applications.",
        teamId: teams[0]._id,
        isUniversal: false,
        active: true,
        createdBy: adminRajesh._id,
        stages: [
          {
            name: "NEW_REGISTRATION",
            orderNumber: 1,
            workRequired: [
              {
                workType: "ELIGIBILITY_CHECK",
                title: "Verify point-based score eligibility matrix",
              },
              {
                workType: "PAYMENT_CONFIRMATION",
                title: "Verify initial onboarding invoice",
              },
            ],
            allowedTransitions: ["DOCUMENTATION_STAGE", "CANCELLED"],
          },
          {
            name: "DOCUMENTATION_STAGE",
            orderNumber: 2,
            workRequired: [
              {
                workType: "ECA_VERIFICATION",
                title: "Audit Education Credential Assessment reports",
              },
              {
                workType: "IELTS_VERIFICATION",
                title: "Validate language proficiency scorecard",
              },
              {
                workType: "EXPERIENCE_LETTERS",
                title: "Audit primary occupation reference letters",
              },
            ],
            allowedTransitions: [
              "WAITING_FOR_INFO",
              "ITA_LODGEMENT",
              "CANCELLED",
            ],
          },
          {
            name: "WAITING_FOR_INFO",
            orderNumber: 3,
            workRequired: [
              {
                workType: "FOLLOW_UP",
                title: "Request updated financial statements and affidavits",
              },
            ],
            allowedTransitions: [
              "DOCUMENTATION_STAGE",
              "ITA_LODGEMENT",
              "CANCELLED",
            ],
          },
          {
            name: "ITA_LODGEMENT",
            orderNumber: 4,
            workRequired: [
              {
                workType: "PROFILE_SUBMISSION",
                title: "Submit formal profile in government registry",
              },
              {
                workType: "PCC_MEDICALS",
                title:
                  "Upload Police Clearance Certificate and medical diagnostics",
              },
            ],
            allowedTransitions: ["UNDER_REVIEW", "CANCELLED"],
          },
          {
            name: "UNDER_REVIEW",
            orderNumber: 5,
            workRequired: [
              {
                workType: "IRCC_TRACKING",
                title:
                  "Track Biometrics submission and statutory background audit",
              },
            ],
            allowedTransitions: ["COMPLETED", "CANCELLED"],
          },
          {
            name: "COMPLETED",
            orderNumber: 6,
            workRequired: [
              {
                workType: "COPR_DISPATCH",
                title: "Deliver Confirmation of Permanent Residence docket",
              },
            ],
            allowedTransitions: [],
          },
        ],
      },

      // Workflow 2: Points-Tested Independent Migration -> Linked to Oceania Skilled Migration Desk
      {
        name: "Skilled Independent Migration 189",
        code: "OC_189_SKILLED",
        description:
          "Points-tested independent permanent visa processing pipeline.",
        teamId: teams[1]._id,
        isUniversal: false,
        active: true,
        createdBy: adminRajesh._id,
        stages: [
          {
            name: "SKILLS_ASSESSMENT",
            orderNumber: 1,
            workRequired: [
              {
                workType: "ASSESSING_BODY_FILING",
                title: "Compile professional body skills dossier",
              },
              {
                workType: "PTE_VERIFICATION",
                title: "Verify PTE / Academic English credentials",
              },
            ],
            allowedTransitions: ["EOI_LODGEMENT", "CANCELLED"],
          },
          {
            name: "EOI_LODGEMENT",
            orderNumber: 2,
            workRequired: [
              {
                workType: "SKILLSELECT_PROFILE",
                title: "Create and lodge formal Expression of Interest",
              },
              {
                workType: "STATE_SPONSOR_OPT",
                title: "Evaluate territorial sponsorship eligibility matrix",
              },
            ],
            allowedTransitions: [
              "VISA_LODGEMENT",
              "SKILLS_ASSESSMENT",
              "CANCELLED",
            ],
          },
          {
            name: "VISA_LODGEMENT",
            orderNumber: 3,
            workRequired: [
              {
                workType: "IMMIACCOUNT_SUBMISSION",
                title: "Lodge statutory electronic visa application",
              },
              {
                workType: "NATIONAL_POLICE_CHECK",
                title: "Upload national and state background clearances",
              },
            ],
            allowedTransitions: ["COMPLETED", "CANCELLED"],
          },
          {
            name: "COMPLETED",
            orderNumber: 4,
            workRequired: [
              {
                workType: "VISA_GRANT_AUDIT",
                title: "Audit formal Visa Grant notification and entry dates",
              },
            ],
            allowedTransitions: [],
          },
        ],
      },

      // Workflow 3: Higher Education & Student Visa -> Linked to European Education & Admissions
      {
        name: "University Admission & Study Visa Pipeline",
        code: "EU_STUDENT_ADMISSIONS",
        description:
          "Higher education course enrollment, offer validation, and student visa filing.",
        teamId: teams[2]._id,
        isUniversal: false,
        active: true,
        createdBy: adminRajesh._id,
        stages: [
          {
            name: "UNIVERSITY_APPLICATIONS",
            orderNumber: 1,
            workRequired: [
              {
                workType: "SOP_DRAFTING",
                title: "Statement of Purpose review and finalization",
              },
              {
                workType: "PORTAL_LODGEMENT",
                title: "Lodge admission dossiers across partner universities",
              },
            ],
            allowedTransitions: ["CAS_STAGE", "CANCELLED"],
          },
          {
            name: "CAS_STAGE",
            orderNumber: 2,
            workRequired: [
              {
                workType: "FEE_DEPOSIT",
                title: "Confirm tuition deposit wire transfer receipt",
              },
              {
                workType: "FINANCIAL_AUDIT",
                title: "Audit maintenance of required 28-day funds statement",
              },
            ],
            allowedTransitions: [
              "UKVI_VISA_FILING",
              "UNIVERSITY_APPLICATIONS",
              "CANCELLED",
            ],
          },
          {
            name: "UKVI_VISA_FILING",
            orderNumber: 3,
            workRequired: [
              {
                workType: "IHS_PAYMENT",
                title: "Process healthcare surcharge and consular visa fees",
              },
              {
                workType: "VFS_BIOMETRICS",
                title: "Schedule biometric enrollment appointment",
              },
            ],
            allowedTransitions: ["COMPLETED", "CANCELLED"],
          },
          {
            name: "COMPLETED",
            orderNumber: 4,
            workRequired: [
              {
                workType: "BRP_LETTER",
                title:
                  "Deliver decision letter and resident permit collection brief",
              },
            ],
            allowedTransitions: [],
          },
        ],
      },

      // Workflow 4: Corporate Intra-Company Mobility -> Linked to Corporate Global Mobility Unit
      {
        name: "Executive Intra-Company Transfer (L-1)",
        code: "CORP_EXEC_TRANSFER",
        description:
          "Enterprise multi-national executive and specialized talent relocation pipeline.",
        teamId: teams[3]._id,
        isUniversal: false,
        active: true,
        createdBy: adminRajesh._id,
        stages: [
          {
            name: "PETITION_DRAFTING",
            orderNumber: 1,
            workRequired: [
              {
                workType: "I129_PREPARATION",
                title:
                  "Draft corporate transfer petition & specialized supplement",
              },
              {
                workType: "ORG_CHART_VERIFICATION",
                title: "Audit parent and subsidiary corporate org charts",
              },
            ],
            allowedTransitions: ["USCIS_FILING", "CANCELLED"],
          },
          {
            name: "USCIS_FILING",
            orderNumber: 2,
            workRequired: [
              {
                workType: "PREMIUM_PROCESSING",
                title: "Lodge expedited processing petition with authorities",
              },
              {
                workType: "FEE_RECEIPTS",
                title: "Archive formal receipt notices and docket ID",
              },
            ],
            allowedTransitions: ["CONSULAR_INTERVIEW", "CANCELLED"],
          },
          {
            name: "CONSULAR_INTERVIEW",
            orderNumber: 3,
            workRequired: [
              {
                workType: "DS160_FILING",
                title:
                  "Complete consular visa applications and schedule interview",
              },
              {
                workType: "MOCK_INTERVIEW",
                title: "Conduct consular briefing and documentation review",
              },
            ],
            allowedTransitions: ["COMPLETED", "CANCELLED"],
          },
          {
            name: "COMPLETED",
            orderNumber: 4,
            workRequired: [
              {
                workType: "I94_VERIFICATION",
                title:
                  "Validate visa stamp, entry validity, and compliance record",
              },
            ],
            allowedTransitions: [],
          },
        ],
      },

      // Workflow 5: Grievance & Dispute Resolution -> Universal (teamId: null, isUniversal: true)
      {
        name: "Account Dispute & Escalation Review",
        code: "DISPUTE_ESCALATION_OPS",
        description:
          "Formal dispute resolution and operational escalation workflow across teams.",
        teamId: null,
        isUniversal: true,
        active: true,
        createdBy: adminRajesh._id,
        stages: [
          {
            name: "INTAKE_AND_TRIAGE",
            orderNumber: 1,
            workRequired: [
              {
                workType: "AGREEMENT_AUDIT",
                title: "Audit service agreement clauses and SLA terms",
              },
              {
                workType: "SERVICE_LOG_REVIEW",
                title:
                  "Review communication audit trail and ticket log history",
              },
            ],
            allowedTransitions: ["LEGAL_ACCOUNTS_REVIEW", "CANCELLED"],
          },
          {
            name: "LEGAL_ACCOUNTS_REVIEW",
            orderNumber: 2,
            workRequired: [
              {
                workType: "DISCOUNT_ASSESSMENT",
                title: "Determine pro-rata settlement credit note calculation",
              },
              {
                workType: "DIRECTOR_APPROVAL",
                title: "Secure financial governance sign-off",
              },
            ],
            allowedTransitions: ["COMPLETED", "INTAKE_AND_TRIAGE", "CANCELLED"],
          },
          {
            name: "COMPLETED",
            orderNumber: 3,
            workRequired: [
              {
                workType: "SETTLEMENT_PAYOUT",
                title: "Dispatch settlement letter and transaction reference",
              },
            ],
            allowedTransitions: [],
          },
        ],
      },
    ]);

    const [northAmericaWf, oceaniaWf, europeWf, corporateWf, disputeWf] =
      workflows;

    // 4. Seed Diverse Customers
    const customers = await Customer.create([
      {
        name: "Rohan Deshmukh",
        email: "rohan.deshmukh@example.com",
        mobile: { code: "+91", num: "9876543210" },
        age: 29,
        gender: "male",
        dob: new Date("1997-04-15"),
        country: "India",
        city: "Pune",
        address: "Flat 402, Baner Heights, Baner Road",
        pincode: "411045",
        active: true,
      },
      {
        name: "Kavita Nair",
        email: "kavita.nair@example.com",
        mobile: { code: "+91", num: "9823011223" },
        age: 31,
        gender: "female",
        dob: new Date("1995-11-22"),
        country: "India",
        city: "Bengaluru",
        address: "12th Cross, Indiranagar",
        pincode: "560038",
        active: true,
      },
      {
        name: "Arjun Patel",
        email: "arjun.patel@example.com",
        mobile: { code: "+91", num: "9988776655" },
        age: 27,
        gender: "male",
        dob: new Date("1999-01-10"),
        country: "India",
        city: "Ahmedabad",
        address: "Satellite Road, Bodakdev",
        pincode: "380015",
        active: true,
      },
      {
        name: "Meera Sengupta",
        email: "meera.sengupta@example.com",
        mobile: { code: "+91", num: "9830012345" },
        age: 23,
        gender: "female",
        dob: new Date("2003-08-19"),
        country: "India",
        city: "Kolkata",
        address: "Salt Lake Sector V, Block EP",
        pincode: "700091",
        active: true,
      },
      {
        name: "Tariq Mansoori",
        email: "tariq.mansoori@globaltech.io",
        mobile: { code: "+91", num: "9711009988" },
        age: 38,
        gender: "male",
        dob: new Date("1988-06-03"),
        country: "India",
        city: "Hyderabad",
        address: "Cyber City, Hitec City Phase 2",
        pincode: "500081",
        active: true,
      },
      {
        name: "Sunita Choudhury",
        email: "sunita.choudhury@example.com",
        mobile: { code: "+91", num: "9435012389" },
        age: 34,
        gender: "female",
        dob: new Date("1992-03-12"),
        country: "India",
        city: "Guwahati",
        address: "GS Road, Dispur",
        pincode: "781005",
        active: true,
      },
    ]);

    // 5. Seed Customer Applications across distinct workflows
    const applications = await CustomerApplication.create([
      // Docket 1: North America PR Active
      {
        customerId: customers[0]._id,
        workflowId: northAmericaWf._id,
        title: "Federal Skilled Worker PR Dossier (Express Track)",
        priority: 2, // High
        currentStage: "DOCUMENTATION_STAGE",
        status: "ACTIVE",
        assignedTo: execVikram._id,
        managerId: managerNorthAmerica._id,
        version: 1,
      },
      // Docket 2: Provincial Tech Program
      {
        customerId: customers[1]._id,
        workflowId: northAmericaWf._id,
        title: "Provincial Tech Nomination Dossier",
        priority: 3, // Urgent
        currentStage: "NEW_REGISTRATION",
        status: "ACTIVE",
        assignedTo: execAnanya._id,
        managerId: managerNorthAmerica._id,
        version: 1,
      },
      // Docket 3: Independent Migration
      {
        customerId: customers[2]._id,
        workflowId: oceaniaWf._id,
        title: "Skilled Independent 189 Migration Dossier (Software Engineer)",
        priority: 1, // Normal
        currentStage: "SKILLS_ASSESSMENT",
        status: "ACTIVE",
        assignedTo: execSuresh._id,
        managerId: managerOceania._id,
        version: 1,
      },
      // Docket 4: Graduate Admissions
      {
        customerId: customers[3]._id,
        workflowId: europeWf._id,
        title: "University Admissions & Study Visa - MSc Data Science",
        priority: 2, // High
        currentStage: "UNIVERSITY_APPLICATIONS",
        status: "ACTIVE",
        assignedTo: execPooja._id,
        managerId: managerEurope._id,
        version: 1,
      },
      // Docket 5: Corporate Intra-Company Transfer
      {
        customerId: customers[4]._id,
        workflowId: corporateWf._id,
        title: "Corporate Executive Intra-Company Transfer Petition",
        priority: 3, // Urgent
        currentStage: "PETITION_DRAFTING",
        status: "ACTIVE",
        assignedTo: execFarhan._id,
        managerId: managerCorp._id,
        version: 1,
      },
      // Docket 6: Client Dispute & Escalation
      {
        customerId: customers[5]._id,
        workflowId: disputeWf._id,
        title: "Formal Retainer Settlement & Escalation Docket #8842",
        priority: 2, // High
        currentStage: "INTAKE_AND_TRIAGE",
        status: "ON_HOLD",
        assignedTo: execVikram._id,
        managerId: managerNorthAmerica._id,
        version: 1,
      },
    ]);

    // 6. Seed Work Items for Docket 1 (North America PR)
    const workItemsApp1 = await WorkItem.create([
      {
        applicationId: applications[0]._id,
        stageName: "DOCUMENTATION_STAGE",
        stageOrderNumber: 2,
        title: "Audit Education Credential Assessment reports",
        description:
          "Verify transcript receipt and reference number matching with checklist requirements.",
        assignedTo: execVikram._id,
        status: "COMPLETED",
        completedAt: new Date(),
      },
      {
        applicationId: applications[0]._id,
        stageName: "DOCUMENTATION_STAGE",
        stageOrderNumber: 2,
        title: "Validate language proficiency scorecard",
        description:
          "Ensure test score satisfies language benchmark standards.",
        assignedTo: execVikram._id,
        status: "PENDING",
      },
      {
        applicationId: applications[0]._id,
        stageName: "DOCUMENTATION_STAGE",
        stageOrderNumber: 2,
        title: "Audit primary occupation reference letters",
        description:
          "Verify organizational roles and responsibilities match classification codes.",
        assignedTo: execVikram._id,
        status: "PENDING",
      },
    ]);

    // Seed Work Items for Docket 4 (Graduate Admissions)
    await WorkItem.create([
      {
        applicationId: applications[3]._id,
        stageName: "UNIVERSITY_APPLICATIONS",
        stageOrderNumber: 1,
        title: "Statement of Purpose review and finalization",
        description:
          "Incorporate university department course prerequisites and statement revisions.",
        assignedTo: execPooja._id,
        status: "COMPLETED",
        completedAt: new Date(),
      },
      {
        applicationId: applications[3]._id,
        stageName: "UNIVERSITY_APPLICATIONS",
        stageOrderNumber: 1,
        title: "Lodge admission dossiers across partner universities",
        description:
          "Lodge direct admission applications via university portals.",
        assignedTo: execPooja._id,
        status: "PENDING",
      },
    ]);

    // 7. Seed Activities Audit Trail
    await Activity.create([
      {
        applicationId: applications[0]._id,
        performedBy: managerNorthAmerica._id,
        actionType: "APPLICATION_CREATED",
        message:
          "Application registered for Federal Skilled Worker PR Program.",
        metadata: { initialStage: "NEW_REGISTRATION" },
      },
      {
        applicationId: applications[0]._id,
        performedBy: managerNorthAmerica._id,
        actionType: "ASSIGNED",
        message: "Assigned application to Executive Vikram Joshi.",
        metadata: { assignedTo: execVikram._id },
      },
      {
        applicationId: applications[0]._id,
        performedBy: execVikram._id,
        actionType: "STAGE_UPDATED",
        message:
          "Stage moved from NEW_REGISTRATION to DOCUMENTATION_STAGE. Remarks: Customer verified initial agreement terms.",
        metadata: {
          previousStage: "NEW_REGISTRATION",
          newStage: "DOCUMENTATION_STAGE",
        },
      },
      {
        applicationId: applications[0]._id,
        performedBy: execVikram._id,
        actionType: "WORK_ITEM_COMPLETED",
        message:
          "Completed work item: Audit Education Credential Assessment reports.",
        metadata: { workItemId: workItemsApp1[0]._id },
      },
      {
        applicationId: applications[3]._id,
        performedBy: managerEurope._id,
        actionType: "APPLICATION_CREATED",
        message:
          "Application registered for University Admission & Study Visa Pipeline.",
        metadata: { initialStage: "UNIVERSITY_APPLICATIONS" },
      },
    ]);

    console.log("✅ Seeding completed successfully!");
    console.log("\n==================== TEST CREDENTIALS ====================");
    console.log("👑 Admins (Unrestricted Global Access):");
    console.log(
      "   • admin.rajesh@workflowops.io    | Password@123 (Head of Ops)",
    );
    console.log(
      "   • admin.deepa@workflowops.io     | Password@123 (Compliance Lead)",
    );
    console.log("\n👔 Managers:");
    console.log(
      "   • manager.priyanka@workflowops.io| Password@123 (North America Team)",
    );
    console.log(
      "   • manager.amitabh@workflowops.io | Password@123 (Oceania Team)",
    );
    console.log(
      "   • manager.rohit@workflowops.io   | Password@123 (Europe Team)",
    );
    console.log(
      "   • manager.shweta@workflowops.io  | Password@123 (Corporate Mobility)",
    );
    console.log("\n💼 Executives (Domain Grouped):");
    console.log(
      "   • executive.vikram@workflowops.io| Password@123 (North America Exec)",
    );
    console.log(
      "   • executive.ananya@workflowops.io| Password@123 (North America Exec)",
    );
    console.log(
      "   • utkarsh@workflowops.io         | Password@123 (North America Exec)",
    );
    console.log(
      "   • executive.suresh@workflowops.io| Password@123 (Oceania Exec)",
    );
    console.log(
      "   • executive.pooja@workflowops.io | Password@123 (Europe Exec)",
    );
    console.log(
      "   • nikhil@workflowops.io          | Password@123 (Europe Exec)",
    );
    console.log(
      "   • executive.farhan@workflowops.io| Password@123 (Corporate Exec)",
    );
    console.log("==========================================================\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
};

seedDatabase();
