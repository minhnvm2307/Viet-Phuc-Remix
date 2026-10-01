# Trend Link Extractor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a user paste a single TikTok or Facebook link they saw trending, extract its thumbnail/caption, and use Gemini vision to recommend one real costume from the existing catalog — with a screenshot-upload fallback when the link can't be extracted.

**Architecture:** Two new backend services (`link_extractor.py` for oEmbed/yt-dlp URL extraction, `trend_adapter.py` for Gemini-vision-to-catalog mapping) sit behind two new stateless router endpoints. `gemini_client.py` gains a multimodal sibling to its existing `generate_json`, sharing the same key-rotation loop via a new private helper. The frontend adds a second tab to the already-shipped `/advisor` page.

**Tech Stack:** FastAPI, `requests` (already a dependency) for oEmbed HTTP calls, new `yt-dlp` dependency for TikTok fallback extraction, `google-genai` (already a dependency) for Gemini vision, `unittest.TestCase` + `fastapi.testclient.TestClient` + `unittest.mock.patch` (matches `tests/test_backend_api.py` conventions).

**Spec:** `docs/superpowers/specs/2026-09-28-trend-link-extractor-design.md`

## Global Constraints

- No authentication required on either new endpoint (spec §1, confirmed).
- No database persistence — every request is processed and returned, nothing written (spec §1, confirmed).
- Facebook oEmbed is called **tokenless** (`graph.facebook.com/v25.0/oembed_video?url=...`, no `access_token` param) per Meta's June 2026 change — do not require `FACEBOOK_APP_ID`/`FACEBOOK_APP_SECRET` for the feature to work (spec §0, §3.1).
- TikTok extraction order: official oEmbed first (`tiktok.com/oembed`, no key), then `yt-dlp` as fallback if oEmbed fails (spec §3.1).
- `matched_costume_id` returned to the client must always be validated against the real catalog (loaded via `load_catalog_data()` in `heritage.py`) — never pass through a Gemini-invented ID, mirroring the existing pattern in `curator_advisor.py`'s `get_context_recommendations` (spec §3.3).
- No `cultural_guardrail` check on this feature — it only recommends an existing catalog costume, it does not accept free-text remix prompts (spec §4).
- All new Gemini calls reuse the existing 7-key rotation and `thinking_config=types.ThinkingConfig(thinking_budget=0)` pattern already proven in `gemini_client.py` — do not build a second, parallel retry mechanism.
- When extraction or vision analysis is unavailable, fail with a clean typed status (`"failed"` / `"unavailable"`) — never raise an unhandled 500.

## Review Focus

