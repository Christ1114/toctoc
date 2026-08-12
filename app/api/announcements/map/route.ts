import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const language = searchParams.get('language') || 'fr'

    // Regrouper par ville avec comptage
    const locationAggregation = await prisma.announcement.groupBy({
      by: ['city'],
      where: {
        language,
        city: { not: null },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 50,
    })

    const points = locationAggregation.map((item) => ({
      city: item.city,
      count: item._count.id,
    }))

    const total = await prisma.announcement.count({
      where: { language, city: { not: null } },
    })

    return NextResponse.json({
      success: true,
      data: {
        points,
        stats: {
          totalAnnouncements: total,
          totalLocations: points.length,
        },
      },
    })

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch map data' },
      { status: 500 }
      
    )
  }
}