
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/app/lib/auth';
import { headers } from 'next/headers';
import { z } from 'zod';

const REQUIRED_CONSENTS = [
  "LOCATION_ACCESS",
  "NO_VPN",
  "VR_CONFERENCE",
  "TERMS_OF_USE",
] as const;


const consentSchema = z.object({
  consents: z.object({
    LOCATION_ACCESS: z.boolean(),
    NO_VPN: z.boolean(),
    VR_CONFERENCE: z.boolean(),
    TERMS_OF_USE: z.boolean(),
  }),
});

export async function POST(request: Request) {
  try {
    
    const body = await request.json();
    const { consents } = consentSchema.parse(body);

    
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' }, 
        { status: 401 }
      );
    }

 
    const missing = REQUIRED_CONSENTS.filter((type) => consents[type] !== true);

    if (missing.length > 0) {
      return NextResponse.json(
        { error: 'Tous les consentements sont requis' }, 
        { status: 400 }
      );
    }

   
    await prisma.$transaction(
      REQUIRED_CONSENTS.map((type) =>
        prisma.userConsent.upsert({
          where: {
            userId_type: {
              userId: session.user.id,
              type: type,
            },
          },
          update: {
            accepted: true,
            acceptedAt: new Date(),
          },
          create: {
            userId: session.user.id,
            type: type,
            accepted: true,
            acceptedAt: new Date(),
          },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
   
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Données invalides', 
          details: error.issues,
        }, 
        { status: 400 }
      );
    }

    console.error('Erreur enregistrement consentements:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' }, 
      { status: 500 }
    );
  }
}