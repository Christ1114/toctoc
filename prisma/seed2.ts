import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const source = await prisma.source.upsert({
    where: { name: "seed-profiles" },
    create: { name: "seed-profiles", baseUrl: "https://example.local", active: false },
    update: {},
  });

  const regionDefs = [
    { name: "Cocody", slug: "cocody", latitude: 5.345, longitude: -3.988 },
    { name: "Yopougon", slug: "yopougon", latitude: 5.3167, longitude: -4.0833 },
    { name: "Plateau", slug: "plateau", latitude: 5.32, longitude: -4.02 },
    { name: "Marcory", slug: "marcory", latitude: 5.3, longitude: -3.9833 },
    { name: "Riviera", slug: "riviera", latitude: 5.3667, longitude: -3.9667 },
    { name: "Bouaké", slug: "bouake", latitude: 7.69, longitude: -5.03 },
  ];
  const regions: Record<string, string> = {};
  for (const r of regionDefs) {
    const created = await prisma.region.upsert({ where: { slug: r.slug }, create: r, update: {} });
    regions[r.slug] = created.id;
  }

  const jobTypeDefs = [
    { name: "Nounou", slug: "nounou", category: "garde-enfants" },
    { name: "Aide ménagère", slug: "menagere", category: "menage" },
    { name: "Cuisinier·ère", slug: "cuisinier", category: "cuisine" },
    { name: "Chauffeur", slug: "chauffeur", category: "transport" },
    { name: "Gardien", slug: "gardien", category: "securite" },
    { name: "Jardinier", slug: "jardinier", category: "exterieur" },
  ];
  const jobTypes: Record<string, string> = {};
  for (const j of jobTypeDefs) {
    const created = await prisma.jobType.upsert({ where: { slug: j.slug }, create: j, update: {} });
    jobTypes[j.slug] = created.id;
  }

  type ProfileInput = {
    language: string;
    title: string;
    description: string;
    jobType: keyof typeof jobTypes;
    region: keyof typeof regions;
    city: string;
    location: string;
    salaryMin: number | null;
    salaryMax: number | null;
    salaryPeriod: string | null;
    salaryRaw: string;
    isUrgent?: boolean;
    isFeatured?: boolean;
    isVerified?: boolean;
    workArrangement?: "NAVETTE" | "LOGE_SUR_PLACE";
    shift?: "JOUR" | "NUIT";
    contractDuration?: "TEMPORAIRE" | "PERMANENT";
    transportAllowance?: number | null;
    workDays?: string[];
    workStartTime?: string;
    workEndTime?: string;
    experienceYearsRequired?: number | null;
    viewCount?: number;
    firstName: string;
    lastName: string;
    age?: number;
    phone?: string;
  };

  // 7 PROFILS
  const allProfiles: ProfileInput[] = [
    // FRANÇAIS (2)
    {
      language: "fr",
      firstName: "Marie",
      lastName: "Koné",
      age: 28,
      title: "Nounou expérimentée - 5 ans d'expérience",
      description: "Je m'appelle Marie Koné, j'ai 28 ans et je suis nounou depuis 5 ans. Je suis douce, patiente et j'adore les enfants. Disponible immédiatement.",
      jobType: "nounou",
      region: "cocody",
      city: "Abidjan",
      location: "Cocody Angré",
      salaryMin: 150000,
      salaryMax: 200000,
      salaryPeriod: "mois",
      salaryRaw: "150 000 - 200 000 FCFA/mois",
      workArrangement: "NAVETTE",
      contractDuration: "PERMANENT",
      workDays: ["LUN", "MAR", "MER", "JEU", "VEN"],
      workStartTime: "07:30",
      workEndTime: "17:30",
      experienceYearsRequired: 5,
      isVerified: true,
      isFeatured: true,
      viewCount: 45,
      phone: "0707123456",
    },
    {
      language: "fr",
      firstName: "Aminata",
      lastName: "Traoré",
      age: 32,
      title: "Ménagère professionnelle - 7 ans d'expérience",
      description: "Je m'appelle Aminata Traoré, 32 ans. Je suis une ménagère professionnelle avec 7 ans d'expérience. Sérieuse et discrète.",
      jobType: "menagere",
      region: "plateau",
      city: "Abidjan",
      location: "Plateau - Zone 4",
      salaryMin: 120000,
      salaryMax: 150000,
      salaryPeriod: "mois",
      salaryRaw: "120 000 - 150 000 FCFA/mois",
      workArrangement: "LOGE_SUR_PLACE",
      contractDuration: "PERMANENT",
      workDays: ["LUN", "MAR", "MER", "JEU", "VEN", "SAM"],
      workStartTime: "08:00",
      workEndTime: "16:00",
      experienceYearsRequired: 7,
      isVerified: true,
      isUrgent: true,
      viewCount: 78,
      phone: "0707234567",
    },
    // ANGLAIS (2)
    {
      language: "en",
      firstName: "Sarah",
      lastName: "Johnson",
      age: 34,
      title: "Experienced Nanny - Bilingual English/French",
      description: "I'm Sarah Johnson, 34, a professional nanny with 8 years of experience. Bilingual English/French. Available immediately.",
      jobType: "nounou",
      region: "cocody",
      city: "Abidjan",
      location: "Cocody Ambassades",
      salaryMin: 200000,
      salaryMax: 250000,
      salaryPeriod: "mois",
      salaryRaw: "200,000 - 250,000 FCFA/month",
      workArrangement: "LOGE_SUR_PLACE",
      contractDuration: "PERMANENT",
      workDays: ["LUN", "MAR", "MER", "JEU", "VEN"],
      workStartTime: "08:00",
      workEndTime: "18:00",
      experienceYearsRequired: 8,
      isVerified: true,
      isFeatured: true,
      viewCount: 234,
      phone: "0708123456",
    },
    {
      language: "en",
      firstName: "Michael",
      lastName: "Smith",
      age: 42,
      title: "Professional Chauffeur - 12 years experience",
      description: "Michael Smith, 42, professional chauffeur with 12 years of experience in Abidjan. Clean driving record.",
      jobType: "chauffeur",
      region: "plateau",
      city: "Abidjan",
      location: "Plateau",
      salaryMin: 180000,
      salaryMax: 200000,
      salaryPeriod: "mois",
      salaryRaw: "180,000 - 200,000 FCFA/month",
      workArrangement: "NAVETTE",
      contractDuration: "PERMANENT",
      workDays: ["LUN", "MAR", "MER", "JEU", "VEN", "SAM"],
      workStartTime: "06:30",
      workEndTime: "19:00",
      experienceYearsRequired: 12,
      isVerified: true,
      viewCount: 98,
      phone: "0708234567",
    },
    // ARABE (1)
    {
      language: "ar",
      firstName: "فاطمة",
      lastName: "حسن",
      age: 31,
      title: "مربية أطفال ذات خبرة - 6 سنوات",
      description: "أنا فاطمة حسن، 31 سنة. لدي 6 سنوات من الخبرة في رعاية الأطفال. أجيد العربية والفرنسية. متوفرة فوراً.",
      jobType: "nounou",
      region: "plateau",
      city: "أبيدجان",
      location: "بلاتو",
      salaryMin: 140000,
      salaryMax: 170000,
      salaryPeriod: "mois",
      salaryRaw: "140,000 - 170,000 فرنك أفريقي شهرياً",
      workArrangement: "LOGE_SUR_PLACE",
      contractDuration: "PERMANENT",
      workDays: ["LUN", "MAR", "MER", "JEU", "VEN"],
      workStartTime: "08:00",
      workEndTime: "18:00",
      experienceYearsRequired: 6,
      isVerified: true,
      isFeatured: true,
      viewCount: 145,
      phone: "0708678901",
    },
    // CHINOIS (1)
    {
      language: "zh",
      firstName: "Mei",
      lastName: "Chen",
      age: 28,
      title: "经验丰富的保姆 - 双语中法",
      description: "我是陈梅,28岁,有5年保姆经验。讲流利的中文和法语。有耐心，有责任心。随时可以开始工作。",
      jobType: "nounou",
      region: "cocody",
      city: "阿比让",
      location: "科科迪",
      salaryMin: 150000,
      salaryMax: 180000,
      salaryPeriod: "mois",
      salaryRaw: "150,000 - 180,000 西非法郎/月",
      workArrangement: "NAVETTE",
      contractDuration: "PERMANENT",
      workDays: ["LUN", "MAR", "MER", "JEU", "VEN"],
      workStartTime: "08:00",
      workEndTime: "17:00",
      experienceYearsRequired: 5,
      isVerified: true,
      isFeatured: true,
      viewCount: 123,
      phone: "0709123456",
    },
    {
      language: "ar",
      firstName: "أحمد",
      lastName: "علي",
      age: 37,
      title: "طباخ محترف - 8 سنوات خبرة",
      description: "أنا أحمد علي، 37 سنة. طباخ محترف مع 8 سنوات من الخبرة. متخصص في المطبخ العربي والفرنسي.",
      jobType: "cuisinier",
      region: "marcory",
      city: "أبيدجان",
      location: "ماركوري",
      salaryMin: 190000,
      salaryMax: 220000,
      salaryPeriod: "mois",
      salaryRaw: "190,000 - 220,000 فرنك أفريقي شهرياً",
      workArrangement: "LOGE_SUR_PLACE",
      contractDuration: "PERMANENT",
      workDays: ["LUN", "MAR", "MER", "JEU", "VEN", "SAM", "DIM"],
      workStartTime: "09:00",
      workEndTime: "19:00",
      experienceYearsRequired: 8,
      isVerified: true,
      isUrgent: true,
      viewCount: 87,
      phone: "0708789012",
    },
  ];

  for (const [i, profile] of allProfiles.entries()) {
    await prisma.announcement.upsert({
      where: { sourceId_externalId: { sourceId: source.id, externalId: `profile-${i}` } },
      create: {
        sourceId: source.id,
        externalId: `profile-${i}`,
        type: "PROFILE",
        language: profile.language,
        title: `${profile.firstName} ${profile.lastName} - ${profile.title}`,
        description: profile.description,
        jobTypeId: jobTypes[profile.jobType],
        regionId: regions[profile.region],
        city: profile.city,
        location: profile.location,
        salaryMin: profile.salaryMin,
        salaryMax: profile.salaryMax,
        salaryPeriod: profile.salaryPeriod,
        salaryRaw: profile.salaryRaw,
        isUrgent: profile.isUrgent ?? false,
        isFeatured: profile.isFeatured ?? false,
        isVerified: profile.isVerified ?? false,
        workArrangement: profile.workArrangement,
        shift: profile.shift,
        contractDuration: profile.contractDuration,
        transportAllowance: profile.transportAllowance ?? null,
        workDays: profile.workDays ?? [],
        workStartTime: profile.workStartTime,
        workEndTime: profile.workEndTime,
        experienceYearsRequired: profile.experienceYearsRequired ?? null,
        viewCount: profile.viewCount ?? 0,
        contact: profile.phone ?? "0700000000 (donnée de test)",
        postedAt: new Date(Date.now() - Math.floor(Math.random() * 60) * 86400000),
      },
      update: {},
    });
  }

  console.log(`✅ ${allProfiles.length} profils créés :`);
  console.log(`   FR=2, EN=2, AR=2, ZH=1`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());