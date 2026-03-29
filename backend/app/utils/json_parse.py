from __future__ import annotations

import json
import re
from typing import Any


def extract_json_object(text: str) -> Any:
    """
    Best-effort JSON extraction from LLM output.
    Accepts outputs that include extra text around the JSON blob.
    """
    # Try direct parse first.
    try:
        return json.loads(text)
    except Exception:
        pass

    # Try to find the first {...} or [...] JSON-like region.
    m = re.search(r"(\{.*\}|\[.*\])", text, flags=re.DOTALL)
    if not m:
        raise ValueError("No JSON object found in text output")

    candidate = m.group(1)
    return json.loads(candidate)

