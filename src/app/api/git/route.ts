import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

export async function GET() {
  try {
    const history = [];
    for (let i = 1; i <= 6; i++) {
      try {
        const content = execSync(`git show HEAD~${i}:src/app/globals.css`, { encoding: 'utf-8' }).toString();
        history.push({ depth: i, content: content.substring(0, 1000) }); // only get start to check colors
      } catch (e) {}
    }
    return NextResponse.json({ history });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
