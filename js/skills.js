/* MM://CONTROL — agent skills showcase renderer (data: js/skills-data.js) */
(() => {
  'use strict';

  const mount = document.getElementById('agentSkillsMount');
  const stamp = document.getElementById('agentSkillsStamp');
  const data = window.AGENT_SKILLS;
  if (!mount || !data) return;

  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function copySkill(btn, md) {
    const done = () => {
      btn.textContent = 'copied ✓';
      btn.classList.add('copied');
      setTimeout(() => { btn.textContent = 'copy'; btn.classList.remove('copied'); }, 1600);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(md).then(done, () => fallback());
    } else fallback();
    function fallback() {
      const ta = document.createElement('textarea');
      ta.value = md;
      ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch { btn.textContent = 'select+copy manually'; }
      document.body.removeChild(ta);
    }
  }

  const groups = data.agents.map(g => `
    <div class="askill-group">
      <h3 class="askill-agent"><span class="led led-green"></span>${esc(g.agent)}
        <span class="chip">${g.skills.length} skill${g.skills.length === 1 ? '' : 's'}</span></h3>
      ${g.skills.map((s, i) => `
        <details class="askill" data-group="${esc(g.key)}" data-idx="${i}">
          <summary>
            <span class="askill-name mono">${esc(s.name)}</span>
            <span class="askill-desc">${esc(s.description)}</span>
            <span class="askill-actions">
              <button class="askill-copy mono" type="button">copy</button>
              <span class="askill-caret">▸</span>
            </span>
          </summary>
          <div class="askill-body">
            <p class="askill-src mono">// ${esc(s.source)}</p>
            <div class="askill-md">${s.html}</div>
          </div>
        </details>`).join('')}
    </div>`).join('');

  mount.innerHTML = groups ||
    '<p class="placeholder-note">// no SKILL.md files found — fleet is running vanilla configs</p>';
  if (stamp) stamp.textContent = `// scanned ${data.generated_at} — regenerated on each service heartbeat`;

  mount.querySelectorAll('.askill-copy').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      const d = btn.closest('details');
      const g = data.agents.find(a => a.key === d.dataset.group);
      copySkill(btn, g.skills[+d.dataset.idx].markdown);
    });
  });
})();
