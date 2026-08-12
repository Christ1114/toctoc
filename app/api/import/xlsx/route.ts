import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'


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


export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key')

    if (apiKey !== process.env.IMPORT_SECRET) {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 401 }
      )
    }
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Aucun fichier' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const workbook = XLSX.read(bytes, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(worksheet)

    console.log(`📄 ${data.length} lignes trouvées`)
    const sourceCache: Record<string, string> = {}
    const jobTypeCache: Record<string, string> = {}

    let saved = 0
    let skipped = 0
    const errors: string[] = []

    for (const row of data as any[]) {
      try {
        const sourceName = row['source']?.toString().trim()
        const jobTypeName = row['jobType']?.toString().trim() || 'Non précisé'
        const externalId = row['externalId']?.toString().trim()

        if (!sourceName || !externalId || !row['title']) {
          skipped++
          continue
        }
        if (!sourceCache[sourceName]) {
          let source = await prisma.source.findFirst({
            where: { name: sourceName },
          })
          if (!source) {
            source = await prisma.source.create({
              data: {
                name: sourceName,
                baseUrl: row['sourceBaseUrl']?.toString().trim() || row['url']?.toString().trim() || '',
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
                category: row['jobTypeCategory']?.toString().trim() || 'Domestique',
              },
            })
          }
          jobTypeCache[jobTypeName] = jobType.id
        }
        const rawType = row['type']?.toString().trim().toUpperCase()
        const listingType = rawType === 'OFFER' || rawType === 'PROFILE' ? rawType : 'PROFILE'

        const announcementData: any = {
          type: listingType,
          sourceId: sourceCache[sourceName],
          externalId: externalId,
          title: row['title']?.toString().trim(),
          description: row['description']?.toString().trim() || null,
          city: row['city']?.toString().trim() || null,
          location: row['location']?.toString().trim() || null,
          language: row['language']?.toString().trim() || 'fr',
          jobTypeId: jobTypeCache[jobTypeName],
          url: row['url']?.toString().trim() || null,
          contactPhone: row['contactPhone']?.toString().trim() || null,
          contactWhatsapp: row['contactWhatsapp']?.toString().trim() || null,
          salaryRaw: row['salaryRaw']?.toString().trim() || null,
          rawData: row,
        }

        if (row['salaryMin']) announcementData.salaryMin = parseFloat(row['salaryMin'])
        if (row['salaryMax']) announcementData.salaryMax = parseFloat(row['salaryMax'])
        if (row['transportAllowance']) announcementData.transportAllowance = parseFloat(row['transportAllowance'])
        if (row['experienceYearsRequired']) announcementData.experienceYearsRequired = parseInt(row['experienceYearsRequired'])
        if (row['viewCount']) announcementData.viewCount = parseInt(row['viewCount'])

        if (row['isUrgent']) announcementData.isUrgent = row['isUrgent'] === true || row['isUrgent'] === 'true' || row['isUrgent'] === 'TRUE' || row['isUrgent'] === '1'
        if (row['isVerified']) announcementData.isVerified = row['isVerified'] === true || row['isVerified'] === 'true' || row['isVerified'] === 'TRUE' || row['isVerified'] === '1'
        if (row['isFeatured']) announcementData.isFeatured = row['isFeatured'] === true || row['isFeatured'] === 'true' || row['isFeatured'] === 'TRUE' || row['isFeatured'] === '1'

   
        if (row['postedAt']) {
          const parsedDate = parseRelativeDate(row['postedAt'].toString())
          if (parsedDate) announcementData.postedAt = parsedDate
        }
        if (row['desiredStartDate']) {
          const parsedDate = parseRelativeDate(row['desiredStartDate'].toString())
          if (parsedDate) announcementData.desiredStartDate = parsedDate
        }

        const validSalaryPeriods = ['HEURE', 'JOUR', 'SEMAINE', 'MOIS']
        if (row['salaryPeriod'] && validSalaryPeriods.includes(row['salaryPeriod'].toString().toUpperCase())) {
          announcementData.salaryPeriod = row['salaryPeriod'].toString().toUpperCase()
        }

        const validWorkArrangements = ['NAVETTE', 'LOGE_SUR_PLACE']
        if (row['workArrangement'] && validWorkArrangements.includes(row['workArrangement'].toString().toUpperCase())) {
          announcementData.workArrangement = row['workArrangement'].toString().toUpperCase()
        }

        const validShifts = ['JOUR', 'NUIT']
        if (row['shift'] && validShifts.includes(row['shift'].toString().toUpperCase())) {
          announcementData.shift = row['shift'].toString().toUpperCase()
        }
        const validContractDurations = ['TEMPORAIRE', 'PERMANENT']
        if (row['contractDuration'] && validContractDurations.includes(row['contractDuration'].toString().toUpperCase())) {
          announcementData.contractDuration = row['contractDuration'].toString().toUpperCase()
        }
        if (row['workDays']) {
          announcementData.workDays = typeof row['workDays'] === 'string'
            ? row['workDays'].split(',').map((d: string) => d.trim()).filter(Boolean)
            : row['workDays']
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
        total: data.length,
        saved,
        skipped,
      },
      errors: errors.slice(0, 10),
    })

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}