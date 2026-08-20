import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { detectIvorianOperator, isIvorianNumber, normalizeIvorianNumber } from "@/app/lib/operatorDetection";


const ipRequests = new Map<string, { count: number; timestamp: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; 
  const maxRequests = 10; 
  
  const request = ipRequests.get(ip);
  
  if (!request || now - request.timestamp > windowMs) {
    ipRequests.set(ip, { count: 1, timestamp: now });
    return true;
  }
  
  if (request.count >= maxRequests) {
    return false;
  }
  
  request.count++;
  return true;
}


function isValidPhone(phoneNumber: string): boolean {
 
  if (!isIvorianNumber(phoneNumber)) {
    return false;
  }
  

  const cleaned = phoneNumber.replace(/\D/g, "");
  
 
  if (cleaned.startsWith("225")) {
    return cleaned.length === 13; 
  }
  
  return false;
}


export async function POST(req: NextRequest) {
  try {
    
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    
   
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Trop de requêtes. Veuillez réessayer dans une minute." },
        { status: 429 }
      );
    }
    
    const body = await req.json();
    const { phoneNumber } = body;
    
    if (!phoneNumber) {
      return NextResponse.json(
        { error: "Numéro de téléphone requis." },
        { status: 400 }
      );
    }
    
   
    if (!isIvorianNumber(phoneNumber)) {
      return NextResponse.json(
        { error: "Numéro non ivoirien. Utilisez un numéro +225." },
        { status: 400 }
      );
    }
    
   
    if (!isValidPhone(phoneNumber)) {
      return NextResponse.json(
        { error: "Format de numéro invalide. Utilisez +225XXXXXXXXXX (10 chiffres)." },
        { status: 400 }
      );
    }
    
  
    const normalizedPhone = normalizeIvorianNumber(phoneNumber);
    
    
    const operator = detectIvorianOperator(normalizedPhone);
    
    if (operator === "UNKNOWN") {
      return NextResponse.json(
        { error: "Opérateur non reconnu pour ce numéro. Utilisez 05 (MTN), 07 (Orange) ou 01 (Moov)." },
        { status: 400 }
      );
    }
    
    const existing = await prisma.verifiedPhone.findUnique({
      where: { phoneNumber: normalizedPhone },
    });
    
    if (existing) {
      return NextResponse.json({
        success: true,
        phoneNumber: existing.phoneNumber,
        operator: existing.operator,
        alreadyVerified: true,
        verifiedAt: existing.verifiedAt,
      });
    }
    
  
    const verified = await prisma.verifiedPhone.create({
      data: {
        phoneNumber: normalizedPhone,
        operator,
      },
    });
    
    return NextResponse.json({
      success: true,
      phoneNumber: verified.phoneNumber,
      operator: verified.operator,
      alreadyVerified: false,
      verifiedAt: verified.verifiedAt,
    });
    
  } catch (error) {
    console.error("Erreur vérification téléphone:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne." },
      { status: 500 }
    );
  }
}


export async function GET() {
  try {
    const [total, orange, moov, mtn, unknown] = await Promise.all([
      prisma.verifiedPhone.count(),
      prisma.verifiedPhone.count({ where: { operator: "ORANGE" } }),
      prisma.verifiedPhone.count({ where: { operator: "MOOV" } }),
      prisma.verifiedPhone.count({ where: { operator: "MTN" } }),
      prisma.verifiedPhone.count({ where: { operator: "UNKNOWN" } }),
    ]);
    
    return NextResponse.json({
      success: true,
      stats: {
        total,
        orange,
        moov,
        mtn,
        unknown,
      },
    });
    
  } catch (error) {
    console.error("Erreur statistiques:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne." },
      { status: 500 }
    );
  }
}