- **Malformed/non-image upload on `/trend-extract-upload`**: a user selects a `.txt` or corrupt file as their "screenshot" — the endpoint must reject it with a clean 400/typed error, not crash trying to feed non-image bytes to Gemini. Covered in Task 5.
- **Short/redirect TikTok URLs** (`vm.tiktok.com/...`) and URLs with tracking query params — platform detection and oEmbed/yt-dlp calls must still work or fail gracefully, not throw on URL parsing. Covered in Task 2.
- **Gemini vision hallucinates a `costume_id` not in the catalog** — must be rejected the same way `curator_advisor.py` already rejects invalid IDs, never surfaced to the client as if real. Covered in Task 3.
- **All 7 Gemini keys exhausted/down during the vision call** — `/trend-extract` and `/trend-extract-upload` must return `{"status": "unavailable"}` with a 200, not a 500. Covered in Task 3 and Task 5.
- **Facebook tokenless oEmbed rejects a valid-looking link** (Meta's announcement notes rate limits/edge cases may differ from token-based access) — must degrade to `{"status": "failed"}` so the frontend falls back to the screenshot uploader, not crash. Covered in Task 2.

---

### Task 1: Extend `gemini_client.py` with a vision-capable JSON call

**Files:**
- Modify: `backend/app/services/gemini_client.py`
- Test: `tests/test_gemini_client.py` (new — repo-root `tests/` dir, same as `tests/test_backend_api.py`; use its `sys.path.insert(str(PROJECT_ROOT / "backend"))` bootstrap pattern)

**Interfaces:**
- Consumes: nothing new (uses existing `settings.GEMINI_API_KEYS`, `settings.GEMINI_TEXT_MODEL`, `_get_client`)
- Produces:
  - `generate_json(system_instruction: str, user_prompt: str, temperature: float = 0.4, max_output_tokens: int = 1024) -> Optional[Dict[str, Any]]` — **same signature and behavior as today**, now implemented via the shared helper below.
  - `generate_json_from_image(system_instruction: str, user_prompt: str, image_bytes: bytes, mime_type: str, temperature: float = 0.4, max_output_tokens: int = 1024) -> Optional[Dict[str, Any]]` — new. Used by `trend_adapter.py` (Task 3).

Internal (not part of the public interface, but pinned so the implementer doesn't invent a different shape): factor the existing per-key try/rotate/parse loop out of `generate_json` into
`_generate_and_parse_json(contents: Any, config: "types.GenerateContentConfig") -> Optional[Dict[str, Any]]`, where `contents` is whatever `client.models.generate_content(..., contents=contents, ...)` already accepts (a plain string for text calls, `[types.Part, str]` for vision calls). Verified against installed SDK: `types.Part.from_bytes(data: bytes, mime_type: str) -> Part` (google-genai 2.25.0). `generate_json` and `generate_json_from_image` each build their own `contents` and `config`, then both call `_generate_and_parse_json`. The empty-keys guard (`if not settings.GEMINI_API_KEYS: ...`) and the `GenerateContentConfig` construction stay in each public function (they differ slightly — image call adds no new config fields, but keeping construction local avoids a config-builder abstraction nobody asked for). The per-key error handling (APIError 429/503 → next key, JSON/ValueError → next key, bare Exception → next key, final `logger.error` after all keys) moves into `_generate_and_parse_json` unchanged.

- [ ] **Step 1: Write the failing tests**

```python
# tests/test_gemini_client.py
import json
import sys
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT / "backend"))

from app.services import gemini_client


class TestGenerateJson(unittest.TestCase):
    @patch("app.services.gemini_client.settings")
    @patch("app.services.gemini_client.genai.Client")
    def test_generate_json_returns_parsed_dict_on_first_key(self, mock_client_cls, mock_settings):
        mock_settings.GEMINI_API_KEYS = ["key-1"]
        mock_settings.GEMINI_TEXT_MODEL = "gemini-2.5-flash"
        fake_response = MagicMock()
        fake_response.text = json.dumps({"verdict": "OK"})
        mock_client_cls.return_value.models.generate_content.return_value = fake_response
        gemini_client._client_cache.clear()

        result = gemini_client.generate_json("system", "user prompt")

        self.assertEqual(result, {"verdict": "OK"})

    @patch("app.services.gemini_client.settings")
    def test_generate_json_returns_none_without_keys(self, mock_settings):
        mock_settings.GEMINI_API_KEYS = []
        self.assertIsNone(gemini_client.generate_json("system", "user prompt"))


class TestGenerateJsonFromImage(unittest.TestCase):
    @patch("app.services.gemini_client.settings")
    @patch("app.services.gemini_client.genai.Client")
    def test_generate_json_from_image_sends_image_part_and_parses_response(self, mock_client_cls, mock_settings):
        mock_settings.GEMINI_API_KEYS = ["key-1"]
        mock_settings.GEMINI_TEXT_MODEL = "gemini-2.5-flash"
        fake_response = MagicMock()
        fake_response.text = json.dumps({"matched_costume_id": "ao-tu-than"})
        mock_client_cls.return_value.models.generate_content.return_value = fake_response
        gemini_client._client_cache.clear()

        result = gemini_client.generate_json_from_image(
            "system", "user prompt", image_bytes=b"fake-jpeg-bytes", mime_type="image/jpeg"
        )

        self.assertEqual(result, {"matched_costume_id": "ao-tu-than"})
        call_kwargs = mock_client_cls.return_value.models.generate_content.call_args.kwargs
        contents = call_kwargs["contents"]
        self.assertEqual(len(contents), 2)
        self.assertEqual(contents[1], "user prompt")

    @patch("app.services.gemini_client.settings")
    @patch("app.services.gemini_client.genai.Client")
    def test_generate_json_from_image_rotates_keys_on_quota_error(self, mock_client_cls, mock_settings):
        from google.genai import errors as genai_errors

        mock_settings.GEMINI_API_KEYS = ["key-1", "key-2"]
        mock_settings.GEMINI_TEXT_MODEL = "gemini-2.5-flash"
        gemini_client._client_cache.clear()

        quota_error = genai_errors.APIError(429, {"error": {"message": "quota", "status": "RESOURCE_EXHAUSTED"}})
        good_response = MagicMock()
        good_response.text = json.dumps({"matched_costume_id": "ao-tac"})

        mock_instance_1 = MagicMock()
        mock_instance_1.models.generate_content.side_effect = quota_error
        mock_instance_2 = MagicMock()
        mock_instance_2.models.generate_content.return_value = good_response
        mock_client_cls.side_effect = [mock_instance_1, mock_instance_2]

        result = gemini_client.generate_json_from_image(
            "system", "user prompt", image_bytes=b"x", mime_type="image/png"
        )

        self.assertEqual(result, {"matched_costume_id": "ao-tac"})


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `PYTHONPATH=backend:. uv run pytest tests/test_gemini_client.py -v`
Expected: FAIL — `generate_json_from_image` does not exist yet, and the existing `generate_json` test may pass or fail depending on current caching state, both acceptable at this point.

- [ ] **Step 3: Implement the refactor + new function in `backend/app/services/gemini_client.py`**

Extract `_generate_and_parse_json(contents, config)` containing the existing per-key loop body (unchanged logic — just delete `generate_json`'s copy and call the shared helper). Add `generate_json_from_image` building `contents=[types.Part.from_bytes(data=image_bytes, mime_type=mime_type), user_prompt]` and a `GenerateContentConfig` identical in shape to `generate_json`'s (`system_instruction`, `temperature`, `max_output_tokens`, `response_mime_type="application/json"`, `thinking_config=types.ThinkingConfig(thinking_budget=0)`).

- [ ] **Step 4: Run tests to verify they pass**

Run: same command as Step 2
Expected: PASS (all 4 tests)

- [ ] **Step 5: Commit**

```bash
git add backend/app/services/gemini_client.py tests/test_gemini_client.py
git commit -m "feat(gemini_client): add multimodal generate_json_from_image, share rotation loop"
```

---

### Task 2: `link_extractor.py` — TikTok/Facebook URL extraction

**Files:**
- Create: `backend/app/services/link_extractor.py`
- Modify: `pyproject.toml` (add `yt-dlp` to `dependencies`)
- Test: `tests/test_link_extractor.py`

**Interfaces:**
- Consumes: `requests` (existing dependency), `yt_dlp.YoutubeDL` (new dependency)
- Produces:
  - `extract_from_url(url: str) -> Dict[str, Any]` → `{"status": "ok", "thumbnail_url": str, "caption": str}` or `{"status": "failed", "reason": str}`. `reason` is one of `"unsupported_platform"`, `"tiktok_unavailable"`, `"facebook_unavailable"`.
  - `download_thumbnail(thumbnail_url: str) -> Tuple[bytes, str]` → raw image bytes and a best-effort mime type (from the response's `Content-Type` header, default `"image/jpeg"` if missing/unrecognized). Raises `requests.RequestException` on failure — caller (Task 5) catches it.

Used by the router in Task 5.

- [ ] **Step 1: Write the failing tests**

```python
# tests/test_link_extractor.py
import sys
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT / "backend"))

