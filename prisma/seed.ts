import { PrismaClient, SalaryPeriod } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const source = await prisma.source.upsert({
    where: { name: "seed-multilingual" },
    create: { name: "seed-multilingual", baseUrl: "https://example.local", active: false },
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



  type OfferInput = {
    language: string;
    title: string;
    description: string;
    jobType: keyof typeof jobTypes;
    region: keyof typeof regions;
    city: string;
    location: string;
    salaryMin: number | null;
    salaryMax: number | null;
    salaryPeriod: SalaryPeriod | null;
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
  };

  type ProfileInput = OfferInput & {
    firstName: string;
    lastName: string;
    age?: number;
    phone?: string;
  };

 
  const FR: OfferInput[] = [
    {
      language: "fr",
      title: "Recherche nounou pour enfant de 2 ans",
      description: "Famille à Cocody Angré recherche nounou expérimentée, du lundi au vendredi, non logée.",
      jobType: "nounou", region: "cocody", city: "Abidjan", location: "Angré, Cocody",
      salaryMin: 50000, salaryMax: 60000, salaryPeriod: SalaryPeriod.MOIS, salaryRaw: "50 000 - 60 000 FCFA/mois",
      workArrangement: "NAVETTE", contractDuration: "PERMANENT",
      workDays: ["LUN", "MAR", "MER", "JEU", "VEN"], workStartTime: "07:30", workEndTime: "18:00",
      experienceYearsRequired: 2, viewCount: 312,
    },
    {
      language: "fr",
      title: "Aide ménagère 3x/semaine",
      description: "Ménage et repassage, appartement 3 pièces à Marcory Zone 4. Sérieux et ponctualité exigés.",
      jobType: "menagere", region: "marcory", city: "Abidjan", location: "Zone 4, Marcory",
      salaryMin: 25000, salaryMax: 30000, salaryPeriod: SalaryPeriod.MOIS, salaryRaw: "25 000 - 30 000 FCFA/mois",
      workArrangement: "NAVETTE", contractDuration: "PERMANENT",
      workDays: ["LUN", "MER", "VEN"], workStartTime: "08:00", workEndTime: "13:00",
      viewCount: 189,
    },
    {
      language: "fr",
      title: "Cuisinier expérimenté demandé - urgent",
      description: "Famille recherche cuisinier pour repas quotidiens, cuisine ivoirienne et française. Poste à pourvoir rapidement.",
      jobType: "cuisinier", region: "plateau", city: "Abidjan", location: "Plateau",
      salaryMin: 70000, salaryMax: 85000, salaryPeriod: SalaryPeriod.MOIS, salaryRaw: "70 000 - 85 000 FCFA/mois",
      isUrgent: true, workArrangement: "LOGE_SUR_PLACE", contractDuration: "PERMANENT",
      experienceYearsRequired: 3, viewCount: 421, isFeatured: true,
    },
    {
      language: "fr",
      title: "Chauffeur particulier avec permis B",
      description: "Recherche chauffeur pour trajets domicile-travail et courses. Voiture fournie. Bonne connaissance d'Abidjan exigée.",
      jobType: "chauffeur", region: "riviera", city: "Abidjan", location: "Riviera 3",
      salaryMin: 80000, salaryMax: 90000, salaryPeriod: SalaryPeriod.MOIS, salaryRaw: "80 000 - 90 000 FCFA/mois",
      transportAllowance: 0, experienceYearsRequired: 5, viewCount: 267,
    },
    {
      language: "fr",
      title: "Gardien de nuit pour villa",
      description: "Villa à Riviera Golf recherche gardien de nuit, temps plein, expérience en sécurité appréciée.",
      jobType: "gardien", region: "riviera", city: "Abidjan", location: "Riviera Golf",
      salaryMin: 45000, salaryMax: 50000, salaryPeriod: SalaryPeriod.MOIS, salaryRaw: "45 000 - 50 000 FCFA/mois",
      shift: "NUIT", workArrangement: "NAVETTE", contractDuration: "PERMANENT", viewCount: 154,
    },
    {
      language: "fr",
      title: "Jardinier pour entretien hebdomadaire",
      description: "Entretien de jardin et espaces verts, une fois par semaine, villa à Cocody.",
      jobType: "jardinier", region: "cocody", city: "Abidjan", location: "Cocody",
      salaryMin: 15000, salaryMax: 20000, salaryPeriod: SalaryPeriod.JOUR, salaryRaw: "15 000 - 20 000 FCFA/jour",
      workDays: ["SAM"], viewCount: 98,
    },
    {
      language: "fr",
      title: "Nounou pour jumeaux, disponibilité immédiate",
      description: "Recherche nounou patiente et expérimentée pour s'occuper de jumeaux en bas âge à Yopougon.",
      jobType: "nounou", region: "yopougon", city: "Abidjan", location: "Yopougon Selmer",
      salaryMin: 55000, salaryMax: 65000, salaryPeriod: SalaryPeriod.MOIS, salaryRaw: "55 000 - 65 000 FCFA/mois",
      isUrgent: true, contractDuration: "PERMANENT", experienceYearsRequired: 3, viewCount: 203,
    },
    {
      language: "fr",
      title: "Aide ménagère logée, temps plein",
      description: "Poste logé pour aide ménagère à Bouaké, famille nombreuse, tâches variées (ménage, cuisine simple).",
      jobType: "menagere", region: "bouake", city: "Bouaké", location: "Bouaké centre",
      salaryMin: 35000, salaryMax: 40000, salaryPeriod: SalaryPeriod.MOIS, salaryRaw: "35 000 - 40 000 FCFA/mois",
      workArrangement: "LOGE_SUR_PLACE", contractDuration: "PERMANENT", viewCount: 87,
    },
    {
      language: "fr",
      title: "Cuisinière pour événements ponctuels",
      description: "Recherche cuisinière pour préparation de repas lors de réceptions occasionnelles, mission temporaire.",
      jobType: "cuisinier", region: "cocody", city: "Abidjan", location: "Cocody 2 Plateaux",
      salaryMin: 20000, salaryMax: 25000, salaryPeriod: SalaryPeriod.JOUR, salaryRaw: "20 000 - 25 000 FCFA/jour",
      contractDuration: "TEMPORAIRE", viewCount: 112,
    },
    {
      language: "fr",
      title: "Chauffeur temporaire pour un mois",
      description: "Remplacement d'un mois pendant les congés du chauffeur habituel, famille à Marcory.",
      jobType: "chauffeur", region: "marcory", city: "Abidjan", location: "Marcory",
      salaryMin: 60000, salaryMax: 60000, salaryPeriod: SalaryPeriod.MOIS, salaryRaw: "60 000 FCFA",
      contractDuration: "TEMPORAIRE", viewCount: 76,
    },
    {
      language: "fr",
      title: "Gardien de jour, résidence sécurisée",
      description: "Poste de jour pour résidence sécurisée à Cocody, expérience en surveillance souhaitée.",
      jobType: "gardien", region: "cocody", city: "Abidjan", location: "Cocody Danga",
      salaryMin: 40000, salaryMax: 45000, salaryPeriod: SalaryPeriod.MOIS, salaryRaw: "40 000 - 45 000 FCFA/mois",
      shift: "JOUR", contractDuration: "PERMANENT", viewCount: 65,
    },
    {
      language: "fr",
      title: "Nounou bilingue français-anglais recherchée",
      description: "Famille recherche nounou parlant français et anglais pour enfant de 4 ans, quartier Riviera.",
      jobType: "nounou", region: "riviera", city: "Abidjan", location: "Riviera 2",
      salaryMin: 65000, salaryMax: 75000, salaryPeriod: SalaryPeriod.MOIS, salaryRaw: "65 000 - 75 000 FCFA/mois",
      isVerified: true, isFeatured: true, experienceYearsRequired: 2, viewCount: 298,
    },
    {
      language: "fr",
      title: "Aide ménagère pour grand ménage ponctuel",
      description: "Grand nettoyage avant emménagement, villa à Plateau, mission d'une journée.",
      jobType: "menagere", region: "plateau", city: "Abidjan", location: "Plateau",
      salaryMin: 15000, salaryMax: 15000, salaryPeriod: SalaryPeriod.JOUR, salaryRaw: "15 000 FCFA/jour",
      contractDuration: "TEMPORAIRE", viewCount: 54,
    },
  ];

  const EN: OfferInput[] = [
    {
      language: "en",
      title: "Live-in nanny needed for expat family",
      description: "English-speaking family in Cocody looking for an experienced, live-in nanny for a 3-year-old. Weekdays plus occasional weekends.",
      jobType: "nounou", region: "cocody", city: "Abidjan", location: "Cocody Ambassades",
      salaryMin: 90000, salaryMax: 110000, salaryPeriod: SalaryPeriod.MOIS, salaryRaw: "90,000 - 110,000 FCFA/month",
      workArrangement: "LOGE_SUR_PLACE", contractDuration: "PERMANENT", isVerified: true, viewCount: 245,
    },
    {
      language: "en",
      title: "Housekeeper wanted, 5 days a week",
      description: "Expat household in Riviera seeking a reliable housekeeper for cleaning and laundry, Monday to Friday.",
      jobType: "menagere", region: "riviera", city: "Abidjan", location: "Riviera Golf 2",
      salaryMin: 60000, salaryMax: 70000, salaryPeriod: SalaryPeriod.MOIS, salaryRaw: "60,000 - 70,000 FCFA/month",
      workArrangement: "NAVETTE", contractDuration: "PERMANENT", viewCount: 167,
    },
    {
      language: "en",
      title: "Personal driver required - urgent",
      description: "NGO staff member needs a personal driver with a clean record and good knowledge of Abidjan. Immediate start.",
      jobType: "chauffeur", region: "plateau", city: "Abidjan", location: "Plateau",
      salaryMin: 100000, salaryMax: 120000, salaryPeriod: SalaryPeriod.MOIS, salaryRaw: "100,000 - 120,000 FCFA/month",
      isUrgent: true, experienceYearsRequired: 4, viewCount: 210,
    },
    {
      language: "en",
      title: "Part-time cook for weekly meal prep",
      description: "Looking for a part-time cook to prepare meals twice a week for a small household in Marcory.",
      jobType: "cuisinier", region: "marcory", city: "Abidjan", location: "Marcory Résidentiel",
      salaryMin: 30000, salaryMax: 35000, salaryPeriod: SalaryPeriod.MOIS, salaryRaw: "30,000 - 35,000 FCFA/month",
      contractDuration: "PERMANENT", viewCount: 92,
    },
  ];

  const AR: OfferInput[] = [
    {
      language: "ar",
      title: "مطلوبة عاملة منزلية بدوام كامل",
      description: "عائلة في كوكودي تبحث عن عاملة منزلية بدوام كامل للتنظيف والطبخ البسيط، خبرة مطلوبة.",
      jobType: "menagere", region: "cocody", city: "أبيدجان", location: "كوكودي",
      salaryMin: 55000, salaryMax: 65000, salaryPeriod: SalaryPeriod.MOIS, salaryRaw: "55,000 - 65,000 فرنك أفريقي شهرياً",
      workArrangement: "LOGE_SUR_PLACE", contractDuration: "PERMANENT", viewCount: 143,
    },
    {
      language: "ar",
      title: "مطلوب سائق خاص بشكل عاجل",
      description: "عائلة لبنانية في الريفييرا تبحث عن سائق خاص يحمل رخصة قيادة سارية وخبرة في شوارع أبيدجان.",
      jobType: "chauffeur", region: "riviera", city: "أبيدجان", location: "ريفييرا",
      salaryMin: 85000, salaryMax: 95000, salaryPeriod: SalaryPeriod.MOIS, salaryRaw: "85,000 - 95,000 فرنك أفريقي شهرياً",
      isUrgent: true, experienceYearsRequired: 3, viewCount: 176,
    },
    {
      language: "ar",
      title: "مطلوبة جليسة أطفال ذات خبرة",
      description: "نبحث عن جليسة أطفال صبورة وذات خبرة لرعاية طفل عمره سنتان، من الاثنين إلى الجمعة.",
      jobType: "nounou", region: "plateau", city: "أبيدجان", location: "بلاتو",
      salaryMin: 60000, salaryMax: 70000, salaryPeriod: SalaryPeriod.MOIS, salaryRaw: "60,000 - 70,000 فرنك أفريقي شهرياً",
      isVerified: true, viewCount: 121,
    },
    {
      language: "ar",
      title: "مطلوب طباخ لتحضير الوجبات اليومية",
      description: "عائلة كبيرة في ماركوري تبحث عن طباخ لتحضير وجبات يومية، خبرة في المطبخ اللبناني تفضّل.",
      jobType: "cuisinier", region: "marcory", city: "أبيدجان", location: "ماركوري",
      salaryMin: 75000, salaryMax: 90000, salaryPeriod: SalaryPeriod.MOIS, salaryRaw: "75,000 - 90,000 فرنك أفريقي شهرياً",
      contractDuration: "PERMANENT", viewCount: 88,
    },
  ];

  const ZH: OfferInput[] = [
    {
      language: "zh",
      title: "招聘保姆,照顾两岁儿童",
      description: "阿比让科科迪区一个华人家庭招聘经验丰富的保姆,周一至周五,不需要住家。",
      jobType: "nounou", region: "cocody", city: "阿比让", location: "科科迪",
      salaryMin: 55000, salaryMax: 65000, salaryPeriod: SalaryPeriod.MOIS, salaryRaw: "55,000 - 65,000 西非法郎/月",
      contractDuration: "PERMANENT", experienceYearsRequired: 2, viewCount: 134,
    },
    {
      language: "zh",
      title: "急聘家庭司机",
      description: "普拉托区华人企业主急需一名熟悉阿比让路况的私人司机,持有有效驾照。",
      jobType: "chauffeur", region: "plateau", city: "阿比让", location: "普拉托",
      salaryMin: 90000, salaryMax: 100000, salaryPeriod: SalaryPeriod.MOIS, salaryRaw: "90,000 - 100,000 西非法郎/月",
      isUrgent: true, experienceYearsRequired: 4, viewCount: 158,
    },
    {
      language: "zh",
      title: "招聘住家保洁员",
      description: "马科里区家庭招聘住家保洁员,负责日常清洁和洗衣,需吃苦耐劳。",
      jobType: "menagere", region: "marcory", city: "阿比让", location: "马科里",
      salaryMin: 40000, salaryMax: 45000, salaryPeriod: SalaryPeriod.MOIS, salaryRaw: "40,000 - 45,000 西非法郎/月",
      workArrangement: "LOGE_SUR_PLACE", contractDuration: "PERMANENT", viewCount: 71,
    },
    {
      language: "zh",
      title: "招聘中餐厨师",
      description: "里维埃拉区华人家庭招聘厨师,会做中餐者优先考虑,长期稳定工作。",
      jobType: "cuisinier", region: "riviera", city: "阿比让", location: "里维埃拉",
      salaryMin: 80000, salaryMax: 95000, salaryPeriod: SalaryPeriod.MOIS, salaryRaw: "80,000 - 95,000 西非法郎/月",
      isFeatured: true, experienceYearsRequired: 3, viewCount: 199,
    },
  ];

  const allOffers = [...FR, ...EN, ...AR, ...ZH];


  const allProfiles: ProfileInput[] = [

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
      salaryPeriod: SalaryPeriod.MOIS,
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
      salaryPeriod: SalaryPeriod.MOIS,
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
      salaryPeriod: SalaryPeriod.MOIS,
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
      salaryPeriod: SalaryPeriod.MOIS,
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
      salaryPeriod: SalaryPeriod.MOIS,
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
      salaryPeriod: SalaryPeriod.MOIS,
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
      salaryPeriod: SalaryPeriod.MOIS,
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
  ];

  for (const [i, offer] of allOffers.entries()) {
    await prisma.announcement.upsert({
      where: { sourceId_externalId: { sourceId: source.id, externalId: `offer-${i}` } },
      create: {
        sourceId: source.id,
        externalId: `offer-${i}`,
        type: "OFFER",
        language: offer.language,
        title: offer.title,
        description: offer.description,
        jobTypeId: jobTypes[offer.jobType],
        regionId: regions[offer.region],
        city: offer.city,
        location: offer.location,
        salaryMin: offer.salaryMin,
        salaryMax: offer.salaryMax,
        salaryPeriod: offer.salaryPeriod,
        salaryRaw: offer.salaryRaw,
        isUrgent: offer.isUrgent ?? false,
        isFeatured: offer.isFeatured ?? false,
        isVerified: offer.isVerified ?? false,
        workArrangement: offer.workArrangement,
        shift: offer.shift,
        contractDuration: offer.contractDuration,
        transportAllowance: offer.transportAllowance ?? null,
        workDays: offer.workDays ?? [],
        workStartTime: offer.workStartTime,
        workEndTime: offer.workEndTime,
        experienceYearsRequired: offer.experienceYearsRequired ?? null,
        viewCount: offer.viewCount ?? 0,
        contactPhone: "0700000000",
        postedAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 86400000),
      },
      update: {},
    });
  }


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
        contactPhone: profile.phone ?? "0700000000",
        postedAt: new Date(Date.now() - Math.floor(Math.random() * 60) * 86400000),
      },
      update: {},
    });
  }

  console.log(
    `✅ ${allOffers.length} offres + ${allProfiles.length} profils créés (FR/EN/AR/ZH)`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());