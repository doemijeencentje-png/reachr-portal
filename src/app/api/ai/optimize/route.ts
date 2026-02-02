import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { callClaude, parseJsonFromResponse } from '@/lib/anthropic';
import { checkApiSecurity } from '@/lib/api-security';

// Response type from Claude
interface OptimizeResult {
  title: string;
  slug: string;
  metaDescription: string;
  content: string;
  changesExplanation: string;
  improvementAreas: string[];
}

// System prompt for optimization
const OPTIMIZE_SYSTEM_PROMPT = `Je bent een SEO content optimizer voor Reachr, een AI-gedreven SEO platform.

Je taak is om een bestaande blogpost te VERBETEREN op basis van performance data.

OPTIMALISATIE FOCUS:
1. Titel: Maak clickbaiter (maar niet misleidend) als CTR laag is
2. Meta description: Verbeter als niet overtuigend genoeg
3. Structuur: Verbeter scanbaarheid
4. Keywords: Versterk waar relevant
5. Interne links: Voeg toe of verbeter
6. Content: Verdiep secties die goed presteren
7. CTA: Versterk call-to-action

ANALYSE VAN REFERRERS:
- Social media verkeer: Maak content meer deelbaar
- Zoekverkeer: Optimaliseer voor zoekintentie
- Direct verkeer: Versterk merkidentiteit

BELANGRIJK:
- Behoud de kernboodschap
- Behoud werkende elementen
- Verbeter wat niet werkt
- Leg uit wat je verandert en waarom

OUTPUT FORMAT (JSON):
{
  "title": "Geoptimaliseerde titel",
  "slug": "url-vriendelijke-slug",
  "metaDescription": "Verbeterde meta description",
  "content": "Volledige geoptimaliseerde HTML content",
  "changesExplanation": "Uitleg van belangrijkste wijzigingen",
  "improvementAreas": ["Gebied 1", "Gebied 2"]
}

Antwoord ALLEEN met valide JSON, geen extra tekst.`;

export async function POST(req: NextRequest) {
  try {
    // Security check: rate limiting, IP whitelist, API key, HMAC
    const security = await checkApiSecurity(req, { rateLimitType: 'ai' });
    if (!security.authorized) {
      return security.response!;
    }

    const { contentItemId, performanceData } = await req.json();

    if (!contentItemId) {
      return NextResponse.json(
        { error: 'contentItemId is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // 1. Get the content item
    const { data: contentItem, error: contentError } = await supabase
      .from('content_items')
      .select('*')
      .eq('id', contentItemId)
      .single();

    if (contentError || !contentItem) {
      return NextResponse.json(
        { error: 'Content item not found' },
        { status: 404 }
      );
    }

    // 2. Get tenant's website profile
    const { data: profile, error: profileError } = await supabase
      .from('website_profiles')
      .select('*')
      .eq('tenant_id', contentItem.tenant_id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Website profile not found' },
        { status: 404 }
      );
    }

    // 3. Get tenant settings
    const { data: tenant } = await supabase
      .from('tenants')
      .select('name, performance_threshold')
      .eq('id', contentItem.tenant_id)
      .single();

    // 4. Build performance analysis
    const views = performanceData?.views || contentItem.views_at_72h || 0;
    const referrers = performanceData?.referrers || contentItem.referrers || [];
    const threshold = tenant?.performance_threshold || 6;

    // 5. Build the prompt for Claude
    const userPrompt = `
HUIDIGE ARTIKEL (versie ${contentItem.version}):

Titel: ${contentItem.title}
Slug: ${contentItem.slug}
Meta: ${contentItem.meta_description}

Content:
${contentItem.content}

---

PERFORMANCE DATA:
- Views na 72 uur: ${views}
- Performance drempel: ${threshold}
- Status: ${views >= threshold ? 'GOED - optimaliseren voor nog beter' : 'GRENSWAARDE - heeft verbetering nodig'}

REFERRER ANALYSE:
${referrers.length > 0
  ? referrers.map((r: { source: string; count: number }) => `- ${r.source}: ${r.count} views`).join('\n')
  : 'Geen referrer data beschikbaar'}

---

KLANTPROFIEL:
- Bedrijfsnaam: ${profile.company_name || tenant?.name}
- Doelgroep: ${profile.target_audience}
- Tone of voice: ${profile.tone_of_voice}

NIET ZEGGEN:
${JSON.stringify(profile.do_not_say || [])}

INTERNE LINKS (verwerk meer als nodig):
${JSON.stringify(profile.internal_links || [])}

---

OPTIMALISEER DIT ARTIKEL.
Focus op:
1. ${views < threshold * 1.5 ? 'Titel MOET aantrekkelijker - dit is kritiek' : 'Titel finetunen'}
2. ${referrers.some((r: { source: string }) => r.source.includes('google')) ? 'SEO werkt - versterk keywords' : 'Zoekverkeer verhogen - betere SEO'}
3. ${referrers.some((r: { source: string }) => r.source.includes('social')) ? 'Social werkt - maak meer deelbaar' : 'Social potentie benutten'}
4. Algemene content kwaliteit

Geef het geoptimaliseerde artikel in JSON format.`;

    // 6. Call Claude
    const response = await callClaude(OPTIMIZE_SYSTEM_PROMPT, userPrompt, {
      maxTokens: 8192,
      temperature: 0.6, // Lower for more consistent improvements
    });

    // 7. Parse the response
    const result = parseJsonFromResponse<OptimizeResult>(response);

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to parse optimized content', raw: response },
        { status: 500 }
      );
    }

    // 8. Update content_item in database
    const { data: updatedItem, error: updateError } = await supabase
      .from('content_items')
      .update({
        title: result.title,
        slug: result.slug,
        meta_description: result.metaDescription,
        content: result.content,
        version: contentItem.version + 1,
        previous_version_id: contentItem.id,
        status: 'optimized',
        optimized_at: new Date().toISOString(),
      })
      .eq('id', contentItemId)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to update content item:', updateError);
      return NextResponse.json(
        { error: 'Failed to save optimized content', details: updateError.message },
        { status: 500 }
      );
    }

    // 9. Return the result
    return NextResponse.json({
      success: true,
      contentItem: {
        id: updatedItem.id,
        title: result.title,
        slug: result.slug,
        metaDescription: result.metaDescription,
        content: result.content,
        version: updatedItem.version,
      },
      changes: {
        explanation: result.changesExplanation,
        areas: result.improvementAreas,
      },
      tenantId: contentItem.tenant_id,
    });
  } catch (error) {
    console.error('Optimize API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