from app.services import link_extractor


class TestExtractFromUrl(unittest.TestCase):
    @patch("app.services.link_extractor.requests.get")
    def test_tiktok_oembed_success(self, mock_get):
        mock_get.return_value = MagicMock(
            status_code=200,
            json=lambda: {"thumbnail_url": "https://p16.tiktokcdn.com/thumb.jpg", "title": "cool outfit"},
        )
        result = link_extractor.extract_from_url("https://www.tiktok.com/@user/video/123")
        self.assertEqual(result, {"status": "ok", "thumbnail_url": "https://p16.tiktokcdn.com/thumb.jpg", "caption": "cool outfit"})

    @patch("app.services.link_extractor.YoutubeDL")
    @patch("app.services.link_extractor.requests.get")
    def test_tiktok_oembed_failure_falls_back_to_yt_dlp(self, mock_get, mock_ytdl_cls):
        mock_get.return_value = MagicMock(status_code=404, json=lambda: {})
        mock_ydl_instance = MagicMock()
        mock_ydl_instance.extract_info.return_value = {"thumbnail": "https://cdn/x.jpg", "description": "trend"}
        mock_ytdl_cls.return_value.__enter__.return_value = mock_ydl_instance

        result = link_extractor.extract_from_url("https://vm.tiktok.com/shortlink/")

        self.assertEqual(result, {"status": "ok", "thumbnail_url": "https://cdn/x.jpg", "caption": "trend"})

    @patch("app.services.link_extractor.YoutubeDL")
    @patch("app.services.link_extractor.requests.get")
    def test_tiktok_both_paths_fail(self, mock_get, mock_ytdl_cls):
        mock_get.return_value = MagicMock(status_code=404, json=lambda: {})
        mock_ytdl_cls.return_value.__enter__.side_effect = Exception("blocked")

        result = link_extractor.extract_from_url("https://www.tiktok.com/@user/video/999")

        self.assertEqual(result, {"status": "failed", "reason": "tiktok_unavailable"})

    @patch("app.services.link_extractor.requests.get")
    def test_facebook_tokenless_oembed_success(self, mock_get):
        mock_get.return_value = MagicMock(
            status_code=200,
            json=lambda: {"thumbnail_url": "https://scontent.fb/thumb.jpg", "title": "ao dai post"},
        )
        result = link_extractor.extract_from_url("https://www.facebook.com/watch/?v=123456")

        self.assertEqual(result["status"], "ok")
        called_url = mock_get.call_args.args[0]
        self.assertIn("graph.facebook.com", called_url)
        self.assertNotIn("access_token", called_url)

    @patch("app.services.link_extractor.requests.get")
    def test_facebook_oembed_failure(self, mock_get):
        mock_get.return_value = MagicMock(status_code=400, json=lambda: {})
        result = link_extractor.extract_from_url("https://www.facebook.com/watch/?v=999")
        self.assertEqual(result, {"status": "failed", "reason": "facebook_unavailable"})

    def test_unsupported_platform(self):
        result = link_extractor.extract_from_url("https://www.instagram.com/p/abc123/")
        self.assertEqual(result, {"status": "failed", "reason": "unsupported_platform"})


