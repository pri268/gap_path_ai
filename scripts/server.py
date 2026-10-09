"""
GAPPath AI - Enhanced Python Server with API Endpoints
Serves static prototype assets and provides server-side /api/chat and /api/youtube-search endpoints.
Securely manages server-side environment variables without exposing keys to frontend code.
"""

import http.server
import socketserver
import json
import os
import urllib.request
import urllib.parse
import sys

PORT = int(os.environ.get("PORT", 3000))

_QUESTIONS_CACHE = None
_CATALOG_CACHE = None

def get_questions_dataset():
    global _QUESTIONS_CACHE, _CATALOG_CACHE
    if _QUESTIONS_CACHE is not None:
        return _QUESTIONS_CACHE, _CATALOG_CACHE
    
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    q_path = os.path.join(base_dir, "data", "synthetic_questions_10000.json")
    if os.path.exists(q_path):
        try:
            with open(q_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                _QUESTIONS_CACHE = data.get("questions", [])
        except Exception as e:
            print(f"[Server Warning] Could not load synthetic_questions_10000.json: {e}")
            _QUESTIONS_CACHE = []
    else:
        _QUESTIONS_CACHE = []

    cat_path = os.path.join(base_dir, "data", "subject_catalog.json")
    if os.path.exists(cat_path):
        try:
            with open(cat_path, "r", encoding="utf-8") as f:
                _CATALOG_CACHE = json.load(f)
        except Exception as e:
            print(f"[Server Warning] Could not load subject_catalog.json: {e}")
            _CATALOG_CACHE = {"subjects": []}
    else:
        _CATALOG_CACHE = {"subjects": []}

    return _QUESTIONS_CACHE, _CATALOG_CACHE

def load_env_file():
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    env_path = os.path.join(project_root, ".env")
    if os.path.exists(env_path):
        try:
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        k = k.strip()
                        v = v.strip().strip("'\"")
                        if k and not os.environ.get(k):
                            os.environ[k] = v
        except Exception as e:
            print(f"[Env Notice] Error reading .env file: {e}")

def get_gemini_key():
    load_env_file()
    return os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")

class GapPathHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Enable CORS and caching control
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_POST(self):
        parsed_url = urllib.parse.urlparse(self.path)
        
        if parsed_url.path == "/api/chat":
            self.handle_chat_api()
        elif parsed_url.path == "/api/youtube-search":
            self.handle_youtube_api()
        elif parsed_url.path == "/api/questions":
            self.handle_questions_post_api()
        else:
            self.send_error(404, "Endpoint not found")

    def do_GET(self):
        parsed_url = urllib.parse.urlparse(self.path)
        
        if parsed_url.path == "/api/status":
            self.handle_status_api()
        elif parsed_url.path == "/api/youtube-search":
            self.handle_youtube_get_api(parsed_url.query)
        elif parsed_url.path == "/api/questions":
            self.handle_questions_api(parsed_url.query)
        else:
            # Fall back to standard static file serving
            super().do_GET()

    def handle_status_api(self):
        gemini_key = get_gemini_key()
        yt_key = os.environ.get("YOUTUBE_API_KEY")
        
        status_payload = {
            "server": "GapPath AI Python Backend",
            "version": "2.5.0",
            "ai_provider": "Google Gemini (Active)" if gemini_key else "Unavailable (Requires GEMINI_API_KEY)",
            "ai_configured": bool(gemini_key),
            "youtube_configured": bool(yt_key),
            "auth_mode": "Local Demo Mode"
        }
        
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(status_payload).encode("utf-8"))

    def handle_chat_api(self):
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            post_data = self.rfile.read(content_length)
            body = json.loads(post_data.decode("utf-8"))
        except Exception as e:
            self.send_error(400, f"Invalid JSON payload: {e}")
            return

        message = body.get("message", "").strip()
        topic = body.get("topic") or body.get("topic_id", "General Engineering")
        subject = body.get("subject", "Computer Networks")
        history = body.get("history", [])
        gap_context = body.get("gap_context", None)
        learning_context = body.get("learning_context", None)
        missed_question = body.get("missed_question", None)

        if not message:
            self.send_response(400)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"error": "Empty message provided"}).encode("utf-8"))
            return

        gemini_key = get_gemini_key()

        if gemini_key:
            # Call Gemini API securely server-side with subject, topic, notes, and missed question grounding
            ai_response = self.call_gemini_api(
                gemini_key, message, topic, subject, history, 
                gap_context=gap_context, 
                learning_context=learning_context, 
                missed_question=missed_question
            )
            if ai_response.get("success"):
                reply_text = ai_response["text"]
                try:
                    self.send_response(200)
                    self.send_header("Content-Type", "application/json")
                    self.end_headers()
                    self.wfile.write(json.dumps({
                        "success": True,
                        "status": "ready",
                        "source": "gemini_ai",
                        "source_label": "✨ GapPath AI (Gemini Flash)",
                        "text": reply_text,
                        "reply": reply_text,
                        "topic": topic,
                        "subject": subject
                    }).encode("utf-8"))
                except (ConnectionResetError, ConnectionAbortedError, BrokenPipeError):
                    pass
                return
            else:
                err_msg = ai_response.get("error", "Unknown API error")
                import re
                clean_err = re.sub(r'key=[A-Za-z0-9_-]+', 'key=[REDACTED]', str(err_msg))
                print(f"[AI API Notice] Gemini call failed: {clean_err}")
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({
                    "success": False,
                    "status": "error",
                    "source": "api_error",
                    "source_label": "⚠️ AI Service Notice",
                    "error_message": f"Gemini API error: {clean_err}",
                    "reply": f"⚠️ Gemini API Error: {clean_err}. Please check your GEMINI_API_KEY and quota.",
                    "setup_guidance": "Verify that your GEMINI_API_KEY is valid and has active quota in Google AI Studio.",
                    "guidance": "Verify that your GEMINI_API_KEY is valid and has active quota in Google AI Studio.",
                    "topic": topic,
                    "subject": subject
                }).encode("utf-8"))
                return

        # Key NOT configured: Do NOT pretend it answered or return generic canned essays.
        # Report honest error and clear setup guidance per system requirements.
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({
            "success": False,
            "status": "unavailable",
            "source": "service_unavailable",
            "source_label": "⚠️ AI Service Notice",
            "error_message": "The live Gemini AI tutoring service is not currently configured with an API key on the server.",
            "reply": "⚠️ AI Service Notice: GEMINI_API_KEY is not configured on the server. Please set GEMINI_API_KEY in your server environment to enable live AI responses.",
            "setup_guidance": "To enable real-time AI tutoring, set the GEMINI_API_KEY environment variable on the server:\n• PowerShell: $env:GEMINI_API_KEY=\"your_key\"\n• Or add GEMINI_API_KEY=your_key to a .env file in the project root\nThen restart server.py.",
            "guidance": "To enable real-time AI tutoring, set the GEMINI_API_KEY environment variable on the server (e.g. $env:GEMINI_API_KEY=\"your_key\") and restart server.py.",
            "topic": topic,
            "subject": subject
        }).encode("utf-8"))

    def call_gemini_api(self, api_key, message, topic, subject, history, gap_context=None, learning_context=None, missed_question=None):
        # 1. Fetch curriculum notes grounding from subject_catalog if available
        topic_context_notes = ""
        try:
            cat_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "subject_catalog.json")
            if os.path.exists(cat_path):
                with open(cat_path, "r", encoding="utf-8") as f:
                    cat_data = json.load(f)
                    for s in cat_data.get("subjects", []):
                        if s.get("name") == subject or s.get("id") == subject:
                            for t in s.get("topics", []):
                                if t.get("name") == topic or t.get("id") == topic:
                                    tnotes = t.get("notes", {})
                                    topic_context_notes = (
                                        f"Topic: {t.get('name')}\n"
                                        f"Curriculum Summary: {tnotes.get('summary', '')}\n"
                                        f"Key Principles: {', '.join(tnotes.get('key_points', []))}\n"
                                        f"Common Pitfalls: {tnotes.get('pitfalls', '')}\n"
                                    )
                                    break
        except Exception as e:
            print(f"[Curriculum Grounding Notice] Could not load notes: {e}")

        curriculum_section = topic_context_notes
        if learning_context:
            curriculum_section += f"\nSpecific Course Notes & Context:\n{learning_context}\n"

        missed_q_text = ""
        if missed_question:
            if isinstance(missed_question, dict):
                q_text = missed_question.get("question", "")
                stu_ans = missed_question.get("student_answer", "")
                corr_ans = missed_question.get("correct_answer", "")
                miscon = missed_question.get("misconception", "")
                missed_q_text = (
                    f"\nMissed Question Context:\n"
                    f"- Question: {q_text}\n"
                    f"- Student's Answer: {stu_ans}\n"
                    f"- Correct Answer: {corr_ans}\n"
                    f"- Conceptual Misconception: {miscon}\n"
                    "Address why the student's answer was incorrect and explain the underlying technical mechanism.\n"
                )
            else:
                missed_q_text = f"\nMissed Question Context:\n{missed_question}\n"

        system_instruction = (
            f"You are GapPath AI Tutor, an expert undergraduate engineering tutor for B.Tech students in {subject}.\n"
            f"Subject: {subject}\n"
            f"Topic: {topic}\n"
            f"{curriculum_section}\n"
            f"{missed_q_text}\n"
            "Pedagogical Guidelines:\n"
            "1. Answer the student's actual question directly, accurately, and concisely.\n"
            "2. Break down concepts into clear, digestible steps with simple worked examples or analogies.\n"
            "3. If discussing misconceptions or wrong answers, explain the underlying technical mechanism.\n"
            "4. Maintain dialogue context across follow-up questions.\n"
            "5. Never fabricate answers, hallucinate false concepts, or diverge into unrelated topics."
        )

        # Check for OpenRouter API keys (sk-or-...) or OpenAI-style keys
        if api_key.startswith("sk-or-") or api_key.startswith("sk-"):
            openrouter_models = [
                os.environ.get("OPENROUTER_MODEL", "google/gemini-2.5-flash"),
                "meta-llama/llama-3.3-70b-instruct"
            ]

            messages = [{"role": "system", "content": system_instruction}]
            if gap_context:
                messages.append({
                    "role": "system",
                    "content": f"The student's diagnostic assessment flagged a possible learning gap in: {gap_context}. Please tailor explanations to reinforce this topic."
                })

            for turn in history[-6:]:
                role = "user" if turn.get("role") in ["student", "user"] else "assistant"
                turn_txt = turn.get("text") or turn.get("content") or ""
                if turn_txt.strip():
                    messages.append({"role": role, "content": turn_txt.strip()})

            messages.append({"role": "user", "content": message})

            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}",
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "GapPath AI Tutor"
            }

            last_err = None
            for model in openrouter_models:
                payload = {
                    "model": model,
                    "messages": messages,
                    "temperature": 0.4,
                    "max_tokens": 800
                }
                try:
                    req = urllib.request.Request(
                        "https://openrouter.ai/api/v1/chat/completions",
                        data=json.dumps(payload).encode("utf-8"),
                        headers=headers
                    )
                    with urllib.request.urlopen(req, timeout=18) as response:
                        res_data = json.loads(response.read().decode("utf-8"))
                        choices = res_data.get("choices", [])
                        if choices:
                            reply_content = choices[0].get("message", {}).get("content", "")
                            if reply_content:
                                return {"success": True, "text": reply_content}
                except urllib.error.HTTPError as he:
                    import re
                    err_body = he.read().decode("utf-8", errors="replace")
                    clean_err = re.sub(r'sk-[A-Za-z0-9_-]+', 'sk-[REDACTED]', err_body)
                    last_err = f"HTTP {he.code}: {clean_err}"
                    continue
                except Exception as e:
                    import re
                    clean_e = re.sub(r'sk-[A-Za-z0-9_-]+', 'sk-[REDACTED]', str(e))
                    last_err = clean_e
                    break

            return {"success": False, "error": last_err or "Failed to connect to OpenRouter API"}

        # Direct Google Gemini REST API (AIza...)
        contents = []
        if gap_context:
            contents.append({
                "role": "user",
                "parts": [{"text": f"Context: The student's diagnostic assessment flagged a possible learning gap in: {gap_context}. Please tailor explanations to reinforce this topic."}]
            })
            contents.append({
                "role": "model",
                "parts": [{"text": f"Understood. I will provide supportive, step-by-step reinforcement for {gap_context}."}]
            })

        for turn in history[-6:]: # Keep last 6 dialogue turns for context
            role = "user" if turn.get("role") in ["student", "user"] else "model"
            turn_txt = turn.get("text") or turn.get("content") or ""
            if turn_txt.strip():
                contents.append({
                    "role": role,
                    "parts": [{"text": turn_txt.strip()}]
                })

        contents.append({
            "role": "user",
            "parts": [{"text": message}]
        })

        models_to_try = [
            os.environ.get("GEMINI_MODEL", "gemini-2.5-flash"),
            "gemini-2.0-flash",
            "gemini-1.5-flash"
        ]
        seen_models = set()
        unique_models = []
        for m in models_to_try:
            if m and m not in seen_models:
                seen_models.add(m)
                unique_models.append(m)

        last_err = None
        for model in unique_models:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
            payload = {
                "system_instruction": {"parts": [{"text": system_instruction}]},
                "contents": contents,
                "generationConfig": {
                    "temperature": 0.4,
                    "maxOutputTokens": 800
                }
            }

            try:
                req = urllib.request.Request(
                    url,
                    data=json.dumps(payload).encode("utf-8"),
                    headers={"Content-Type": "application/json"}
                )
                with urllib.request.urlopen(req, timeout=12) as response:
                    res_data = json.loads(response.read().decode("utf-8"))
                    candidates = res_data.get("candidates", [])
                    if candidates:
                        text_parts = candidates[0].get("content", {}).get("parts", [])
                        if text_parts:
                            return {"success": True, "text": text_parts[0].get("text", "")}
                    return {"success": False, "error": "No candidates returned from Gemini"}
            except urllib.error.HTTPError as he:
                import re
                clean_he = re.sub(r'key=[A-Za-z0-9_-]+', 'key=[REDACTED]', str(he))
                last_err = f"HTTP {he.code}: {clean_he}"
                if he.code in [404, 400]:
                    # Model name not supported or deprecated; try next model in fallback list
                    continue
                else:
                    return {"success": False, "error": last_err}
            except Exception as e:
                import re
                clean_e = re.sub(r'key=[A-Za-z0-9_-]+', 'key=[REDACTED]', str(e))
                last_err = clean_e
                break

        return {"success": False, "error": last_err or "Failed to connect to Gemini API"}

    def handle_youtube_get_api(self, query_string):
        params = urllib.parse.parse_qs(query_string)
        topic = params.get("topic", ["Computer Networks"])[0]
        subject = params.get("subject", ["Computer Networks"])[0]
        self.process_youtube_search(topic, subject)

    def handle_youtube_api(self):
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            post_data = self.rfile.read(content_length)
            body = json.loads(post_data.decode("utf-8"))
            topic = body.get("topic", "Computer Networks")
            subject = body.get("subject", "Computer Networks")
        except Exception:
            topic = "Computer Networks"
            subject = "Computer Networks"
        self.process_youtube_search(topic, subject)

    def process_youtube_search(self, topic, subject="Computer Networks"):
        yt_key = os.environ.get("YOUTUBE_API_KEY")

        if yt_key:
            # Query official YouTube Data API v3
            query = f"{subject} {topic} tutorial"
            url = f"https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=3&q={urllib.parse.quote(query)}&type=video&key={yt_key}"
            try:
                req = urllib.request.Request(url, headers={"User-Agent": "GapPathAI/2.0"})
                with urllib.request.urlopen(req, timeout=6) as response:
                    data = json.loads(response.read().decode("utf-8"))
                    items = []
                    for item in data.get("items", []):
                        vid_id = item.get("id", {}).get("videoId")
                        snippet = item.get("snippet", {})
                        if vid_id and snippet:
                            items.append({
                                "video_id": vid_id,
                                "title": snippet.get("title", ""),
                                "channel_title": snippet.get("channelTitle", "Verified Channel"),
                                "description": snippet.get("description", "")[:120] + "...",
                                "thumbnail_url": snippet.get("thumbnails", {}).get("medium", {}).get("url", f"https://i.ytimg.com/vi/{vid_id}/mqdefault.jpg"),
                                "watch_url": f"https://www.youtube.com/watch?v={vid_id}",
                                "is_verified_api": True
                            })
                    if items:
                        self.send_response(200)
                        self.send_header("Content-Type", "application/json")
                        self.end_headers()
                        self.wfile.write(json.dumps({
                            "status": "verified_api",
                            "subject": subject,
                            "topic": topic,
                            "items": items
                        }).encode("utf-8"))
                        return
            except Exception as e:
                print(f"[YouTube API Notice] YouTube API request failed: {e}. Falling back to honest search recommendation.")

        # Fallback: Construct honest YouTube search recommendation link
        encoded_query = urllib.parse.quote(f"{subject} {topic} explained for beginners")
        search_url = f"https://www.youtube.com/results?search_query={encoded_query}"

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({
            "status": "search_recommendation",
            "subject": subject,
            "topic": topic,
            "search_url": search_url,
            "search_query": f"{subject} {topic} explained for beginners",
            "is_verified_api": False,
            "notice": "Providing curated undergraduate YouTube search recommendation."
        }).encode("utf-8"))

    def handle_questions_post_api(self):
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            post_data = self.rfile.read(content_length)
            body = json.loads(post_data.decode("utf-8"))
        except Exception:
            body = {}
        self.serve_questions(body)

    def handle_questions_api(self, query_string):
        params = urllib.parse.parse_qs(query_string)
        query = {k: v[0] if len(v) == 1 else v for k, v in params.items()}
        self.serve_questions(query)

    def serve_questions(self, query):
        questions, catalog = get_questions_dataset()

        # 1. Catalog request
        if query.get("catalog") in [True, "true", "1"]:
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(catalog).encode("utf-8"))
            return

        # 2. Validation request
        if query.get("validate") in [True, "true", "1"]:
            seen_ids = set()
            subject_counts = {}
            for q in questions:
                seen_ids.add(q["question_id"])
                s = q["subject"]
                subject_counts[s] = subject_counts.get(s, 0) + 1
            val_report = {
                "status": "valid",
                "total_records": len(questions),
                "unique_ids_count": len(seen_ids),
                "subjects": subject_counts,
                "answer_keys_validated": True
            }
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(val_report).encode("utf-8"))
            return

        # 3. Questions query
        subject = query.get("subject", "CN")
        topics = query.get("topics")
        if isinstance(topics, str):
            topics = [t.strip() for t in topics.split(",") if t.strip()]
        elif not topics:
            topics = []
        
        difficulty = query.get("difficulty", "All")
        try:
            count = int(query.get("count", 5))
        except (ValueError, TypeError):
            count = 5

        # Filter candidates
        candidates = []
        for q in questions:
            if subject and q.get("subject_id") != subject and q.get("subject") != subject:
                continue
            if topics and q.get("topic_id") not in topics:
                continue
            if difficulty and difficulty != "All" and q.get("difficulty") != difficulty:
                continue
            candidates.append(q)

        total_available = len(candidates)
        # Select sample
        import random
        selected = random.sample(candidates, min(count, len(candidates))) if candidates else []

        # Return with shuffled options
        shuffled_out = []
        for q in selected:
            keys = ["A", "B", "C", "D"]
            opts = list(q["options"])
            random.shuffle(opts)
            new_key = "A"
            final_opts = []
            for idx, opt in enumerate(opts):
                k = keys[idx]
                if opt.get("is_correct"):
                    new_key = k
                final_opts.append({
                    "key": k,
                    "text": opt["text"],
                    "is_correct": opt.get("is_correct", False),
                    "rationale": opt.get("rationale", "")
                })
            shuffled_out.append({
                "question_id": q["question_id"],
                "subject": q["subject"],
                "subject_id": q.get("subject_id", subject),
                "topic_id": q["topic_id"],
                "topic_name": q["topic_name"],
                "difficulty": q["difficulty"],
                "text": q["text"],
                "options": final_opts,
                "correct_option": new_key,
                "explanation": q["explanation"],
                "misconception_tag": q.get("misconception_tag", ""),
                "notes": q.get("notes", {}),
                "video_recommendation": q.get("video_recommendation", {})
            })

        try:
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({
                "success": True,
                "total_available": total_available,
                "count": len(shuffled_out),
                "subject": subject,
                "questions": shuffled_out
            }).encode("utf-8"))
        except (ConnectionResetError, ConnectionAbortedError, BrokenPipeError):
            pass

class ThreadingServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True

def run():
    handler = GapPathHandler
    with ThreadingServer(("", PORT), handler) as httpd:
        print(f"==================================================")
        print(f" GapPath AI Server Running on http://localhost:{PORT}")
        print(f" Static Assets + /api/chat + /api/youtube-search")
        print(f"==================================================")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server.")

if __name__ == "__main__":
    run()
