import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'
import { z } from 'zod'
import { timingSafeEqual } from 'crypto'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
]

function parseRelativeDate(text: string): Date | null {
  if (!text || text === '') return null

  const cleaned = text.toLowerCase().trim()
  const now = new Date()

  const moisMatch = cleaned.match(/il y a (\d+)\s*mois/)
  if (moisMatch) {
    const months = parseInt(moisMatch[1])
    now.setMonth(now.getMonth() - months)
    return now
  }

  const joursMatch = cleaned.match(/il y a (\d+)\s*jour/)
  if (joursMatch) {
    const days = parseInt(joursMatch[1])
    now.setDate(now.getDate() - days)
    return now
  }

  const semMatch = cleaned.match(/il y a (\d+)\s*semaine/)
  if (semMatch) {
    const weeks = parseInt(semMatch[1])
    now.setDate(now.getDate() - weeks * 7)
    return now
  }

  const heuresMatch = cleaned.match(/il y a (\d+)\s*heure/)
  if (heuresMatch) {
    const hours = parseInt(heuresMatch[1])
    now.setHours(now.getHours() - hours)
    return now
  }

  if (cleaned.includes("aujourd'hui") || cleaned.includes('today')) return now

  if (cleaned.includes('hier') || cleaned.includes('yesterday')) {
    now.setDate(now.getDate() - 1)
    return now
  }

  const dateMatch = cleaned.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/)
  if (dateMatch) {
    const day = parseInt(dateMatch[1])
    const month = parseInt(dateMatch[2]) - 1
    let year = parseInt(dateMatch[3])
    if (year < 100) year += 2000
    return new Date(year, month, day)
  }

  const parsed = new Date(text)
  if (!isNaN(parsed.getTime())) return parsed

  return null
}

// Compare deux chaînes en temps constant pour éviter les timing attacks
function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

