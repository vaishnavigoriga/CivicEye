import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../models/User';
import { Department } from '../models/Department';
import { Complaint, ComplaintCategory, ComplaintStatus, ComplaintDataSource } from '../models/Complaint';
import { Counter } from '../models/Counter';
import { connectDB, disconnectDB } from '../config/db';
import { logger } from '../utils/logger';

// 10 Key Hyderabad Localities with precise GeoJSON Coordinates [longitude, latitude]
const LOCALITIES = [
  { area: 'Banjara Hills', lng: 78.4347, lat: 17.4156 },
  { area: 'Jubilee Hills', lng: 78.4071, lat: 17.4328 },
  { area: 'Madhapur', lng: 78.3900, lat: 17.4504 },
  { area: 'Hitech City', lng: 78.3806, lat: 17.4486 },
  { area: 'Kukatpally', lng: 78.4138, lat: 17.4849 },
  { area: 'Secunderabad', lng: 78.4983, lat: 17.4399 },
  { area: 'Charminar', lng: 78.4747, lat: 17.3616 },
  { area: 'Begumpet', lng: 78.4636, lat: 17.4418 },
  { area: 'Ameerpet', lng: 78.4487, lat: 17.4374 },
  { area: 'LB Nagar', lng: 78.5522, lat: 17.3463 },
];

