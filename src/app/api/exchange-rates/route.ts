import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch('https://api.frankfurter.app/latest?from=USD&to=EUR,CAD,CLP');
    if (!response.ok) throw new Error('Failed to fetch');
    
    const data = await response.json();
    return NextResponse.json({
      EUR: data.rates.EUR || 0.92,
      CAD: data.rates.CAD || 1.36,
      CLP: data.rates.CLP || 920,
    });
  } catch {
    return NextResponse.json({ EUR: 0.92, CAD: 1.36, CLP: 920 });
  }
}