class TestDownloadThumbnail(unittest.TestCase):
    @patch("app.services.link_extractor.requests.get")
    def test_download_thumbnail_returns_bytes_and_mime_type(self, mock_get):
        mock_get.return_value = MagicMock(
            status_code=200, content=b"\xff\xd8\xff", headers={"Content-Type": "image/jpeg"}
        )
        data, mime_type = link_extractor.download_thumbnail("https://cdn/x.jpg")
        self.assertEqual(data, b"\xff\xd8\xff")
        self.assertEqual(mime_type, "image/jpeg")


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `PYTHONPATH=backend:. uv run pytest tests/test_link_extractor.py -v`
Expected: FAIL — `app.services.link_extractor` does not exist yet.

- [ ] **Step 3: Add `yt-dlp` dependency**

Add `"yt-dlp"` to the `dependencies` list in `pyproject.toml`, then run `uv sync`.

- [ ] **Step 4: Implement `backend/app/services/link_extractor.py`**

`import requests` at module top, `from yt_dlp import YoutubeDL` at module top (so both are patchable at `app.services.link_extractor.requests` / `app.services.link_extractor.YoutubeDL`, matching the tests). Platform detection by substring match on the URL's netloc (`tiktok.com` or `vm.tiktok.com` → `"tiktok"`; `facebook.com` or `fb.watch` → `"facebook"`; else `None`). TikTok: `GET https://www.tiktok.com/oembed?url={url}`, on non-200 or exception fall back to `with YoutubeDL({"quiet": True}) as ydl: info = ydl.extract_info(url, download=False)`, reading `info["thumbnail"]` / `info["description"]`; if that also raises, return the `tiktok_unavailable` failure. Facebook: `GET https://graph.facebook.com/v25.0/oembed_video?url={url}` (no `access_token` param at all, per Global Constraints), non-200 → `facebook_unavailable` failure. `download_thumbnail` does `requests.get(thumbnail_url)`, reads `.content` and `.headers.get("Content-Type", "image/jpeg")`.

