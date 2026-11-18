/**
 * Tap Rush V4: shareable high-score challenge.
 * Additive enhancement; does not change gameplay or saved records.
 */
(() => {
  'use strict';

  const results = document.getElementById('screen-gameover');
  const actions = results?.querySelector('.btn-group');
  if (!actions || document.getElementById('btn-share-challenge')) return;

  const button = document.createElement('button');
  button.id = 'btn-share-challenge';
  button.type = 'button';
  button.className = 'btn-cyber-ghost';
  button.textContent = 'CHALLENGE A FRIEND';
  actions.appendChild(button);

  const status = document.createElement('p');
  status.id = 'share-challenge-status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  status.style.cssText = 'text-align:center;font-size:.75rem;margin-top:8px;color:var(--c-cyan)';
  actions.insertAdjacentElement('afterend', status);

  button.addEventListener('click', async () => {
    const scoreText = document.getElementById('go-score')?.textContent || '0';
    const score = Number(scoreText.replace(/[^0-9]/g, '')) || 0;
    const gameUrl = 'https://tap-rush-v3.vercel.app/';
    const message = `I scored ${score.toLocaleString('en-IN')} in Tap Rush! ⚡ Think you can beat me? Play: ${gameUrl}`;
    status.textContent = '';

    try {
      if (navigator.share) {
        await navigator.share({ title: 'Tap Rush Challenge', text: message });
        status.textContent = 'Challenge shared!';
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(message);
        status.textContent = 'Challenge copied — send it to a friend!';
      } else {
        window.prompt('Copy your challenge:', message);
        status.textContent = 'Copy the challenge and share it!';
      }
    } catch (error) {
      if (error?.name === 'AbortError') return;
      window.prompt('Copy your challenge:', message);
      status.textContent = 'Share not available — copy the challenge instead.';
    }
  });
})();
