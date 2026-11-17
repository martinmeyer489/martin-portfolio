#!/usr/bin/env python3
"""Generate the agent-skills showcase data for the portfolio site.

Scans SKILL.md files from:
  - global skills dir (shared by all agents):
      /paperclip/.config/devin/skills/*/SKILL.md
  - per-agent skills dirs:
      /paperclip/workspaces/<agent>/.devin/skills/*/SKILL.md

and emits:
  - js/skills-data.js   -> window.AGENT_SKILLS = {...}  (consumed by js/skills.js)
  - data/skills.json    -> same data, for programmatic consumers

Paths are overridable via env vars so the script also works inside the
compose one-shot container or on the host:
  PC_GLOBAL_SKILLS_DIR   global skills directory
  PC_WORKSPACES_DIR      directory containing the per-agent workspaces

Only reads *.md inside skills directories. Run:  python3 generate_skills.py
"""

import html
import json
import os
import re
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path

REPO_DIR = Path(__file__).resolve().parent
VENDOR_DIR = REPO_DIR / "skills"
GITHUB_BLOB = "https://github.com/martinmeyer489/martin-portfolio/blob/main"


def first_existing(candidates):
    for c in candidates:
        if c and Path(c).is_dir():
            return Path(c)
    return None


GLOBAL_SKILLS_DIR = first_existing([
    os.environ.get("PC_GLOBAL_SKILLS_DIR"),
    "/paperclip/.config/devin/skills",
    "/skills/global",
    str(Path.home() / ".config/devin/skills"),
])

WORKSPACES_DIR = first_existing([
    os.environ.get("PC_WORKSPACES_DIR"),
    "/paperclip/workspaces",
    "/workspaces",
    str(REPO_DIR.parent.parent),  # repo sits in workspaces/<agent>/martin-portfolio
])

DISPLAY = {"shared": "SHARED", "chief": "CHIEF", "devin": "DEVIN",
           "research": "RESEARCHER", "researcher": "RESEARCHER"}
# canonical groups come first and are shown even when they have no skills
GROUP_ORDER = ["CHIEF", "DEVIN", "RESEARCHER", "SHARED"]


def parse_frontmatter(text):
    """Return (metadata dict, body). Minimal YAML frontmatter parser."""
    meta = {}
    if not text.startswith("---"):
        return meta, text
    end = text.find("\n---", 3)
    if end == -1:
        return meta, text
    block = text[3:end]
    body = text[end + 4:].lstrip("\n")
    key = None
    for line in block.splitlines():
        m = re.match(r"^([A-Za-z_][\w-]*):\s*(.*)$", line)
        if m:
            key, val = m.group(1), m.group(2).strip()
            if val in (">", "|", ">-", "|-"):
                meta[key] = ""
            elif val:
                meta[key] = val.strip("'\"")
        elif key and line.startswith((" ", "\t")):
            meta[key] = (meta[key] + " " + line.strip()).strip()
        elif line.strip():
            key = None
    return meta, body


def inline(text):
    """Inline markdown -> HTML (text is escaped first)."""
    t = html.escape(text)
    t = re.sub(r"`([^`]+)`", r"<code>\1</code>", t)
    t = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", t)
    t = re.sub(r"(?<![\w*])\*([^*\n]+)\*(?![\w*])", r"<em>\1</em>", t)
    t = re.sub(r"(?<![\w_])_([^_\n]+)_(?![\w_])", r"<em>\1</em>", t)
    t = re.sub(r"\[([^\]]+)\]\((https?://[^)\s]+|[^)\s]+)\)",
               r'<a href="\2" target="_blank" rel="noopener">\1</a>', t)
    return t


