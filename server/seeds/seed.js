const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const Lead = require('../models/Lead');
const Activity = require('../models/Activity');
const Task = require('../models/Task');
const Notification = require('../models/Notification');
const { calculateLeadIntelligence } = require('../services/aiEngine');

const demoUsers = [
  {
    name: 'Sarah Connor (Admin)',
    email: 'admin@salesintel.ai',
    password: 'Password123!',
    role: 'admin',
    department: 'Sales Leadership',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'
  },
  {
    name: 'Alex Mercer (Enterprise Rep)',
    email: 'rep@salesintel.ai',
    password: 'Password123!',
    role: 'sales_rep',
    department: 'Strategic Accounts',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
  }
];

const sampleLeadsRaw = [
  {
    name: 'Elena Rostova',
    email: 'elena.rostova@cloudscale.io',
    phone: '+1 (555) 234-5678',
    company: 'CloudScale Technologies',
    jobTitle: 'Chief Technology Officer (CTO)',
    industry: 'Technology',
    source: 'Website',
    dealValue: 78000,
    status: 'Negotiation',
    priority: 'Urgent',
    notes: 'Evaluating our enterprise security and analytics suite for 1,200 developers.'
  },
  {
    name: 'Marcus Vance',
    email: 'm.vance@apexfinancial.com',
    phone: '+1 (555) 876-5432',
    company: 'Apex Financial Partners',
    jobTitle: 'VP of Wealth Operations',
    industry: 'Finance',
    source: 'Referral',
    dealValue: 45000,
    status: 'Proposal',
    priority: 'High',
    notes: 'Referred by our Series-B banking partner. Seeking compliance analytics automation.'
  },
  {
    name: 'Dr. Linda Zhao',
    email: 'lzhao@genomedx.org',
    phone: '+1 (555) 345-6789',
    company: 'GenomeDx Health Systems',
    jobTitle: 'Chief Medical Information Officer',
    industry: 'Healthcare',
    source: 'Inbound Form',
    dealValue: 62000,
    status: 'Qualified',
    priority: 'High',
    notes: 'HIPAA compliance required. Looking to integrate our sales engine with diagnostic equipment sales.'
  },
  {
    name: 'David Sterling',
    email: 'david@titanmfg.net',
    phone: '+1 (555) 987-1234',
    company: 'Titan Heavy Manufacturing',
    jobTitle: 'Director of Global Procurement',
    industry: 'Manufacturing',
    source: 'LinkedIn',
    dealValue: 35000,
    status: 'Contacted',
    priority: 'Medium',
    notes: 'Connected via LinkedIn InMail. Inquiring about supply-chain sales cycle compression.'
  },
  {
    name: 'Samantha Brooks',
    email: 'samantha.b@omnistore.com',
    phone: '+1 (555) 432-8765',
    company: 'OmniStore Retail Group',
    jobTitle: 'Head of Commercial Strategy',
    industry: 'Retail',
    source: 'Event',
    dealValue: 28000,
    status: 'Won',
    priority: 'High',
    notes: 'Met at SaaStr Annual. Signed 3-year enterprise license after successful proof of concept.'
  },
  {
    name: 'Jonathan Hayes',
    email: 'jhayes@eduquest.org',
    phone: '+1 (555) 654-3210',
    company: 'EduQuest Learning Systems',
    jobTitle: 'Dean of Information Services',
    industry: 'Education',
    source: 'Cold Outreach',
    dealValue: 12000,
    status: 'New',
    priority: 'Low',
    notes: 'Cold email sequence reply. Interested in institutional discounts.'
  },
  {
    name: 'Rachel Adams',
    email: 'radams@primelogistics.co',
    phone: '+1 (555) 789-0123',
    company: 'Prime Cargo & Logistics',
    jobTitle: 'Chief Operating Officer',
    industry: 'Logistics',
    source: 'Referral',
    dealValue: 54000,
    status: 'Won',
    priority: 'High',
    notes: 'Deal closed last month; deployment underway across 14 freight depots.'
  },
  {
    name: 'Carlos Mendez',
    email: 'carlos@zenithrealty.com',
    phone: '+1 (555) 890-1234',
    company: 'Zenith Commercial Real Estate',
    jobTitle: 'Managing Partner',
    industry: 'Real Estate',
    source: 'Partner',
    dealValue: 18000,
    status: 'Lost',
    priority: 'Low',
    notes: 'Lost to legacy ERP due to existing multi-year vendor lock-in. Revisit next fiscal year.'
  },
  {
    name: 'Natasha Roman',
    email: 'n.roman@cyberdef.io',
    phone: '+1 (555) 678-9012',
    company: 'CyberDef Shield Technologies',
    jobTitle: 'Chief Executive Officer (CEO)',
    industry: 'Technology',
    source: 'Website',
    dealValue: 85000,
    status: 'Proposal',
    priority: 'Urgent',
    notes: 'High intent enterprise deal. Needs custom SOC-2 reports and multi-tenant telemetry.'
  },
  {
    name: 'Brian Kelling',
    email: 'bkelling@stratacap.com',
    phone: '+1 (555) 567-8901',
    company: 'Strata Capital Management',
    jobTitle: 'Senior Investment Analyst',
    industry: 'Finance',
    source: 'LinkedIn',
    dealValue: 24000,
    status: 'Contacted',
    priority: 'Medium',
    notes: 'Needs demo tailored to portfolio deal intelligence tracking.'
  },
  {
    name: 'Claire Dupont',
    email: 'c.dupont@biotechfusion.com',
    phone: '+1 (555) 456-7890',
    company: 'BioTech Fusion Labs',
    jobTitle: 'Vice President of Research Sales',
    industry: 'Healthcare',
    source: 'Partner',
    dealValue: 39000,
    status: 'Qualified',
    priority: 'High',
    notes: 'Partnership referral. Fast-moving evaluation of automated follow-up intelligence.'
  },
  {
    name: 'Vikram Seth',
    email: 'vikram@metrixauto.com',
    phone: '+1 (555) 321-6549',
    company: 'Metrix Automotive Dynamics',
    jobTitle: 'Supply Chain Operations Lead',
    industry: 'Manufacturing',
    source: 'Organic Search',
    dealValue: 19500,
    status: 'New',
    priority: 'Medium',
    notes: 'Downloaded our whitepaper on predictive CRM pipelines.'
  },
  {
    name: 'Karen White',
    email: 'kwhite@urbanapparel.com',
    phone: '+1 (555) 210-9876',
    company: 'Urban Apparel Brands',
    jobTitle: 'Director of Wholesale Accounts',
    industry: 'Retail',
    source: 'Website',
    dealValue: 14000,
    status: 'Lost',
    priority: 'Low',
    notes: 'Budget postponed indefinitely due to retail restructuring.'
  },
  {
    name: 'Arthur Pendelton',
    email: 'arthur@pinnaclelegal.com',
    phone: '+1 (555) 123-9874',
    company: 'Pinnacle Legal Solutions',
    jobTitle: 'Managing Partner',
    industry: 'Professional Services',
    source: 'Referral',
    dealValue: 32000,
    status: 'Negotiation',
    priority: 'High',
    notes: 'Contract sent. Redlining indemnity clauses with counsel.'
  },
  {
    name: 'Priya Sharma',
    email: 'priya.s@fintechhorizons.in',
    phone: '+1 (555) 998-8776',
    company: 'Fintech Horizons',
    jobTitle: 'Chief Revenue Officer (CRO)',
    industry: 'Finance',
    source: 'Website',
    dealValue: 92000,
    status: 'Qualified',
    priority: 'Urgent',
    notes: 'Expanding cross-border payment sales team across APAC and North America.'
  }
];

