import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const imageFile = formData.get('image') as File | null;
    const imageUrl = formData.get('imageUrl') as string | null;
    const question = formData.get('question') as string;

    if (!question) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }
    if (!imageFile && !imageUrl) {
      return NextResponse.json({ error: 'Image or Image URL is required' }, { status: 400 });
    }

    let finalImageUrl = imageUrl;
    let base64Data = '';
    let mimeType = 'image/jpeg';

    if (imageFile) {
      // Upload to Supabase Storage
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${session.user.id}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError, data } = await supabase.storage
        .from('images')
        .upload(fileName, imageFile);

      if (uploadError) {
        return NextResponse.json({ error: 'Failed to upload image to storage' }, { status: 500 });
      }

      const { data: publicUrlData } = supabase.storage
        .from('images')
        .getPublicUrl(fileName);

      finalImageUrl = publicUrlData.publicUrl;

      const arrayBuffer = await imageFile.arrayBuffer();
      base64Data = Buffer.from(arrayBuffer).toString('base64');
      mimeType = imageFile.type;
    } else if (imageUrl) {
      // Fetch the image from URL to send to Gemini
      try {
        const response = await fetch(imageUrl);
        const arrayBuffer = await response.arrayBuffer();
        base64Data = Buffer.from(arrayBuffer).toString('base64');
        mimeType = response.headers.get('content-type') || 'image/jpeg';
      } catch (e) {
        return NextResponse.json({ error: 'Failed to fetch image from URL' }, { status: 400 });
      }
    }

    // Call Gemini Vision API
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent([
      question,
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      }
    ]);

    const answer = result.response.text();

    // Save to Database
    const { data: queryData, error: dbError } = await supabase
      .from('queries')
      .insert({
        user_id: session.user.id,
        image_url: finalImageUrl,
        question: question,
        answer: answer
      })
      .select()
      .single();

    if (dbError) {
      console.error('DB Error:', dbError);
      return NextResponse.json({ error: 'Failed to save query history' }, { status: 500 });
    }

    return NextResponse.json({ query: queryData });

  } catch (error: any) {
    console.error('API Route Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