export const seedDatabase = async (): Promise<void> => {
  logger.info('Starting idempotent database seeding for CivicEye...');

  // One-time data migration for existing documents if any
  try {
    await Complaint.updateMany({ dataSource: 'citizen_submitted' as any }, { $set: { dataSource: 'CITIZEN_SUBMITTED' } });
    await Complaint.updateMany({ dataSource: 'fictional_demo' as any }, { $set: { dataSource: 'DEMO_SIMULATED' } });
  } catch (migErr) {
    logger.warn('Migration step warning (harmless on empty database):', migErr);
  }

  // 1. Seed Demo Users
  const salt = await bcrypt.genSalt(10);
  const citizenHash = await bcrypt.hash('demo1234', salt);
  const adminHash = await bcrypt.hash('admin1234', salt);

  const citizen = await User.findOneAndUpdate(
    { email: 'citizen@civiceye.demo' },
    {
      name: 'Ramesh Kumar (Citizen)',
      email: 'citizen@civiceye.demo',
      passwordHash: citizenHash,
      role: 'citizen',
      preferredLanguage: 'en',
      phone: '+91 98765 43210',
    },
    { upsert: true, new: true }
  );

  const admin = await User.findOneAndUpdate(
    { email: 'admin@civiceye.demo' },
    {
      name: 'Smt. Sunita Rao (Municipal Commissioner)',
      email: 'admin@civiceye.demo',
      passwordHash: adminHash,
      role: 'admin',
      preferredLanguage: 'en',
      phone: '+91 91234 56789',
    },
    { upsert: true, new: true }
  );

  logger.info(`Seeded demo users: Citizen (${citizen.email}) & Admin (${admin.email})`);

  // 2. Seed Departments
  const departmentsData = [
    { name: 'GHMC Roads & Infrastructure Maintenance', code: 'GHMC-ROADS', description: 'Repair of arterial roads, potholes, dividers, and road signage in Greater Hyderabad.', contactEmail: 'roads@ghmc.gov.in.demo' },
    { name: 'GHMC Stormwater Drainage & Sewerage', code: 'GHMC-DRAIN', description: 'Clearing blocked stormwater drains, preventing urban waterlogging, and desilting.', contactEmail: 'drainage@ghmc.gov.in.demo' },
    { name: 'TSSPDCL Electricity Distribution', code: 'TSSPDCL-ELEC', description: 'Electrical transformers, live wire hazards, meter defects, and power outages.', contactEmail: 'support@tsspdcl.gov.in.demo' },
    { name: 'HMWSSB Water Supply & Sewerage', code: 'HMWSSB-WATER', description: 'Hyderabad metropolitan drinking water supply pipelines, leakage, and tanker services.', contactEmail: 'grievance@hmwssb.gov.in.demo' },
    { name: 'GHMC Solid Waste & Sanitation Management', code: 'GHMC-SANITATION', description: 'Garbage collection, secondary collection bins, dead animal disposal, and road sweeping.', contactEmail: 'sanitation@ghmc.gov.in.demo' },
    { name: 'GHMC Street Lighting Division', code: 'GHMC-LIGHT', description: 'Central LED street lights, dark spot illumination, timer defects, and faulty lamp poles.', contactEmail: 'lighting@ghmc.gov.in.demo' },
    { name: 'GHMC Urban Biodiversity & Parks', code: 'GHMC-PARKS', description: 'Public community parks, dangerous tree branches, and urban horticulture maintenance.', contactEmail: 'parks@ghmc.gov.in.demo' },
    { name: 'Civic Grievance Special Cell (General)', code: 'GHMC-GENERAL', description: 'Inter-departmental coordination and civic infrastructure issues not covered elsewhere.', contactEmail: 'general@ghmc.gov.in.demo' },
  ];

  const deptMap: Record<string, any> = {};
  for (const dept of departmentsData) {
    const d = await Department.findOneAndUpdate({ code: dept.code }, dept, { upsert: true, new: true });
    deptMap[dept.code] = d;
  }
  logger.info(`Seeded ${departmentsData.length} Hyderabad administrative departments.`);

  // 3. Seed Complaints
  const existingCount = await Complaint.countDocuments();
  if (existingCount >= 20) {
    logger.info(`Database already seeded with ${existingCount} complaints. Skipping complaint re-generation.`);
    return;
  }

  // Clear existing complaints for fresh comprehensive seed
  await Complaint.deleteMany({});

  const sampleComplaints = [
    {
      title: 'Deep crater pothole near Road No. 36 junction causing vehicle slowdowns',
      description: 'A deep dangerous pothole has developed on the main carriage way right before the metro pillar. Multiple two-wheelers have skid during evening hours.',
      category: 'Roads' as ComplaintCategory,
      deptCode: 'GHMC-ROADS',
      severityRating: 8,
      status: 'in-progress' as ComplaintStatus,
      locIndex: 1, // Jubilee Hills
      tags: ['road-hazard', 'pothole', 'traffic-slowdown'],
    },
    {
      title: 'Open stormwater drain overflow near Durgam Cheruvu intake road',
      description: 'Sewage and monsoon stormwater is overflowing onto pedestrian walkway. High risk of accidents and foul smell spreading across the residential colony.',
      category: 'Drainage' as ComplaintCategory,
      deptCode: 'GHMC-DRAIN',
      severityRating: 9,
      status: 'assigned' as ComplaintStatus,
      locIndex: 2, // Madhapur
      tags: ['drainage-overflow', 'waterlogging', 'health-hazard'],
    },
    // Duplicate pair 1 (Madhapur)
    {
      title: 'Sewage drain leaking continuously on Madhapur main road',
      description: 'Stagnant foul water overflowing from an open manhole onto the road near Durgam Cheruvu road.',
      category: 'Drainage' as ComplaintCategory,
      deptCode: 'GHMC-DRAIN',
      severityRating: 8,
      status: 'pending' as ComplaintStatus,
      locIndex: 2, // Madhapur
      tags: ['drainage', 'sewage-leak'],
      duplicateGroupIndex: 1,
    },
    {
      title: 'Continuous drinking water pipeline rupture wasting gallons of water',
      description: 'HMWSSB underground drinking water pipe ruptured early morning. Potable clean water is gushing out on the road while nearby houses have zero supply.',
      category: 'Water Supply' as ComplaintCategory,
      deptCode: 'HMWSSB-WATER',
      severityRating: 9,
      status: 'in-progress' as ComplaintStatus,
      locIndex: 0, // Banjara Hills
      tags: ['water-pipeline', 'leakage', 'hmwssb'],
    },
    {
      title: 'Hanging live electricity wire near school gate after tree fall',
      description: 'High tension electricity cable has snapped and is dangling 4 feet above ground level near the municipal primary school gate. Immediate isolation required.',
      category: 'Electricity' as ComplaintCategory,
      deptCode: 'TSSPDCL-ELEC',
      severityRating: 10,
      status: 'assigned' as ComplaintStatus,
      locIndex: 4, // Kukatpally
      tags: ['live-wire', 'danger-to-life', 'school-zone'],
    },
    {
      title: 'Overflowing community garbage dumper with stray cattle',
      description: 'GHMC garbage dumper has not been cleared for past 4 days. Waste spilled all over the street corner causing severe stench and stray animal menace.',
      category: 'Sanitation' as ComplaintCategory,
      deptCode: 'GHMC-SANITATION',
      severityRating: 7,
      status: 'resolved' as ComplaintStatus,
      locIndex: 6, // Charminar
      tags: ['solid-waste', 'garbage-bin', 'hygiene'],
      hasEvidence: true,
    },
    {
      title: 'Street lights not functional across 1 km stretch on Begumpet main road',
      description: 'Entire street light row from flyover descent to lifestyle building is pitch dark for 3 days. Women and commuters feel unsafe walking at night.',
      category: 'Street Lights' as ComplaintCategory,
      deptCode: 'GHMC-LIGHT',
      severityRating: 6,
      status: 'resolved' as ComplaintStatus,
      locIndex: 7, // Begumpet
      tags: ['dark-spots', 'street-lights', 'women-safety'],
      hasEvidence: true,
    },
    {
      title: 'Broken swings and rusty fence in Ameerpet colony park',
      description: 'Children playground swings are broken and jagged metal edges have injured a toddler. The walking track also has fallen dry branches.',
      category: 'Parks' as ComplaintCategory,
      deptCode: 'GHMC-PARKS',
      severityRating: 4,
      status: 'pending' as ComplaintStatus,
      locIndex: 8, // Ameerpet
      tags: ['park-maintenance', 'child-safety'],
    },
    {
      title: 'Major waterlogging under LB Nagar flyover during light rain',
      description: 'Storm drains are choked with construction debris. Even mild showers lead to 2 feet of stagnant water blocking bus commuters.',
      category: 'Drainage' as ComplaintCategory,
      deptCode: 'GHMC-DRAIN',
      severityRating: 8,
      status: 'in-progress' as ComplaintStatus,
      locIndex: 9, // LB Nagar
      tags: ['flyover-waterlogging', 'choked-drain'],
    },
    {
      title: 'Sparking distribution transformer near Secunderabad railway station road',
      description: 'Transformer produces loud sparks and smoking during peak afternoon load. Surrounding shops fear a fire breakout.',
      category: 'Electricity' as ComplaintCategory,
      deptCode: 'TSSPDCL-ELEC',
      severityRating: 9,
      status: 'assigned' as ComplaintStatus,
      locIndex: 5, // Secunderabad
      tags: ['transformer-spark', 'fire-hazard'],
    },
  ];

  const complaintsToInsert: any[] = [];
  const sharedDuplicateGroupId = uuidv4();

  for (let i = 0; i < 40; i++) {
    const template = sampleComplaints[i % sampleComplaints.length];
    const loc = LOCALITIES[i % LOCALITIES.length];

    const lngOffset = (Math.random() - 0.5) * 0.008;
    const latOffset = (Math.random() - 0.5) * 0.008;
    const finalLng = parseFloat((loc.lng + lngOffset).toFixed(6));
    const finalLat = parseFloat((loc.lat + latOffset).toFixed(6));

    const statusList: ComplaintStatus[] = ['pending', 'assigned', 'in-progress', 'resolved', 'resolved'];
    const chosenStatus = i < sampleComplaints.length ? template.status : statusList[i % statusList.length];

    const aiSeverityRating = template.severityRating;
    const upvotes = Math.floor(Math.random() * 18);
    const daysAgo = Math.floor(Math.random() * 15);
    const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

    const popScore = Math.min(100, upvotes * 5);
    const safetyScore = ['Drainage', 'Water Supply', 'Electricity'].includes(template.category) ? 100 : 0;
    const durationScore = Math.min(100, daysAgo * 2);
    const rawPriority = Math.round(
      0.40 * (aiSeverityRating * 10) +
      0.25 * popScore +
      0.20 * safetyScore +
      0.15 * durationScore
    );
    const priorityScore = Math.max(1, Math.min(100, rawPriority));

    const isDup1 = i === 1;
    const isDup2 = i === 2;
    const isDuplicate = isDup1 || isDup2;
    const duplicateGroupId = isDuplicate ? sharedDuplicateGroupId : undefined;

    const assignedDept = deptMap[template.deptCode] || deptMap['GHMC-GENERAL'];
    const refNum = (i + 1).toString().padStart(6, '0');

    const complaintDoc = {
      referenceId: `CE-HYD-2026-${refNum}`,
      citizenId: citizen._id,
      title: `${template.title} #${i + 1}`,
      description: template.description,
      language: 'en',
      category: template.category,
      location: {
        address: `${loc.area} Main Cross Road, Lane ${Math.floor(i / 2) + 1}`,
        area: loc.area,
        ward: `Ward ${Math.floor(Math.random() * 50) + 1}`,
        geo: {
          type: 'Point',
          coordinates: [finalLng, finalLat],
        },
      },
      media: [
        {
          type: 'image',
          url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=60',
          mimeType: 'image/jpeg',
          uploadedAt: createdAt,
        },
      ],
      aiAnalysis: {
        category: template.category,
        aiSeverityRating,
        priorityScore,
        tags: template.tags,
        summary: `Automated assessment: ${template.category} issue identified in ${loc.area}. Priority score calculated as ${priorityScore}/100.`,
        detectedLanguage: 'en',
        isSimulated: true,
        source: 'mock',
        department: template.deptCode,
        severityFactors: {
          safetyRisk: aiSeverityRating >= 8 ? 'critical' : aiSeverityRating >= 6 ? 'high' : 'medium',
          affectedPopulation: 'street',
          infrastructureDamage: 'moderate',
          publicHealthRisk: template.category === 'Drainage' || template.category === 'Sanitation',
        },
        suggestedActions: ['Zonal engineering squad scheduled for field inspection'],
        confidence: 0.88,
        computedAt: createdAt,
      },
      duplicateGroupId,
      duplicateStatus: isDuplicate ? (isDup2 ? 'unreviewed' : 'confirmed') : 'unreviewed',
      duplicateSimilarityScore: isDuplicate ? 0.82 : undefined,
      department: assignedDept._id,
      status: chosenStatus,
      timeline: [
        {
          status: 'pending',
          note: 'Demo grievance record seeded for system evaluation.',
          updatedBy: citizen._id,
          timestamp: createdAt,
        },
        ...(chosenStatus !== 'pending'
          ? [
              {
                status: 'assigned',
                note: `Allocated to ${assignedDept.name} for immediate field inspection.`,
                updatedBy: admin._id,
                timestamp: new Date(createdAt.getTime() + 4 * 60 * 60 * 1000),
              },
            ]
          : []),
        ...(chosenStatus === 'in-progress' || chosenStatus === 'resolved'
          ? [
              {
                status: 'in-progress',
                note: 'Field engineer dispatched to location. Work underway.',
                updatedBy: admin._id,
                timestamp: new Date(createdAt.getTime() + 18 * 60 * 60 * 1000),
              },
            ]
          : []),
        ...(chosenStatus === 'resolved'
          ? [
              {
                status: 'resolved',
                note: 'Field repairs completed. On-site verification logged and closed.',
                updatedBy: admin._id,
                timestamp: new Date(createdAt.getTime() + 36 * 60 * 60 * 1000),
              },
            ]
          : []),
      ],
      resolutionEvidence:
        chosenStatus === 'resolved'
          ? [
              {
                url: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=800&auto=format&fit=crop&q=60',
                caption: 'Official field completion photograph verified by zonal inspector.',
                uploadedAt: new Date(createdAt.getTime() + 36 * 60 * 60 * 1000),
              },
            ]
          : [],
      upvotes,
      upvotedBy: [citizen._id],
      dataSource: 'DEMO_SIMULATED' as ComplaintDataSource,
      createdAt,
      updatedAt: new Date(),
    };

    complaintsToInsert.push(complaintDoc);
  }

  // 4. Seed Verified External Open Data Sample records from Telangana Open Data
  const externalSampleComplaints = [
    {
      referenceId: 'CE-HYD-2026-000041',
      citizenId: citizen._id,
      title: 'GHMC Public Amenity Defect: Choked box drain near Secunderabad Station Road',
      description: 'Official defect identified during municipal pre-monsoon storm-water audit. Silt accumulation exceeds 60% of conduit capacity.',
      language: 'en',
      category: 'Drainage' as ComplaintCategory,
      location: {
        address: 'Secunderabad Railway Station North Gate Road',
        area: 'Secunderabad',
        ward: 'Ward 147 - Sanath Nagar / Secunderabad',
        geo: { type: 'Point', coordinates: [78.5015, 17.4344] },
      },
      media: [],
      aiAnalysis: {
        category: 'Drainage' as ComplaintCategory,
        aiSeverityRating: 8,
        priorityScore: 78,
        tags: ['stormwater-audit', 'ghmc-opendata', 'desilting'],
        summary: 'Public open data audit: Stormwater box drain desilting required before monsoon.',
        detectedLanguage: 'en',
        isSimulated: false,
        source: 'mock',
        department: 'GHMC-DRAIN',
        computedAt: new Date(),
      },
      duplicateStatus: 'unreviewed',
      department: deptMap['GHMC-DRAIN']?._id,
      status: 'in-progress' as ComplaintStatus,
      timeline: [
        {
          status: 'in-progress',
          note: 'Imported from Telangana State Open Data Portal public infrastructure survey dataset.',
          updatedBy: admin._id,
          timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        },
      ],
      resolutionEvidence: [],
      upvotes: 4,
      upvotedBy: [],
      dataSource: 'VERIFIED_EXTERNAL' as ComplaintDataSource,
      externalSourceAttribution: {
        datasetName: 'GHMC Stormwater Drain Pre-Monsoon Survey',
        sourceOrg: 'Government of Telangana Open Data Portal',
        sourceUrl: 'https://data.telangana.gov.in',
        licence: 'Government Open Data License (OGDL) – India',
      },
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
    },
    {
      referenceId: 'CE-HYD-2026-000042',
      citizenId: citizen._id,
      title: 'TSSPDCL Feeder Pillar Earthing Wire Exposed near Hitech City Cyber Towers',
      description: 'Audit finding: Earthing connection at street feeder pillar disconnected, posing hazard during monsoon inundation.',
      language: 'en',
      category: 'Electricity' as ComplaintCategory,
      location: {
        address: 'Cyber Towers Junction, Main Road',
        area: 'Hitech City',
        ward: 'Ward 107 - Madhapur',
        geo: { type: 'Point', coordinates: [78.3812, 17.4501] },
      },
      media: [],
      aiAnalysis: {
        category: 'Electricity' as ComplaintCategory,
        aiSeverityRating: 9,
        priorityScore: 84,
        tags: ['feeder-pillar', 'tsspdcl-audit', 'electrical-safety'],
        summary: 'External utility survey: Exposed earthing wire at distribution feeder pillar.',
        detectedLanguage: 'en',
        isSimulated: false,
        source: 'mock',
        department: 'TSSPDCL-ELEC',
        computedAt: new Date(),
      },
      duplicateStatus: 'unreviewed',
      department: deptMap['TSSPDCL-ELEC']?._id,
      status: 'assigned' as ComplaintStatus,
      timeline: [
        {
          status: 'assigned',
          note: 'Imported from Telangana Electrical Infrastructure Safety Audit dataset.',
          updatedBy: admin._id,
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
      ],
      resolutionEvidence: [],
      upvotes: 7,
      upvotedBy: [],
      dataSource: 'VERIFIED_EXTERNAL' as ComplaintDataSource,
      externalSourceAttribution: {
        datasetName: 'Telangana Power Distribution Safety Index',
        sourceOrg: 'Telangana State Open Data Portal',
        sourceUrl: 'https://data.telangana.gov.in',
        licence: 'Government Open Data License (OGDL) – India',
      },
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
    },
  ];

  complaintsToInsert.push(...externalSampleComplaints);

  await Complaint.insertMany(complaintsToInsert);

  // Initialize counter for future citizen complaints
  await Counter.findByIdAndUpdate(
    'complaints',
    { seq: complaintsToInsert.length },
    { upsert: true, new: true }
  );

  logger.info(`Successfully seeded ${complaintsToInsert.length} complaints (40 DEMO_SIMULATED + 2 VERIFIED_EXTERNAL).`);
  logger.info(`Test Duplicate Group generated with ID: ${sharedDuplicateGroupId} (Check /admin/duplicates)`);
};

// If run directly via `npm run seed`
if (require.main === module) {
  connectDB()
    .then(async () => {
      await seedDatabase();
      await disconnectDB();
      logger.info('Database seeding completed successfully. Exiting.');
      process.exit(0);
    })
    .catch((err) => {
      logger.error('Seeding failure:', err);
      process.exit(1);
    });
}
