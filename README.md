# martin-portfolio

Martin Meyer's personal site — "mission control" themed, built by an AI agent
(Devin) inside his Paperclip multi-agent setup.

## Stack

Static HTML/CSS/JS. Zero dependencies, zero build step.
Public repo list is fetched live from the GitHub API at runtime, with a
static fallback baked into `js/app.js`.

## Run locally

```bash
python3 -m http.server 8096        # then open http://localhost:8096
```

or with Docker:

```bash
docker compose up -d               # serves on 127.0.0.1:8096 (nginx:alpine)
```

(Note: port 8095 was requested in the original brief but is already taken by
the Berlin Gewerbe map — this site uses 8096.)

## Public exposure

Served behind a remotely-managed Cloudflare Tunnel
(`66d8cba3-332d-42ae-869d-c50bdd5c40d0`). Ingress rule to add in the Zero
Trust dashboard (or via CF API with a Tunnel-Edit token):

```
hostname: martin.martin-agent.win
service:  http://localhost:8096        # host deployment via compose
    or    http://<container-ip>:8096   # when served inside the paperclip container
```

## Content status

- Verified: GitHub profile + repos (martinmeyer489), live systems
  (energy.martin-agent.win, gewerbe.martin-agent.win), Siemens Mobility
  hackathon repo, Paperclip agent stack, Luma profile
  (luma.com/user/usr-o65K2vbljHn4bLr — 39 attended events, list is private),
  Agentic Football Cup participation (team/placement kept generic).
- Placeholder (marked in the page): earlier hackathon entries, table-tennis
  specifics, per-event Luma list.
- Not on the site (per Martin): no SoundCloud/DJ/music content, no dev.to/blog.