// Schéma de validation d'une ligne du fichier Excel.
// Tout est optionnel/coercé car les fichiers Excel sont des sources
// externes peu fiables, mais chaque champ est borné et typé.
const RowSchema = z.object({
  source: z.string().trim().min(1),
  externalId: z.string().trim().min(1),
  title: z.string().trim().min(1).max(300),
  jobType: z.string().trim().max(100).optional(),
  jobTypeCategory: z.string().trim().max(100).optional(),
  sourceBaseUrl: z.string().trim().max(2048).optional(),
  url: z.string().trim().max(2048).optional(),
  description: z.string().trim().max(5000).optional(),
  city: z.string().trim().max(150).optional(),
  location: z.string().trim().max(300).optional(),
  language: z.string().trim().max(10).optional(),
  contactPhone: z.string().trim().max(30).optional(),
  contactWhatsapp: z.string().trim().max(30).optional(),
  salaryRaw: z.string().trim().max(200).optional(),
  salaryMin: z.coerce.number().finite().min(0).max(100_000_000).optional(),
  salaryMax: z.coerce.number().finite().min(0).max(100_000_000).optional(),
  transportAllowance: z.coerce.number().finite().min(0).max(10_000_000).optional(),
  experienceYearsRequired: z.coerce.number().int().min(0).max(60).optional(),
  viewCount: z.coerce.number().int().min(0).optional(),
  isUrgent: z.union([z.boolean(), z.string()]).optional(),
  isVerified: z.union([z.boolean(), z.string()]).optional(),
  isFeatured: z.union([z.boolean(), z.string()]).optional(),
  postedAt: z.union([z.string(), z.number()]).optional(),
  desiredStartDate: z.union([z.string(), z.number()]).optional(),
  salaryPeriod: z.string().trim().max(20).optional(),
  workArrangement: z.string().trim().max(30).optional(),
  shift: z.string().trim().max(20).optional(),
  contractDuration: z.string().trim().max(20).optional(),
  workDays: z.union([z.string(), z.array(z.string())]).optional(),
  type: z.string().trim().max(20).optional(),
}).passthrough() // autorise des colonnes en plus dans rawData, mais les champs connus sont validés au-dessus

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key')
    const expectedKey = process.env.IMPORT_SECRET

    if (!apiKey || !expectedKey || !safeCompare(apiKey, expectedKey)) {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: 'Aucun fichier valide' },
        { status: 400 }
      )
    }

    if (file.size === 0) {
      return NextResponse.json(
        { success: false, error: 'Fichier vide' },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: `Fichier trop volumineux (max ${MAX_FILE_SIZE / 1024 / 1024} Mo)` },
        { status: 413 }
      )
    }

    if (file.type && !ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Type de fichier non autorisé. Utilisez un fichier .xlsx ou .xls' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()

    let workbook: XLSX.WorkBook
    try {
      workbook = XLSX.read(bytes, { type: 'array' })
    } catch {
      return NextResponse.json(
        { success: false, error: 'Fichier illisible ou corrompu' },
        { status: 400 }
      )
    }

    const sheetName = workbook.SheetNames[0]
    if (!sheetName) {
      return NextResponse.json(
        { success: false, error: 'Aucune feuille trouvée dans le fichier' },
        { status: 400 }
      )
    }

    const worksheet = workbook.Sheets[sheetName]
    const rawRows = XLSX.utils.sheet_to_json(worksheet)

    const MAX_ROWS = 5000
    if (rawRows.length > MAX_ROWS) {
      return NextResponse.json(
        { success: false, error: `Trop de lignes (max ${MAX_ROWS})` },
        { status: 400 }
      )
    }

    console.log(`📄 ${rawRows.length} lignes trouvées`)
    const sourceCache: Record<string, string> = {}
    const jobTypeCache: Record<string, string> = {}

    let saved = 0
    let skipped = 0
    const errors: string[] = []

    for (const rawRow of rawRows) {
      const parseResult = RowSchema.safeParse(rawRow)

      if (!parseResult.success) {
        skipped++
        errors.push(`Ligne invalide: ${parseResult.error.issues.map(i => i.message).join(', ')}`)
        continue
      }

      const row = parseResult.data

      try {
        const sourceName = row.source
        const jobTypeName = row.jobType || 'Non précisé'
        const externalId = row.externalId

        if (!sourceCache[sourceName]) {
          let source = await prisma.source.findFirst({
            where: { name: sourceName },
          })
          if (!source) {
            source = await prisma.source.create({
              data: {
                name: sourceName,
                baseUrl: row.sourceBaseUrl || row.url || '',
                active: true,
              },
            })
          }
          sourceCache[sourceName] = source.id
        }

        if (!jobTypeCache[jobTypeName]) {
          const slug = jobTypeName.toLowerCase().replace(/\s+/g, '-')
          let jobType = await prisma.jobType.findFirst({
            where: { slug },
          })
          if (!jobType) {
            jobType = await prisma.jobType.create({
              data: {
                name: jobTypeName,
                slug,
                category: row.jobTypeCategory || 'Domestique',
              },
            })
          }
          jobTypeCache[jobTypeName] = jobType.id
        }

        const rawType = row.type?.toUpperCase()
        const listingType = rawType === 'OFFER' || rawType === 'PROFILE' ? rawType : 'PROFILE'

        const announcementData: any = {
          type: listingType,
          sourceId: sourceCache[sourceName],
          externalId: externalId,
          title: row.title,
          description: row.description || null,
          city: row.city || null,
          location: row.location || null,
          language: row.language || 'fr',
          jobTypeId: jobTypeCache[jobTypeName],
          url: row.url || null,
          contactPhone: row.contactPhone || null,
          contactWhatsapp: row.contactWhatsapp || null,
          salaryRaw: row.salaryRaw || null,
          rawData: row,
        }

        if (row.salaryMin !== undefined) announcementData.salaryMin = row.salaryMin
        if (row.salaryMax !== undefined) announcementData.salaryMax = row.salaryMax
        if (row.transportAllowance !== undefined) announcementData.transportAllowance = row.transportAllowance
        if (row.experienceYearsRequired !== undefined) announcementData.experienceYearsRequired = row.experienceYearsRequired
        if (row.viewCount !== undefined) announcementData.viewCount = row.viewCount

        if (row.isUrgent !== undefined) announcementData.isUrgent = row.isUrgent === true || row.isUrgent === 'true' || row.isUrgent === 'TRUE' || row.isUrgent === '1'
        if (row.isVerified !== undefined) announcementData.isVerified = row.isVerified === true || row.isVerified === 'true' || row.isVerified === 'TRUE' || row.isVerified === '1'
        if (row.isFeatured !== undefined) announcementData.isFeatured = row.isFeatured === true || row.isFeatured === 'true' || row.isFeatured === 'TRUE' || row.isFeatured === '1'

        if (row.postedAt) {
          const parsedDate = parseRelativeDate(row.postedAt.toString())
          if (parsedDate) announcementData.postedAt = parsedDate
        }
        if (row.desiredStartDate) {
          const parsedDate = parseRelativeDate(row.desiredStartDate.toString())
          if (parsedDate) announcementData.desiredStartDate = parsedDate
        }

        const validSalaryPeriods = ['HEURE', 'JOUR', 'SEMAINE', 'MOIS']
        if (row.salaryPeriod && validSalaryPeriods.includes(row.salaryPeriod.toUpperCase())) {
          announcementData.salaryPeriod = row.salaryPeriod.toUpperCase()
        }

        const validWorkArrangements = ['NAVETTE', 'LOGE_SUR_PLACE']
        if (row.workArrangement && validWorkArrangements.includes(row.workArrangement.toUpperCase())) {
          announcementData.workArrangement = row.workArrangement.toUpperCase()
        }

        const validShifts = ['JOUR', 'NUIT']
        if (row.shift && validShifts.includes(row.shift.toUpperCase())) {
          announcementData.shift = row.shift.toUpperCase()
        }

        const validContractDurations = ['TEMPORAIRE', 'PERMANENT']
        if (row.contractDuration && validContractDurations.includes(row.contractDuration.toUpperCase())) {
          announcementData.contractDuration = row.contractDuration.toUpperCase()
        }

        if (row.workDays) {
          announcementData.workDays = typeof row.workDays === 'string'
            ? row.workDays.split(',').map((d: string) => d.trim()).filter(Boolean)
            : row.workDays
        }

        await prisma.announcement.upsert({
          where: {
            sourceId_externalId: {
              sourceId: sourceCache[sourceName],
              externalId: externalId,
            },
          },
          update: announcementData,
          create: announcementData,
        })

        saved++
      } catch (error: any) {
        skipped++
        errors.push(`Ligne erreur: ${error.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `${saved} offres importées, ${skipped} ignorées`,
      stats: {
        total: rawRows.length,
        saved,
        skipped,
      },
      errors: errors.slice(0, 10),
    })

  } catch (error: any) {
    console.error('Erreur import xlsx:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}