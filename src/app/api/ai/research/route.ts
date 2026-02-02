import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { callClaude, parseJsonFromResponse } from '@/lib/anthropic';
import { checkApiSecurity } from '@/lib/api-security';

// Response type from Claude
interface ResearchResult {
  topic: string;
  angle: string;
  keywords: string[];
  sources: {
    url: string;
    title: string;
    relevance: string;
  }[];
  reasoning: string;
}

// System prompt for topic research
const RESEARCH_SYSTEM_PROMPT = `Je bent een SEO content researcher voor Reachr, een AI-gedreven SEO platform.

Je taak is om EEN relevant blogpost-onderwerp te vinden voor een klant, gebaseerd op hun profiel.

BELANGRIJKE REGELS:
1. Kies GEEN onderwerp dat al eerder is gebruikt (zie "Eerder gebruikte topics")
2. Het onderwerp moet relevant zijn voor de producten/diensten van de klant
3. Het moet interessant zijn voor de doelgroep
4. Focus op evergreen content OF actuele trends in de industrie
5. Geef 2-4 bronnen die als basis kunnen dienen voor het artikel

OUTPUT FORMAT (JSON):
{
  "topic": "Hoofdonderwerp van het artikel",
  "angle": "Specifieke invalshoek/benadering",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "sources": [
    {
      "url": "https://example.com/article",
      "title": "Titel van de bron",
      "relevance": "Waarom deze bron relevant is"
    }
  ],
  "reasoning": "Korte uitleg waarom dit topic is gekozen"
}

Antwoord ALLEEN met valide JSON, geen extra tekst.`;

export async function POST(req: NextRequest) {
  try {
    // Security check: rate limiting, IP whitelist, API key, HMAC
    const security = await checkApiSecurity(req, { rateLimitType: 'ai' });
    if (!security.authorized) {
      return security.response!;
    }

    const { tenantId } = await req.json();

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
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

    // 2. Get previously used topics
    const { data: usedTopics } = await supabase
      .from('topic_logs')
      .select('topic, success')
      .eq('tenant_id', tenantId)
      .order('used_at', { ascending: false })
      .limit(50);

    // 3. Get tenant settings
    const { data: tenant } = await supabase
      .from('tenants')
      .select('name, posts_per_week')
      .eq('id', tenantId)
      .single();

    // 4. Build the prompt for Claude
    const userPrompt = `
KLANTPROFIEL:
- Bedrijfsnaam: ${profile.company_name || tenant?.name || 'Onbekend'}
- Website: ${profile.website_url || 'Niet opgegeven'}
- Industrie: ${profile.industry || 'Niet opgegeven'}

PRODUCTEN/DIENSTEN:
${JSON.stringify(profile.products_services || [], null, 2)}

DOELGROEP:
${profile.target_audience || 'Niet gespecificeerd'}

TONE OF VOICE:
${profile.tone_of_voice || 'professional'}

NIET ZEGGEN (vermijd deze woorden/zinnen):
${JSON.stringify(profile.do_not_say || [], null, 2)}

SEED KEYWORDS:
${JSON.stringify(profile.seed_keywords || [], null, 2)}

CONCURRENTEN:
${JSON.stringify(profile.competitors || [], null, 2)}

EERDER GEBRUIKTE TOPICS (NIET OPNIEUW GEBRUIKEN):
${usedTopics?.map(t => `- ${t.topic} (${t.success ? 'succesvol' : 'gefaald'})`).join('\n') || 'Nog geen topics gebruikt'}

---

Zoek nu EEN nieuw, relevant onderwerp voor een blogpost.
Zorg dat het:
1. NIET overeenkomt met eerder gebruikte topics
2. Past bij de producten/diensten
3. Relevant is voor de doelgroep
4. SEO-potentie heeft

Antwoord in JSON format.`;

    // 5. Call Claude
    const response = await callClaude(RESEARCH_SYSTEM_PROMPT, userPrompt, {
      temperature: 0.8, // Slightly higher for creativity
    });

    // 6. Parse the response
    const result = parseJsonFromResponse<ResearchResult>(response);

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to parse research result', raw: response },
        { status: 500 }
      );
    }

    // 7. Check if topic was already used (double-check)
    const { data: existingTopic } = await supabase
      .from('topic_logs')
      .select('id')
      .eq('tenant_id', tenantId)
      .ilike('topic', result.topic)
      .single();

    if (existingTopic) {
      return NextResponse.json(
        { error: 'Generated topic was already used, please retry' },
        { status: 409 }
      );
    }

    // 8. Return the research result
    return NextResponse.json({
      success: true,
      research: result,
      tenantId,
    });
  } catch (error) {
    console.error('Research API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