const seedDatabase = async () => {
  try {
    console.log('[Seed] Connecting to database...');
    await connectDB();

    console.log('[Seed] Checking existing records...');
    const userCount = await User.countDocuments();
    if (userCount > 0 && process.env.FORCE_SEED !== 'true') {
      console.log(`[Seed] Database already contains ${userCount} users. Skipping destructive seed.`);
      console.log('[Seed] To force re-seed, run: $env:FORCE_SEED="true"; npm run seed');
      await disconnectDB();
      return;
    }

    console.log('[Seed] Clearing previous collections...');
    await Promise.all([
      User.deleteMany({}),
      Lead.deleteMany({}),
      Activity.deleteMany({}),
      Task.deleteMany({}),
      Notification.deleteMany({})
    ]);

    console.log('[Seed] Creating demo users...');
    const createdUsers = [];
    for (const u of demoUsers) {
      const user = await User.create(u);
      createdUsers.push(user);
      console.log(`  Created user: ${user.name} (${user.email}) - Role: ${user.role}`);
    }

    const adminUser = createdUsers[0];
    const repUser = createdUsers[1];

    console.log('[Seed] Seeding sample leads with AI scoring engine...');
    const createdLeads = [];
    const now = new Date();

    for (let i = 0; i < sampleLeadsRaw.length; i++) {
      const raw = sampleLeadsRaw[i];
      const assignedTo = i % 2 === 0 ? adminUser._id : repUser._id;
      const owner = adminUser._id;

      // Contact recency simulation
      const daysAgo = (i * 2) % 25;
      const lastContactedAt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      
      // Next follow-up (some in future, 2 overdue for testing)
      let nextFollowUpAt = new Date(now.getTime() + (i % 5 + 1) * 24 * 60 * 60 * 1000);
      if (i === 1 || i === 3) {
        // Overdue follow-up for Marcus Vance and David Sterling
        nextFollowUpAt = new Date(now.getTime() - (i + 1) * 24 * 60 * 60 * 1000);
      }

      const leadData = {
        ...raw,
        owner,
        assignedTo,
        lastContactedAt,
        nextFollowUpAt
      };

      // Compute explainable AI scoring
      const aiResults = calculateLeadIntelligence(leadData, []);
      Object.assign(leadData, aiResults);

      const lead = await Lead.create(leadData);
      createdLeads.push(lead);

      // Create initial creation activity
      await Activity.create({
        lead: lead._id,
        user: assignedTo,
        type: 'note',
        title: 'Lead Onboarded',
        description: `Lead profile initialized. AI Score calculated at ${lead.aiScore} (${lead.aiCategory}).`
      });

      // Add a realistic interaction activity
      if (lead.status !== 'New') {
        await Activity.create({
          lead: lead._id,
          user: assignedTo,
          type: lead.status === 'Won' ? 'meeting' : lead.status === 'Proposal' ? 'call' : 'email',
          title: `Client Engagement: ${lead.company}`,
          description: `Conducted discussion regarding ${lead.notes.substring(0, 50)}...`,
          createdAt: lastContactedAt
        });
      }
    }

    console.log(`[Seed] Seeded ${createdLeads.length} leads with full AI intelligence metadata.`);

    console.log('[Seed] Seeding sample tasks and reminders...');
    const sampleTasks = [
      {
        title: 'Review Final SLA with Elena Rostova',
        description: 'Prepare enterprise MSA and redline security appendix for CloudScale.',
        lead: createdLeads[0]._id,
        assignedTo: adminUser._id,
        createdBy: adminUser._id,
        dueDate: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        priority: 'Urgent',
        status: 'in_progress'
      },
      {
        title: 'URGENT: Overdue Follow-up with Apex Financial',
        description: 'Marcus Vance requested regulatory audit data sheet last week.',
        lead: createdLeads[1]._id,
        assignedTo: repUser._id,
        createdBy: adminUser._id,
        dueDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // Overdue
        priority: 'High',
        status: 'pending'
      },
      {
        title: 'Schedule HIPAA Discovery Workshop with GenomeDx',
        description: 'Coordinate with solutions engineering team for Dr. Zhao.',
        lead: createdLeads[2]._id,
        assignedTo: repUser._id,
        createdBy: repUser._id,
        dueDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
        priority: 'High',
        status: 'pending'
      },
      {
        title: 'Send Case Study to Metrix Automotive',
        description: 'Share predictive supply chain automation benchmarks.',
        lead: createdLeads[11]._id,
        assignedTo: repUser._id,
        createdBy: repUser._id,
        dueDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
        priority: 'Medium',
        status: 'pending'
      },
      {
        title: 'Complete Onboarding Handoff for Prime Cargo',
        description: 'Handoff signed contract and requirements to customer success team.',
        lead: createdLeads[6]._id,
        assignedTo: adminUser._id,
        createdBy: adminUser._id,
        dueDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        priority: 'Medium',
        status: 'completed',
        completedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000)
      }
    ];

    await Task.insertMany(sampleTasks);
    console.log(`[Seed] Seeded ${sampleTasks.length} tasks.`);

    console.log('[Seed] Seeding sample notifications...');
    await Notification.create([
      {
        user: adminUser._id,
        title: 'High-Value Opportunity Ready',
        message: 'Elena Rostova (CloudScale Technologies) entered Negotiation stage ($78,000 deal).',
        type: 'deal_won',
        isRead: false
      },
      {
        user: repUser._id,
        title: 'Task Overdue Notice',
        message: 'Follow-up with Marcus Vance (Apex Financial) is past due.',
        type: 'task_overdue',
        isRead: false
      },
      {
        user: repUser._id,
        title: 'High-Score Lead Assigned',
        message: 'Dr. Linda Zhao (GenomeDx Health Systems) assigned to you with AI Score 88.',
        type: 'lead_assigned',
        isRead: true
      }
    ]);

    console.log('[Seed] Demo data seeding completed successfully!');
    console.log('================================================================');
    console.log('  DEMO CREDENTIALS:');
    console.log('  Admin User:      admin@salesintel.ai  |  Password: Password123!');
    console.log('  Sales Rep User:  rep@salesintel.ai    |  Password: Password123!');
    console.log('================================================================');

    if (require.main === module) {
      await disconnectDB();
    }
  } catch (err) {
    console.error(`[Seed] Fatal error seeding database: ${err.message}`, err);
    if (require.main === module) {
      process.exit(1);
    }
  }
};

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
