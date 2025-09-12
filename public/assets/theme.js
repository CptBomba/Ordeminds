(function(){
  const stored = localStorage.getItem('theme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = stored || (prefersDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
  const btn = document.getElementById('themeToggle');
  const render = () => { if(btn) btn.textContent = (document.documentElement.getAttribute('data-theme')==='dark'?'☀️ Claro':'🌙 Escuro'); };
  render();
  if(btn){ btn.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme')==='dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    render();
  });}
})();