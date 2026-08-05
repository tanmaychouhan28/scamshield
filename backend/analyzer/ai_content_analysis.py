"""
Optional, higher-accuracy content read using the Anthropic API.

Keyword lists (content_analysis.py) are transparent but brittle — they miss
paraphrased urgency language and can't judge whether copy reads as
AI-generated boilerplate. An LLM pass catches both, at the cost of an API
call. This module is entirely optional: if ANTHROPIC_API_KEY isn't set,
the risk engine just falls back to the heuristic-only signals.
"""
import json
import os

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")

SYSTEM_PROMPT = """You are a fraud-analysis assistant. You will be given the visible text of a \
website's homepage. Judge it ONLY on content patterns associated with scam/fraudulent \
e-commerce and phishing sites: manipulative urgency, implausible guarantees, generic/\
templated AI-sounding product copy, pressure toward unusual payment methods, and mismatched \
or absent seller identity. You are not verifying facts about the business.

Respond with ONLY a JSON object, no other text, matching exactly this shape:
{
  "urgency_score": <0-100 integer>,
  "ai_generated_likelihood": <0-100 integer>,
  "grammar_quality_score": <0-100 integer, 100 = clean professional writing>,
  "manipulation_tactics": [<short strings, max 5>],
  "summary": "<one sentence, under 30 words>"
}"""


def analyze_content_with_llm(text: str, timeout: float = 20.0) -> dict | None:
    if not ANTHROPIC_API_KEY or not text.strip():
        return None
    try:
        import anthropic
    except ImportError:
        return {"error": "anthropic package not installed. Run: pip install anthropic"}

    try:
        client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
        resp = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=500,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": text[:6000]}],
            timeout=timeout,
        )
        raw = "".join(block.text for block in resp.content if getattr(block, "type", None) == "text")
        raw = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        parsed = json.loads(raw)
        return parsed
    except Exception as e:
        return {"error": f"LLM content analysis failed: {e}"}
