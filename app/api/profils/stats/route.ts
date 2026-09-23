import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/app/lib/auth"; 
import { prisma } from "@/lib/prisma"; 
export async function GET() {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});
		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}
		const userId = session.user.id;
		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: { accountType: true },
		});
		if (!user) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}
		const [bookingsCount, reviewsCount, favoritesCount, ratingAgg] =
		await Promise.all([
			prisma.booking.count({
				where: {
					OR: [{ clientId: userId }, { providerId: userId }],
				},
			}),
			prisma.review.count({
				where: { receiverId: userId },
			}),
			prisma.favorite.count({
				where: user.accountType === "PROVIDER" ?
					{ providerId: userId } :
					{ clientId: userId },
			}),
			prisma.review.aggregate({
				where: { receiverId: userId },
				_avg: { rating: true },
			}),
		]);
		return NextResponse.json({
			bookingsCount,
			reviewsCount,
			favoritesCount,
			averageRating: user.accountType === "PROVIDER" ?
				ratingAgg._avg.rating ?? null :
				null,
		});
	} catch (err) {
		console.error("[GET /api/profils/stats] error:", err);
		return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
	}
}