
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/app/lib/auth"; 
import { prisma } from "@/lib/prisma";

export async function GET() {
	try {
		
		const session = await auth.api.getSession({
			headers: await headers()
		});

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
		}

		const searches = await prisma.search.findMany({
			where: {
				userId: session.user.id
			},
			orderBy: {
				createdAt: "desc"
			},
			take: 5,
			select: {
				id: true,
				query: true,
				createdAt: true,
			},
		});

		return NextResponse.json({ searches });
	} catch (error) {
		console.error("Erreur lors de la récupération des recherches:", error);
		return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
	}
}


export async function POST(request: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: await headers()
		});

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
		}

		const body = await request.json();
		const { query } = body;

		if (!query || query.trim().length === 0) {
			return NextResponse.json({ error: "La recherche est vide" }, { status: 400 });
		}

		if (query.trim().length > 100) {
			return NextResponse.json({ error: "La recherche est trop longue" }, { status: 400 });
		}

		const normalizedQuery = query.trim();

	
		await prisma.search.deleteMany({
			where: {
				userId: session.user.id,
				query: normalizedQuery,
			},
		});


		const search = await prisma.search.create({
			data: {
				query: normalizedQuery,
				userId: session.user.id,
			},
		});

	
		const oldSearches = await prisma.search.findMany({
			where: {
				userId: session.user.id
			},
			orderBy: {
				createdAt: "desc"
			},
			skip: 10,
			select: {
				id: true
			},
		});

		if (oldSearches.length > 0) {
			await prisma.search.deleteMany({
				where: {
					id: {
						in: oldSearches.map(s => s.id)
					},
				},
			});
		}

		return NextResponse.json({
			search,
			message: "Recherche sauvegardée avec succès"
		}, { status: 201 });

	} catch (error) {
		console.error("Erreur lors de la sauvegarde de la recherche:", error);
		return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
	}
}


export async function DELETE() {
	try {
		const session = await auth.api.getSession({
			headers: await headers()
		});

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
		}

		const result = await prisma.search.deleteMany({
			where: {
				userId: session.user.id
			},
		});

		return NextResponse.json({
			success: true,
			deletedCount: result.count,
			message: `${result.count} recherche(s) supprimée(s)`
		});

	} catch (error) {
		console.error("Erreur lors de la suppression des recherches:", error);
		return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
	}
}