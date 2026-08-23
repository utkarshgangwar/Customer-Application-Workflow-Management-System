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
      { name: "Canada PR Processing Unit" }, // teams[0]
      { name: "Australia SkillSelect Team" }, // teams[1]
      { name: "Student Visa Admissions Cell" }, // teams[2]
      { name: "Corporate Global Mobility Desk" }, // teams[3]
      { name: "Client Grievance & Escalations" }, // teams[4]
    ]);

    // 2. Seed Users (Admins, Managers, Executives)
    const users = await User.create([
      // Admins (teamId: null -> Global oversight)
      {
        name: "Rajesh Sharma",
        email: "admin.rajesh@yaxis.com",
        password: "Password@123",
        role: "admin",
        teamId: null,
      },
      {
        name: "Deepa Krishnan",
        email: "admin.deepa@yaxis.com",
        password: "Password@123",
        role: "admin",
        teamId: null,
      },
      // Managers (Scoped to respective department teams)
      {
        name: "Priyanka Verma",
        email: "manager.priyanka@yaxis.com",
        password: "Password@123",
        role: "manager",
        teamId: teams[0]._id, // Canada PR
      },
      {
        name: "Amitabh Sen",
        email: "manager.amitabh@yaxis.com",
        password: "Password@123",
        role: "manager",
        teamId: teams[1]._id, // Australia
      },
      {
        name: "Rohit Kulkarni",
        email: "manager.rohit@yaxis.com",
        password: "Password@123",
        role: "manager",
        teamId: teams[2]._id, // Student Visas
      },
      {
        name: "Shweta Mukherjee",
        email: "manager.shweta@yaxis.com",
        password: "Password@123",
        role: "manager",
        teamId: teams[3]._id, // Corporate Mobility
      },
      // Executives (Scoped to respective department teams)
      {
        name: "Vikram Joshi",
        email: "executive.vikram@yaxis.com",
        password: "Password@123",
        role: "executive",
        teamId: teams[0]._id, // Canada PR
      },
      {
        name: "Ananya Iyer",
        email: "executive.ananya@yaxis.com",
        password: "Password@123",
        role: "executive",
        teamId: teams[0]._id, // Canada PR
      },
      {
        name: "Utkarsh Gangwar",
        email: "utkarsh@test.com",
        password: "Password@123",
        role: "executive",
        teamId: teams[0]._id, // Canada PR
      },
      {
        name: "Suresh Menon",
        email: "executive.suresh@yaxis.com",
        password: "Password@123",
        role: "executive",
        teamId: teams[1]._id, // Australia
      },
      {
        name: "Pooja Hegde",
        email: "executive.pooja@yaxis.com",
        password: "Password@123",
        role: "executive",
        teamId: teams[2]._id, // Student Visas
      },
      {
        name: "Nikhil Yadav",
        email: "nikhil@test.com",
        password: "Password@123",
        role: "executive",
        teamId: teams[2]._id, // Student Visas
      },
      {
        name: "Farhan Akhtar",
        email: "executive.farhan@yaxis.com",
        password: "Password@123",
        role: "executive",
        teamId: teams[3]._id, // Corporate Mobility
      },
    ]);

    const adminRajesh = users[0];
    const managerCanada = users[2];
    const managerAus = users[3];
    const managerEdu = users[4];
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
      // Workflow 1: Canada Express Entry PR -> Linked to Canada PR Processing Unit
      {
        name: "Canada Express Entry PR Process",
        code: "CAN_EXPRESS_ENTRY_PR",
        description:
          "Comprehensive federal skilled worker immigration pipeline for Canada.",
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
                title: "Verify 67-point FSWP score eligibility",
              },
              {
                workType: "PAYMENT_CONFIRMATION",
                title: "Verify sign-up fee invoice",
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
                title: "Submit WES Education Credential Assessment",
              },
              {
                workType: "IELTS_VERIFICATION",
                title: "Verify IELTS TRF scorecard (CLB 9+ target)",
              },
              {
                workType: "EXPERIENCE_LETTERS",
                title: "Audit NOC reference letters",
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
                title: "Request revised salary slips and bank statements",
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
                title: "Submit Express Entry profile in IRCC portal",
              },
              {
                workType: "PCC_MEDICALS",
                title: "Upload Police Clearance Certificate and e-Medical",
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
                  "Track Biometrics Collection Letter and Background Check",
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
                title:
                  "Deliver Confirmation of Permanent Residence (COPR) packet",
              },
            ],
            allowedTransitions: [],
          },
        ],
      },

      // Workflow 2: Australia Subclass 189 -> Linked to Australia SkillSelect Team
      {
        name: "Australia Skilled Independent 189",
        code: "AUS_189_SKILLED",
        description:
          "Points-tested permanent visa processing pipeline via Australian Department of Home Affairs.",
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
                title: "ACS / VETASSESS Document Compilation",
              },
              {
                workType: "PTE_VERIFICATION",
                title: "Verify PTE Academic Score (Superior English Target)",
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
                title: "Create and Lodge SkillSelect EOI",
              },
              {
                workType: "STATE_SPONSOR_OPT",
                title: "Review State Nomination Matrix",
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
                title: "Lodge Form 1276 on ImmiAccount",
              },
              {
                workType: "NATIONAL_POLICE_CHECK",
                title: "Upload AFP & Indian PCC",
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
                title: "Verify Visa Grant Notice and Initial Entry Date",
              },
            ],
            allowedTransitions: [],
          },
        ],
      },

      // Workflow 3: UK Admissions -> Linked to Student Visa Admissions Cell
      {
        name: "UK University Admission & Student Visa",
        code: "UK_STUDENT_CAS_VISA",
        description:
          "Higher education university selection, unconditional offer, CAS, and UKVI filing.",
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
                title: "Statement of Purpose Review and Finalization",
              },
              {
                workType: "PORTAL_LODGEMENT",
                title: "Submit applications to Russell Group Universities",
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
                title: "Verify Tuition Deposit Wire Transfer",
              },
              {
                workType: "FINANCIAL_AUDIT",
                title: "Audit 28-day consecutive bank balance maintenance",
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
                title: "Pay Immigration Health Surcharge and Visa Fee",
              },
              {
                workType: "VFS_BIOMETRICS",
                title: "Schedule VFS Biometrics Appointment",
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
                title: "Issue UKVI Decision Letter & BRP Collection Guidance",
              },
            ],
            allowedTransitions: [],
          },
        ],
      },

      // Workflow 4: US Corporate L-1 -> Linked to Corporate Global Mobility Desk
      {
        name: "US Corporate Intra-Company Transfer (L-1)",
        code: "US_CORP_L1_TRANSFER",
        description:
          "Enterprise multi-national managerial and specialized knowledge transfer petition pipeline.",
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
                title: "Draft Form I-129 and L Supplement",
              },
              {
                workType: "ORG_CHART_VERIFICATION",
                title:
                  "Audit foreign and domestic entity organizational charts",
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
                title: "Lodge Form I-907 Premium Processing with USCIS",
              },
              {
                workType: "FEE_RECEIPTS",
                title: "Record I-797C Notice of Action receipts",
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
                title: "Complete Form DS-160 and MRV Fee Payment",
              },
              {
                workType: "MOCK_INTERVIEW",
                title: "Conduct consular interview preparation briefing",
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
                title: "Verify stamped visa foil and entry compliance binder",
              },
            ],
            allowedTransitions: [],
          },
        ],
      },

      // Workflow 5: Client Grievance -> Universal (teamId: null, isUniversal: true)
      {
        name: "Client Grievance & Refund Review",
        code: "CLIENT_REFUND_ESCALATION",
        description:
          "Formal legal and accounts escalation workflow for resolving dispute dockets across any team.",
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
                title: "Review signed client service agreement terms",
              },
              {
                workType: "SERVICE_LOG_REVIEW",
                title:
                  "Extract executive communication timeline and audit trail",
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
                title:
                  "Calculate allowable pro-rata refund or credit credit note",
              },
              {
                workType: "DIRECTOR_APPROVAL",
                title: "Acquire financial clearance sign-off",
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
                title:
                  "Dispatch settlement letter and NEFT transaction receipt",
              },
            ],
            allowedTransitions: [],
          },
        ],
      },
    ]);

    const [canadaWf, ausWf, ukWf, usCorpWf, grievanceWf] = workflows;

    // 4. Seed Diverse Customers
    const customers = await Customer.create([
      {
        name: "Rohan Deshmukh",
        email: "rohan.deshmukh@gmail.com",
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
        email: "kavita.nair@outlook.com",
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
        email: "arjun.patel@yahoo.com",
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
        email: "meera.sengupta@gmail.com",
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
        email: "tariq.mansoori@techcorp.com",
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
        email: "sunita.choudhury@gmail.com",
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
      // Docket 1: Canada PR Active
      {
        customerId: customers[0]._id,
        workflowId: canadaWf._id,
        title: "Canada PR - Express Entry FSWP (Primary Dossier)",
        priority: 2, // High
        currentStage: "DOCUMENTATION_STAGE",
        status: "ACTIVE",
        assignedTo: execVikram._id,
        managerId: managerCanada._id,
        version: 1,
      },
      // Docket 2: Canada OINP Tech Draw
      {
        customerId: customers[1]._id,
        workflowId: canadaWf._id,
        title: "Canada PR - OINP Tech Draw Application",
        priority: 3, // Urgent
        currentStage: "NEW_REGISTRATION",
        status: "ACTIVE",
        assignedTo: execAnanya._id,
        managerId: managerCanada._id,
        version: 1,
      },
      // Docket 3: Australia 189 Migration
      {
        customerId: customers[2]._id,
        workflowId: ausWf._id,
        title: "Australia Subclass 189 (Software Engineer ANZSCO 261313)",
        priority: 1, // Normal
        currentStage: "SKILLS_ASSESSMENT",
        status: "ACTIVE",
        assignedTo: execSuresh._id,
        managerId: managerAus._id,
        version: 1,
      },
      // Docket 4: UK Student Visa
      {
        customerId: customers[3]._id,
        workflowId: ukWf._id,
        title: "UK Admissions - MSc Data Science (University of Manchester)",
        priority: 2, // High
        currentStage: "UNIVERSITY_APPLICATIONS",
        status: "ACTIVE",
        assignedTo: execPooja._id,
        managerId: managerEdu._id,
        version: 1,
      },
      // Docket 5: US Corporate L-1 Mobility
      {
        customerId: customers[4]._id,
        workflowId: usCorpWf._id,
        title: "US Intra-Company Transfer L-1A Executive Petition",
        priority: 3, // Urgent
        currentStage: "PETITION_DRAFTING",
        status: "ACTIVE",
        assignedTo: execFarhan._id,
        managerId: managerCorp._id,
        version: 1,
      },
      // Docket 6: Client Dispute & Refund Review
      {
        customerId: customers[5]._id,
        workflowId: grievanceWf._id,
        title: "Formal Escalation & Retainer Refund Docket #8842",
        priority: 2, // High
        currentStage: "INTAKE_AND_TRIAGE",
        status: "ON_HOLD",
        assignedTo: execVikram._id,
        managerId: managerCanada._id,
        version: 1,
      },
    ]);

    // 6. Seed Work Items for Docket 1 (Canada PR)
    const workItemsApp1 = await WorkItem.create([
      {
        applicationId: applications[0]._id,
        stageName: "DOCUMENTATION_STAGE",
        stageOrderNumber: 2,
        title: "Submit WES Education Credential Assessment",
        description:
          "Verify transcript receipt and reference number matching with IRCC checklist.",
        assignedTo: execVikram._id,
        status: "COMPLETED",
        completedAt: new Date(),
      },
      {
        applicationId: applications[0]._id,
        stageName: "DOCUMENTATION_STAGE",
        stageOrderNumber: 2,
        title: "Verify IELTS TRF scorecard (CLB 9+ target)",
        description:
          "Ensure minimum Band 8 in Listening, Band 7 in Reading, Writing, Speaking.",
        assignedTo: execVikram._id,
        status: "PENDING",
      },
      {
        applicationId: applications[0]._id,
        stageName: "DOCUMENTATION_STAGE",
        stageOrderNumber: 2,
        title: "Audit NOC reference letters",
        description:
          "Verify roles and responsibilities match NOC 21232 guidelines.",
        assignedTo: execVikram._id,
        status: "PENDING",
      },
    ]);

    // Seed Work Items for Docket 4 (UK Student Admission)
    await WorkItem.create([
      {
        applicationId: applications[3]._id,
        stageName: "UNIVERSITY_APPLICATIONS",
        stageOrderNumber: 1,
        title: "Statement of Purpose Review and Finalization",
        description:
          "Incorporate Manchester faculty course requirements and draft edits.",
        assignedTo: execPooja._id,
        status: "COMPLETED",
        completedAt: new Date(),
      },
      {
        applicationId: applications[3]._id,
        stageName: "UNIVERSITY_APPLICATIONS",
        stageOrderNumber: 1,
        title: "Submit applications to Russell Group Universities",
        description:
          "Lodge direct admission applications via Manchester, Edinburgh & Warwick portals.",
        assignedTo: execPooja._id,
        status: "PENDING",
      },
    ]);

    // 7. Seed Activities Audit Trail
    await Activity.create([
      {
        applicationId: applications[0]._id,
        performedBy: managerCanada._id,
        actionType: "APPLICATION_CREATED",
        message: "Application registered for Canada Express Entry PR.",
        metadata: { initialStage: "NEW_REGISTRATION" },
      },
      {
        applicationId: applications[0]._id,
        performedBy: managerCanada._id,
        actionType: "ASSIGNED",
        message: "Assigned application to Executive Vikram Joshi.",
        metadata: { assignedTo: execVikram._id },
      },
      {
        applicationId: applications[0]._id,
        performedBy: execVikram._id,
        actionType: "STAGE_UPDATED",
        message:
          "Stage moved from NEW_REGISTRATION to DOCUMENTATION_STAGE. Remarks: Client signed service agreement and submitted initial fees.",
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
          "Completed work item: Submit WES Education Credential Assessment.",
        metadata: { workItemId: workItemsApp1[0]._id },
      },
      {
        applicationId: applications[3]._id,
        performedBy: managerEdu._id,
        actionType: "APPLICATION_CREATED",
        message:
          "Application registered for UK University Admission & Student Visa.",
        metadata: { initialStage: "UNIVERSITY_APPLICATIONS" },
      },
    ]);

    console.log("✅ Seeding completed successfully!");
    console.log("\n==================== TEST CREDENTIALS ====================");
    console.log("👑 Admins (Unrestricted Global Access):");
    console.log("   • admin.rajesh@yaxis.com    | Password@123 (Head of Ops)");
    console.log(
      "   • admin.deepa@yaxis.com     | Password@123 (Compliance Lead)",
    );
    console.log("\n👔 Managers:");
    console.log("   • manager.priyanka@yaxis.com| Password@123 (Canada Team)");
    console.log(
      "   • manager.amitabh@yaxis.com | Password@123 (Australia Team)",
    );
    console.log(
      "   • manager.rohit@yaxis.com   | Password@123 (Admissions Cell)",
    );
    console.log(
      "   • manager.shweta@yaxis.com  | Password@123 (Corporate Mobility)",
    );
    console.log("\n💼 Executives (Domain Grouped):");
    console.log(
      "   • executive.vikram@yaxis.com| Password@123 (Canada PR Exec)",
    );
    console.log(
      "   • executive.ananya@yaxis.com| Password@123 (Canada PR Exec)",
    );
    console.log(
      "   • utkarsh@test.com          | Password@123 (Canada PR Exec)",
    );
    console.log(
      "   • executive.suresh@yaxis.com| Password@123 (Australia Exec)",
    );
    console.log(
      "   • executive.pooja@yaxis.com | Password@123 (Student Visa Exec)",
    );
    console.log(
      "   • nikhil@test.com           | Password@123 (Student Visa Exec)",
    );
    console.log(
      "   • executive.farhan@yaxis.com| Password@123 (Corporate L-1 Exec)",
    );
    console.log("==========================================================\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
};

seedDatabase();