- [ ] **Step 5: Run tests to verify they pass**

Run: same command as Step 2
Expected: PASS (all 7 tests)

- [ ] **Step 6: Commit**

```bash
git add backend/app/services/link_extractor.py pyproject.toml uv.lock tests/test_link_extractor.py
git commit -m "feat(link_extractor): tokenless TikTok/Facebook oEmbed with yt-dlp fallback"
```

---

### Task 3: `trend_adapter.py` — Gemini vision → catalog costume mapping

**Files:**
- Create: `backend/app/services/trend_adapter.py`
- Test: `tests/test_trend_adapter.py`

**Interfaces:**
- Consumes: `gemini_client.generate_json_from_image` (Task 1)
- Produces: `analyze_trend_image(image_bytes: bytes, mime_type: str, caption: Optional[str], costumes: List[Dict[str, Any]]) -> Dict[str, Any]` → `{"status": "ok", "matched_costume_id": str, "adaptation_reason": str, "detected_elements": Dict[str, str]}` or `{"status": "unavailable"}`. `costumes` is the same list shape `load_catalog_data()["costumes"]` already produces in `heritage.py` (each item has `id`, `name`, `occasion_usage`, `remix_suggestions`, etc. — same shape `curator_advisor.py` already consumes).

Used by the router in Task 5.

- [ ] **Step 1: Write the failing tests**

