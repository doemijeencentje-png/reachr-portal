import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { callClaude, parseJsonFromResponse } from '@/lib/anthropic';
import { checkApiSecurity } from '@/lib/api-security';

// Response type from Claude
interface GenerateResult {
  title: string;
  slug: string;
  metaDescription: string;
  content: string;
  internalLinksUsed: string[];
  sourcesUsed: {
    url: string;
    title: string;
    quoteUsed: string;
  }[];
}

// System prompt for content generation
const GENERATE_SYSTEM_PROMPT = `Je bent een SEO content writer voor Reachr, een AI-gedreven SEO platform.

Je taak is om een hoogwaardige, SEO-geoptimaliseerde blogpost te schrijven.

BELANGRIJKE REGELS:
1. ANTI-HALLUCINATIE: Elke feitelijke claim moet gebaseerd zijn op de gegeven bronnen
2. Noem bronnen expliciet in de tekst waar relevant
3. Gebruik de tone of voice van de klant
4. Vermijd woorden/zinnen uit de "niet zeggen" lijst
5. Verwerk interne links waar natuurlijk
6. Schrijf voor de doelgroep, niet voor zoekmachines
7. Maak de content scanbaar (kopjes, lijsten, korte alinea's)

ARTIKEL STRUCTUUR:
- Pakkende titel (60-70 karakters)
- Meta description (150-160 karakters)
- Inleiding (hook + wat lezer gaat leren)
- 3-5 hoofdsecties met H2/H3 kopjes
- Conclusie met call-to-action
- Lengte: 1000-1500 woorden

OUTPUT FORMAT (JSON):
{
  "title": "SEO-geoptimaliseerde titel",
  "slug": "url-vriendelijke-slug",
  "metaDescription": "Meta description voor zoekmachines",
  "content": "Volledige HTML content van het artikel",
  "internalLinksUsed": ["url1", "url2"],
  "sourcesUsed": [
    {
      "url": "https://bron.com",
      "title": "Titel van bron",
      "quoteUsed": "Specifieke info die je hebt gebruikt"
    }
  ]
}

Antwoord ALLEEN met valide JSON, geen extra tekst.
Gebruik HTML formatting in de content (h2, h3, p, ul, li, a, strong, em).`;

export async function POST(req: NextRequest) {
  try {
    // Security check: rate limiting, IP whitelist, API key, HMAC
    const security = await checkApiSecurity(req, { rateLimitType: 'ai' });
    if (!security.authorized) {
      return security.response!;
    }

    const { tenantId, topic, angle, keywords, sources } = await req.json();

    if (!tenantId || !topic) {
      return NextResponse.json(
        { error: 'tenantId and topic are required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // 1. Get tenant's website profile
    const { data: profile, error: profileError } = await supabase
      .from('website_profiles')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Website profile not found' },
        { status: 404 }
      );
    }

    // 2. Get tenant info
    const { data: tenant } = await supabase
      .from('tenants')
      .select('name')
      .eq('id', tenantId)
      .single();

    // 3. Build the prompt for Claude
    const userPrompt = `
SCHRIJF EEN BLOGPOST OVER:
Topic: ${topic}
Invalshoek: ${angle || 'Algemeen informatief'}
Target Keywords: ${JSON.stringify(keywords || [])}

BRONNEN (gebruik deze voor feitelijke claims):
${sources?.map((s: { url: string; title: string; relevance: string }) =>
  `- ${s.title}: ${s.url}\n  Relevantie: ${s.relevance}`
).join('\n') || 'Geen specifieke bronnen opgegeven - schrijf alleen algemene informatie'}

---

KLANTPROFIEL:
- Bedrijfsnaam: ${profile.company_name || tenant?.name || 'Onbekend'}
- Website: ${profile.website_url || 'Niet opgegeven'}
- Industrie: ${profile.industry || 'Niet opgegeven'}

PRODUCTEN/DIENSTEN:
${JSON.stringify(profile.products_services || [], null, 2)}

DOELGROEP:
${profile.target_audience || 'Niet gespecificeerd'}

TONE OF VOICE: ${profile.tone_of_voice || 'professional'}
${profile.tone_of_voice === 'professional' ? '- Formeel maar toegankelijk, geen jargon' : ''}
${profile.tone_of_voice === 'casual' ? '- Informeel, alsof je met een vriend praat' : ''}
${profile.tone_of_voice === 'friendly' ? '- Warm en uitnodigend, persoonlijk' : ''}
${profile.tone_of_voice === 'expert' ? '- Autoritair en kennisrijk, diepgaand' : ''}
${profile.tone_of_voice === 'playful' ? '- Luchtig en humoristisch, niet te serieus' : ''}

NIET ZEGGEN (vermijd deze woorden/zinnen ABSOLUUT):
${JSON.stringify(profile.do_not_say || [], null, 2)}

INTERNE LINKS (verwerk waar natuurlijk, max 3-4):
${JSON.stringify(profile.internal_links || [], null, 2)}

---

Schrijf nu het complete artikel in JSON format.
Zorg voor:
1. Unieke, pakkende titel
2. SEO-vriendelijke slug
3. Overtuigende meta description
4. Goed gestructureerde HTML content
5. Bronvermelding waar relevant`;

    // 4. Call Claude with higher token limit for article
    const response = await callClaude(GENERATE_SYSTEM_PROMPT, userPrompt, {
      maxTokens: 8192,
      temperature: 0.7,
    });

    // 5. Parse the response
    const result = parseJsonFromResponse<GenerateResult>(response);

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to parse generated content', raw: response },
        { status: 500 }
      );
    }

    // 6. Create content_item in database (draft status)
    const { data: contentItem, error: insertError } = await supabase
      .from('content_items')
      .insert({
        tenant_id: tenantId,
        title: result.title,
        slug: result.slug,
        meta_description: result.metaDescription,
        content: result.content,
        topic: topic,
        topic_angle: angle,
        keywords_targeted: keywords || [],
        sources: result.sourcesUsed,
        internal_links_used: result.internalLinksUsed,
        status: 'draft',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to save content item:', insertError);
      return NextResponse.json(
        { error: 'Failed to save content', details: insertError.message },
        { status: 500 }
      );
    }

    // 7. Log the topic
    await supabase.from('topic_logs').insert({
      tenant_id: tenantId,
      topic: topic,
      topic_angle: angle,
      keywords: keywords || [],
      content_item_id: contentItem.id,
    });

    // 8. Return the result
    return NextResponse.json({
      success: true,
      contentItem: {
        id: contentItem.id,
        title: result.title,
        slug: result.slug,
        metaDescription: result.metaDescription,
        content: result.content,
        sources: result.sourcesUsed,
        internalLinks: result.internalLinksUsed,
      },
      tenantId,
    });
  } catch (error) {
    console.error('Generate API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
