import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callGeminiWithImage } from '@/lib/gemini/client'
import { getBusinessRules } from '@/lib/data/rules'
import sharp from 'sharp'

export const maxDuration = 60

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ── Step 1: Receive and validate upload ──
    const formData = await request.formData()
    const imageFile = formData.get('image') as File | null
    const businessId = formData.get('business_id') as string | null

    if (!imageFile) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    if (!businessId) {
      return NextResponse.json({ error: 'business_id is required' }, { status: 400 })
    }

    // Validate file type
    const mimeType = imageFile.type || 'image/jpeg'
    if (!ALLOWED_TYPES.includes(mimeType)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${mimeType}. Use JPEG, PNG, or WebP.` },
        { status: 400 }
      )
    }

    // Validate file size
    if (imageFile.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 413 }
      )
    }

    // Verify ownership
    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('id', businessId)
      .eq('user_id', user.id)
      .single()

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    // ── Step 2: Convert to buffer and compress ──
    const arrayBuffer = await imageFile.arrayBuffer()
    const originalBuffer = Buffer.from(arrayBuffer)
    const buffer = await sharp(originalBuffer)
      .resize(1024, 1024, { fit: 'inside' })
      .jpeg({ quality: 80 })
      .toBuffer()

    // ── Step 3: Upload to Supabase Storage ──
    const timestamp = Date.now()
    const ext = mimeType.split('/')[1] === 'jpeg' ? 'jpg' : mimeType.split('/')[1]
    const storagePath = `${user.id}/${timestamp}-invoice.${ext}`

    let uploadedPath = storagePath
    try {
      const { error: uploadError } = await supabase.storage
        .from('invoices')
        .upload(storagePath, buffer, {
          contentType: mimeType,
          upsert: false,
        })

      if (uploadError) {
        console.warn('Storage upload failed (non-critical):', uploadError.message)
        uploadedPath = `upload-failed-${timestamp}`
      }
    } catch (storageErr) {
      console.warn('Storage not available:', storageErr)
      uploadedPath = `storage-unavailable-${timestamp}`
    }

    // ── Step 4: Convert to base64 ──
    const base64Image = buffer.toString('base64')

    // ── Step 5: Call Z.AI Vision ──
    const visionPrompt = `You are extracting data from a supplier invoice or delivery receipt for a Malaysian F&B restaurant.

Extract ALL items from this invoice/receipt.
Return ONLY a valid JSON array. No explanation text.
No markdown. No backticks. Just the raw JSON array.

Each item in the array must have exactly these fields:
{
  "name": "item name in English",
  "name_original": "item name as shown on invoice",
  "quantity": number (numeric value only),
  "unit": "kg/g/L/ml/pcs/box/bag/bottle",
  "unit_price": number (price per unit, numeric),
  "total_price": number (total for this line, numeric),
  "category": "one of: Meat/Seafood/Vegetables/Dairy/Dry Goods/Beverages/Condiments/Other"
}

Rules:
- Convert all prices to MYR numbers (remove RM, commas)
- If quantity unclear: use 1
- If unit unclear: use "pcs"
- If price missing: use 0
- Translate Malay/Chinese item names to English in the "name" field
- Keep original in "name_original"
- Return empty array [] if no items found

Extract every line item you can see.`

    let rawResponse: string

    try {
      // Use the correct mime type for the vision model
      const validMime = mimeType === 'image/heic' ? 'image/jpeg' : mimeType
      rawResponse = await callGeminiWithImage(visionPrompt, base64Image, validMime)
    } catch (aiError) {
      console.error('AI Vision error:', aiError)
      return NextResponse.json(
        { error: 'AI vision service unavailable. Please try again later.' },
        { status: 503 }
      )
    }

    // ── Step 6: Parse and validate response ──
    let extractedItems: any[]

    try {
      // Clean the response — remove markdown backticks if present
      let cleaned = rawResponse.trim()
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.slice(7)
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.slice(3)
      }
      if (cleaned.endsWith('```')) {
        cleaned = cleaned.slice(0, -3)
      }
      cleaned = cleaned.trim()

      extractedItems = JSON.parse(cleaned)

      if (!Array.isArray(extractedItems)) {
        throw new Error('Response is not an array')
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Raw:', rawResponse)
      return NextResponse.json(
        {
          error: 'Could not read invoice. Try with a clearer photo.',
          raw: rawResponse,
        },
        { status: 422 }
      )
    }

    // Filter and validate items
    extractedItems = extractedItems
      .filter((item: any) => item.name && item.name.trim() !== '')
      .map((item: any) => ({
        name: String(item.name || '').trim(),
        name_original: String(item.name_original || item.name || '').trim(),
        quantity: parseFloat(item.quantity) || 1,
        unit: String(item.unit || 'pcs').trim(),
        unit_price: parseFloat(item.unit_price) || 0,
        total_price: parseFloat(item.total_price) || 0,
        category: String(item.category || 'Other').trim(),
      }))

    // ── Step 7: Match against existing inventory ──
    const { data: existingInventory } = await supabase
      .from('inventory_items')
      .select('id, name')
      .eq('business_id', businessId)

    const inventory = existingInventory || []

    const matchedItems = extractedItems.map((item: any) => {
      const searchName = item.name.toLowerCase().trim()
      const match = inventory.find((inv: any) => {
        const invName = inv.name.toLowerCase().trim()
        return (
          invName.includes(searchName) ||
          searchName.includes(invName) ||
          invName === searchName
        )
      })

      return {
        ...item,
        matchedItemId: match ? match.id : null,
        matchedItemName: match ? match.name : null,
      }
    })

    // ── Step 8: Return response ──
    const totalValue = matchedItems.reduce(
      (sum: number, item: any) => sum + (item.total_price || item.quantity * item.unit_price),
      0
    )

    // Check against weekly ingredient budget
    const rules = await getBusinessRules(businessId)
    let budgetWarning: { message: string; overBy: number } | null = null
    if (rules?.weekly_ingredient_budget && totalValue > rules.weekly_ingredient_budget) {
      budgetWarning = {
        message: `This invoice (RM${totalValue.toFixed(2)}) exceeds your weekly ingredient budget (RM${rules.weekly_ingredient_budget})`,
        overBy: Math.round((totalValue - rules.weekly_ingredient_budget) * 100) / 100,
      }
    }

    return NextResponse.json({
      items: matchedItems,
      totalItems: matchedItems.length,
      totalValue,
      storagePath: uploadedPath,
      invoiceDate: new Date().toISOString().split('T')[0],
      budgetWarning,
    })
  } catch (err) {
    console.error('POST /api/ai/scan-invoice error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