```python
# tests/test_trend_adapter.py
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT / "backend"))

from app.services import trend_adapter

FAKE_COSTUMES = [
    {"id": "ao-tu-than", "name": "Áo Tứ Thân & Yếm Đào", "occasion_usage": "Hội Lim", "remix_suggestions": {"suitable_for": "lễ hội"}},
    {"id": "ao-nhat-binh", "name": "Áo Nhật Bình", "occasion_usage": "Đại lễ", "remix_suggestions": {"suitable_for": "dạ tiệc"}},
]


class TestAnalyzeTrendImage(unittest.TestCase):
    @patch("app.services.trend_adapter.generate_json_from_image")
    def test_returns_ok_when_gemini_matches_real_costume(self, mock_generate):
        mock_generate.return_value = {
            "matched_costume_id": "ao-tu-than",
            "adaptation_reason": "Tông màu ấm và phom rộng gợi nét mộc mạc của Áo Tứ Thân.",
            "detected_elements": {"tone": "nâu đất", "vibe": "mộc mạc"},
        }

        result = trend_adapter.analyze_trend_image(b"fake", "image/jpeg", "check out this fit", FAKE_COSTUMES)

        self.assertEqual(result["status"], "ok")
        self.assertEqual(result["matched_costume_id"], "ao-tu-than")
        self.assertIn("adaptation_reason", result)

    @patch("app.services.trend_adapter.generate_json_from_image")
    def test_rejects_hallucinated_costume_id(self, mock_generate):
        mock_generate.return_value = {
            "matched_costume_id": "ao-khong-ton-tai",
            "adaptation_reason": "...",
            "detected_elements": {},
        }

        result = trend_adapter.analyze_trend_image(b"fake", "image/jpeg", None, FAKE_COSTUMES)

        self.assertEqual(result, {"status": "unavailable"})

    @patch("app.services.trend_adapter.generate_json_from_image")
    def test_returns_unavailable_when_gemini_fails(self, mock_generate):
        mock_generate.return_value = None

        result = trend_adapter.analyze_trend_image(b"fake", "image/jpeg", None, FAKE_COSTUMES)

        self.assertEqual(result, {"status": "unavailable"})


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `PYTHONPATH=backend:. uv run pytest tests/test_trend_adapter.py -v`
Expected: FAIL — `app.services.trend_adapter` does not exist yet.

- [ ] **Step 3: Implement `backend/app/services/trend_adapter.py`**

`from app.services.gemini_client import generate_json_from_image` (imported by name so the test's `@patch("app.services.trend_adapter.generate_json_from_image")` works). Write a system prompt (Vietnamese, giọng giám tuyển, ported from spec §3.3 / PRD §3.4 steps 3-4: nhận diện tông màu/phom dáng/vibe hiện đại, ánh xạ sang đúng 1 costume trong danh sách được cung cấp, bắt buộc chỉ chọn `costume_id` có trong danh sách — same "BẮT BUỘC" instruction style already used in `curator_advisor.ADVISOR_SYSTEM`). Build the user prompt by listing `costumes` the same way `curator_advisor._build_context_prompt` lists them (`id`, `name`, `occasion_usage`, `remix_suggestions.suitable_for`), plus the caption if present. Call `generate_json_from_image(system_instruction=..., user_prompt=..., image_bytes=image_bytes, mime_type=mime_type, temperature=0.4, max_output_tokens=500)`. Validate: `matched_costume_id` must be in `{c["id"] for c in costumes}`; if the call returned `None` or the ID is invalid or missing, return `{"status": "unavailable"}`; otherwise return `{"status": "ok", "matched_costume_id": ..., "adaptation_reason": (result.get("adaptation_reason") or "").strip(), "detected_elements": result.get("detected_elements") or {}}`.

- [ ] **Step 4: Run tests to verify they pass**

Run: same command as Step 2
Expected: PASS (all 3 tests)

- [ ] **Step 5: Commit**

```bash
git add backend/app/services/trend_adapter.py tests/test_trend_adapter.py
git commit -m "feat(trend_adapter): map trend image to a validated catalog costume via Gemini vision"
```

---

### Task 4: Schemas for the two new endpoints

**Files:**
- Modify: `backend/app/schemas/heritage.py`

**Interfaces:**
- Produces:
  - `TrendExtractRequest(BaseModel)`: `source_url: str`
  - `TrendExtractResponse(BaseModel)`: `status: str` (`"ok" | "failed" | "unavailable"`), `thumbnail_url: Optional[str] = None`, `matched_costume_id: Optional[str] = None`, `adaptation_reason: str = ""`, `detected_elements: Dict[str, str] = Field(default_factory=dict)`, `reason: Optional[str] = None` (carries `link_extractor`'s failure reason when `status == "failed"`)

Used by the router in Task 5. No test file — this task is pure data-shape declaration, exercised indirectly by Task 5's API tests (consistent with how `ContextAdvisorRequest`/`ContextAdvisorResponse` were added previously without a dedicated schema test).

- [ ] **Step 1: Add the two classes to `backend/app/schemas/heritage.py`**, placed after the existing `ContextAdvisorResponse` class, following that class's exact style (plain `BaseModel`, `Field(default_factory=...)` for the dict/list defaults).

- [ ] **Step 2: Commit**

```bash
git add backend/app/schemas/heritage.py
git commit -m "feat(schemas): add TrendExtractRequest/TrendExtractResponse"
```

---

### Task 5: Router endpoints — `/trend-extract` and `/trend-extract-upload`

**Files:**
- Modify: `backend/app/routers/heritage.py`
- Test: `tests/test_trend_api.py`

**Interfaces:**
- Consumes: `link_extractor.extract_from_url`, `link_extractor.download_thumbnail` (Task 2), `trend_adapter.analyze_trend_image` (Task 3), `TrendExtractRequest`/`TrendExtractResponse` (Task 4), the existing `load_catalog_data()` already defined in `heritage.py`.
- Produces: `POST /api/heritage/trend-extract`, `POST /api/heritage/trend-extract-upload` — both mounted the same way the existing `remix-generate`/`context-advisor` endpoints are (`@router.post(...)`, no `Depends(get_current_user)` per Global Constraints).

- [ ] **Step 1: Write the failing tests**

```python
# tests/test_trend_api.py
import io
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT / "backend"))

from app.main import app
from fastapi.testclient import TestClient


