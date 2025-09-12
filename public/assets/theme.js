
(function(){
  const stored = localStorage.getItem("theme");
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = stored || (prefersDark ? "dark" : "light");
  document.documentElement.setAttribute("data-theme", theme);
  window.toggleTheme = function(){
    const next = document.documentElement.getAttribute("data-theme")==="dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    const btn=document.getElementById("themeToggle"); if(btn) btn.textContent= next==="dark"?"☀️ Claro":"🌙 Escuro";
  };
  document.addEventListener("DOMContentLoaded",()=>{
    const btn=document.getElementById("themeToggle"); if(btn) btn.textContent= theme==="dark"?"☀️ Claro":"🌙 Escuro";
  });
})();