def md_to_html(md):
    """Small, safe markdown -> HTML renderer (headings, code fences, lists,
    tables, quotes, paragraphs). All source text is HTML-escaped."""
    lines = md.split("\n")
    out, i, n = [], 0, len(lines)
    while i < n:
        line = lines[i]
        if not line.strip():
            i += 1
            continue

        m = re.match(r"^```(\w*)\s*$", line)
        if m:
            lang, buf = m.group(1), []
            i += 1
            while i < n and not lines[i].startswith("```"):
                buf.append(lines[i]); i += 1
            i += 1
            cls = f' class="lang-{html.escape(lang)}"' if lang else ""
            out.append(f"<pre><code{cls}>{html.escape(chr(10).join(buf))}</code></pre>")
            continue

        m = re.match(r"^(#{1,6})\s+(.*)$", line)
        if m:
            lvl = min(len(m.group(1)) + 2, 6)  # h1->h3 keeps page hierarchy sane
            out.append(f"<h{lvl}>{inline(m.group(2))}</h{lvl}>")
            i += 1
            continue

        if re.match(r"^\s*(-{3,}|\*{3,})\s*$", line):
            out.append("<hr>"); i += 1; continue

        if line.lstrip().startswith(">"):
            buf = []
            while i < n and lines[i].lstrip().startswith(">"):
                buf.append(lines[i].lstrip()[1:].strip()); i += 1
            out.append(f"<blockquote>{inline(' '.join(buf))}</blockquote>")
            continue

        if line.lstrip().startswith("|") and i + 1 < n and re.match(r"^\s*\|[\s:|-]+\|\s*$", lines[i + 1]):
            def cells(l):
                return [c.strip() for c in l.strip().strip("|").split("|")]
            head = cells(line); i += 2
            rows = []
            while i < n and lines[i].lstrip().startswith("|"):
                rows.append(cells(lines[i])); i += 1
            th = "".join(f"<th>{inline(c)}</th>" for c in head)
            trs = "".join("<tr>" + "".join(f"<td>{inline(c)}</td>" for c in r) + "</tr>" for r in rows)
            out.append(f"<table><thead><tr>{th}</tr></thead><tbody>{trs}</tbody></table>")
            continue

        m = re.match(r"^(\s*)([-*+]|\d+\.)\s+(.*)$", line)
        if m:
            ordered = bool(re.match(r"\d", m.group(2)))
            tag = "ol" if ordered else "ul"
            items = []
            while i < n:
                mm = re.match(r"^(\s*)([-*+]|\d+\.)\s+(.*)$", lines[i])
                if not mm:
                    break
                items.append(mm.group(3)); i += 1
            lis = "".join(f"<li>{inline(it)}</li>" for it in items)
            out.append(f"<{tag}>{lis}</{tag}>")
            continue

        buf = [line]
        i += 1
        while i < n and lines[i].strip() and not re.match(
            r"^\s*(#{1,6}\s|```|[-*+]\s|\d+\.\s|>|\||-{3,}\s*$|\*{3,}\s*$)", lines[i]):
            buf.append(lines[i]); i += 1
        out.append(f"<p>{inline(' '.join(b.strip() for b in buf))}</p>")
    return "\n".join(out)


def collect():
    groups = {}  # display name -> {"key": str, "skills": [...]}

    def group_for(key):
        name = DISPLAY.get(key, key.upper())
        if name not in groups:
            groups[name] = {"agent": name, "key": name.lower(), "skills": []}
        return groups[name]

    def add_agent(key, skills_dir):
        skills_dir = Path(skills_dir)
        if not skills_dir.is_dir():
            return
        g = group_for(key)
        for f in sorted(skills_dir.glob("*/SKILL.md")):
            try:
                text = f.read_text(encoding="utf-8")
            except OSError:
                continue
            meta, body = parse_frontmatter(text)
            name = meta.get("name") or f.parent.name

            # vendor the skill dir (SKILL.md + references/) into skills/<group>/<name>/
            # so the site can link to it on GitHub
            dest = VENDOR_DIR / g["key"] / name
            if dest.exists():
                shutil.rmtree(dest)
            shutil.copytree(f.parent, dest)
            repo_rel = dest.relative_to(REPO_DIR).as_posix()
            refs = sorted(
                p.relative_to(dest).as_posix()
                for p in dest.rglob("*") if p.is_file() and p.name != "SKILL.md"
            )

            g["skills"].append({
                "name": name,
                "description": meta.get("description", ""),
                "source": str(f.relative_to(WORKSPACES_DIR.parent)) if WORKSPACES_DIR and str(f).startswith(str(WORKSPACES_DIR.parent)) else str(f),
                "repoPath": f"{repo_rel}/SKILL.md",
                "githubUrl": f"{GITHUB_BLOB}/{repo_rel}/SKILL.md",
                "references": [
                    {"path": r, "githubUrl": f"{GITHUB_BLOB}/{repo_rel}/{r}"}
                    for r in refs
                ],
                "html": md_to_html(body),
                "markdown": text,
            })

    if GLOBAL_SKILLS_DIR:
        add_agent("shared", GLOBAL_SKILLS_DIR)
    if WORKSPACES_DIR:
        for ws in sorted(WORKSPACES_DIR.iterdir()):
            if ws.is_dir():
                add_agent(ws.name, ws / ".devin" / "skills")

    agents = [{"agent": n, "key": n.lower(), "skills": groups.pop(n, {"skills": []})["skills"]}
              for n in GROUP_ORDER]
    agents += [groups[n] for n in sorted(groups)]
    return agents


def main():
    # wipe vendored copies so removed/renamed skills don't linger
    if VENDOR_DIR.is_dir():
        shutil.rmtree(VENDOR_DIR)

    payload = {
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
        "agents": collect(),
    }
    js = "window.AGENT_SKILLS = " + json.dumps(payload, ensure_ascii=False, indent=2) + ";\n"

    js_path = REPO_DIR / "js" / "skills-data.js"
    json_path = REPO_DIR / "data" / "skills.json"
    json_path.parent.mkdir(parents=True, exist_ok=True)

    changed = False
    for path, content in ((js_path, js),
                          (json_path, json.dumps(payload, ensure_ascii=False, indent=2) + "\n")):
        old = path.read_text(encoding="utf-8") if path.exists() else None
        if old != content:
            path.write_text(content, encoding="utf-8")
            changed = True

    n = sum(len(a["skills"]) for a in payload["agents"])
    print(f"skills: {n} across {len(payload['agents'])} group(s) -> "
          f"{js_path.relative_to(REPO_DIR)}, {json_path.relative_to(REPO_DIR)}"
          f"{' (updated)' if changed else ' (unchanged)'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