class TestTrendExtractEndpoint(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    @patch("app.routers.heritage.trend_adapter.analyze_trend_image")
    @patch("app.routers.heritage.link_extractor.download_thumbnail")
    @patch("app.routers.heritage.link_extractor.extract_from_url")
    def test_trend_extract_success(self, mock_extract, mock_download, mock_analyze):
        mock_extract.return_value = {"status": "ok", "thumbnail_url": "https://cdn/x.jpg", "caption": "outfit check"}
        mock_download.return_value = (b"fake-bytes", "image/jpeg")
        mock_analyze.return_value = {
            "status": "ok",
            "matched_costume_id": "ao-tu-than",
            "adaptation_reason": "phù hợp",
            "detected_elements": {"vibe": "mộc mạc"},
        }

        response = self.client.post("/api/heritage/trend-extract", json={"source_url": "https://www.tiktok.com/@u/video/1"})

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "ok")
        self.assertEqual(data["matched_costume_id"], "ao-tu-than")

    @patch("app.routers.heritage.link_extractor.extract_from_url")
    def test_trend_extract_link_failure_returns_failed_status(self, mock_extract):
        mock_extract.return_value = {"status": "failed", "reason": "unsupported_platform"}

        response = self.client.post("/api/heritage/trend-extract", json={"source_url": "https://instagram.com/p/1"})

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "failed")
        self.assertEqual(data["reason"], "unsupported_platform")

    @patch("app.routers.heritage.trend_adapter.analyze_trend_image")
    @patch("app.routers.heritage.link_extractor.download_thumbnail")
    @patch("app.routers.heritage.link_extractor.extract_from_url")
    def test_trend_extract_gemini_unavailable(self, mock_extract, mock_download, mock_analyze):
        mock_extract.return_value = {"status": "ok", "thumbnail_url": "https://cdn/x.jpg", "caption": ""}
        mock_download.return_value = (b"fake-bytes", "image/jpeg")
        mock_analyze.return_value = {"status": "unavailable"}

        response = self.client.post("/api/heritage/trend-extract", json={"source_url": "https://www.tiktok.com/@u/video/1"})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "unavailable")

    @patch("app.routers.heritage.trend_adapter.analyze_trend_image")
    def test_trend_extract_upload_success(self, mock_analyze):
        mock_analyze.return_value = {
            "status": "ok",
            "matched_costume_id": "ao-nhat-binh",
            "adaptation_reason": "phù hợp",
            "detected_elements": {},
        }

        fake_image = io.BytesIO(b"\xff\xd8\xff-fake-jpeg")
        response = self.client.post(
            "/api/heritage/trend-extract-upload",
            files={"screenshot": ("shot.jpg", fake_image, "image/jpeg")},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["matched_costume_id"], "ao-nhat-binh")

    def test_trend_extract_upload_rejects_non_image_file(self):
        fake_file = io.BytesIO(b"not an image")
        response = self.client.post(
            "/api/heritage/trend-extract-upload",
            files={"screenshot": ("notes.txt", fake_file, "text/plain")},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "failed")


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `PYTHONPATH=backend:. uv run pytest tests/test_trend_api.py -v`
Expected: FAIL — endpoints don't exist yet (404).

- [ ] **Step 3: Implement the two endpoints in `backend/app/routers/heritage.py`**

Add `from app.services import link_extractor, trend_adapter` and `from app.schemas.heritage import TrendExtractRequest, TrendExtractResponse` (alongside the existing schema imports) and `from fastapi import UploadFile, File` to the existing `fastapi` import line.

`POST /trend-extract` (`response_model=TrendExtractResponse`, body `req: TrendExtractRequest`): call `link_extractor.extract_from_url(req.source_url)`; if `status != "ok"`, return `TrendExtractResponse(status="failed", reason=result.get("reason"))`. Otherwise `link_extractor.download_thumbnail(result["thumbnail_url"])` wrapped in `try/except requests.RequestException` → on exception return `TrendExtractResponse(status="failed", reason="thumbnail_download_failed")`. Then `costumes = load_catalog_data().get("costumes", [])` and `trend_adapter.analyze_trend_image(image_bytes, mime_type, result.get("caption"), costumes)`; if that result's `status != "ok"`, return `TrendExtractResponse(status="unavailable")`; otherwise return `TrendExtractResponse(status="ok", thumbnail_url=result["thumbnail_url"], matched_costume_id=..., adaptation_reason=..., detected_elements=...)`.

`POST /trend-extract-upload` (`response_model=TrendExtractResponse`, `screenshot: UploadFile = File(...)`): read `image_bytes = await screenshot.read()`; if `not (screenshot.content_type or "").startswith("image/")`, return `TrendExtractResponse(status="failed", reason="invalid_file_type")` without calling Gemini. Otherwise call `trend_adapter.analyze_trend_image(image_bytes, screenshot.content_type, None, load_catalog_data().get("costumes", []))` and map to `TrendExtractResponse` the same way as above (no `thumbnail_url` — the client already has the image it uploaded).

- [ ] **Step 4: Run tests to verify they pass**

Run: same command as Step 2
Expected: PASS (all 5 tests)

- [ ] **Step 5: Run the full backend test suite to check for regressions**

Run: `PYTHONPATH=backend:. uv run pytest tests/ -v`
Expected: PASS — all previously-passing tests (`test_backend_api.py`, `test_auth_api.py`, `test_lookbook_api.py`, `test_crawler_and_catalog.py`, `test_database_models.py`) still pass, plus the 15 new tests from Tasks 1, 2, 3, 5.

- [ ] **Step 6: Commit**

```bash
git add backend/app/routers/heritage.py tests/test_trend_api.py
git commit -m "feat(heritage): add /trend-extract and /trend-extract-upload endpoints"
```

---

### Task 6: Frontend — "Theo Trend" tab on `/advisor`

**Files:**
- Modify: `frontend/src/pages/AdvisorPage.jsx`
- Modify: `frontend/src/index.css`

**Interfaces:**
- Consumes: `POST /api/heritage/trend-extract` and `POST /api/heritage/trend-extract-upload` (Task 5)

No backend interface is produced here — this is the last task in the chain.

- [ ] **Step 1: Add a 2-tab header to `AdvisorPage.jsx`**

Add `const [activeTab, setActiveTab] = useState('context')` state. Add a small tab bar above `.advisor-page-body` with two buttons — "Theo Bối Cảnh" (`activeTab === 'context'`) and "Theo Trend" (`activeTab === 'trend'`) — reusing the existing `.advisor-chip` button styling for consistency (active/inactive), not a new component. Wrap the current form/results JSX in `{activeTab === 'context' && (...)}`.

- [ ] **Step 2: Add the "Theo Trend" tab content**

New state: `trendUrl`, `isTrendLoading`, `trendError`, `trendResult`, `showUploadFallback`, `uploadFile`. A form with one text input (placeholder: link TikTok/Facebook) + submit button (`btn-editorial-primary`, label "Phân Tích" / "Đang phân tích"), `POST`ing to `/api/heritage/trend-extract` with `{source_url: trendUrl}`. On response: if `status === "ok"`, render a single `.advisor-recommend-card` (same markup pattern as the context tab's cards) with the returned `thumbnail_url`, the matched costume's name/era (look it up in the already-loaded `costumes` list by `matched_costume_id`), `adaptation_reason`, and a "Phối đồ ngay" button (`navigate('/studio?costume=...')`, same as the context tab). If `status === "failed"` or `"unavailable"`, set `showUploadFallback = true` and render a short message ("Không truy cập được link này." for failed / "Chưa phân tích được ảnh lúc này, vui lòng thử lại." for unavailable) plus a file input; submitting it does `FormData` + `POST /api/heritage/trend-extract-upload`, handling the response the same way (minus `thumbnail_url`, which will be null — show the user's own uploaded image preview instead via `URL.createObjectURL`).

- [ ] **Step 3: Add CSS for the tab bar and trend result card in `frontend/src/index.css`**

Add `.advisor-tab-bar` (flex row, `gap: 8px`, `margin-bottom: 20px`) reusing `.advisor-chip`/`.advisor-chip.active` for the buttons themselves (no new button visual language — matches the "minimal, no new icon" constraint from the earlier nav redesign). Add `.advisor-trend-upload-zone` reusing the same visual pattern as `.upload-dropzone` already defined for Studio's photo upload (border, radius, centered text) rather than inventing a new dropzone style.

- [ ] **Step 4: Build and manually verify**

Run: `cd frontend && npm run build`
Expected: builds cleanly with no errors.
Manual QA checklist (no frontend test harness exists in this repo — consistent with how Task 6 of the earlier nav redesign was verified): paste a real public TikTok link → see a costume recommendation; paste an unsupported link (e.g. a YouTube URL) → see the upload fallback appear; upload a non-image file → see a clean error, not a crash; click "Phối đồ ngay" from a trend result → lands in Studio with that costume preselected.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/AdvisorPage.jsx frontend/src/index.css
git commit -m "feat(advisor): add Theo Trend tab wired to trend-extract endpoints"
```
